import React, { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Globe, Search, Brain, Zap } from 'lucide-react';
import { AppConfig, ApiKeys, OpenRouterModel } from '../types';
import { StorageService } from '../services/storageService';
import { ApiService } from '../services/apiService';

interface ConfigPanelProps {
  config: AppConfig;
  apiKeys: ApiKeys;
  onConfigChange: (config: AppConfig) => void;
  onApiKeysChange: (keys: ApiKeys) => void;
  onGenerate: () => void;
  isProcessing: boolean;
}

export function ConfigPanel({
  config,
  apiKeys,
  onConfigChange,
  onApiKeysChange,
  onGenerate,
  isProcessing
}: ConfigPanelProps) {
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [showApiFields, setShowApiFields] = useState({
    openrouter: false,
    jina: false,
    serpdata: false,
  });
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    loadModels();
  }, [apiKeys.openrouter]);

  const loadModels = async () => {
    if (!apiKeys.openrouter) return;
    
    setLoadingModels(true);
    try {
      const apiService = new ApiService(apiKeys);
      const fetchedModels = await apiService.fetchOpenRouterModels();
      setModels(fetchedModels);
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleApiKeyChange = (key: keyof ApiKeys, value: string) => {
    const newKeys = { ...apiKeys, [key]: value };
    onApiKeysChange(newKeys);
    StorageService.saveApiKeys(newKeys);
  };

  const handleConfigChange = (updates: Partial<AppConfig>) => {
    const newConfig = { ...config, ...updates };
    onConfigChange(newConfig);
    StorageService.saveConfig(newConfig);
  };

  const canGenerate = () => {
    return (
      apiKeys.openrouter &&
      apiKeys.jina &&
      apiKeys.serpdata &&
      config.project.name &&
      config.project.centralEntity &&
      config.models.extractionModel &&
      config.models.synthesisModel &&
      (config.urlSource === 'auto' ? config.autoConfig.mainQuery : config.manualConfig.urls.length > 0)
    );
  };

  // Sort models alphabetically for better UX
  const sortedModels = models.sort((a, b) => {
    const aName = a.name || a.id;
    const bName = b.name || b.id;
    return aName.localeCompare(bName);
  });

  return (
    <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Brain className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Semantic Architect</h1>
            <p className="text-sm text-gray-500">V-Lite</p>
          </div>
        </div>

        {/* API Keys Section */}
        <div className="space-y-3">
          <button
            onClick={() => setShowApiKeys(!showApiKeys)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors w-full"
          >
            <Settings className="w-4 h-4" />
            <span className="font-medium">Ustawienia API</span>
            <div className="flex-1" />
            {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {showApiKeys && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              {Object.entries(apiKeys).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiFields[key as keyof typeof showApiFields] ? 'text' : 'password'}
                      value={value}
                      onChange={(e) => handleApiKeyChange(key as keyof ApiKeys, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm pr-10"
                      placeholder={`Wprowadź ${key} API key`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiFields(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                      className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showApiFields[key as keyof typeof showApiFields] ? 
                        <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Konfiguracja Projektu</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa Projektu
              </label>
              <input
                type="text"
                value={config.project.name}
                onChange={(e) => handleConfigChange({
                  project: { ...config.project, name: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                placeholder="np. Baseny Ogrodowe - Klient X"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Centralna Encja / Temat
              </label>
              <input
                type="text"
                value={config.project.centralEntity}
                onChange={(e) => handleConfigChange({
                  project: { ...config.project, centralEntity: e.target.value },
                  autoConfig: { ...config.autoConfig, mainQuery: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                placeholder="np. basen ogrodowy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kontekst Biznesowy
              </label>
              <textarea
                value={config.project.businessContext}
                onChange={(e) => handleConfigChange({
                  project: { ...config.project, businessContext: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                rows={3}
                placeholder="np. Jesteśmy producentem basenów poliestrowych premium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Język
                </label>
                <select
                  value={config.project.language}
                  onChange={(e) => handleConfigChange({
                    project: { ...config.project, language: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                >
                  <option value="pl">Polski</option>
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lokalizacja
                </label>
                <select
                  value={config.project.location}
                  onChange={(e) => handleConfigChange({
                    project: { ...config.project, location: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                >
                  <option value="pl">Polska</option>
                  <option value="us">USA</option>
                  <option value="de">Niemcy</option>
                  <option value="gb">Wielka Brytania</option>
                  <option value="es">Hiszpania</option>
                  <option value="fr">Francja</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* URL Source Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Źródło Adresów URL</span>
          </h3>

          <div className="space-y-3">
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="auto"
                  checked={config.urlSource === 'auto'}
                  onChange={(e) => handleConfigChange({ urlSource: e.target.value as 'auto' | 'manual' })}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Automatycznie (zalecane)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="manual"
                  checked={config.urlSource === 'manual'}
                  onChange={(e) => handleConfigChange({ urlSource: e.target.value as 'auto' | 'manual' })}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Manualnie</span>
              </label>
            </div>

            {config.urlSource === 'auto' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Główne zapytanie do Google
                  </label>
                  <input
                    type="text"
                    value={config.autoConfig.mainQuery}
                    onChange={(e) => handleConfigChange({
                      autoConfig: { ...config.autoConfig, mainQuery: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    placeholder="Automatycznie z Centralnej Encji"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Liczba głównych zapytań (Query Expansion): {config.autoConfig.queryExpansionCount}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={config.autoConfig.queryExpansionCount}
                    onChange={(e) => handleConfigChange({
                      autoConfig: { ...config.autoConfig, queryExpansionCount: parseInt(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Liczba URL-i na zapytanie: {config.autoConfig.urlsPerQuery}
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={config.autoConfig.urlsPerQuery}
                    onChange={(e) => handleConfigChange({
                      autoConfig: { ...config.autoConfig, urlsPerQuery: parseInt(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Liczba Dodatkowych Eksploracji SERP: {config.autoConfig.serpExplorationDepth}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    value={config.autoConfig.serpExplorationDepth}
                    onChange={(e) => handleConfigChange({
                      autoConfig: { ...config.autoConfig, serpExplorationDepth: parseInt(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresy URL do analizy (każdy w nowej linii)
                </label>
                <textarea
                  value={config.manualConfig.urls.join('\n')}
                  onChange={(e) => handleConfigChange({
                    manualConfig: { urls: e.target.value.split('\n').filter(url => url.trim()) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                  rows={6}
                  placeholder="https://example1.com&#10;https://example2.com&#10;https://example3.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL-i: {config.manualConfig.urls.length}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AI Models Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Wybór Modeli AI</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model AI do Ekstrakcji
              </label>
              <select
                value={config.models.extractionModel}
                onChange={(e) => handleConfigChange({
                  models: { ...config.models, extractionModel: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                disabled={loadingModels}
              >
                <option value="">Wybierz model...</option>
                {sortedModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name || model.id}
                  </option>
                ))}
              </select>
              {loadingModels && (
                <p className="text-xs text-gray-500 mt-1">Ładowanie modeli...</p>
              )}
              {!loadingModels && models.length === 0 && apiKeys.openrouter && (
                <p className="text-xs text-red-500 mt-1">Nie udało się pobrać modeli. Sprawdź klucz API.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model AI do Syntezy
              </label>
              <select
                value={config.models.synthesisModel}
                onChange={(e) => handleConfigChange({
                  models: { ...config.models, synthesisModel: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                disabled={loadingModels}
              >
                <option value="">Wybierz model...</option>
                {sortedModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name || model.id}
                  </option>
                ))}
              </select>
              {loadingModels && (
                <p className="text-xs text-gray-500 mt-1">Ładowanie modeli...</p>
              )}
              {!loadingModels && models.length === 0 && apiKeys.openrouter && (
                <p className="text-xs text-red-500 mt-1">Nie udało się pobrać modeli. Sprawdź klucz API.</p>
              )}
            </div>

            {!apiKeys.openrouter && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs text-yellow-800">
                  Wprowadź klucz OpenRouter API, aby załadować dostępne modele.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-4">
          <button
            onClick={onGenerate}
            disabled={!canGenerate() || isProcessing}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
              canGenerate() && !isProcessing
                ? 'bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <Brain className="w-5 h-5" />
            <span>
              {isProcessing ? 'PRZETWARZANIE...' : 'GENERUJ MAPĘ TEMATYCZNĄ'}
            </span>
          </button>

          {!canGenerate() && !isProcessing && (
            <div className="mt-2 text-xs text-red-500 space-y-1">
              {!apiKeys.openrouter && <p>• Brak klucza OpenRouter API</p>}
              {!apiKeys.jina && <p>• Brak klucza Jina AI API</p>}
              {!apiKeys.serpdata && <p>• Brak klucza SerpData API</p>}
              {!config.project.name && <p>• Brak nazwy projektu</p>}
              {!config.project.centralEntity && <p>• Brak centralnej encji</p>}
              {!config.models.extractionModel && <p>• Nie wybrano modelu ekstrakcji</p>}
              {!config.models.synthesisModel && <p>• Nie wybrano modelu syntezy</p>}
              {config.urlSource === 'auto' && !config.autoConfig.mainQuery && <p>• Brak głównego zapytania</p>}
              {config.urlSource === 'manual' && config.manualConfig.urls.length === 0 && <p>• Brak URL-i do analizy</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}