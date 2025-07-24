import { ApiService } from './apiService';
import { cleanMarkdown } from '../utils/markdownCleaner';
import { cleanKnowledgeGraph, getCleaningStats } from '../utils/graphCleaner';
import { AppConfig, LogEntry, ProcessResults, KnowledgeGraph, KnowledgeGraphNode, KnowledgeGraphEdge } from '../types';

export class ProcessingService {
  private apiService: ApiService;
  private onLog: (log: LogEntry) => void;
  private isCancelled: () => boolean;
  private logCounter: number = 0;
  
  // Universal token limit for all models - generous but reasonable
  private static readonly UNIVERSAL_MAX_TOKENS = 32000;

  constructor(apiService: ApiService, onLog: (log: LogEntry) => void, isCancelled: () => boolean) {
    this.apiService = apiService;
    this.onLog = onLog;
    this.isCancelled = isCancelled;
  }

  private addLog(level: LogEntry['level'], message: string) {
    this.logCounter++;
    this.onLog({
      id: `${Date.now()}_${this.logCounter}`,
      timestamp: new Date(),
      level,
      message,
    });
  }

  /**
   * Parses a Markdown nested list into a flat array of unique queries.
   * Handles both top-level and sub-level list items.
   */
  private parseMarkdownQueryList(markdown: string): string[] {
    const queries: string[] = [];
    const lines = markdown.split('\n');
    lines.forEach(line => {
      const match = line.match(/^-+\s*(.+)/); // Matches "- Query" or "  - Query"
      if (match && match[1]) {
        queries.push(match[1].trim());
      }
    });
    return [...new Set(queries)]; // Return unique queries
  }

