import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Folder,
  Calendar
} from 'lucide-react';
import { SessionState } from '../types';
import { SessionService } from '../services/sessionService';

interface SessionPanelProps {
  currentSessionId?: string;
  onResumeSession: (sessionId: string) => void;
  onNewSession: () => void;
}

export function SessionPanel({ currentSessionId, onResumeSession, onNewSession }: SessionPanelProps) {
  const [sessions, setSessions] = useState<SessionState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const allSessions = await SessionService.getAllSessions();
      // Sort by creation date, newest first
      setSessions(allSessions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę sesję? Ta operacja jest nieodwracalna.')) {
      return;
    }

    try {
      await SessionService.deleteSession(sessionId);
      await loadSessions(); // Refresh list
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Błąd podczas usuwania sesji');
    }
  };

  const handleExportSession = async (sessionId: string) => {
    try {
      await SessionService.exportSessionData(sessionId);
    } catch (error) {
      console.error('Error exporting session:', error);
      alert('Błąd podczas eksportu sesji');
    }
  };

  const getStatusIcon = (status: SessionState['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: SessionState['status']) => {
    switch (status) {
      case 'completed': return 'Ukończono';
      case 'running': return 'W toku';
      case 'paused': return 'Zapauzowano';
      case 'error': return 'Błąd';
      case 'cancelled': return 'Anulowano';
      default: return 'Nieznany';
    }
  };

  const getStepText = (step: SessionState['currentStep']) => {
    switch (step) {
      case 'urls': return 'Pozyskiwanie URL-i';
      case 'content': return 'Pobieranie treści';
      case 'fragments': return 'Ekstrakcja grafów';
      case 'consolidation': return 'Konsolidacja';
      case 'synthesis': return 'Generowanie mapy';
      case 'completed': return 'Zakończono';
      default: return 'Nieznany';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  if (loading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Folder className="w-5 h-5" />
            <span>Sesje Projektów</span>
          </h2>
          <button
            onClick={onNewSession}
            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
          >
            Nowa Sesja
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Brak zapisanych sesji</p>
            <p className="text-xs mt-2">Rozpocznij nową analizę</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`border rounded-lg p-4 transition-all ${
                  session.id === currentSessionId
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Session Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {session.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(session.status)}
                      <span className="text-xs text-gray-600">
                        {getStatusText(session.status)}
                      </span>
                      {session.status === 'running' && (
                        <span className="text-xs text-gray-500">
                          - {getStepText(session.currentStep)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Session Metadata */}
                <div className="text-xs text-gray-500 space-y-1 mb-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(session.createdAt)}</span>
                  </div>
                  {session.metadata.executionTime > 0 && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Czas: {formatDuration(session.metadata.executionTime)}</span>
                    </div>
                  )}
                  {session.metadata.processedUrls !== undefined && session.metadata.totalUrls !== undefined && (
                    <div>
                      URL-e: {session.metadata.processedUrls}/{session.metadata.totalUrls}
                    </div>
                  )}
                </div>

                {/* Progress Indicators */}
                {session.status === 'running' || session.status === 'paused' ? (
                  <div className="mb-3">
                    <div className="text-xs text-gray-600 mb-1">Postęp:</div>
                    <div className="flex space-x-1">
                      {['urls', 'content', 'fragments', 'consolidation', 'synthesis'].map((step, index) => (
                        <div
                          key={step}
                          className={`flex-1 h-2 rounded-full ${
                            index < ['urls', 'content', 'fragments', 'consolidation', 'synthesis'].indexOf(session.currentStep) + 1
                              ? 'bg-green-400'
                              : index === ['urls', 'content', 'fragments', 'consolidation', 'synthesis'].indexOf(session.currentStep)
                              ? 'bg-blue-400'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Error Message */}
                {session.status === 'error' && session.error && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    {session.error}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {(session.status === 'paused' || session.status === 'error') && (
                    <button
                      onClick={() => onResumeSession(session.id)}
                      className="flex-1 flex items-center justify-center space-x-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      <span>Wznów</span>
                    </button>
                  )}
                  
                  {session.status === 'completed' && (
                    <button
                      onClick={() => handleExportSession(session.id)}
                      className="flex-1 flex items-center justify-center space-x-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Eksportuj</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                    title="Usuń sesję"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}