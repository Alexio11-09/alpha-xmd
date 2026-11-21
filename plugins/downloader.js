const fs = require('fs');
const path = require('path');
const ax = require('axios');
const yts = require('yt-search');
const ytdl = require('@pontalabs/ytdl');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { execFile } = require('child_process');
const { downloadVideo } = require('@raihan07/vidly');

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

const sleep = ms => new Promise(r => setTimeout(r, ms));
const tmpFile = (prefix, ext = '.mp4') => path.join(TMP_DIR, `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}${ext}`);

const dl = async (u, o) => {
  const w = fs.createWriteStream(o);
  const r = await ax({ url: u, method: 'GET', responseType: 'stream', timeout: 12e4, headers: { 'User-Agent': 'Mozilla/5.0' } });
  r.data.pipe(w);
  return new Promise((a, b) => { w.on('finish', a); w.on('error', b); });
};

const B = c => ({ forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: c?.newsletter?.id + '@newsletter', newsletterName: c?.newsletter?.name } });
const rm = f => { try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch {} };
const IMG_UA = 'Mozilla/5.0 (compatible; AlphaBot/1.0; +https://github.com/Alexio11-09/alpha-xmd)';
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

async function fetchImage(url, max = 10 * 1024 * 1024) {
  const r = await ax.get(url, { responseType: 'arraybuffer', timeout: 15000, maxContentLength: max, maxBodyLength: max, headers: { 'User-Agent': IMG_UA, 'Accept': 'image/*' } });
  const type = String(r.headers['content-type'] || '');
  if (!/^image\/(jpeg|png|webp|gif)/i.test(type)) throw new Error('not an image');
  return Buffer.from(r.data);
}

async function bingImages(query, limit = 10) {
  try {
    const res = await ax.get(`https://www.bing.com/images/search?q=${encodeURIComponent(query)}`, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }, timeout: 15000 });
    const html = res.data;
    const regex = /murl&quot;:&quot;(.*?)&quot;/g;
    const urls = [];
    let match;
    while ((match = regex.exec(html)) !== null && urls.length < limit) {
      const url = match[1];
      if (!urls.includes(url) && !url.includes('base64') && url.startsWith('http')) urls.push(url);
    }
    return urls;
  } catch (e) { return []; }
}

async function sendMediaUrl(s, m, kind, url, extra, opts) {
  try { return await s.sendMessage(m.chat, { [kind]: { url }, ...extra }, opts); }
  catch (e) {
    const o = tmpFile('dl', kind === 'audio' ? '.mp3' : '.mp4');
    try {
      await dl(url, o);
      return await s.sendMessage(m.chat, { [kind]: { url: o }, ...extra }, opts);
    } finally { rm(o); }
  }
}

