// © 2026 Alpha - TOOLS (WITH .img IMAGE SEARCH + .take STATUS SAVER)
const fs = require('fs'), path = require('path'), axios = require('axios'), QRCode = require('qrcode');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const moment = require('moment-timezone'), ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg'); ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const { writeExif } = require('../library/exif'), webp = require('node-webpmux');
const cleanup = (f) => setTimeout(() => { try { fs.unlinkSync(f); } catch {} }, 300000);
const F = (a) => a[Math.floor(Math.random()*a.length)];
const fail = ["👾 Oops! Try again?","💥 Failed!","😅 Something broke.","🤷‍♂️ Blame the gremlins."];
const guide = (c,u) => F([`🧐 Use: *${u}*`,`🤔 Try: *${u}*`,`😜 Right: *${u}*`,`🙈 Type: *${u}*`]);
const ok = {
  calc: (e,r) => F([`🧮 ${e}=${r}`,`🤓 ${r}`,`💡 ${e}? ${r}.`]),
  qr: F(["📱 QR ready!","🎯 Scan!","🔳 Done."]),
  tts: F(["🗣️ Speaking!","🔊 Listen!","🎙️ TTS done."]),
  time: F(["🕐 Time:","⏰ Clock:","⌛ Now:"]),
  sticker: F(["🖼️ Sticker created!","🤳 Ready!","✨ Ta-da!"]),
  toimg: F(["🖼️ Image extracted!","📸 Done!","✨ Reversed!"]),
  getpp: (n) => F([`📸 ${n}'s pic`,`👀 Found`,`🖼️ PP of ${n}`]),
  getid: (i) => F([`🆔 ${i}`,`🔢 ${i}`,`👤 ${i}`]),
  getlink: F(["🔗 Link!","📎 Here!","🔗 Group link."]),
  translate: (l,t) => F([`🌐 ${l}: ${t}`,`🗣️ ${t}`,`📖 ${l}: ${t}`]),
  weather: (c,d) => F([`🌤️ ${c}: ${d}`,`🌡️ ${d}`,`☁️ ${c}: ${d}`]),
  lyrics: F(["🎵 Lyrics!","🎤 Sing!","📝 Words."]),
  removebg: F(["✨ No bg!","🪄 Magic!","🎨 Done."]),
  tomp3: F(["⏳ Converting...","🎧 MP3 ready!","🔊 Done!"]),
  url: F(["🌐 Uploaded!","📤 Link:","🔗 Online:"]),
  img: F(["🖼️ Images found!","📸 Here you go:","🔍 Search result:"]),
  vv: {
    img: F(["👀 Saved!","📸 Snapped!","🖼️ Bypass."]),
    vid: F(["🎥 Rescued!","📹 Saved!","🎬 Bypass."]),
    aud: F(["🎵 Saved!","🔊 Voicenote.","🎤 Bypass."])
  }
};

async function uploadImage(buf, fname = 'image.png') {
  const fd = new (require('form-data'))();
  fd.append('reqtype', 'fileupload');
  fd.append('fileToUpload', buf, { filename: fname, contentType: 'image/png' });
  const r = await axios.post('https://catbox.moe/user/api.php', fd, { headers: { ...fd.getHeaders(), 'User-Agent': 'AlphaBot/1.0' }, timeout: 15000 });
  if (typeof r.data === 'string' && r.data.startsWith('http')) return r.data;
  throw new Error('Catbox: ' + r.data);
}

