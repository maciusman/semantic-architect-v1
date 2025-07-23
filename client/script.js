/**
 * Semantic Architect V-Lite - Frontend JavaScript
 * Handles UI interactions, API communication, and SSE connections
 */

// Global state
let currentResults = null;
let logCount = 0;
let isProcessing = false;
let eventSource = null;

// DOM Elements
const elements = {
    // API Keys
    openrouterKey: document.getElementById('openrouter-key'),
    jinaKey: document.getElementById('jina-key'),
    serpdataKey: document.getElementById('serpdata-key'),
    
    // Project config
    projectName: document.getElementById('project-name'),
    centralEntity: document.getElementById('central-entity'),
    businessContext: document.getElementById('business-context'),
    language: document.getElementById('language'),
    location: document.getElementById('location'),
    
    // URL source
    urlSourceRadios: document.querySelectorAll('input[name="url-source"]'),
    autoConfig: document.getElementById('auto-config'),
    manualConfig: document.getElementById('manual-config'),
    mainQuery: document.getElementById('main-query'),
    queryExpansionCount: document.getElementById('query-expansion-count'),
    queryCountDisplay: document.getElementById('query-count-display'),
    urlsPerQuery: document.getElementById('urls-per-query'),
    urlsCountDisplay: document.getElementById('urls-count-display'),
    manualUrls: document.getElementById('manual-urls'),
    manualUrlCount: document.getElementById('manual-url-count'),
    
    // AI Models
    extractionModel: document.getElementById('extraction-model'),
    synthesisModel: document.getElementById('synthesis-model'),
    modelsLoading: document.getElementById('models-loading'),
    apiWarning: document.getElementById('api-warning'),
    
    // Generate
    generateBtn: document.getElementById('generate-btn'),
    validationErrors: document.getElementById('validation-errors'),
    
    // Logs
    logsContainer: document.getElementById('logs-container'),
    logsCount: document.getElementById('logs-count'),
    processingIndicator: document.getElementById('processing-indicator'),
    liveIndicator: document.getElementById('live-indicator'),
    
    // Results
    resultsEmpty: document.getElementById('results-empty'),
    resultsProcessing: document.getElementById('results-processing'),
    resultsContent: document.getElementById('results-content'),
    previewTab: document.getElementById('preview-tab'),
    graphTab: document.getElementById('graph-tab'),
    previewContent: document.getElementById('preview-content'),
    graphStats: document.getElementById('graph-stats'),
    graphContent: document.getElementById('graph-content'),
    resultsStats: document.getElementById('results-stats'),
    copyBtn: document.getElementById('copy-btn')
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadSavedData();
    updateUI();
});

function initializeEventListeners() {
    // URL source radio buttons
    elements.urlSourceRadios.forEach(radio => {
        radio.addEventListener('change', handleUrlSourceChange);
    });
    
    // Central entity auto-fill main query
    elements.centralEntity.addEventListener('input', function() {
        if (!elements.mainQuery.value || elements.mainQuery.value === elements.mainQuery.placeholder) {
            elements.mainQuery.value = this.value;
        }
    });
    
    // Range sliders
    elements.queryExpansionCount.addEventListener('input', function() {
        elements.queryCountDisplay.textContent = this.value;
        saveConfigData();
    });
    
    elements.urlsPerQuery.addEventListener('input', function() {
        elements.urlsCountDisplay.textContent = this.value;
        saveConfigData();
    });
    
    // Manual URLs count
    elements.manualUrls.addEventListener('input', function() {
        const urls = this.value.split('\n').filter(url => url.trim());
        elements.manualUrlCount.textContent = urls.length;
        saveConfigData();
    });
    
    // API keys change
    [elements.openrouterKey, elements.jinaKey, elements.serpdataKey].forEach(input => {
        input.addEventListener('input', function() {
            saveApiKeys();
            if (input === elements.openrouterKey) {
                loadModels();
            }
        });
    });
    
    // Other form inputs
    [elements.projectName, elements.centralEntity, elements.businessContext, 
     elements.language, elements.location, elements.mainQuery,
     elements.extractionModel, elements.synthesisModel].forEach(input => {
        input.addEventListener('change', saveConfigData);
        input.addEventListener('input', saveConfigData);
    });
    
    // Generate button
    elements.generateBtn.addEventListener('click', handleGenerate);
    
    // Load models on page load
    setTimeout(loadModels, 500);
}

