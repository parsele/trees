const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
// Allow requests from the frontend and enable credentials for cookies.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || true; // set to your Netlify URL in production
const IS_PROD = process.env.NODE_ENV === 'production';
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(bodyParser.json());

// Simple admin auth: password from env or default. In-memory token store.
const crypto = require('crypto');
const DEFAULT_ADMIN_PASSWORD = 'lekaoo12';
const ADMIN_PASSWORD_FILE = process.env.ADMIN_PASSWORD_FILE || '/etc/secrets/ADMIN_PASSWORD';
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
try {
  if (fs.existsSync(ADMIN_PASSWORD_FILE)) {
    ADMIN_PASSWORD = fs.readFileSync(ADMIN_PASSWORD_FILE, 'utf8').trim();
    console.log('Loaded ADMIN_PASSWORD from secret file:', ADMIN_PASSWORD_FILE);
  }
} catch (e) {
  // ignore file read errors and fall back to env/default
}
let adminToken = null;

function requireAdmin(req, res, next){
  const token = req.cookies && req.cookies.admin_token || req.headers['x-admin-token'];
  if(token && adminToken && token === adminToken) return next();
  // not authorized
  res.status(401).json({ error: 'Unauthorized' });
}

// parse cookies for admin check
app.use(function(req,res,next){
  const header = req.headers.cookie || '';
  const cookies = {};
  header.split(';').forEach(pair=>{
    const idx = pair.indexOf('=');
    if(idx>0){
      const k = pair.slice(0,idx).trim();
      const v = pair.slice(idx+1).trim();
      cookies[k]=v;
    }
  });
  req.cookies = cookies;
  next();
});

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'trees.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');

function readData() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8') || '[]';
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeData(arr) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2));
}

app.get('/api/trees', (req, res) => {
  res.json(readData());
});

// Add a tree (admin only)
app.post('/api/trees', requireAdmin, (req, res) => {
  const body = req.body || {};
  const lat = parseFloat(body.lat);
  const lng = parseFloat(body.lng);
  if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: 'Invalid lat/lng' });
  const arr = readData();
  const maxId = arr.reduce((m, t) => Math.max(m, Number(t.id) || 0), 0);
  const id = maxId + 1 || Date.now();
  const tree = {
    id,
    species: body.species || '',
    lat,
    lng,
    date: body.date || '',
    planted_by: body.planted_by || body.plantedBy || '',
    notes: body.notes || ''
  };
  arr.push(tree);
  writeData(arr);
  res.status(201).json({ tree });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const pw = req.body && req.body.password;
  if (!pw) return res.status(400).json({ error: 'Missing password' });
  if (pw !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid password' });
  adminToken = crypto.randomBytes(24).toString('hex');
  // Set cookie (not signed). For cross-site logins we need SameSite=None and secure in production.
  const cookieOpts = { httpOnly: true, sameSite: IS_PROD ? 'None' : 'Strict' };
  if (IS_PROD) cookieOpts.secure = true;
  res.cookie('admin_token', adminToken, cookieOpts);
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  adminToken = null;
  res.clearCookie('admin_token');
  res.json({ ok: true });
});

// stats: total count and counts by species
app.get('/api/stats', (req, res) => {
  const arr = readData();
  const total = arr.length;
  const bySpecies = {};
  arr.forEach(t => {
    const s = (t.species || 'Unknown').trim();
    bySpecies[s] = (bySpecies[s] || 0) + 1;
  });
  res.json({ total, bySpecies });
});

// delete a tree by id
app.delete('/api/trees/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const arr = readData();
  const idx = arr.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const removed = arr.splice(idx, 1)[0];
  writeData(arr);
  res.json({ removed });
});

// Serve admin.html only when logged in (check cookie/token)
app.get('/admin.html', (req, res) => {
  const token = req.cookies && req.cookies.admin_token;
  if (token && adminToken && token === adminToken) {
    return res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  }
  return res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.use('/', express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
// Error handler for malformed JSON bodies
app.use(function(err, req, res, next){
  if (!err) return next();
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400 && 'body' in err)){
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next(err);
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
