import React, { useState, useEffect } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { LogsPanel } from './components/LogsPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { StorageService } from './services/storageService';
import { ApiService } from './services/apiService';
import { ProcessingService } from './services/processingService';
import { AppConfig, ApiKeys, LogEntry, ProcessResults } from './types';

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

  useEffect(() => {
    // Load saved configuration and API keys
    const savedKeys = StorageService.loadApiKeys();
    const savedConfig = StorageService.loadConfig();
    
    setApiKeys(savedKeys);
    if (savedConfig) {
      setConfig(prev => ({ ...prev, ...savedConfig }));
    }
  }, []);

  const addLog = (log: LogEntry) => {
    setLogs(prev => [...prev, log]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const handleGenerate = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setIsCancelled(false);
    setResults(null);
    clearLogs();

    try {
      const apiService = new ApiService(apiKeys);
      const processingService = new ProcessingService(apiService, addLog, () => isCancelled);
      
      addLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        level: 'INFO',
        message: `Rozpoczynanie przetwarzania projektu "${config.project.name}"`
      });

      const processResults = await processingService.processTopicalMap(config);
      setResults(processResults);
      
    } catch (error) {
      addLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        level: 'ERROR',
        message: `Proces nie powiódł się: ${error instanceof Error ? error.message : 'Nieznany błąd'}`
      });
    } finally {
      setIsProcessing(false);
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

  return (
    <div className="h-screen flex bg-gray-50">
      <ConfigPanel
        config={config}
        apiKeys={apiKeys}
        onConfigChange={setConfig}
        onApiKeysChange={setApiKeys}
        onGenerate={handleGenerate}
        onStop={handleStop}
        isProcessing={isProcessing}
      />
      
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