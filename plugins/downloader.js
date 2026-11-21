const fs = require('fs');
const ax = require('axios');
const yts = require('yt-search');
const ytdl = require('@pontalabs/ytdl');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { execFile } = require('child_process');
const { downloadVideo } = require('@raihan07/vidly');
const path = require('path');

// ======================================================
// TEMP FOLDER (auto-cleaned so it can't fill your storage)
// Files are normally deleted right after use, but a memory restart
// in the middle of a download used to leave them behind forever.
// ======================================================
const TMP_DIR = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

function cleanTmp(maxAgeMs = 15 * 60 * 1000) {
  try {
    const now = Date.now();

    for (const f of fs.readdirSync(TMP_DIR)) {
      const p = path.join(TMP_DIR, f);

      try {
        const st = fs.statSync(p);
        if (st.isFile() && now - st.mtimeMs > maxAgeMs) fs.unlinkSync(p);
      } catch {}
    }
  } catch {}
}

cleanTmp();
setInterval(cleanTmp, 30 * 60 * 1000).unref();

// ======================================================
// HELPERS
// ======================================================
const sleep = ms => new Promise(r => setTimeout(r, ms));

const tmpFile = (prefix, ext = '.mp4') =>
  path.join(TMP_DIR, `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}${ext}`);

const dl = async (u, o) => {
  const w = fs.createWriteStream(o);
  const r = await ax({ url: u, method: 'GET', responseType: 'stream', timeout: 12e4, headers: { 'User-Agent': 'Mozilla/5.0' } });
  r.data.pipe(w);
  return new Promise((a, b) => { w.on('finish', a); w.on('error', b); });
};

const B = c => ({
  forwardingScore: 999,
  isForwarded: !0,
  forwardedNewsletterMessageInfo: { newsletterJid: c.newsletter.id + '@newsletter', newsletterName: c.newsletter.name }
});

const rm = f => { try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch {} };