function toggleApiKeys() {
    const section = document.getElementById('api-section');
    const toggle = document.getElementById('api-toggle');
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        toggle.textContent = '🙈';
    } else {
        section.style.display = 'none';
        toggle.textContent = '👁️';
    }
}

function handleUrlSourceChange() {
    const selectedValue = document.querySelector('input[name="url-source"]:checked').value;
    
    if (selectedValue === 'auto') {
        elements.autoConfig.style.display = 'block';
        elements.manualConfig.style.display = 'none';
    } else {
        elements.autoConfig.style.display = 'none';
        elements.manualConfig.style.display = 'block';
    }
    
    saveConfigData();
    updateUI();
}

async function loadModels() {
    const openrouterKey = elements.openrouterKey.value.trim();
    
    if (!openrouterKey) {
        elements.apiWarning.style.display = 'block';
        elements.modelsLoading.style.display = 'none';
        clearModelOptions();
        return;
    }
    
    elements.apiWarning.style.display = 'none';
    elements.modelsLoading.style.display = 'block';
    
    try {
        const response = await fetch('/api/models', {
            headers: {
                'Authorization': `Bearer ${openrouterKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        populateModelOptions(data.models || []);
        
    } catch (error) {
        console.error('Error loading models:', error);
        addLog('ERROR', `Błąd ładowania modeli: ${error.message}`);
        clearModelOptions();
        elements.apiWarning.style.display = 'block';
        elements.apiWarning.textContent = `❌ Błąd ładowania modeli: ${error.message}`;
    } finally {
        elements.modelsLoading.style.display = 'none';
    }
}

function populateModelOptions(models) {
    // Sort models alphabetically
    const sortedModels = models.sort((a, b) => {
        const aName = a.name || a.id;
        const bName = b.name || b.id;
        return aName.localeCompare(bName);
    });
    
    // Clear existing options (keep placeholder)
    clearModelOptions();
    
    // Add model options
    sortedModels.forEach(model => {
        const option1 = document.createElement('option');
        option1.value = model.id;
        option1.textContent = model.name || model.id;
        elements.extractionModel.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = model.id;
        option2.textContent = model.name || model.id;
        elements.synthesisModel.appendChild(option2);
    });
    
    // Restore saved selections
    const savedConfig = loadConfigData();
    if (savedConfig.models) {
        elements.extractionModel.value = savedConfig.models.extractionModel || '';
        elements.synthesisModel.value = savedConfig.models.synthesisModel || '';
    }
}

function clearModelOptions() {
    elements.extractionModel.innerHTML = '<option value="">Wybierz model...</option>';
    elements.synthesisModel.innerHTML = '<option value="">Wybierz model...</option>';
}

function validateForm() {
    const errors = [];
    const apiKeys = getApiKeys();
    const config = getConfigData();
    
    // Check API keys
    if (!apiKeys.openrouter) errors.push('• Brak klucza OpenRouter API');
    if (!apiKeys.jina) errors.push('• Brak klucza Jina AI API');
    if (!apiKeys.serpdata) errors.push('• Brak klucza SerpData API');
    
    // Check project config
    if (!config.project.name) errors.push('• Brak nazwy projektu');
    if (!config.project.centralEntity) errors.push('• Brak centralnej encji');
    
    // Check models
    if (!config.models.extractionModel) errors.push('• Nie wybrano modelu ekstrakcji');
    if (!config.models.synthesisModel) errors.push('• Nie wybrano modelu syntezy');
    
    // Check URL source
    if (config.urlSource === 'auto' && !config.autoConfig.mainQuery) {
        errors.push('• Brak głównego zapytania');
    }
    if (config.urlSource === 'manual' && config.manualConfig.urls.length === 0) {
        errors.push('• Brak URL-i do analizy');
    }
    
    return errors;
}

function updateUI() {
    const errors = validateForm();
    const isValid = errors.length === 0;
    
    elements.generateBtn.disabled = !isValid || isProcessing;
    
    if (errors.length > 0) {
        elements.validationErrors.innerHTML = errors.map(error => `<p>${error}</p>`).join('');
        elements.validationErrors.style.display = 'block';
    } else {
        elements.validationErrors.style.display = 'none';
    }
    
    // Update processing state
    if (isProcessing) {
        elements.generateBtn.textContent = '⏳ PRZETWARZANIE...';
        elements.processingIndicator.style.display = 'flex';
        elements.liveIndicator.style.display = 'inline';
        elements.resultsEmpty.style.display = 'none';
        elements.resultsProcessing.style.display = 'block';
        elements.resultsContent.style.display = 'none';
    } else {
        elements.generateBtn.textContent = '🧠 GENERUJ MAPĘ TEMATYCZNĄ';
        elements.processingIndicator.style.display = 'none';
        elements.liveIndicator.style.display = 'none';
        elements.resultsProcessing.style.display = 'none';
        
        if (currentResults) {
            elements.resultsEmpty.style.display = 'none';
            elements.resultsContent.style.display = 'block';
        } else {
            elements.resultsEmpty.style.display = 'block';
            elements.resultsContent.style.display = 'none';
        }
    }
}

async function handleGenerate() {
    if (isProcessing) return;
    
    const errors = validateForm();
    if (errors.length > 0) {
        alert('Proszę wypełnić wszystkie wymagane pola:\n' + errors.join('\n'));
        return;
    }
    
    isProcessing = true;
    currentResults = null;
    clearLogs();
    updateUI();
    
    const apiKeys = getApiKeys();
    const config = getConfigData();
    
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ config, apiKeys })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Handle SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const eventData = JSON.parse(line.slice(6));
                        console.log('Parsed SSE data:', eventData);
                        handleSSEMessage(eventData);
                    } catch (parseError) {
                        console.error('Error parsing SSE message:', parseError);
                        console.error('Raw line was:', line);
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('Error in generate process:', error);
        addLog('ERROR', `Błąd połączenia: ${error.message}`);
    } finally {
        isProcessing = false;
        updateUI();
    }
}

function handleSSEMessage(data) {
    // Debug logging - sprawdź co dociera z serwera
    console.log('SSE Message received:', data);
    
    if (data.type === 'log') {
        addLog(data.level, data.message);
    } else if (data.type === 'result') {
        // Sprawdź czy dane wyników rzeczywiście istnieją
        if (data.data && typeof data.data === 'object') {
            console.log('Processing results:', data.data);
            handleResults(data.data);
            addLog('SUCCESS', 'Proces zakończony pomyślnie!');
        } else {
            console.error('Result data is missing or invalid:', data);
            addLog('ERROR', 'Otrzymano nieprawidłowe dane wyników');
        }
    } else if (data.type === 'error') {
        addLog('ERROR', data.message);
    } else {
        console.warn('Unknown SSE message type:', data.type);
    }
}

function handleResults(results) {
    console.log('handleResults called with:', results);
    
    currentResults = results;
    
    // Update preview tab
    if (results.mapMarkdown) {
        elements.previewContent.textContent = results.mapMarkdown;
        console.log('Updated preview content');
    } else {
        console.error('mapMarkdown is missing from results');
    }
    
    // Update graph tab
    const graph = results.graphJson;
    const nodeCount = graph.nodes ? graph.nodes.length : 0;
    const edgeCount = graph.edges ? graph.edges.length : 0;
    
    elements.graphStats.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${nodeCount}</div>
            <div class="stat-label">Węzły</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${edgeCount}</div>
            <div class="stat-label">Relacje</div>
        </div>
    `;
    
    elements.graphContent.textContent = JSON.stringify(graph, null, 2);
    
    // Update stats
    const metadata = results.metadata;
    if (metadata) {
        elements.resultsStats.innerHTML = `
            <div><strong>URL-e:</strong> ${metadata.processedUrls}/${metadata.totalUrls}</div>
            <div><strong>Czas:</strong> ${formatTime(metadata.executionTime)}</div>
        `;
    } else {
        console.error('metadata missing from results');
    }
    
    console.log('Results processed, updating UI...');
    
    updateUI();
}

function addLog(level, message) {
    logCount++;
    
    if (elements.logsContainer.querySelector('.logs-empty')) {
        elements.logsContainer.innerHTML = '';
    }
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `
        <div class="log-time">${new Date().toLocaleTimeString()}</div>
        <div class="log-level ${level}">${getLogIcon(level)}</div>
        <div class="log-message">[${level}] ${message}</div>
    `;
    
    elements.logsContainer.appendChild(logEntry);
    elements.logsContainer.scrollTop = elements.logsContainer.scrollHeight;
    elements.logsCount.textContent = logCount;
}

function clearLogs() {
    logCount = 0;
    elements.logsContainer.innerHTML = `
        <div class="logs-empty">
            <div class="empty-icon">📟</div>
            <p>Gotowy do rozpoczęcia przetwarzania...</p>
            <small>Logi będą wyświetlane tutaj w czasie rzeczywistym</small>
        </div>
    `;
    elements.logsCount.textContent = '0';
}

function getLogIcon(level) {
    switch (level) {
        case 'INFO': return 'ℹ️';
        case 'SUCCESS': return '✅';
        case 'WARNING': return '⚠️';
        case 'ERROR': return '❌';
        default: return 'ℹ️';
    }
}

function formatTime(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

// Tab switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show/hide tab content
    elements.previewTab.style.display = tabName === 'preview' ? 'flex' : 'none';
    elements.graphTab.style.display = tabName === 'graph' ? 'flex' : 'none';
}

// Export functions
async function copyToClipboard() {
    if (!currentResults) return;
    
    try {
        await navigator.clipboard.writeText(currentResults.mapMarkdown);
        elements.copyBtn.innerHTML = '✅';
        elements.copyBtn.classList.add('copy-success');
        
        setTimeout(() => {
            elements.copyBtn.innerHTML = '📋';
            elements.copyBtn.classList.remove('copy-success');
        }, 2000);
    } catch (error) {
        console.error('Error copying to clipboard:', error);
    }
}

function exportMarkdown() {
    if (!currentResults) return;
    
    const filename = `${currentResults.metadata.config.project.name.replace(/[^a-zA-Z0-9]/g, '_')}_mapa.md`;
    downloadFile(currentResults.mapMarkdown, filename, 'text/markdown');
}

function exportGraph() {
    if (!currentResults) return;
    
    const filename = `${currentResults.metadata.config.project.name.replace(/[^a-zA-Z0-9]/g, '_')}_graf.json`;
    downloadFile(JSON.stringify(currentResults.graphJson, null, 2), filename, 'application/json');
}

function exportContent() {
    if (!currentResults) return;
    
    const filename = `${currentResults.metadata.config.project.name.replace(/[^a-zA-Z0-9]/g, '_')}_tresci.json`;
    downloadFile(JSON.stringify(currentResults.contentJson, null, 2), filename, 'application/json');
}

async function exportProject() {
    if (!currentResults) return;
    
    try {
        const response = await fetch('/api/download-zip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mapMarkdown: currentResults.mapMarkdown,
                graphJson: currentResults.graphJson,
                contentJson: currentResults.contentJson,
                metadata: currentResults.metadata
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentResults.metadata.config.project.name.replace(/[^a-zA-Z0-9]/g, '_')}_projekt.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Error exporting project:', error);
        addLog('ERROR', `Błąd eksportu projektu: ${error.message}`);
    }
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Data persistence
function saveApiKeys() {
    const apiKeys = getApiKeys();
    localStorage.setItem('semantic_architect_api_keys', JSON.stringify(apiKeys));
}

function loadApiKeys() {
    try {
        const stored = localStorage.getItem('semantic_architect_api_keys');
        if (stored) {
            const apiKeys = JSON.parse(stored);
            elements.openrouterKey.value = apiKeys.openrouter || '';
            elements.jinaKey.value = apiKeys.jina || '';
            elements.serpdataKey.value = apiKeys.serpdata || '';
        }
    } catch (error) {
        console.error('Error loading API keys:', error);
    }
}

function saveConfigData() {
    const config = getConfigData();
    localStorage.setItem('semantic_architect_config', JSON.stringify(config));
    updateUI();
}

function loadConfigData() {
    try {
        const stored = localStorage.getItem('semantic_architect_config');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
    return {};
}

function loadSavedData() {
    loadApiKeys();
    
    const savedConfig = loadConfigData();
    if (savedConfig.project) {
        elements.projectName.value = savedConfig.project.name || '';
        elements.centralEntity.value = savedConfig.project.centralEntity || '';
        elements.businessContext.value = savedConfig.project.businessContext || '';
        elements.language.value = savedConfig.project.language || 'pl';
        elements.location.value = savedConfig.project.location || 'pl';
    }
    
    if (savedConfig.urlSource) {
        document.querySelector(`input[name="url-source"][value="${savedConfig.urlSource}"]`).checked = true;
        handleUrlSourceChange();
    }
    
    if (savedConfig.autoConfig) {
        elements.mainQuery.value = savedConfig.autoConfig.mainQuery || '';
        elements.queryExpansionCount.value = savedConfig.autoConfig.queryExpansionCount || 3;
        elements.queryCountDisplay.textContent = savedConfig.autoConfig.queryExpansionCount || 3;
        elements.urlsPerQuery.value = savedConfig.autoConfig.urlsPerQuery || 5;
        elements.urlsCountDisplay.textContent = savedConfig.autoConfig.urlsPerQuery || 5;
    }
    
    if (savedConfig.manualConfig) {
        elements.manualUrls.value = savedConfig.manualConfig.urls.join('\n');
        elements.manualUrlCount.textContent = savedConfig.manualConfig.urls.length;
    }
}

function getApiKeys() {
    return {
        openrouter: elements.openrouterKey.value.trim(),
        jina: elements.jinaKey.value.trim(),
        serpdata: elements.serpdataKey.value.trim()
    };
}

function getConfigData() {
    const urlSource = document.querySelector('input[name="url-source"]:checked').value;
    const manualUrls = elements.manualUrls.value.split('\n').filter(url => url.trim());
    
    return {
        project: {
            name: elements.projectName.value.trim(),
            centralEntity: elements.centralEntity.value.trim(),
            businessContext: elements.businessContext.value.trim(),
            language: elements.language.value,
            location: elements.location.value
        },
        urlSource: urlSource,
        autoConfig: {
            mainQuery: elements.mainQuery.value.trim(),
            queryExpansionCount: parseInt(elements.queryExpansionCount.value),
            urlsPerQuery: parseInt(elements.urlsPerQuery.value)
        },
        manualConfig: {
            urls: manualUrls
        },
        models: {
            extractionModel: elements.extractionModel.value,
            synthesisModel: elements.synthesisModel.value
        }
    };
}

// Make functions available globally for onclick handlers
window.toggleApiKeys = toggleApiKeys;
window.switchTab = switchTab;
window.copyToClipboard = copyToClipboard;
window.exportMarkdown = exportMarkdown;
window.exportGraph = exportGraph;
window.exportProject = exportProject;
window.exportContent = exportContent;