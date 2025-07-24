import React, { useState, useEffect } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { LogsPanel } from './components/LogsPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { SessionPanel } from './components/SessionPanel';
import { StorageService } from './services/storageService';
import { ApiService } from './services/apiService';
import { ProcessingService } from './services/processingService';
import { SessionService } from './services/sessionService';
import { AppConfig, ApiKeys, LogEntry, ProcessResults, SessionState } from './types';

const defaultConfig: AppConfig = {
  project: {
    name: '',
    centralEntity: '',
    businessContext: '',
    language: 'pl',
    location: 'pl',
  },
  urlSource: 'auto',
  autoConfig: {
    mainQuery: '',
    queryExpansionCount: 3,
    urlsPerQuery: 5,
  },
  manualConfig: {
    urls: [],
  },
  models: {
    extractionModel: '',
    synthesisModel: '',
  },
};

function App() {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ openrouter: '', jina: '', serpdata: '' });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [results, setResults] = useState<ProcessResults | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSessionPanel, setShowSessionPanel] = useState(false);

  useEffect(() => {
    // Load saved configuration and API keys
    const savedKeys = StorageService.loadApiKeys();
    const savedConfig = StorageService.loadConfig();
    
    setApiKeys(savedKeys);
    if (savedConfig) {
      setConfig(prev => ({
        ...prev,
        ...savedConfig,
        project: {
          ...prev.project,
          ...savedConfig.project,
        },
        autoConfig: {
          ...prev.autoConfig,
          ...savedConfig.autoConfig,
          // Ensure these are numbers, falling back to default if saved is null/undefined
          queryExpansionCount: savedConfig.autoConfig?.queryExpansionCount ?? prev.autoConfig.queryExpansionCount,
          urlsPerQuery: savedConfig.autoConfig?.urlsPerQuery ?? prev.autoConfig.urlsPerQuery,
          serpExplorationDepth: savedConfig.autoConfig?.serpExplorationDepth ?? prev.autoConfig.serpExplorationDepth,
        },
        manualConfig: {
          ...prev.manualConfig,
          ...savedConfig.manualConfig,
        },
        models: {
          ...prev.models,
          ...savedConfig.models,
        },
      }));
    }
  }, []);

  const addLog = (log: LogEntry) => {
    setLogs(prev => [...prev, log]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const handleGenerate = async (resumeSessionId?: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setIsCancelled(false);
    setIsPaused(false);
    setResults(null);
    clearLogs();

    try {
      const apiService = new ApiService(apiKeys);
      const processingService = new ProcessingService(
        apiService, 
        addLog, 
        () => isCancelled,
        () => isPaused,
        resumeSessionId
      );
      
      if (resumeSessionId) {
        setCurrentSessionId(resumeSessionId);
        addLog({
          id: Date.now().toString(),
          timestamp: new Date(),
          level: 'INFO',
          message: `Wznawianie sesji "${resumeSessionId}"`
        });
      } else {
        addLog({
          id: Date.now().toString(),
          timestamp: new Date(),
          level: 'INFO',
          message: `Rozpoczynanie przetwarzania projektu "${config.project.name}"`
        });
      }

      const processResults = await processingService.processTopicalMap(config, resumeSessionId);
      setResults(processResults);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
      if (!errorMessage.includes('zapauzowany') && !errorMessage.includes('anulowany')) {
        addLog({
          id: Date.now().toString(),
          timestamp: new Date(),
          level: 'ERROR',
          message: `Proces nie powiódł się: ${errorMessage}`
        });
      }
    } finally {
      setIsProcessing(false);
      setCurrentSessionId(null);
    }
  };

  const handleStop = () => {
    setIsCancelled(true);
    addLog({
      id: Date.now().toString(),
      timestamp: new Date(),
      level: 'WARNING',
      message: 'Proces zatrzymywany przez użytkownika...'
    });
  };

  const handlePause = () => {
    setIsPaused(true);
    addLog({
      id: Date.now().toString(),
      timestamp: new Date(),
      level: 'WARNING',
      message: 'Proces pauzowany przez użytkownika...'
    });
  };

  const handleResumeSession = (sessionId: string) => {
    handleGenerate(sessionId);
  };

  const handleNewSession = () => {
    setShowSessionPanel(false);
    // Reset to new session mode
    setResults(null);
    clearLogs();
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {showSessionPanel ? (
        <SessionPanel
          currentSessionId={currentSessionId}
          onResumeSession={handleResumeSession}
          onNewSession={handleNewSession}
        />
      ) : (
        <ConfigPanel
          config={config}
          apiKeys={apiKeys}
          onConfigChange={setConfig}
          onApiKeysChange={setApiKeys}
          onGenerate={() => handleGenerate()}
          onStop={handleStop}
          onPause={handlePause}
          onShowSessions={() => setShowSessionPanel(true)}
          isProcessing={isProcessing}
        />
      )}
      
      <LogsPanel
        logs={logs}
        isProcessing={isProcessing}
      />
      
      <ResultsPanel
        results={results}
        isProcessing={isProcessing}
      />
    </div>
  );
}

export default App;