// Look at the first bytes of the file to tell images from videos
// (the old code treated everything as a video because the file name ended in .mp4)
function sniffType(file) {
  try {
    const fd = fs.openSync(file, 'r');
    const b = Buffer.alloc(12);
    fs.readSync(fd, b, 0, 12, 0);
    fs.closeSync(fd);

    if (b[0] === 0xFF && b[1] === 0xD8) return 'image';                        // JPEG
    if (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return 'image';  // PNG
    if (b.toString('ascii', 0, 3) === 'GIF') return 'image';                   // GIF
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'image';
  } catch {}

  return 'video';
}

// Shared by .fb / .ig / .pin: download to disk, send straight from disk, delete
async function socialDownload(s, m, reply, c, url, prefix, label) {
  const o = tmpFile(prefix);

  try {
    const result = await downloadVideo(url, o);

    if (result && fs.existsSync(o)) {
      const kind = sniffType(o);

      if (kind === 'image') {
        await s.sendMessage(m.chat, { image: { url: o }, caption: `✅ ${label} Image`, contextInfo: B(c) }, { quoted: m });
      } else {
        await s.sendMessage(m.chat, { video: { url: o }, caption: `✅ ${label} Video`, contextInfo: B(c) }, { quoted: m });
      }
    } else {
      reply(`❌ Failed to download ${label} media.`);
    }
  } catch (e) {
    console.log(`[${label}] download failed:`, e.message);
    reply('❌ Failed: ' + e.message);
  } finally {
    rm(o);
  }
}

// Run ffmpeg without freezing the whole bot (execSync froze every session)
const runFfmpeg = (input, output) => new Promise(resolve => {
  execFile(
    'ffmpeg',
    ['-y', '-i', input, '-t', '20', '-vn', '-ar', '44100', '-ac', '2', '-b:a', '128k', output],
    { timeout: 60000 },
    err => resolve(!err)
  );
});


// ======================================================
// EXTRAS HELPERS (.apk .ringtone .wallpaper .img)
// Free public APIs, no keys needed (.img can use Pexels if PEXELS_KEY is set)
// ======================================================
const API = {
  aptoide:   process.env.APTOIDE_API   || 'https://ws75.aptoide.com/api/7',
  itunes:    process.env.ITUNES_API    || 'https://itunes.apple.com',
  wallhaven: process.env.WALLHAVEN_API || 'https://wallhaven.cc/api/v1',
  wikimedia: process.env.WIKIMEDIA_API || 'https://commons.wikimedia.org/w/api.php',
  pexels:    process.env.PEXELS_API    || 'https://api.pexels.com/v1'
};

const MB = 1024 * 1024;
const MAX_APK = 60 * MB;   // refuse bigger APKs (storage + memory friendly)
const MAX_IMG = 6 * MB;    // skip huge wallpapers

const getJson = async (url, params, headers = {}) => {
  const r = await ax.get(url, { params, timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0', ...headers } });
  return r.data;
};

// Only one APK download at a time (they are the biggest files)
let apkChain = Promise.resolve();
const oneApkAtATime = job => {
  const run = apkChain.then(job);
  apkChain = run.catch(() => {});
  return run;
};

const fmtSize = bytes => bytes >= MB ? (bytes / MB).toFixed(1) + ' MB' : Math.round(bytes / 1024) + ' KB';
const react = (s, m, text) => s.sendMessage(m.chat, { react: { text, key: m.key } }).catch(() => {});

module.exports = [
{ command: 'play', aliases: ['song', 'music', 'play2', 'ytmp3'], category: 'downloader', execute: async (s, m, { args, reply, config: c }) => {
  let t = args.join(' '); if (!t) return reply('🎧 Usage: .play <song name>');
  try {
    await s.sendMessage(m.chat, { react: { text: '🎶', key: m.key } });
    let sr = await yts(t); if (!sr.videos.length) { await s.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); return reply('❌ No song found'); }
    let v = sr.videos[0];
    await s.sendMessage(m.chat, { react: { text: '⬇️', key: m.key } });

    // The download service is a free third-party one and fails now and then, so try twice
    let audioUrl = null;
    for (let i = 0; i < 2 && !audioUrl; i++) {
      try {
        const audio = await ytdl.downloadAudio(v.url, 128);
        audioUrl = audio?.download?.downloadUrl || null;
      } catch (e) { console.log('play dl err:', e.message); }
      if (!audioUrl && i === 0) await sleep(2000);
    }

    if (!audioUrl) { console.log('[PLAY] no audio URL returned for:', v.title); await s.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); return reply('⚠️ No audio URL returned. The download service may be busy, try again in a minute.'); }

    await s.sendMessage(m.chat, { image: { url: v.thumbnail }, caption: `🎵 *${v.title}*\n\n👑 ${c.settings.title}`, contextInfo: B(c) }, { quoted: m });
    await s.sendMessage(m.chat, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', ptt: !1, fileName: v.title.replace(/[^a-zA-Z0-9]/g, '_') + '.mp3', contextInfo: { externalAdReply: { title: v.title, body: '🎧 Now playing', thumbnailUrl: v.thumbnail, mediaType: 1 } } }, { quoted: m });
    await s.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
  } catch (e) { console.log('play err:', e.message); await s.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); reply('❌ Failed'); }
} },

{ command: 'video', aliases: ['vid', 'dl', 'yt', 'ytmp4'], category: 'downloader', execute: async (s, m, { args, reply, config: c }) => {
  let t = args.join(' '); if (!t) return reply('🎥 Usage: .video <name/url>');
  try {
    await s.sendMessage(m.chat, { react: { text: '⚡', key: m.key } });
    let u = t;
    if (!t.startsWith('http')) { const sr = await yts(t); if (!sr.videos.length) return reply('❌ No videos'); u = sr.videos[0].url; }
    await s.sendMessage(m.chat, { react: { text: '⬇️', key: m.key } });

    const pick = v => v?.download?.downloadUrl || v?.url || v?.downloadUrl || null;
    let videoUrl = null;

    try { videoUrl = pick(await ytdl.downloadVideo(u)); } catch (e) {}
    if (!videoUrl) { try { videoUrl = pick(await ytdl.downloadVideo(u, 360)); } catch (e) {} }
    if (!videoUrl) { await sleep(2000); try { videoUrl = pick(await ytdl.downloadVideo(u, 360)); } catch (e) {} }

    if (!videoUrl) { console.log('[VIDEO] no video URL returned for:', u); await s.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); return reply('⚠️ No video URL returned. The download service may be busy, try again in a minute.'); }

    await s.sendMessage(m.chat, { video: { url: videoUrl }, mimetype: 'video/mp4', fileName: 'video_' + Date.now() + '.mp4', caption: `✅ Downloaded\n👑 ${c.settings.title}`, contextInfo: B(c) }, { quoted: m });
    await s.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
  } catch (e) { console.log('video err:', e.message); await s.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); reply('❌ Failed'); }
} },