  /**
   * Truncate content based on estimated token count
   * Using rough estimation: 1 token ≈ 0.75 words ≈ 4 characters
   */
  private truncateContentByTokens(content: string, maxTokens: number): string {
    if (!content) return '';
    
    // Rough estimation: 1 token ≈ 4 characters for most languages
    const maxChars = maxTokens * 4;
    
    if (content.length <= maxChars) {
      return content;
    }
    
    // Truncate and add ellipsis
    const truncated = content.substring(0, maxChars);
    
    // Try to cut at a word boundary to avoid cutting words in half
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    const finalContent = lastSpaceIndex > maxChars * 0.9 ? 
      truncated.substring(0, lastSpaceIndex) : 
      truncated;
    
    return finalContent + '...';
  }
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async processTopicalMap(config: AppConfig): Promise<ProcessResults> {
    const startTime = Date.now();
    this.addLog('INFO', 'Rozpoczynanie procesu generowania mapy tematycznej...');

    try {
      // Step 1: Get URLs
      const urls = await this.getUrls(config);
      this.addLog('SUCCESS', `Pozyskano ${urls.length} unikalnych URL-i do analizy`);

      // Step 2: Scrape content
      const scrapedContent = await this.scrapeContent(urls);
      this.addLog('SUCCESS', `Pobrano treść z ${scrapedContent.length}/${urls.length} stron`);

      // Step 3: Extract knowledge graphs
      const knowledgeFragments = await this.extractKnowledgeGraphs(
        scrapedContent,
        config.project.centralEntity,
        config.project.businessContext,
        config.models.extractionModel,
        config.project.language
      );
      this.addLog('SUCCESS', `Wygenerowano ${knowledgeFragments.length} fragmentów grafu wiedzy`);

      // Step 4: Consolidate knowledge graph
      const consolidatedGraph = this.consolidateKnowledgeGraph(knowledgeFragments);
      this.addLog('SUCCESS', `Skonsolidowano graf: ${consolidatedGraph.nodes.length} węzłów, ${consolidatedGraph.edges.length} relacji`);

      // Step 5: Generate topical map
      const topicalMap = await this.generateTopicalMap(consolidatedGraph, config);
      this.addLog('SUCCESS', 'Wygenerowano finalną mapę tematyczną');

      const executionTime = Date.now() - startTime;
      this.addLog('SUCCESS', `Proces zakończony pomyślnie w czasie ${Math.round(executionTime / 1000)}s`);

      return {
        topicalMap,
        knowledgeGraph: consolidatedGraph,
        scrapedContent,
        metadata: {
          totalUrls: urls.length,
          processedUrls: scrapedContent.length,
          executionTime,
          config,
        },
      };
    } catch (error) {
      this.addLog('ERROR', `Błąd podczas przetwarzania: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
      if (error instanceof Error && error.message === 'Process cancelled by user') {
        this.addLog('INFO', 'Proces został anulowany przez użytkownika.');
      } else {
        throw error; // Rethrow other errors
      }
    }
  }

  private async getUrls(config: AppConfig): Promise<string[]> {
    if (config.urlSource === 'manual') {
      this.addLog('INFO', 'Używanie ręcznie wprowadzonych URL-i');
      return config.manualConfig.urls;
    }

    this.addLog('INFO', 'Rozpoczynanie automatycznego pozyskiwania URL-i...');

    // Query expansion
    this.addLog('INFO', `Generowanie ${config.autoConfig.queryExpansionCount} zapytań na podstawie "${config.project.centralEntity}"`);
    const rawQueriesMarkdown = await this.apiService.performQueryExpansion(
      config.project.centralEntity,
      config.project.businessContext,
      config.project.language,
      config.autoConfig.queryExpansionCount,
      config.models.extractionModel
    );
    const initialQueries = this.parseMarkdownQueryList(rawQueriesMarkdown);

    this.addLog('SUCCESS', `Wygenerowano ${initialQueries.length} początkowych zapytań.`);

    const allUrls: string[] = [];
    let queriesToProcess: string[] = [...initialQueries]; // Queries for the current round
    const processedQueries = new Set<string>();

    for (let currentRound = 1; currentRound <= config.autoConfig.serpExplorationDepth; currentRound++) {
      if (this.isCancelled()) {
        this.addLog('WARNING', 'Proces zatrzymany przez użytkownika podczas eksploracji SERP');
        throw new Error('Process cancelled by user');
      }
      
      if (queriesToProcess.length === 0) {
        this.addLog('INFO', `Brak nowych zapytań do przetworzenia w rundzie ${currentRound}. Zakończenie eksploracji.`);
        break; // No more queries to process, exit loop
      }

      this.addLog('INFO', `Rozpoczynanie rundy eksploracji SERP (głębokość ${currentRound}/${config.autoConfig.serpExplorationDepth})...`);
      
      const queriesForThisRound = [...queriesToProcess]; // Snapshot queries for this round
      queriesToProcess = []; // Clear for next round's PAA queries

      for (const query of queriesForThisRound) {
        if (this.isCancelled()) {
          this.addLog('WARNING', 'Proces zatrzymany przez użytkownika');
          throw new Error('Process cancelled by user');
        }
        
        if (processedQueries.has(query)) {
          continue; // Skip already processed queries
        }
        processedQueries.add(query);

        this.addLog('INFO', `Wyszukiwanie URL-i dla zapytania: "${query}"`);

        try {
          const results = await this.apiService.searchSerp(
            query,
            config.project.language,
            config.project.location,
            config.autoConfig.urlsPerQuery
          );

          const urls = results.map(r => r.link);
          allUrls.push(...urls);
          this.addLog('INFO', `Znaleziono ${urls.length} URL-i dla "${query}"`);

          // Collect all discovered queries from this SERP round
          const discoveredQueries: string[] = [];
          results.forEach(result => {
            if (result.additionalQueries) {
              result.additionalQueries.forEach(discoveredQuery => {
                if (!processedQueries.has(discoveredQuery) && !discoveredQueries.includes(discoveredQuery)) {
                  discoveredQueries.push(discoveredQuery);
                }
              });
            }
          });
          
          // If we have discovered queries and this is not the last round, select the best one
          if (discoveredQueries.length > 0 && currentRound < config.autoConfig.serpExplorationDepth) {
            this.addLog('INFO', `Znaleziono ${discoveredQueries.length} potencjalnych zapytań do następnej rundy. Wybieranie najbardziej trafnego...`);
            
            // Score all discovered queries for relevance
            const scoredQueries: Array<{ query: string; score: number }> = [];
            
            for (const discoveredQuery of discoveredQueries) {
              try {
                const score = await this.apiService.scoreQueryRelevance(
                  discoveredQuery,
                  config.project.centralEntity,
                  config.models.extractionModel
                );
                scoredQueries.push({ query: discoveredQuery, score });
                this.addLog('INFO', `Zapytanie "${discoveredQuery}" otrzymało ocenę trafności: ${score.toFixed(2)}`);
              } catch (error) {
                this.addLog('WARNING', `Błąd oceny zapytania "${discoveredQuery}": ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
              }
            }
            
            // Select the highest scoring query
            if (scoredQueries.length > 0) {
              const bestQuery = scoredQueries.reduce((best, current) => 
                current.score > best.score ? current : best
              );
              
              if (bestQuery.score > 0.3) { // Only add if relevance is reasonable
                queriesToProcess.push(bestQuery.query);
                this.addLog('SUCCESS', `Wybrano najlepsze zapytanie dla rundy ${currentRound + 1}: "${bestQuery.query}" (trafność: ${bestQuery.score.toFixed(2)})`);
              } else {
                this.addLog('INFO', `Najlepsze zapytanie "${bestQuery.query}" ma zbyt niską trafność (${bestQuery.score.toFixed(2)}). Pomijanie.`);
              }
            }
          }

