const fs = require('fs');
const path = require('path');
const ax = require('axios');
const yts = require('yt-search');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { execSync } = require('child_process');
const YTDlpWrap = require('yt-dlp-wrap-plus').default;

const YTDLP_BINARY_PATH = path.join(__dirname, '..', 'yt-dlp');

// ✅ Download yt-dlp binary on first run (bypasses Pterodactyl postinstall block)
async function ensureYtDlp() {
  if (!fs.existsSync(YTDLP_BINARY_PATH)) {
    console.log('⬇️ Downloading yt-dlp binary (first run)...');
    try {
      await YTDlpWrap.downloadFromGithub(YTDLP_BINARY_PATH);
      fs.chmodSync(YTDLP_BINARY_PATH, '755');
      console.log('✅ yt-dlp binary ready.');
    } catch (e) {
      console.log('❌ Failed to download yt-dlp:', e.message);
    }
  }
}
ensureYtDlp();

const ytDlp = new YTDlpWrap(YTDLP_BINARY_PATH);

const cl = f => setTimeout(() => { try { fs.unlinkSync(f) } catch {} }, 3e5);
const bf = async u => Buffer.from((await ax.get(u, { responseType: 'arraybuffer', timeout: 15e3 })).data);
const B = c => ({ forwardingScore: 999, isForwarded: !0, forwardedNewsletterMessageInfo: { newsletterJid: c.newsletter.id + '@newsletter', newsletterName: c.newsletter.name } });

module.exports = [
  {
    command: 'play',
    aliases: ['song', 'music', 'play2', 'ytmp3'],
    category: 'downloader',
    execute: async (s, m, { args, reply, config: c }) => {
      let t = args.join(' ');
      if (!t) return reply('❌ Use .play song name');
      try {
        await s.sendMessage(m.chat, { react: { text: '🎶', key: m.key } });
        let sr = await yts(t);
        if (!sr.videos.length) return reply('❌ No song found');
        let v = sr.videos[0];
        const o = `./audio_${Date.now()}.mp3`;
        try {
          await ytDlp.execPromise([v.url, '--extract-audio', '--audio-format', 'mp3', '-o', o]);
        } catch (e) {
          console.log('yt-dlp audio error:', e.message);
          return reply('❌ Failed to download audio.');
        }
        await s.sendMessage(m.chat, { image: { url: v.thumbnail }, caption: `🎵 *${v.title}*\n\n⬇️ Uploading...\n\n👑 ${c.settings.title}`, contextInfo: B(c) }, { quoted: m });
        await s.sendMessage(m.chat, { audio: fs.readFileSync(o), mimetype: 'audio/mpeg', ptt: !1, fileName: v.title.replace(/[^a-zA-Z0-9]/g, '_') + '.mp3', contextInfo: { externalAdReply: { title: v.title, body: `🎧 ${c.settings.title}`, thumbnailUrl: v.thumbnail, mediaType: 1 } } }, { quoted: m });
        await s.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        cl(o);
      } catch (e) {
        console.log('play error:', e);
        reply('❌ Failed');
      }
    }
  },

  {
    command: 'video',
    aliases: ['vid', 'dl', 'yt', 'ytmp4'],
    category: 'downloader',
    execute: async (s, m, { args, reply, config: c }) => {
      let i = args.join(' ');
      if (!i) return reply('❌ Provide a link or query!\n📌 .video montreality diamond');
      let u = i, sr = !1;
      const YT = /youtube\.com|youtu\.be/.test(i), TT = /tiktok\.com/.test(i), FB = /facebook\.com|fb\.watch/.test(i), IG = /instagram\.com/.test(i), TW = /twitter\.com|x\.com/.test(i), D = YT || TT || FB || IG || TW;
      if (!D) {
        sr = !0;
        reply(`🔍 Searching: ${i}`);
        let r = await yts(i);
        if (!r.videos?.length) return reply('❌ No results');
        u = r.videos[0].url;
        reply(`📹 *${r.videos[0].title}*\n⏳ Downloading...`);
      } else reply('📹 Downloading...');
      const o = `./video_${Date.now()}.mp4`;
      try {
        await ytDlp.execPromise([u, '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]', '--merge-output-format', 'mp4', '-o', o]);
      } catch (e) {
        console.log('yt-dlp video error:', e.message);
        return reply('❌ Failed to download video.');
      }
      try {
        const stats = fs.statSync(o);
        if (stats.size > 104857600) { cl(o); return reply('❌ Video too large (>100MB)'); }
        await s.sendMessage(m.chat, { video: fs.readFileSync(o), mimetype: 'video/mp4', fileName: `video_${Date.now()}.mp4`, caption: `✅ Downloaded by Alpha`, contextInfo: B(c) }, { quoted: m });
        cl(o);
      } catch (e) {
        console.log('video send error:', e);
        reply('❌ Failed to send video.');
      }
    }
  },

  // ... (keep the rest of the commands: tiktok, gitclone, movie, etc.)
];