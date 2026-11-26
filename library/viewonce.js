// Caches the FULL original message content for view-once media, keyed by
// message id, and SAVES IT TO DISK so it survives a restart.
//
// Why this needs to be on disk: WhatsApp's "quoted message" copy (what .vv
// normally sees when someone replies) is often stripped of the real
// mediaKey/directPath fields, which is why downloading straight from the
// quote fails with "No valid media URL or directPath present in message".
// The original message, captured here the moment it first arrives, still
// has them - but if the host restarts the bot (common on free hosting once
// memory climbs) before someone replies with .vv, an in-memory-only cache
// would be wiped and .vv would fail exactly as if this fix didn't exist.

const fs = require('fs');
const path = require('path');
const tenant = require('./tenant');

const DIR = path.join(tenant.ROOT, 'database');
const FILE = path.join(DIR, 'viewonce_cache.json');
const MAX = 300;

// Buffers (mediaKey, fileEncSha256, fileSha256, ...) don't survive JSON as-is,
// so they're converted to { $buf: base64 } on save and back on load. This
// walks any shape generically, so it doesn't need to know field names.
function toSafe(v) {
  if (Buffer.isBuffer(v)) return { $buf: v.toString('base64') };
  if (Array.isArray(v)) return v.map(toSafe);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v)) out[k] = toSafe(v[k]);
    return out;
  }
  return v;
}

function fromSafe(v) {
  if (v && typeof v === 'object') {
    if (typeof v.$buf === 'string' && Object.keys(v).length === 1) return Buffer.from(v.$buf, 'base64');
    if (Array.isArray(v)) return v.map(fromSafe);
    const out = {};
    for (const k of Object.keys(v)) out[k] = fromSafe(v[k]);
    return out;
  }
  return v;
}

const store = new Map();

function loadFromDisk() {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    if (!fs.existsSync(FILE)) return;
    const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    for (const [id, safeMsg] of Object.entries(raw)) store.set(id, fromSafe(safeMsg));
  } catch (e) {
    console.log('[VIEWONCE CACHE] could not load saved cache:', e.message);
  }
}

function saveToDisk() {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    const obj = {};
    for (const [id, msg] of store) obj[id] = toSafe(msg);
    const tmp = FILE + '.' + process.pid + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(obj));
    fs.renameSync(tmp, FILE);
  } catch (e) {
    console.log('[VIEWONCE CACHE] could not save cache:', e.message);
  }
}

loadFromDisk();

function remember(id, message) {
  if (!id || !message) return;
  store.set(id, message);
  if (store.size > MAX) store.delete(store.keys().next().value);
  saveToDisk();
}

function get(id) {
  return id ? store.get(id) || null : null;
}

module.exports = { remember, get };