module.exports = [
  // ... (commands 1–15 unchanged) ...
  // 16. URL (UPLOAD)
  { command: "url", aliases: ["upload","imageurl"], category: "tools",
    execute: async (s, m, { reply }) => {
      if (!m.quoted?.message) return reply("❌ Reply to image/sticker!");
      const q = m.quoted, t = Object.keys(q.message)[0];
      const im = t === 'imageMessage', st = t === 'stickerMessage';
      if (!im && !st) return reply("❌ Must be image or sticker!");
      reply("⏳ Uploading...");
      try {
        let buf;
        if (im) { const s = await downloadContentFromMessage(q.message.imageMessage, 'image'); buf = Buffer.from([]); for await (const c of s) buf = Buffer.concat([buf, c]); }
        else { const s = await downloadContentFromMessage(q.message.stickerMessage, 'image'); let w = Buffer.from([]); for await (const c of s) w = Buffer.concat([w, c]); const img = new webp.Image(); await img.load(w); buf = await img.toBuffer('image/png'); }
        const url = await uploadImage(buf, im ? 'image.jpg' : 'sticker.png');
        reply(`${ok.url}\n\n🔗 ${url}`);
      } catch (e) { console.error("Upload:", e); reply("❌ " + (e.message || "Failed")); }
    }
  },

  // ==================== 18. .img (FREE IMAGE SEARCH) ====================
  {
    command: "img",
    aliases: ["image", "pic", "gimage"],
    category: "tools",
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply("❌ Usage: .img <search query>\n\n📌 Example: .img doja cat");
      const query = args.join(" ");
      reply(`🔍 Searching images for *${query}*...`);
      try {
        const res = await axios.get(`https://api.davidcyriltech.my.id/search/image?query=${encodeURIComponent(query)}`, { timeout: 15000 });
        const images = res.data?.results || res.data?.data || res.data?.images || [];
        if (!images || images.length === 0) return reply(`❌ No images found for "${query}".`);
        const validImages = images
          .map(img => typeof img === 'string' ? img : (img.url || img.image || img.link || img.src))
          .filter(url => url && url.startsWith('http'))
          .sort(() => Math.random() - 0.5);
        const selected = validImages.slice(0, 5);
        if (selected.length === 0) return reply(`❌ No valid image URLs found for "${query}". Try a different search.`);
        for (let i = 0; i < selected.length; i++) {
          const caption = i === 0 ? `${ok.img}\n🔍 *${query}* (${i + 1}/${selected.length})` : `🔍 *${query}* (${i + 1}/${selected.length})`;
          try {
            await s.sendMessage(m.chat, { image: { url: selected[i] }, caption }, { quoted: i === 0 ? m : undefined });
            if (i < selected.length - 1) await new Promise(r => setTimeout(r, 500));
          } catch (imgErr) { console.log("Img send error:", imgErr.message); }
        }
      } catch (err) { console.error("Img search error:", err); reply(`❌ Image search failed: ${err.message || "Unknown error"}`); }
    }
  },   // ← missing comma was here

  // ==================== .take (SAVE STATUS MEDIA) ====================
  {
    command: "take",
    aliases: ["savestatus", "getstatus"],
    category: "tools",
    owner: true,
    execute: async (s, m, { args, reply }) => {
      let target;
      if (m.mentionedJid && m.mentionedJid[0]) {
        target = m.mentionedJid[0];
      } else if (m.quoted && m.quoted.sender) {
        target = m.quoted.sender;
      } else if (args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num.length < 7) return reply("❌ Invalid number.");
        target = num + '@s.whatsapp.net';
      } else {
        return reply("❌ Please mention a user, reply to their message, or provide a number!");
      }

      if (!global.statusCache || !global.statusCache.has(target)) {
        return reply("❌ No cached status for that user. Make sure auto‑status is ON and they posted a status recently.");
      }

      const statusMsg = global.statusCache.get(target);
      const msgType = Object.keys(statusMsg.message || {})[0];
      const allowedTypes = ['imageMessage', 'videoMessage', 'audioMessage'];
      if (!allowedTypes.includes(msgType)) {
        return reply("❌ The latest status from this user is not an image/video/audio (maybe text?).");
      }

      reply("⏳ Downloading the status...");
      try {
        const content = statusMsg.message[msgType];
        const stream = await downloadContentFromMessage(content,
          msgType === 'imageMessage' ? 'image' :
          msgType === 'videoMessage' ? 'video' : 'audio'
        );
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        if (msgType === 'imageMessage') {
          await s.sendMessage(m.chat, { image: buffer, caption: `📸 Status from @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
        } else if (msgType === 'videoMessage') {
          await s.sendMessage(m.chat, { video: buffer, caption: `🎥 Status from @${target.split('@')[0]}`, mentions: [target], gifPlayback: false }, { quoted: m });
        } else if (msgType === 'audioMessage') {
          await s.sendMessage(m.chat, { audio: buffer, mimetype: 'audio/mpeg', ptt: true }, { quoted: m });
          reply(`🎵 Voice status from @${target.split('@')[0]}`);
        }
      } catch (err) {
        console.error("Take error:", err);
        reply("❌ Failed to download status: " + (err.message || String(err)));
      }
    }
  }
];