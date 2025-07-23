import React, { useState } from 'react';
import { Download, FileText, Database, Archive, Eye, Copy, Check } from 'lucide-react';
import { ProcessResults } from '../types';

interface ResultsPanelProps {
  results: ProcessResults | null;
  isProcessing: boolean;
}

export function ResultsPanel({ results, isProcessing }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'graph'>('preview');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!results) return;
    
    try {
      await navigator.clipboard.writeText(results.topicalMap);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    if (!results) return;
    const filename = `${results.metadata.config.project.name.replace(/[^a-zA-Z0-9]/g, '_')}_mapa.md`;
    downloadFile(results.topicalMap, filename, 'text/markdown');
  };

  const handleExportGraph = () => {
    if (!results) return;
    const filename = `${results.metadata.config.project.name.replace(/[^a-zA-Z0-9]/g, '_')}_graf.json`;
    downloadFile(JSON.stringify(results.knowledgeGraph, null, 2), filename, 'application/json');
  };

  const handleExportProject = () => {
    if (!results) return;
    
    // Create metadata file content
    const metadata = `Semantic Architect V-Lite - Raport Projektu
=====================================

Nazwa Projektu: ${results.metadata.config.project.name}
Centralna Encja: ${results.metadata.config.project.centralEntity}
Kontekst Biznesowy: ${results.metadata.config.project.businessContext}

Konfiguracja:
- Język: ${results.metadata.config.project.language}
- Lokalizacja: ${results.metadata.config.project.location}
- Źródło URL: ${results.metadata.config.urlSource}
- Model Ekstrakcji: ${results.metadata.config.models.extractionModel}
- Model Syntezy: ${results.metadata.config.models.synthesisModel}

Statystyki:
- Łączna liczba URL-i: ${results.metadata.totalUrls}
- Przetworzone URL-e: ${results.metadata.processedUrls}
- Czas wykonania: ${Math.round(results.metadata.executionTime / 1000)}s

Data generowania: ${new Date().toLocaleString('pl-PL')}
`;

    // Create ZIP-like structure (simplified for browser)
    const projectData = {
      'mapa.md': results.topicalMap,
      'graf.json': JSON.stringify(results.knowledgeGraph, null, 2),
      'metadane.txt': metadata
    };

    const zipContent = JSON.stringify(projectData, null, 2);
    const filename = `${results.metadata.config.project.name.replace(/[^a-zA-Z0-9]/g, '_')}_projekt.json`;
    downloadFile(zipContent, filename, 'application/json');
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Wyniki i Eksport</span>
        </h2>
      </div>

      {!results && !isProcessing && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-gray-500">
            <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Brak wyników</p>
            <p className="text-xs mt-2">Uruchom generowanie mapy tematycznej</p>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-gray-600">Przetwarzanie w toku...</p>
            <p className="text-xs text-gray-500 mt-2">Proszę czekać</p>
          </div>
        </div>
      )}

      {results && (
        <>
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'preview'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Podgląd
              </button>
              <button
                onClick={() => setActiveTab('graph')}
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'graph'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Database className="w-4 h-4 inline mr-2" />
                Graf
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'preview' ? (
              <div className="h-full flex flex-col">
                <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Mapa Tematyczna</span>
                  <button
                    onClick={handleCopy}
                    className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Skopiuj do schowka"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-xs leading-relaxed text-gray-800 font-sans">
                      {results.topicalMap}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="p-3 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Graf Wiedzy</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="font-medium text-blue-800">Węzły</div>
                        <div className="text-xl font-bold text-blue-900">
                          {results.knowledgeGraph.nodes?.length || 0}
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="font-medium text-green-800">Relacje</div>
                        <div className="text-xl font-bold text-green-900">
                          {results.knowledgeGraph.edges?.length || 0}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs">
                      <pre className="bg-gray-50 p-3 rounded-lg overflow-x-auto text-gray-800">
                        {JSON.stringify(results.knowledgeGraph, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="border-t border-gray-200 p-4">
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-4">
              <div>
                <span className="font-medium">URL-e:</span> {results.metadata.processedUrls}/{results.metadata.totalUrls}
              </div>
              <div>
                <span className="font-medium">Czas:</span> {formatExecutionTime(results.metadata.executionTime)}
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="border-t border-gray-200 p-4 space-y-2">
            <button
              onClick={handleExportMarkdown}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Eksportuj Mapę (Markdown)</span>
            </button>
            
            <button
              onClick={handleExportGraph}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              <Database className="w-4 h-4" />
              <span>Eksportuj Graf (JSON)</span>
            </button>
            
            <button
              onClick={handleExportProject}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
            >
              <Archive className="w-4 h-4" />
              <span>Eksportuj Projekt (ZIP)</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}