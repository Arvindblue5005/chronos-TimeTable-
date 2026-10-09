import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing for zero-knowledge encrypted payloads
app.use(express.json({ limit: '10mb' }));

// Cross-device CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Vault directory for persistent encrypted storage
const VAULTS_DIR = process.env.VAULTS_DIR || path.resolve(__dirname, '.sync_vaults');
if (!fs.existsSync(VAULTS_DIR)) {
  fs.mkdirSync(VAULTS_DIR, { recursive: true });
}

// Health check endpoint (for Docker & Jenkins health checks)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// End-to-End Encrypted Sync API
app.get('/api/sync/:vaultId', (req, res) => {
  const vaultId = req.params.vaultId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!vaultId) {
    res.status(400).json({ error: 'Vault ID is required' });
    return;
  }

  const filePath = path.join(VAULTS_DIR, `${vaultId}.json`);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Vault not found' });
    return;
  }

  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read encrypted vault' });
  }
});

app.post('/api/sync/:vaultId', (req, res) => {
  const vaultId = req.params.vaultId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!vaultId) {
    res.status(400).json({ error: 'Vault ID is required' });
    return;
  }

  const { ciphertext, iv, salt, revision } = req.body;
  if (!ciphertext || !iv || !salt) {
    res.status(400).json({ error: 'Invalid encrypted vault package' });
    return;
  }

  const filePath = path.join(VAULTS_DIR, `${vaultId}.json`);
  const payload = {
    vaultId,
    ciphertext,
    iv,
    salt,
    revision: revision || Date.now(),
    updatedAt: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
    res.status(200).json({
      success: true,
      revision: payload.revision,
      updatedAt: payload.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write encrypted vault' });
  }
});

// Static assets from Vite build
const DIST_DIR = path.resolve(__dirname, 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { maxAge: '1d' }));

  // SPA fallback routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Chronos API Server is active. Frontend build missing - run npm run build.');
  });
}

app.listen(PORT, () => {
  console.log(`[Chronos] Production server running on port ${PORT}`);
});