{ command: 'tiktok', aliases: ['tt', 'tiktokdl'], category: 'downloader', execute: async (s, m, { args, reply, config: c }) => {
  if (!args[0]) return reply('❌ TT link?'); reply('🎵...');
  const o = tmpFile('tt');
  try {
    let r = await ax.get(`https://tikwm.com/api/?url=${encodeURIComponent(args[0])}`, { timeout: 2e4 }), d = r.data?.data;
    if (!d?.play) return reply('❌ Failed.');
    await dl(d.play, o);
    // Send straight from disk instead of loading the whole video into RAM
    await s.sendMessage(m.chat, { video: { url: o }, caption: `🎬 *TikTok*\n👤 @${d.author?.nickname || '?'}\n⚡ *${c.settings.title}*`, contextInfo: B(c) }, { quoted: m });
  } catch (e) { reply('❌ ' + e.message); }
  finally { rm(o); }
} },

{ command: 'fb', aliases: ['facebook', 'fbdl'], category: 'downloader', execute: async (s, m, { args, reply, config: c }) => {
  if (!args[0]) return reply('❌ FB link?');
  reply('📘 Downloading...');
  await socialDownload(s, m, reply, c, args[0], 'f', 'FB');
} },

{ command: 'ig', aliases: ['instagram', 'igdl'], category: 'downloader', execute: async (s, m, { args, reply, config: c }) => {
  if (!args[0]) return reply('❌ IG link?');
  reply('📸 Downloading...');
  await socialDownload(s, m, reply, c, args[0], 'i', 'IG');
} },

{ command: 'pin', aliases: ['pinterest', 'pindl'], category: 'downloader', execute: async (s, m, { args, reply, config: c }) => {
  if (!args[0]) return reply('❌ Pinterest link?');
  reply('📌 Downloading...');
  await socialDownload(s, m, reply, c, args[0], 'p', 'Pinterest');
} },