          // Small delay to be respectful to the API
          await this.delay(500);
        } catch (error) {
          this.addLog('WARNING', `Błąd wyszukiwania dla "${query}": ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
        }
      }
    }

    // Remove duplicates
    const uniqueUrls = [...new Set(allUrls)];
    return uniqueUrls;
  }

  private async scrapeContent(urls: string[]): Promise<Array<{ url: string; content: string }>> {
    this.addLog('INFO', `Rozpoczynanie pobierania treści z ${urls.length} stron...`);
    
    const results: Array<{ url: string; content: string }> = [];
    const batchSize = 3; // Process in small batches to avoid overwhelming APIs
    
    for (let i = 0; i < urls.length; i += batchSize) {
      if (this.isCancelled()) {
        this.addLog('WARNING', 'Proces zatrzymany przez użytkownika podczas pobierania treści');
        throw new Error('Process cancelled by user');
      }
      
      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map(async (url, index) => {
        try {
          this.addLog('INFO', `Pobieram treść z ${url} (${i + index + 1}/${urls.length})`);
          const content = await this.apiService.scrapeContent(url);
          
          if (content && content.length > 100) {
            results.push({ url, content });
            this.addLog('SUCCESS', `Pobrano treść z ${url} (${content.length} znaków)`);
            return { url, content };
          } else {
            this.addLog('WARNING', `Zbyt mało treści z ${url}`);
            return null;
          }
        } catch (error) {
          this.addLog('WARNING', `Błąd pobierania z ${url}: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
          return null;
        }
      });
      
      await Promise.allSettled(batchPromises);
      
      // Delay between batches
      if (i + batchSize < urls.length) {
        await this.delay(1000);
      }
    }
    
    return results;
  }

  private async extractKnowledgeGraphs(
    scrapedContent: Array<{ url: string; content: string }>,
    centralEntity: string,
    businessContext: string,
    model: string,
    language: string
  ): Promise<KnowledgeGraph[]> {
    this.addLog('INFO', `Rozpoczynanie ekstrakcji grafów wiedzy z ${scrapedContent.length} stron...`);
    
    const results: KnowledgeGraph[] = [];
    
    for (let i = 0; i < scrapedContent.length; i++) {
      if (this.isCancelled()) {
        this.addLog('WARNING', 'Proces zatrzymany przez użytkownika podczas ekstrakcji grafów');
        throw new Error('Process cancelled by user');
      }
      
      const { url, content } = scrapedContent[i];
      
      try {
        this.addLog('INFO', `Generuję graf wiedzy dla ${url} (${i + 1}/${scrapedContent.length})`);
        
        // Clean and process content
        const cleanedContent = cleanMarkdown(content);
        this.addLog('INFO', `Oczyszczono treść dla ${url}: ${content.length} → ${cleanedContent.length} znaków`);
        
        // Truncate content using universal token limit
        const processedContent = this.truncateContentByTokens(
          cleanedContent, 
          ProcessingService.UNIVERSAL_MAX_TOKENS
        );
        
        if (processedContent !== cleanedContent) {
          this.addLog('INFO', `Obcięto treść dla ${url} do ${ProcessingService.UNIVERSAL_MAX_TOKENS} tokenów (~${processedContent.length} znaków)`);
        }
        
        const rawGraph = await this.apiService.extractKnowledgeGraph(
          processedContent,
          centralEntity,
          businessContext,
          url,
          model,
          language
        );
        
        if (rawGraph.nodes && rawGraph.nodes.length > 0) {
          // Step 3.4: Clean the raw graph to remove noise
          const cleanedGraph = cleanKnowledgeGraph(rawGraph);
          const stats = getCleaningStats(rawGraph, cleanedGraph);
          
          this.addLog('INFO', `Czyszczenie grafu dla ${url}: ${stats.nodesRemoved} węzłów usuniętych (${stats.nodesFilteredPercent}%), ${stats.edgesRemoved} krawędzi usuniętych (${stats.edgesFilteredPercent}%)`);
          
          if (cleanedGraph.nodes && cleanedGraph.nodes.length > 0) {
            results.push(cleanedGraph);
            this.addLog('SUCCESS', `Wygenerowano oczyszczony graf z ${cleanedGraph.nodes.length} węzłami dla ${url}`);
          } else {
            this.addLog('WARNING', `Graf dla ${url} jest pusty po oczyszczeniu - zbyt dużo szumu`);
          }
        } else {
          this.addLog('WARNING', `Pusty graf dla ${url}`);
        }
        
        // Small delay between requests
        await this.delay(500);
      } catch (error) {
        this.addLog('WARNING', `Błąd generowania grafu dla ${url}: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
      }
    }
    
    return results;
  }

  private consolidateKnowledgeGraph(fragments: KnowledgeGraph[]): KnowledgeGraph {
    this.addLog('INFO', `Konsolidacja ${fragments.length} fragmentów grafu wiedzy...`);
    
    const allNodes: KnowledgeGraphNode[] = [];
    const allEdges: KnowledgeGraphEdge[] = [];
    const nodeMap = new Map<string, KnowledgeGraphNode>();
    const edgeMap = new Map<string, KnowledgeGraphEdge>();
    
    // Consolidate nodes
    fragments.forEach(fragment => {
      if (fragment.nodes) {
        fragment.nodes.forEach(node => {
          const key = `${node.label.toLowerCase()}_${node.type}`;
          if (!nodeMap.has(key)) {
            nodeMap.set(key, {
              ...node,
              id: key,
            });
          } else {
            // Merge properties
            const existing = nodeMap.get(key)!;
            existing.properties = { ...existing.properties, ...node.properties };
          }
        });
      }
    });
    
    // Consolidate edges
    fragments.forEach(fragment => {
      if (fragment.edges) {
        fragment.edges.forEach(edge => {
          const sourceKey = this.findNodeKey(edge.source, fragments);
          const targetKey = this.findNodeKey(edge.target, fragments);
          
          if (sourceKey && targetKey) {
            const edgeKey = `${sourceKey}_${edge.relationship}_${targetKey}`;
            if (!edgeMap.has(edgeKey)) {
              edgeMap.set(edgeKey, {
                source: sourceKey,
                target: targetKey,
                relationship: edge.relationship,
                weight: edge.weight || 1,
              });
            } else {
              // Increase weight for duplicate relationships
              const existing = edgeMap.get(edgeKey)!;
              existing.weight = Math.min((existing.weight || 1) + 0.1, 1);
            }
          }
        });
      }
    });
    
    return {
      nodes: Array.from(nodeMap.values()),
      edges: Array.from(edgeMap.values()),
    };
  }

  private findNodeKey(nodeId: string, fragments: KnowledgeGraph[]): string | null {
    for (const fragment of fragments) {
      if (fragment.nodes) {
        const node = fragment.nodes.find(n => n.id === nodeId || n.label.toLowerCase() === nodeId.toLowerCase());
        if (node) {
          return `${node.label.toLowerCase()}_${node.type}`;
        }
      }
    }
    return null;
  }

  private async generateTopicalMap(graph: KnowledgeGraph, config: AppConfig): Promise<string> {
    this.addLog('INFO', 'Generowanie finalnej mapy tematycznej...');
    
    // Check if graph is empty
    if (!graph.nodes || graph.nodes.length === 0) {
      this.addLog('WARNING', 'Graf wiedzy jest pusty - generowanie podstawowej mapy na podstawie konfiguracji');
      return `# Mapa Tematyczna: ${config.project.centralEntity}

## Podsumowanie
Nie udało się zebrać wystarczających danych z internetu aby wygenerować szczegółową mapę tematyczną.

## Konfiguracja Projektu
- **Centralna Encja**: ${config.project.centralEntity}
- **Kontekst Biznesowy**: ${config.project.businessContext}
- **Język**: ${config.project.language}
- **Lokalizacja**: ${config.project.location}

## Zalecenia
1. Sprawdź poprawność kluczy API
2. Upewnij się, że centralna encja jest popularna w internecie
3. Rozważ użycie trybu ręcznego z konkretnymi URL-ami
4. Sprawdź czy wybrane zapytania zwracają wyniki w wyszukiwarce Google

*Mapa wygenerowana automatycznie z powodu braku danych źródłowych.*`;
    }
    
    return await this.apiService.generateTopicalMap(
      graph,
      config.project.centralEntity,
      config.project.businessContext,
      config.project.language,
      config.models.synthesisModel
    );
  }
}