import { ApiService } from './apiService';
import { AppConfig, LogEntry, ProcessResults, KnowledgeGraph, KnowledgeGraphNode, KnowledgeGraphEdge } from '../types';

export class ProcessingService {
  private apiService: ApiService;
  private onLog: (log: LogEntry) => void;
  private logCounter: number = 0;

  constructor(apiService: ApiService, onLog: (log: LogEntry) => void) {
    this.apiService = apiService;
    this.onLog = onLog;
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
        config.models.extractionModel
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
        metadata: {
          totalUrls: urls.length,
          processedUrls: scrapedContent.length,
          executionTime,
          config,
        },
      };
    } catch (error) {
      this.addLog('ERROR', `Błąd podczas przetwarzania: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
      throw error;
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
    const queries = await this.apiService.performQueryExpansion(
      config.project.centralEntity,
      config.project.businessContext,
      config.project.language,
      config.autoConfig.queryExpansionCount,
      config.models.extractionModel
    );

    this.addLog('SUCCESS', `Wygenerowano zapytania: ${queries.join(', ')}`);

    // Filter out empty or whitespace-only queries
    const validQueries = queries.filter(query => query && query.trim().length > 0);
    
    if (validQueries.length === 0) {
      this.addLog('WARNING', 'Wszystkie wygenerowane zapytania są puste - brak URL-i do pobrania');
      return [];
    }
    
    if (validQueries.length < queries.length) {
      this.addLog('WARNING', `Odfiltrowano ${queries.length - validQueries.length} pustych zapytań`);
    }
    // Multi-SERP analysis
    const allUrls: string[] = [];
    for (const query of validQueries) {
      this.addLog('INFO', `Wyszukiwanie URL-i dla zapytania: "${query}"`);
      
      try {
        const results = await this.apiService.searchSerp(
          query,
          config.project.language,
          config.project.location,
          config.autoConfig.urlsPerQuery
        );
        
        const urls = results.map(r => r.url);
        allUrls.push(...urls);
        this.addLog('INFO', `Znaleziono ${urls.length} URL-i dla "${query}" (z ${results.length} wyników)`);
        
        // Small delay to be respectful to the API
        await this.delay(500);
      } catch (error) {
        this.addLog('WARNING', `Błąd wyszukiwania dla "${query}": ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
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
    model: string
  ): Promise<KnowledgeGraph[]> {
    this.addLog('INFO', `Rozpoczynanie ekstrakcji grafów wiedzy z ${scrapedContent.length} stron...`);
    
    const results: KnowledgeGraph[] = [];
    
    for (let i = 0; i < scrapedContent.length; i++) {
      const { url, content } = scrapedContent[i];
      
      try {
        this.addLog('INFO', `Generuję graf wiedzy dla ${url} (${i + 1}/${scrapedContent.length})`);
        
        // Truncate content if too long (to avoid token limits)
        const truncatedContent = content.length > 8000 ? content.substring(0, 8000) + '...' : content;
        
        const graph = await this.apiService.extractKnowledgeGraph(
          truncatedContent,
          centralEntity,
          url,
          model
        );
        
        if (graph.nodes && graph.nodes.length > 0) {
          results.push(graph);
          this.addLog('SUCCESS', `Wygenerowano graf z ${graph.nodes.length} węzłami dla ${url}`);
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