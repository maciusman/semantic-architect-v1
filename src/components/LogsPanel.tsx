import React, { useEffect, useRef } from 'react';
import { Terminal, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { LogEntry } from '../types';

interface LogsPanelProps {
  logs: LogEntry[];
  isProcessing: boolean;
}

export function LogsPanel({ logs, isProcessing }: LogsPanelProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'INFO':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'ERROR':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'INFO':
        return 'text-blue-700';
      case 'SUCCESS':
        return 'text-green-700';
      case 'WARNING':
        return 'text-yellow-700';
      case 'ERROR':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center space-x-3">
          <Terminal className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-semibold">Logi Procesu</h2>
          {isProcessing && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">Przetwarzanie...</span>
            </div>
          )}
        </div>
      </div>

      {/* Logs Content */}
      <div className="flex-1 p-4 overflow-y-auto font-mono text-sm">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Gotowy do rozpoczęcia przetwarzania...</p>
            <p className="text-xs mt-2">Logi będą wyświetlane tutaj w czasie rzeczywistym</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 py-1">
                <span className="text-xs text-gray-500 w-20 flex-shrink-0">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                <div className="flex-shrink-0 mt-0.5">
                  {getLogIcon(log.level)}
                </div>
                <span className={`${getLogColor(log.level)} flex-1`}>
                  [{log.level}] {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Wpisy: {logs.length}</span>
          {isProcessing && (
            <span className="flex items-center space-x-1">
              <div className="w-1 h-1 bg-green-400 rounded-full animate-ping"></div>
              <span>Na żywo</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}