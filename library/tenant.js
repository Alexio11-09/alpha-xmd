// Per-WhatsApp-account storage helpers for Alpha XMD.
const fs = require('fs');
const path = require('path');
const config = require('../settings/config');

const ROOT = path.join(__dirname, '..');
const SESSIONS = path.join(ROOT, 'sessions');
const MAIN_OWNER = '263784969735';

function phoneOf(sock) {
  const raw = sock?.user?.id || sock?.user?.jid || '';
  const num = String(raw).split('@')[0].split(':')[0].replace(/\D/g, '');
  return /^\d{7,15}$/.test(num) ? num : '';
}

function dirOf(sock) {
  const phone = phoneOf(sock);
  if (!phone) throw new Error('Cannot identify this WhatsApp account.');
  const dir = path.join(SESSIONS, phone);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function fileOf(sock, name) {
  if (!/^[a-zA-Z0-9_-]+\.json$/.test(name)) throw new Error('Invalid tenant data filename.');
  return path.join(dirOf(sock), name);
}

// ---------------------------------------------------------------
// Short-lived cache of raw file text (parsed fresh on every read so
// callers can safely modify what they get back).
// ---------------------------------------------------------------
const cache = new Map();
const TTL = 5000;

function readRaw(sock, name) {
  const phone = phoneOf(sock);
  const key = phone + '/' + name;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL) return hit.raw;

  let raw = null;
  try {
    raw = fs.readFileSync(fileOf(sock, name), 'utf8');
  } catch {
    // Existing shared data belongs only to the confirmed primary owner's account.
    if (phone === MAIN_OWNER) {
      try { raw = fs.readFileSync(path.join(ROOT, 'database', name), 'utf8'); } catch {}
    }
  }

  // Do not cache anything for an unidentified account
  if (phone) cache.set(key, { t: Date.now(), raw });
  return raw;
}

function read(sock, name, fallback = {}) {
  const raw = readRaw(sock, name);
  if (raw) {
    try { return JSON.parse(raw); } catch {}
  }
  return JSON.parse(JSON.stringify(fallback));
}

function write(sock, name, data) {
  const file = fileOf(sock, name);
  const temp = `${file}.${process.pid}.tmp`;
  const body = JSON.stringify(data, null, 2);
  fs.writeFileSync(temp, body);
  fs.renameSync(temp, file);
  cache.set(phoneOf(sock) + '/' + name, { t: Date.now(), raw: body });
  return true;
}

// Drop cached files for one account (used when a session is deleted)
function forget(phone) {
  const prefix = String(phone) + '/';
  for (const k of cache.keys()) {
    if (k.startsWith(prefix)) cache.delete(k);
  }
}

function isMainOwner(sender) {
  return String(sender || '').split('@')[0].split(':')[0].replace(/\D/g, '') === MAIN_OWNER;
}

function isAccountOwner(sender, sock) {
  const num = String(sender || '').split('@')[0].split(':')[0].replace(/\D/g, '');
  return !!num && (num === phoneOf(sock) || isMainOwner(num));
}

module.exports = {
  ROOT, SESSIONS, MAIN_OWNER,
  phoneOf, dirOf, fileOf,
  read, write, forget,
  isMainOwner, isAccountOwner
};