function sniffType(file) {
  try {
    const fd = fs.openSync(file, 'r'), b = Buffer.alloc(12);
    fs.readSync(fd, b, 0, 12, 0); fs.closeSync(fd);
    if (b[0] === 0xFF && b[1] === 0xD8) return 'image';
    if (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return 'image';
    if (b.toString('ascii', 0, 3) === 'GIF') return 'image';
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'image';
  } catch {}
  return 'video';
}

async function socialDownload(s, m, reply, c, url, prefix, label) {
  const o = tmpFile(prefix);
  try {
    const result = await downloadVideo(url, o);
    if (result && fs.existsSync(o)) {
      const kind = sniffType(o);
      await s.sendMessage(m.chat, { [kind]: { url: o }, caption: `✅ ${label} ${kind === 'image' ? 'Image' : 'Video'}`, contextInfo: B(c) }, { quoted: m });
    } else reply(`❌ Failed to download ${label} media.`);
  } catch (e) { reply('❌ Failed: ' + e.message); }
  finally { rm(o); }
}

const runFfmpeg = (input, output) => new Promise(resolve => {
  execFile('ffmpeg', ['-y', '-i', input, '-t', '20', '-vn', '-ar', '44100', '-ac', '2', '-b:a', '128k', output], { timeout: 60000 }, err => resolve(!err));
});

const API = {
  aptoide: 'https://ws75.aptoide.com/api/7',
  itunes: 'https://itunes.apple.com',
  wallhaven: 'https://wallhaven.cc/api/v1',
  pexels: 'https://api.pexels.com/v1'
};

const MB = 1024 * 1024;
const MAX_APK = 60 * MB;
const getJson = async (url, params, headers = {}) => (await ax.get(url, { params, timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0', ...headers } })).data;
let apkChain = Promise.resolve();
const oneApkAtATime = job => { const run = apkChain.then(job); apkChain = run.catch(() => {}); return run; };
const fmtSize = bytes => bytes >= MB ? (bytes / MB).toFixed(1) + ' MB' : Math.round(bytes / 1024) + ' KB';
const react = (s, m, text) => s.sendMessage(m.chat, { react: { text, key: m.key } }).catch(() => {});

module.exports = [
  { command: 'play', aliases: ['song', 'music', 'play2', 'ytmp3'], category: 'downloader', execute: async (s, m, { args, reply, config: c }) => {
    let t = args.join(' '); if (!t) return reply('🎧 Usage: .play <song name>');
    try {
      await react(s, m, '🎶');
      let sr = await yts(t); if (!sr.videos.length) return reply('❌ No song found');
      let v = sr.videos[0];
      await react(s, m, '⬇️');
      let audioUrl = null;
      for (let i = 0; i < 2 && !audioUrl; i++) {
        try { audioUrl = (await ytdl.downloadAudio(v.url, 128))?.download?.downloadUrl || null; } catch (e) {}
        if (!audioUrl && i === 0) await sleep(2000);
      }
      if (!audioUrl) return reply('⚠️ Service busy, try again.');
      await s.sendMessage(m.chat, { image: { url: v.thumbnail }, caption: `🎵 *${v.title}*\n👑 ${c.settings.title}`, contextInfo: B(c) }, { quoted: m });
      await sendMediaUrl(s, m, 'audio', audioUrl, { mimetype: 'audio/mpeg', ptt: false, fileName: v.title.replace(/[^a-zA-Z0-9]/g, '_') + '.mp3' }, { quoted: m });
      await react(s, m, '✅');
    } catch (e) { reply('❌ Failed'); }
  } },

  { command: 'video', aliases: ['vid', 'dl', 'yt', 'ytmp4'], category: 'downloader', execute: async (s, m, { args, reply, config: c }) => {
    let t = args.join(' '); if (!t) return reply('🎥 Usage: .video <name/url>');
    try {
      await react(s, m, '⚡');
      let u = t;
      if (!t.startsWith('http')) { const sr = await yts(t); if (!sr.videos.length) return reply('❌ No videos'); u = sr.videos[0].url; }
      await react(s, m, '⬇️');
      const caption = `✅ Downloaded\n👑 ${c.settings.title}`;
      const pick = v => v?.download?.downloadUrl || v?.url || v?.downloadUrl || null;
      let sent = false, videoUrl = null;
      
      try { videoUrl = pick(await ytdl.downloadVideo(u)); } catch (e) {}
      if (!videoUrl) { try { videoUrl = pick(await ytdl.downloadVideo(u, 360)); } catch (e) {} }
      if (videoUrl) {
        try { await sendMediaUrl(s, m, 'video', videoUrl, { mimetype: 'video/mp4', fileName: 'video.mp4', caption, contextInfo: B(c) }, { quoted: m }); sent = true; } catch (e) {}
      }
      if (!sent) {
        const o = tmpFile('yv');
        try {
          if (await downloadVideo(u, o) && fs.existsSync(o)) {
            if (fs.statSync(o).size > 64 * MB) return reply(`⚠️ Video is too large.`);
            await s.sendMessage(m.chat, { video: { url: o }, mimetype: 'video/mp4', fileName: 'video.mp4', caption, contextInfo: B(c) }, { quoted: m });
            sent = true;
          }
        } catch (e) {} finally { rm(o); }
      }
      if (!sent) {
        try {
          const d = await getJson('https://api.dreaded.site/api/ytdl', { url: u });
          const dlUrl = d?.result?.mp4 || d?.result?.video || d?.result?.url;
          if (dlUrl) { await sendMediaUrl(s, m, 'video', dlUrl, { mimetype: 'video/mp4', fileName: 'video.mp4', caption, contextInfo: B(c) }, { quoted: m }); sent = true; }
        } catch (e) {}
      }
      if (!sent) return reply('⚠️ Could not download video.');
      await react(s, m, '✅');
    } catch (e) { reply('❌ Failed'); }
  } },

  { command: 'tiktok', aliases: ['tt', 'tiktokdl'], category: 'downloader', execute: async (s, m, { args, reply, config: c }) => {
    if (!args[0]) return reply('❌ TT link?'); reply('🎵...');
    const o = tmpFile('tt');
    try {
      let r = await ax.get(`https://tikwm.com/api/?url=${encodeURIComponent(args[0])}`), d = r.data?.data;
      if (!d?.play) return reply('❌ Failed.');
      await dl(d.play, o);
      await s.sendMessage(m.chat, { video: { url: o }, caption: `🎬 *TikTok*\n👤 @${d.author?.nickname || '?'}`, contextInfo: B(c) }, { quoted: m });
    } catch (e) { reply('❌ ' + e.message); } finally { rm(o); }
  } },

  { command: 'fb', aliases: ['facebook', 'fbdl'], category: 'downloader', execute: async (s, m, { args, reply, config: c }) => {
    if (!args[0]) return reply('❌ FB link?'); reply('📘 Downloading...');
    await socialDownload(s, m, reply, c, args[0], 'f', 'FB');
  } },

  { command: 'ig', aliases: ['instagram', 'igdl'], category: 'downloader', execute: async (s, m, { args, reply, config: c }) => {
    if (!args[0]) return reply('❌ IG link?'); reply('📸 Downloading...');
    await socialDownload(s, m, reply, c, args[0], 'i', 'IG');
  } },

  { command: 'pin', aliases: ['pinterest', 'pindl'], category: 'downloader', execute: async (s, m, { args, reply, config: c }) => {
    if (!args[0]) return reply('❌ Pinterest link?'); reply('📌 Downloading...');
    await socialDownload(s, m, reply, c, args[0], 'p', 'Pinterest');
  } },

  { command: 'yts', aliases: ['ytsearch'], category: 'downloader', execute: async (s, m, { args, reply }) => {
    if (!args[0]) return reply('❌ Query?'); let q = args.join(' ');
    try { let r = await yts(q); if (!r.videos?.length) return reply('❌ No results'); let t = `🔎 *${q}*\n\n`; for (let i = 0; i < Math.min(10, r.videos.length); i++) { let v = r.videos[i]; t += `${i + 1}. *${v.title}*\n   🔗 ${v.url}\n\n`; } reply(t); } catch { reply('❌ Failed'); }
  } },

  { command: 'shazam', aliases: ['identify', 'whatsong'], category: 'downloader', execute: async (s, m, { reply }) => {
    if (!m.quoted) return reply('❌ Reply to an audio!'); 
    let qt = m.quoted.message, t = Object.keys(qt).find(k => ['audioMessage', 'voiceMessage', 'videoMessage'].includes(k));
    if (!t) return reply('❌ Unsupported'); reply('🎧 Listening...'); 
    let inf, ouf;
    try {
      let st = await downloadContentFromMessage(qt[t], t === 'videoMessage' ? 'video' : 'audio');
      const chunks = []; let size = 0;
      for await (let ch of st) { size += ch.length; if (size > 20 * 1024 * 1024) return reply('❌ File too large'); chunks.push(ch); }
      inf = tmpFile('si', ''); ouf = tmpFile('so', '.mp3');
      fs.writeFileSync(inf, Buffer.concat(chunks));
      if (!await runFfmpeg(inf, ouf)) { if (size > 8 * 1024 * 1024) return reply('❌ ffmpeg unavailable'); fs.copyFileSync(inf, ouf); }
      
      let r = await ax.post('https://api.audd.io/', { api_token: process.env.AUDD_TOKEN || 'test', audio: fs.readFileSync(ouf).toString('base64'), return: 'apple_music,spotify' }, { headers: { 'Content-Type': 'application/json' }, timeout: 15000 });
      let d = r.data;
      if (d.status === 'success' && d.result) {
        let g = d.result, cu = g.apple_music?.artwork?.url?.replace('{w}', '600').replace('{h}', '600') || g.spotify?.album?.images?.[0]?.url || '';
        let tx = `🎵 *${g.title || 'Unknown'}*\n\n💿 *Album:* ${g.album || 'Single'}\n📅 *Released:* ${g.release_date ? g.release_date.split('-')[0] : 'Unknown'}\n🏢 *Label:* ${g.label || 'Unknown'}\n👤 *Artist:* ${g.artist || 'Unknown'}\n⏱️ *Recognised:* Just now`;
        if (cu) await s.sendMessage(m.chat, { image: { url: cu }, caption: tx }, { quoted: m }); else reply(tx);
      } else reply('❌ Not recognized');
    } catch (e) { reply('❌ Failed to recognize'); } finally { rm(inf); rm(ouf); }
  } },

  { command: 'apk', aliases: ['app', 'aptoide'], category: 'downloader', execute: async (s, m, { args, reply, config: c }) => {
    if (!args[0]) return reply('📱 Usage: .apk <app name>');
    try {
      await react(s, m, '🔎');
      const d = await getJson(`${API.aptoide}/apps/search`, { query: args.join(' '), limit: 1 }), app = d?.datalist?.list?.[0];
      if (!app) return reply('❌ App not found.');
      const url = app.file?.path || app.file?.path_alt, size = Number(app.size || app.file?.filesize || 0);
      if (size > MAX_APK) return reply(`⚠️ App is too large (${fmtSize(size)}).`);
      await react(s, m, '⬇️');
      await oneApkAtATime(() => s.sendMessage(m.chat, { document: { url }, mimetype: 'application/vnd.android.package-archive', fileName: app.name.replace(/[^a-zA-Z0-9._-]+/g, '_') + '.apk', caption: `📱 *${app.name}*\n📦 ${fmtSize(size)}` }, { quoted: m }));
      await react(s, m, '✅');
    } catch (e) { reply('❌ Download failed.'); }
  } },

  { command: 'ringtone', aliases: ['ringtones', 'rt'], category: 'downloader', execute: async (s, m, { args, reply }) => {
    if (!args[0]) return reply('🔔 Usage: .ringtone <song name>');
    try {
      await react(s, m, '🔎');
      const d = await getJson(`${API.itunes}/search`, { term: args.join(' '), media: 'music', entity: 'song', limit: 5 }), hit = (d?.results || []).find(x => x.previewUrl);
      if (!hit) return reply('❌ No ringtone found.');
      await s.sendMessage(m.chat, { audio: { url: hit.previewUrl }, mimetype: 'audio/mp4', ptt: false, fileName: `${hit.trackName}.m4a` }, { quoted: m });
      await reply(`🔔 *${hit.trackName}*\n👤 ${hit.artistName}`);
      await react(s, m, '✅');
    } catch (e) { reply('❌ Search failed.'); }
  } },

  { command: 'wallpaper', aliases: ['wall', 'wp'], category: 'downloader', execute: async (s, m, { args, reply }) => {
    const q = args.join(' ').trim() || 'nature';
    try {
      await react(s, m, '🖼️');
      let urls = await bingImages(q + ' hd wallpaper', 10);
      if (!urls.length) { const d = await getJson(`${API.wallhaven}/search`, { q, categories: '111', purity: '100', sorting: 'random', per_page: 10 }); urls.push(...(d?.data || []).map(x => x.path).filter(Boolean)); }
      urls = shuffle([...new Set(urls)]); if (!urls.length) return reply('❌ No wallpapers found.');
      let sent = 0;
      for (const u of urls) { if (sent >= 3) break; try { await s.sendMessage(m.chat, { image: await fetchImage(u), caption: `🖼️ ${q}` }, sent === 0 ? { quoted: m } : {}); sent++; await sleep(1000); } catch (e) {} }
      if (!sent) return reply('❌ Could not load.'); await react(s, m, '✅');
    } catch (e) { reply('❌ Wallpaper search failed.'); }
  } },

  { command: 'img', aliases: ['image', 'pic'], category: 'downloader', execute: async (s, m, { args, reply }) => {
    if (!args[0]) return reply('❌ Usage: .img <query>');
    const q = args.join(' ');
    try {
      await react(s, m, '🔍');
      let urls = await bingImages(q, 10);
      if (!urls.length && process.env.PEXELS_KEY) { const d = await getJson(`${API.pexels}/search`, { query: q, per_page: 10 }, { Authorization: process.env.PEXELS_KEY }); urls.push(...(d?.photos || []).map(p => p.src?.large || p.src?.medium).filter(Boolean)); }
      urls = shuffle([...new Set(urls)]); if (!urls.length) return reply('❌ No images found.');
      let sent = 0;
      for (const u of urls) { if (sent >= 4) break; try { await s.sendMessage(m.chat, { image: await fetchImage(u), caption: `📸 ${q} (${sent + 1})` }, sent === 0 ? { quoted: m } : {}); sent++; await sleep(1000); } catch (e) {} }
      if (!sent) return reply('❌ Could not load.'); await react(s, m, '✅');
    } catch (e) { reply('❌ Image search failed.'); }
  } },

  { command: 'gitclone', aliases: ['git', 'repo'], category: 'downloader', execute: async (s, m, { args, reply, config: c }) => {
    const url = args[0];
    if (!url || !url.includes('github.com')) return reply('❌ Provide a valid GitHub repository URL.');
    try {
      await reply('⬇️ Downloading repository...');
      const parts = url.split('/'), user = parts[3], repo = parts[4]?.replace('.git', '');
      if (!user || !repo) return reply('❌ Invalid GitHub URL.');
      await s.sendMessage(m.chat, { document: { url: `https://api.github.com/repos/${user}/${repo}/zipball` }, mimetype: 'application/zip', fileName: `${repo}.zip`, caption: `✅ *GitHub Repo*\n👤 ${user}\n📦 ${repo}`, contextInfo: B(c) }, { quoted: m });
    } catch (e) { reply('❌ Failed to clone repository.'); }
  } },

  { command: 'spotify', aliases: ['spotifydl', 'sp'], category: 'downloader', execute: async (s, m, { args, reply, config: c }) => {
    if (!args[0] || !args[0].includes('spotify.com')) return reply('❌ Provide a valid Spotify track URL.');
    try {
      await reply('🎵 Fetching Spotify track...');
      const apiRes = await ax.get(`https://api.dreaded.site/api/spotifydl?url=${encodeURIComponent(args[0])}`, { timeout: 15000 });
      if (!apiRes.data?.result?.download_url) return reply('❌ Failed. (Ensure it is a track, not a playlist).');
      const track = apiRes.data.result;
      await s.sendMessage(m.chat, { image: { url: track.thumbnail }, caption: `🎵 *Spotify*\n🎧 ${track.title}\n👤 ${track.artist}\n💿 ${track.album}`, contextInfo: B(c) }, { quoted: m });
      await s.sendMessage(m.chat, { audio: { url: track.download_url }, mimetype: 'audio/mpeg', fileName: `${track.title}.mp3`, ptt: false, contextInfo: B(c) }, { quoted: m });
    } catch (e) { reply('❌ Failed to download Spotify track.'); }
  } },

  { command: 'mediafire', aliases: ['mf'], category: 'downloader', execute: async (s, m, { args, reply, config: c }) => {
    if (!args[0] || !args[0].includes('mediafire.com')) return reply('❌ Provide a valid MediaFire URL.');
    try {
      await reply('📁 Scanning MediaFire link...');
      const html = (await ax.get(args[0], { headers: { 'User-Agent': 'Mozilla/5.0' } })).data;
      const match = html.match(/href="(https:\/\/download[0-9]+\.mediafire\.com\/[^"]+)"/);
      if (!match || !match[1]) return reply('❌ Invalid or private MediaFire link.');
      await s.sendMessage(m.chat, { document: { url: match[1] }, mimetype: 'application/octet-stream', fileName: args[0].split('/').pop() || 'download', caption: `✅ *MediaFire*\n📦 Sent successfully.`, contextInfo: B(c) }, { quoted: m });
    } catch (e) { reply('❌ Failed to download from MediaFire.'); }
  } }
];