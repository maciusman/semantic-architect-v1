/**
 * Semantic Architect V-Lite - Express Server
 * Main server file handling API endpoints and SSE connections
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const archiver = require('archiver');
const { ApiService } = require('./core/apiService');
const { ProcessingService } = require('./core/processingService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Endpoint 1: GET /api/models - Fetch OpenRouter models
app.get('/api/models', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const openrouterKey = authHeader.replace('Bearer ', '');
    const apiKeys = { openrouter: openrouterKey, jina: '', serpdata: '' };
    const apiService = new ApiService(apiKeys);
    
    const models = await apiService.fetchOpenRouterModels();
    res.json({ models });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 2: POST /api/generate - Generate topical map with SSE
app.post('/api/generate', async (req, res) => {
  try {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const { config, apiKeys } = req.body;
    
    if (!config || !apiKeys) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Missing config or apiKeys' })}\n\n`);
      res.end();
      return;
    }

    // SSE log function
    const sendLog = (logEntry) => {
      const data = {
        type: 'log',
        timestamp: logEntry.timestamp,
        level: logEntry.level,
        message: logEntry.message
      };
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Initialize services
    const apiService = new ApiService(apiKeys);
    const processingService = new ProcessingService(apiService, sendLog);

    try {
      // Start processing
      const results = await processingService.processTopicalMap(config);
      
      // Send final results
      const finalData = {
        type: 'result',
        data: {
          mapMarkdown: results.topicalMap,
          graphJson: results.knowledgeGraph,
          contentJson: results.scrapedContent,
          metadata: results.metadata
        }
      };
      
      res.write(`data: ${JSON.stringify(finalData)}\n\n`);
      res.end();
      
    } catch (processingError) {
      const errorData = {
        type: 'error',
        message: processingError.message || 'Unknown processing error'
      };
      res.write(`data: ${JSON.stringify(errorData)}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('Error in /api/generate:', error);
    const errorData = {
      type: 'error',
      message: error.message || 'Server error'
    };
    res.write(`data: ${JSON.stringify(errorData)}\n\n`);
    res.end();
  }
});

// Endpoint 3: POST /api/download-zip - Generate project ZIP file
app.post('/api/download-zip', async (req, res) => {
  try {
    const { mapMarkdown, graphJson, contentJson, metadata } = req.body;
    
    if (!mapMarkdown || !graphJson || !metadata) {
      return res.status(400).json({ error: 'Missing required data for ZIP creation' });
    }

    // Create metadata file content
    const metadataContent = `Semantic Architect V-Lite - Raport Projektu
=====================================

Nazwa Projektu: ${metadata.config.project.name}
Centralna Encja: ${metadata.config.project.centralEntity}
Kontekst Biznesowy: ${metadata.config.project.businessContext}

Konfiguracja:
- Język: ${metadata.config.project.language}
- Lokalizacja: ${metadata.config.project.location}
- Źródło URL: ${metadata.config.urlSource}
- Model Ekstrakcji: ${metadata.config.models.extractionModel}
- Model Syntezy: ${metadata.config.models.synthesisModel}

Statystyki:
- Łączna liczba URL-i: ${metadata.totalUrls}
- Przetworzone URL-e: ${metadata.processedUrls}
- Czas wykonania: ${Math.round(metadata.executionTime / 1000)}s

Data generowania: ${new Date().toLocaleString('pl-PL')}
`;

    // Set response headers for file download
    const filename = `${metadata.config.project.name.replace(/[^a-zA-Z0-9]/g, '_')}_projekt.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Handle archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).json({ error: 'Error creating ZIP file' });
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add files to archive
    archive.append(mapMarkdown, { name: 'mapa.md' });
    archive.append(JSON.stringify(graphJson, null, 2), { name: 'graf.json' });
    archive.append(metadataContent, { name: 'metadane.txt' });
    
    if (contentJson && contentJson.length > 0) {
      archive.append(JSON.stringify(contentJson, null, 2), { name: 'tresci.json' });
    }

    // Finalize archive
    await archive.finalize();

  } catch (error) {
    console.error('Error creating ZIP:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve index.html for all other routes (SPA behavior)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Semantic Architect V-Lite server running on http://localhost:${PORT}`);
  console.log(`📊 Ready to process topical maps!`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});