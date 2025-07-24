import { SessionState, AppConfig, KnowledgeGraph } from '../types';

export class SessionService {
  private static readonly DB_NAME = 'SemanticArchitectSessions';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = 'sessions';

  private static async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  static async createSession(config: AppConfig): Promise<string> {
    const sessionId = `${config.project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    const session: SessionState = {
      id: sessionId,
      name: config.project.name,
      config,
      status: 'running',
      currentStep: 'urls',
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: {},
      metadata: {
        executionTime: 0
      }
    };

    const db = await this.openDB();
    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.add(session);
      request.onsuccess = () => resolve(sessionId);
      request.onerror = () => reject(request.error);
    });
  }

  static async getSession(sessionId: string): Promise<SessionState | null> {
    const db = await this.openDB();
    const transaction = db.transaction([this.STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(sessionId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  static async updateSession(sessionId: string, updates: Partial<SessionState>): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: new Date()
    };

    const db = await this.openDB();
    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.put(updatedSession);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getAllSessions(): Promise<SessionState[]> {
    const db = await this.openDB();
    const transaction = db.transaction([this.STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(sessionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async saveCheckpoint(
    sessionId: string, 
    step: SessionState['currentStep'], 
    data: any
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const progressUpdate: any = { ...session.progress };
    
    switch (step) {
      case 'urls':
        progressUpdate.urls = data;
        break;
      case 'content':
        progressUpdate.scrapedContent = data;
        break;
      case 'fragments':
        progressUpdate.knowledgeFragments = data;
        break;
      case 'consolidation':
        progressUpdate.consolidatedGraph = data;
        break;
      case 'synthesis':
        progressUpdate.topicalMap = data;
        break;
    }

    await this.updateSession(sessionId, {
      currentStep: step,
      progress: progressUpdate,
      status: step === 'completed' ? 'completed' : 'running'
    });
  }

  static async exportSessionData(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    // Create session archive
    const sessionData = {
      'config.json': JSON.stringify(session.config, null, 2),
      'session_metadata.json': JSON.stringify({
        id: session.id,
        name: session.name,
        status: session.status,
        currentStep: session.currentStep,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        metadata: session.metadata
      }, null, 2),
    };

    // Add progress files if they exist
    if (session.progress.urls) {
      sessionData['urls.json'] = JSON.stringify(session.progress.urls, null, 2);
    }
    if (session.progress.scrapedContent) {
      sessionData['content.json'] = JSON.stringify(session.progress.scrapedContent, null, 2);
    }
    if (session.progress.knowledgeFragments) {
      sessionData['fragments.json'] = JSON.stringify(session.progress.knowledgeFragments, null, 2);
    }
    if (session.progress.consolidatedGraph) {
      sessionData['consolidated_graph.json'] = JSON.stringify(session.progress.consolidatedGraph, null, 2);
    }
    if (session.progress.topicalMap) {
      sessionData['topical_map.md'] = session.progress.topicalMap;
    }

    // Create and download ZIP-like JSON file
    const archiveContent = JSON.stringify(sessionData, null, 2);
    const blob = new Blob([archiveContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.name.replace(/[^a-zA-Z0-9]/g, '_')}_session_archive.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}</action>