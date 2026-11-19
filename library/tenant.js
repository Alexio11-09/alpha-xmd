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
function read(sock, name, fallback = {}) {
  try { return JSON.parse(fs.readFileSync(fileOf(sock, name), 'utf8')); }
  catch {
    // Existing shared data belongs only to the confirmed primary owner's account.
    if (phoneOf(sock) === MAIN_OWNER) {
      try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'database', name), 'utf8')); } catch {}
    }
    return JSON.parse(JSON.stringify(fallback));
  }
}
function write(sock, name, data) {
  const file = fileOf(sock, name);
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2));
  fs.renameSync(temp, file);
  return true;
}
function isMainOwner(sender) {
  return String(sender || '').split('@')[0].split(':')[0].replace(/\D/g, '') === MAIN_OWNER;
}
function isAccountOwner(sender, sock) {
  const num = String(sender || '').split('@')[0].split(':')[0].replace(/\D/g, '');
  return !!num && (num === phoneOf(sock) || isMainOwner(num));
}
module.exports = { ROOT, SESSIONS, MAIN_OWNER, phoneOf, dirOf, fileOf, read, write, isMainOwner, isAccountOwner };
