export interface ApiKeys {
  openrouter: string;
  jina: string;
  serpdata: string;
}

export interface ProjectConfig {
  name: string;
  centralEntity: string;
  businessContext: string;
  language: string;
  location: string;
}

export interface AutoUrlConfig {
  mainQuery: string;
  queryExpansionCount: number;
  urlsPerQuery: number;
}

export interface ManualUrlConfig {
  urls: string[];
}

export interface ModelConfig {
  extractionModel: string;
  synthesisModel: string;
}

export interface AppConfig {
  project: ProjectConfig;
  urlSource: 'auto' | 'manual';
  autoConfig: AutoUrlConfig;
  manualConfig: ManualUrlConfig;
  models: ModelConfig;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING';
  message: string;
}

export interface ProcessResults {
  topicalMap: string;
  knowledgeGraph: any;
  scrapedContent: Array<{ url: string; content: string }>;
  metadata: {
    totalUrls: number;
    processedUrls: number;
    executionTime: number;
    config: AppConfig;
  };
}

export interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}

export interface SerpResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  paaQuestions?: string[]; // Added for People Also Ask questions
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
}

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  relationship: string;
  weight: number;
}

export interface KnowledgeGraph {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}