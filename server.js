const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'blast-queuing-data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure .gitkeep
const gitkeep = path.join(DATA_DIR, '.gitkeep');
if (!fs.existsSync(gitkeep)) {
  fs.writeFileSync(gitkeep, '', 'utf8');
}

// Initial state
const freshState = () => ({
  trucks: [],
  queueNumber: 1,
  queueDate: getPstDateString(),
  inventory: [],
  inventoryHistory: [],
  inventoryLastUpdated: new Date().toISOString(),
  activityRows: [],
  lastUpdated: new Date().toISOString()
});

function getPstDateString() {
  const d = new Date(Date.now() + 8 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(content);
      return {
        trucks: Array.isArray(parsed.trucks) ? parsed.trucks : [],
        queueNumber: typeof parsed.queueNumber === 'number' ? parsed.queueNumber : 1,
        queueDate: parsed.queueDate || getPstDateString(),
        inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
        inventoryHistory: Array.isArray(parsed.inventoryHistory) ? parsed.inventoryHistory : [],
        inventoryLastUpdated: parsed.inventoryLastUpdated || parsed.lastUpdated || new Date().toISOString(),
        activityRows: Array.isArray(parsed.activityRows) ? parsed.activityRows : [],
        lastUpdated: parsed.lastUpdated || new Date().toISOString()
      };
    }
  } catch (err) {
    console.error('[MHC Server] Error reading data file:', err);
  }
  const init = freshState();
  saveData(init);
  return init;
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[MHC Server] Error writing data file:', err);
  }
}

// Two-way merge
function mergeData(serverState, incoming) {
  if (!incoming) return serverState;

  // 1. Trucks (Product Queues)
  if (Array.isArray(incoming.trucks) && incoming.trucks.length > 0) {
    const map = new Map();
    serverState.trucks.forEach(t => {
      const key = t.id || `${t.date}_${t.queue}_${t.product}`;
      map.set(key, t);
    });
    incoming.trucks.forEach(t => {
      const key = t.id || `${t.date}_${t.queue}_${t.product}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, t);
      } else {
        map.set(key, { ...existing, ...t });
      }
    });
    serverState.trucks = Array.from(map.values());
  }

  // 2. Queue Number & Date
  if (incoming.queueDate === serverState.queueDate) {
    if (typeof incoming.queueNumber === 'number' && incoming.queueNumber > serverState.queueNumber) {
      serverState.queueNumber = incoming.queueNumber;
    }
  } else if (incoming.queueDate && incoming.queueDate > serverState.queueDate) {
    serverState.queueDate = incoming.queueDate;
    serverState.queueNumber = typeof incoming.queueNumber === 'number' ? incoming.queueNumber : 1;
  }

  // 3. Inventory
  if (Array.isArray(incoming.inventory)) {
    serverState.inventory = incoming.inventory;
  }
  if (incoming.inventoryLastUpdated) {
    serverState.inventoryLastUpdated = incoming.inventoryLastUpdated;
  }

  // 4. Inventory History
  if (Array.isArray(incoming.inventoryHistory)) {
    if (incoming.inventoryHistory.length === 0 && Array.isArray(incoming.inventory) && incoming.inventory.length === 0) {
      serverState.inventoryHistory = [];
    } else if (incoming.inventoryHistory.length > 0) {
      const hSet = new Set(serverState.inventoryHistory.map(h => (h.timestamp || '') + '_' + (h.action || h.type || '')));
      incoming.inventoryHistory.forEach(h => {
        const key = (h.timestamp || '') + '_' + (h.action || h.type || '');
        if (!hSet.has(key)) {
          serverState.inventoryHistory.unshift(h);
          hSet.add(key);
        }
      });
      serverState.inventoryHistory = serverState.inventoryHistory.slice(0, 1000);
    }
  }

  // 5. Activity Rows
  if (Array.isArray(incoming.activityRows) && incoming.activityRows.length > 0) {
    serverState.activityRows = incoming.activityRows;
  }

  serverState.lastUpdated = new Date().toISOString();
  return serverState;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (pathname === '/healthz' || pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString(), app: 'MHC Blast Queuing System' }));
    return;
  }

  // Online PST Time API
  if (pathname === '/api/time') {
    const nowMs = Date.now();
    const pstDateObj = new Date(nowMs + 8 * 3600 * 1000);
    const pstDate = pstDateObj.toISOString().slice(0, 10);
    const pstTime = pstDateObj.toISOString().slice(11, 19);

    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({
      serverTime: nowMs,
      iso: new Date(nowMs).toISOString(),
      pstDate: pstDate,
      pstTime: pstTime,
      timezone: 'Asia/Manila (UTC+8)',
      offsetMinutes: 480
    }));
    return;
  }

  // Sync API
  if (pathname === '/api/sync') {
    if (req.method === 'GET') {
      const data = loadData();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(data));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 25 * 1024 * 1024) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Payload too large' }));
          req.destroy();
        }
      });

      req.on('end', () => {
        try {
          const incoming = JSON.parse(body);
          const current = loadData();
          const merged = mergeData(current, incoming);
          saveData(merged);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, count: merged.trucks.length, lastUpdated: merged.lastUpdated }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON', details: e.message }));
        }
      });
      return;
    }
  }

  // Static File Serving
  let relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  try {
    relativePath = decodeURIComponent(relativePath);
  } catch (e) {}

  let filePath = path.join(__dirname, relativePath);

  // If request is root or doesn't exist, check index.html or Blast Freezing Queuing_V4.html
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    if (fs.existsSync(path.join(__dirname, 'index.html'))) {
      filePath = path.join(__dirname, 'index.html');
    } else if (fs.existsSync(path.join(__dirname, 'Blast Freezing Queuing_V4.html'))) {
      filePath = path.join(__dirname, 'Blast Freezing Queuing_V4.html');
    }
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache, must-revalidate' : 'public, max-age=3600'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found - May Harvest Corporation');
  }
});

server.listen(PORT, () => {
  console.log(`[MHC Blast Queuing System] Server running on port ${PORT}`);
  console.log(`[MHC Blast Queuing System] Philippine Standard Time (PST): ${getPstDateString()}`);
});
