import express from 'express';
import http from 'http';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 9200;

// Service configuration - User-facing features (like GitHub)
const services = {
  webapp: { 
    name: 'Web Application',
    url: 'http://frontend.caritas.svc.cluster.local:9001' 
  },
  admin: { 
    name: 'Admin Panel',
    url: 'http://admin.caritas.svc.cluster.local:9000' 
  },
  auth: { 
    name: 'Authentication',
    url: 'http://keycloak.caritas.svc.cluster.local:8080/health' 
  },
  api: { 
    name: 'API Services',
    url: 'http://agencyservice.caritas.svc.cluster.local:8084/actuator/health' 
  },
  messaging: { 
    name: 'Messaging & Chat',
    url: 'http://matrix-synapse.caritas.svc.cluster.local:8008' 
  },
  uploads: { 
    name: 'File Uploads',
    url: 'http://uploadservice.caritas.svc.cluster.local:8085/actuator/health' 
  },
  video: { 
    name: 'Video Calls',
    url: 'http://videoservice.caritas.svc.cluster.local:8080/actuator/health' 
  },
  database: { 
    name: 'Database',
    url: 'http://agencyservice.caritas.svc.cluster.local:8084/actuator/health',
    checkComponent: 'db'
  }
};

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// API endpoint to get all services
app.get('/api/services', (req, res) => {
  res.json(services);
});

// API endpoint to check health of a specific service
app.get('/api/health/:key', (req, res) => {
  const key = req.params.key;
  const service = services[key];
  
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  try {
    const url = new URL(service.url);
    const transport = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      timeout: 5000
    };

    const request = transport.request(options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          res.status(response.statusCode).json(jsonData);
        } catch {
          res.status(response.statusCode).json({ 
            status: response.statusCode >= 200 && response.statusCode < 300 ? 'UP' : 'DOWN'
          });
        }
      });
    });

    request.on('error', (error) => {
      res.status(502).json({ 
        status: 'DOWN', 
        error: error.message 
      });
    });

    request.on('timeout', () => {
      request.destroy();
      res.status(504).json({ 
        status: 'DOWN', 
        error: 'Request timeout' 
      });
    });

    request.end();
  } catch (error) {
    res.status(500).json({ 
      status: 'DOWN', 
      error: error.message 
    });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 ORISO Status Page running on http://localhost:${PORT}`);
});

