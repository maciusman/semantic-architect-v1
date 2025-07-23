/**
 * ProcessingService - Main service for orchestrating the entire topical map generation process
 * Converted from TypeScript to JavaScript for Node.js backend with SSE support
 */

const { ApiService } = require('./apiService');
const { cleanMarkdown } = require('./markdownCleaner');
const { cleanKnowledgeGraph, getCleaningStats } = require('./graphCleaner');

class ProcessingService {
  constructor(apiService, onLog) {
    this.apiService = apiService;
    this.onLog = onLog;
    this.logCounter = 0;
  }

  addLog(level, message) {
    this.logCounter++;
    this.onLog({
      id: `${Date.now()}_${this.logCounter}`,
      timestamp: new Date(),
      level,
      message,
    });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async processTopicalMap(config) {
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
      throw error;
    }
  }

  async getUrls(config) {
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
    const allUrls = [];
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

  async scrapeContent(urls) {
    this.addLog('INFO', `Rozpoczynanie pobierania treści z ${urls.length} stron...`);
    
    const results = [];
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

  async extractKnowledgeGraphs(scrapedContent, centralEntity, businessContext, model) {
    this.addLog('INFO', `Rozpoczynanie ekstrakcji grafów wiedzy z ${scrapedContent.length} stron...`);
    
    const results = [];
    
    for (let i = 0; i < scrapedContent.length; i++) {
      const { url, content } = scrapedContent[i];
      
      try {
        this.addLog('INFO', `Generuję graf wiedzy dla ${url} (${i + 1}/${scrapedContent.length})`);
        
        // Clean and process content
        const cleanedContent = cleanMarkdown(content);
        this.addLog('INFO', `Oczyszczono treść dla ${url}: ${content.length} → ${cleanedContent.length} znaków`);
        
        // Truncate cleaned content if still too long (to avoid token limits)
        const processedContent = cleanedContent.length > 8000 ? cleanedContent.substring(0, 8000) + '...' : cleanedContent;
        
        const rawGraph = await this.apiService.extractKnowledgeGraph(
          processedContent,
          centralEntity,
          url,
          model
        );
        
        if (rawGraph.nodes && rawGraph.nodes.length > 0) {
          // Clean the raw graph to remove noise
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

  consolidateKnowledgeGraph(fragments) {
    this.addLog('INFO', `Konsolidacja ${fragments.length} fragmentów grafu wiedzy...`);
    
    const allNodes = [];
    const allEdges = [];
    const nodeMap = new Map();
    const edgeMap = new Map();
    
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
            const existing = nodeMap.get(key);
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
              const existing = edgeMap.get(edgeKey);
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

  findNodeKey(nodeId, fragments) {
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

  async generateTopicalMap(graph, config) {
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

module.exports = { ProcessingService };