{ command: 'lyrics', aliases: ['lirik'], category: 'downloader', execute: async (s, m, { args, reply }) => {
  if (!args[0]) return reply('❌ Song?'); let q = args.join(' ');

  // 1) original service
  try {
    let r = await ax.get(`https://api.lolhuman.xyz/api/lirik?apikey=GataDios&query=${encodeURIComponent(q)}`, { timeout: 15e3 });
    if (r.data?.status === 200 && r.data.result) return reply(`🎵 *${q}*\n\n${r.data.result.substring(0, 2e3)}`);
    console.log('[LYRICS] primary service returned no lyrics, status:', r.data?.status);
  } catch (e) { console.log('[LYRICS] primary service failed:', e.message); }

  // 2) fallback: works when you type  .lyrics artist - song title
  const parts = q.split(/\s+-\s+/);
  if (parts.length >= 2) {
    try {
      const artist = parts[0].trim(), title = parts.slice(1).join(' - ').trim();
      let r2 = await ax.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`, { timeout: 15e3 });
      if (r2.data?.lyrics) return reply(`🎵 *${artist} - ${title}*\n\n${String(r2.data.lyrics).substring(0, 2e3)}`);
      console.log('[LYRICS] fallback returned no lyrics');
    } catch (e) { console.log('[LYRICS] fallback failed:', e.message); }
  }

  reply('❌ Not found. Try: .lyrics artist - song title');
} },

{ command: 'yts', aliases: ['ytsearch'], category: 'downloader', execute: async (s, m, { args, reply }) => {
  if (!args[0]) return reply('❌ Query?'); let q = args.join(' ');
  try { let r = await yts(q); if (!r.videos?.length) return reply('❌ No results'); let t = `🔎 *${q}*\n\n`; for (let i = 0; i < Math.min(10, r.videos.length); i++) { let v = r.videos[i]; t += `${i + 1}. *${v.title}*\n   🔗 ${v.url}\n\n`; } reply(t); } catch { reply('❌ Failed'); }
} },

{ command: 'shazam', aliases: ['identify', 'whatsong'], category: 'downloader', execute: async (s, m, { reply }) => {
  if (!m.quoted) return reply('❌ Reply to audio!'); let qt = m.quoted.message; if (!qt) return reply('❌ Cannot read');
  let t = Object.keys(qt).find(k => ['audioMessage', 'voiceMessage', 'videoMessage'].includes(k));
  if (!t) return reply('❌ Unsupported');
  reply('🎧...'); let inf, ouf;
  try {
    let st = await downloadContentFromMessage(qt[t], t === 'videoMessage' ? 'video' : 'audio');

    // collect chunks, join once, refuse very large files
    const chunks = []; let size = 0;
    for await (let ch of st) {
      size += ch.length;
      if (size > 20 * 1024 * 1024) return reply('❌ File too large');
      chunks.push(ch);
    }

    inf = tmpFile('si', '');
    ouf = tmpFile('so', '.mp3');
    fs.writeFileSync(inf, Buffer.concat(chunks));

    // trim to 20s mono-friendly mp3; if ffmpeg is missing, fall back to the original file
    const ok = await runFfmpeg(inf, ouf);
    if (!ok) {
      if (size > 8 * 1024 * 1024) return reply('❌ Audio too large and ffmpeg is not available');
      fs.copyFileSync(inf, ouf);
    }

    let ab = fs.readFileSync(ouf).toString('base64');
    let r = await ax.post('https://api.audd.io/', { api_token: process.env.AUDD_TOKEN || 'test', audio: ab, return: 'apple_music,spotify' }, { headers: { 'Content-Type': 'application/json' }, timeout: 15e3 });
    let d = r.data;

    if (d.status === 'success' && d.result) {
      let g = d.result, cu = g.apple_music?.artwork?.url?.replace('{w}', '300').replace('{h}', '300') || g.spotify?.album?.images?.[0]?.url || '', tx = `🎵 *${g.title || '?'}*\n👤 ${g.artist || '?'}\n💿 ${g.album || '?'}`;
      if (cu) await s.sendMessage(m.chat, { image: { url: cu }, caption: tx }, { quoted: m }); else reply(tx);
    } else {
      if (!process.env.AUDD_TOKEN) console.log('[SHAZAM] No AUDD_TOKEN set - the "test" token is limited. Get a token from audd.io and add AUDD_TOKEN to the environment.');
      reply('❌ Not recognized');
    }
  } catch (e) { console.error(e); reply('❌ Failed'); }
  finally { rm(inf); rm(ouf); }
} },

// ======================================================
// .apk <app name>
// ======================================================
{ command: 'apk', aliases: ['app', 'aptoide'], category: 'downloader', execute: async (s, m, { args, reply, config: c }) => {
  if (!args[0]) return reply('📱 Usage: .apk <app name>\nExample: .apk whatsapp');
  const q = args.join(' ');

  try {
    await react(s, m, '🔎');

    const d = await getJson(`${API.aptoide}/apps/search`, { query: q, limit: 1 });
    const app = d?.datalist?.list?.[0];
    if (!app) { await react(s, m, '❌'); return reply('❌ App not found.'); }

    const url = app.file?.path || app.file?.path_alt;
    const size = Number(app.size || app.file?.filesize || 0);
    const name = String(app.name || q);
    const version = app.file?.vername || '';

    if (!url) { await react(s, m, '❌'); return reply('❌ No download link for that app.'); }

    if (size > MAX_APK) {
      await react(s, m, '❌');
      return reply(`⚠️ *${name}* is ${fmtSize(size)}, which is too large for this bot (limit ${fmtSize(MAX_APK)}).`);
    }

    await react(s, m, '⬇️');

    await oneApkAtATime(() => s.sendMessage(m.chat, {
      document: { url },
      mimetype: 'application/vnd.android.package-archive',
      fileName: name.replace(/[^a-zA-Z0-9._-]+/g, '_') + '.apk',
      caption: `📱 *${name}*\n${version ? '🏷️ Version: ' + version + '\n' : ''}${size ? '📦 Size: ' + fmtSize(size) + '\n' : ''}👑 ${c?.settings?.title || 'Alpha Bot'}`
    }, { quoted: m }));

    await react(s, m, '✅');
  } catch (e) {
    console.log('[APK] failed:', e.message);
    await react(s, m, '❌');
    reply('❌ APK download failed. Try again in a moment.');
  }
} },

// ======================================================
// .ringtone <song or sound name>   (30-second clip)
// ======================================================
{ command: 'ringtone', aliases: ['ringtones', 'rt'], category: 'downloader', execute: async (s, m, { args, reply }) => {
  if (!args[0]) return reply('🔔 Usage: .ringtone <song name>\nExample: .ringtone calm down rema');
  const q = args.join(' ');

  try {
    await react(s, m, '🔎');

    const d = await getJson(`${API.itunes}/search`, { term: q, media: 'music', entity: 'song', limit: 5 });
    const hit = (d?.results || []).find(x => x.previewUrl);
    if (!hit) { await react(s, m, '❌'); return reply('❌ No ringtone found. Try the song name plus the artist.'); }

    await s.sendMessage(m.chat, {
      audio: { url: hit.previewUrl },
      mimetype: 'audio/mp4',
      ptt: false,
      fileName: `${hit.trackName || q}`.replace(/[^a-zA-Z0-9._-]+/g, '_') + '.m4a'
    }, { quoted: m });

    await reply(`🔔 *${hit.trackName || q}*\n👤 ${hit.artistName || '?'}\n⏱️ 30-second clip. Save it and set it as your ringtone.`);
    await react(s, m, '✅');
  } catch (e) {
    console.log('[RINGTONE] failed:', e.message);
    await react(s, m, '❌');
    reply('❌ Ringtone search failed. Try again in a moment.');
  }
} },

// ======================================================
// .wallpaper <topic>   (safe-for-work only)
// ======================================================
{ command: 'wallpaper', aliases: ['wall', 'wp'], category: 'downloader', execute: async (s, m, { args, reply }) => {
  const q = args.join(' ').trim() || 'nature';

  try {
    await react(s, m, '🖼️');

    const base = { q, categories: '111', purity: '100', sorting: 'random', per_page: 24 };

    // phone-shaped wallpapers first, then anything
    let d = await getJson(`${API.wallhaven}/search`, { ...base, ratios: 'portrait' });
    let list = (d?.data || []).filter(x => x.path && Number(x.file_size || 0) <= MAX_IMG);

    if (!list.length) {
      d = await getJson(`${API.wallhaven}/search`, base);
      list = (d?.data || []).filter(x => x.path && Number(x.file_size || 0) <= MAX_IMG);
    }

    list = list.slice(0, 3);
    if (!list.length) { await react(s, m, '❌'); return reply('❌ No wallpapers found for that. Try another word.'); }

    for (let i = 0; i < list.length; i++) {
      await s.sendMessage(m.chat, {
        image: { url: list[i].path },
        caption: `🖼️ ${q} (${i + 1}/${list.length})${list[i].resolution ? '\n📐 ' + list[i].resolution : ''}`
      }, i === 0 ? { quoted: m } : {});
    }

    await react(s, m, '✅');
  } catch (e) {
    console.log('[WALLPAPER] failed:', e.message);
    await react(s, m, '❌');
    reply('❌ Wallpaper search failed. Try again in a moment.');
  }
} },

// ======================================================
// .img <query>
// Uses Pexels when PEXELS_KEY is set (free key from pexels.com/api),
// otherwise Wikimedia Commons (no key, but more encyclopedic images).
// ======================================================
{ command: 'img', aliases: ['image', 'pic'], category: 'downloader', execute: async (s, m, { args, reply }) => {
  if (!args[0]) return reply('❌ Usage: .img <query>');
  const q = args.join(' ');

  try {
    await react(s, m, '🔍');
    let urls = [];

    if (process.env.PEXELS_KEY) {
      const d = await getJson(`${API.pexels}/search`, { query: q, per_page: 5 }, { Authorization: process.env.PEXELS_KEY });
      urls = (d?.photos || []).map(p => p.src?.large || p.src?.medium).filter(Boolean);
    }

    if (!urls.length) {
      const d = await getJson(API.wikimedia, {
        action: 'query', format: 'json', origin: '*',
        generator: 'search', gsrsearch: `${q} filetype:bitmap`, gsrnamespace: 6, gsrlimit: 8,
        prop: 'imageinfo', iiprop: 'url|mime', iiurlwidth: 1000
      });

      urls = Object.values(d?.query?.pages || {})
        .map(p => p.imageinfo?.[0])
        .filter(i => i && /^image\/(jpeg|png)$/.test(i.mime || ''))
        .map(i => i.thumburl || i.url)
        .filter(Boolean);
    }

    urls = urls.slice(0, 4);
    if (!urls.length) { await react(s, m, '❌'); return reply('❌ No images found for that.'); }

    for (let i = 0; i < urls.length; i++) {
      await s.sendMessage(m.chat, {
        image: { url: urls[i] },
        caption: `📸 ${q} (${i + 1}/${urls.length})`
      }, i === 0 ? { quoted: m } : {});
    }

    await react(s, m, '✅');
  } catch (e) {
    console.log('[IMG] failed:', e.message);
    await react(s, m, '❌');
    reply('❌ Image search failed. Try again in a moment.');
  }
} }

];
