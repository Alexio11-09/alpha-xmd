const fs = require('fs'), path = require('path'), axios = require('axios'), QRCode = require('qrcode');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const moment = require('moment-timezone'), ffmpeg = require('fluent-ffmpeg');
// System ffmpeg is used (no @ffmpeg-installer)
const { writeExif } = require('../library/exif');
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
async function uploadImage(buf,fname='image.png') {
  const fd = new (require('form-data'))();
  fd.append('reqtype','fileupload');
  fd.append('fileToUpload',buf,{filename:fname,contentType:'image/png'});
  const r = await axios.post('https://catbox.moe/user/api.php',fd,{headers:{...fd.getHeaders(),'User-Agent':'AlphaBot/1.0'},timeout:15000});
  if(typeof r.data==='string'&&r.data.startsWith('http'))return r.data;
  throw new Error('Catbox: '+r.data);
}
module.exports = [
  { command: "calc", aliases: ["calculator","math"], category: "tools",
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply(guide("calc", ".calc 2+2"));
      try { reply(ok.calc(args.join(" ").replace(/[^0-9+\-*/()%. ]/g, ""), eval(args.join(" ").replace(/[^0-9+\-*/()%. ]/g, "")))); } catch { reply(F(fail)); }
    }
  },
  { command: "qr", aliases: ["qrcode"], category: "tools",
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply(guide("qr", ".qr text"));
      try { const b = await QRCode.toBuffer(args.join(" "), { type: 'png' }); await s.sendMessage(m.chat, { image: b, caption: ok.qr }, { quoted: m }); } catch { reply(F(fail)); }
    }
  },
  { command: "tts", aliases: ["speak","say"], category: "tools",
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply(guide("tts", ".tts text"));
      try { const t = encodeURIComponent(args.join(" ")); await s.sendMessage(m.chat, { audio: { url: `https://translate.google.com/translate_tts?ie=UTF-8&q=${t}&tl=en&client=tw-ob` }, mimetype: "audio/mpeg", ptt: true }, { quoted: m }); reply(ok.tts); } catch { reply(F(fail)); }
    }
  },
  { command: "time", aliases: ["clock","date"], category: "tools",
    execute: async (s, m, { reply }) => {
      try { const n = moment(); reply(`${ok.time}\n📅 ${n.format("dddd, MMMM Do YYYY")}\n⏰ ${n.format("hh:mm:ss A")}\n🌍 SA: ${moment().tz("Africa/Johannesburg").format("hh:mm A")}`); } catch { reply(F(fail)); }
    }
  },
  { command: "sticker", aliases: ["s","st"], category: "tools",
    execute: async (s, m, { reply }) => {
      if (!m.quoted?.message) return reply("❌ Reply to image/video!");
      const q = m.quoted, t = Object.keys(q.message)[0];
      if (t !== 'imageMessage' && t !== 'videoMessage') return reply("❌ Must be image or video!");
      reply("⏳ Cooking...");
      try {
        const c = q.message[t];
        const st = await downloadContentFromMessage(c, t === 'imageMessage' ? 'image' : 'video');
        let b = Buffer.from([]); for await (const ch of st) b = Buffer.concat([b, ch]);
        const sb = await writeExif({ data: b, mimetype: t === 'imageMessage' ? 'image/jpeg' : 'video/mp4' }, { packname: 'Alpha Bot', author: 'Sticker Maker', categories: ['🤖'] });
        await s.sendMessage(m.chat, { sticker: sb }, { quoted: m }); reply(ok.sticker);
      } catch (e) { console.error("Sticker:", e); reply("❌ " + (e.message || "Failed")); }
    }
  },
  { command: "toimg", aliases: ["stickertoimg","simg"], category: "tools",
    execute: async (s, m, { reply }) => {
      if (!m.quoted?.message) return reply("❌ Reply to sticker!");
      const q = m.quoted;
      if (Object.keys(q.message)[0] !== 'stickerMessage') return reply("❌ Must be sticker!");
      reply("⏳ Converting...");
      const tmp = path.join(__dirname, '../temp');
      if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
      const webpPath = path.join(tmp, `sticker_${Date.now()}.webp`);
      const pngPath = path.join(tmp, `output_${Date.now()}.png`);
      try {
        let webpBuffer = Buffer.from([]);
        const stream = await downloadContentFromMessage(q.message.stickerMessage, 'image');
        for await (const chunk of stream) webpBuffer = Buffer.concat([webpBuffer, chunk]);
        fs.writeFileSync(webpPath, webpBuffer);
        await new Promise((resolve, reject) => {
          ffmpeg(webpPath).output(pngPath).outputOptions('-vframes 1').on('end', resolve).on('error', reject).run();
        });
        if (fs.existsSync(pngPath)) {
          const pngBuffer = fs.readFileSync(pngPath);
          await s.sendMessage(m.chat, { image: pngBuffer, caption: ok.toimg }, { quoted: m });
        } else throw new Error("Conversion failed");
      } catch (e) { console.error("Toimg:", e); reply("❌ Failed. The sticker may be animated."); }
      finally { cleanup(webpPath); cleanup(pngPath); }
    }
  },
  { command: "getpp", aliases: ["getprofile","pp"], category: "tools",
    execute: async (s, m, { reply }) => {
      let t = m.mentionedJid?.[0] || (m.quoted?.sender) || m.sender;
      try { const u = await s.profilePictureUrl(t, 'image'); await s.sendMessage(m.chat, { image: { url: u }, caption: ok.getpp(t.split('@')[0]), mentions: [t] }, { quoted: m }); } catch { reply("👤 No PP."); }
    }
  },
  { command: "getid", aliases: ["id","userid"], category: "tools",
    execute: async (s, m, { reply }) => {
      let t = m.mentionedJid?.[0] || (m.quoted?.sender) || m.sender; reply(ok.getid(t.split('@')[0]));
    }
  },
  { command: "getlink", aliases: ["grouplink","invitelink"], category: "tools", group: true, admin: true,
    execute: async (s, m, { reply }) => {
      try { const c = await s.groupInviteCode(m.chat); reply(`${ok.getlink}\nhttps://chat.whatsapp.com/${c}`); } catch { reply("❌ Need admin."); }
    }
  },
  { command: "translate", aliases: ["tr"], category: "tools",
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply(guide("translate", ".translate en Hello"));
      const l = args[0].toLowerCase(), t = args.slice(1).join(" "); if (!t) return reply("❌ Text missing.");
      try { const r = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${l}&dt=t&q=${encodeURIComponent(t)}`, { timeout: 10000 }); reply(ok.translate(l, r.data[0][0][0])); } catch { reply(F(fail)); }
    }
  },
  { command: "weather", aliases: ["forecast"], category: "tools",
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply(guide("weather", ".weather Harare"));
      try { const r = await axios.get(`https://wttr.in/${encodeURIComponent(args.join(" "))}?format=%C+%t+%w+%h`, { timeout: 10000 }); reply(ok.weather(args.join(" "), r.data)); } catch { reply(F(fail)); }
    }
  },
  { command: "lyrics", aliases: ["lyric"], category: "tools",
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply(guide("lyrics", ".lyrics Song"));
      try { const r = await axios.get(`https://api.davidcyriltech.my.id/lyrics?title=${encodeURIComponent(args.join(" "))}`, { timeout: 10000 }); const l = r.data?.lyrics || r.data?.result?.lyrics; if (!l) return reply("❌ Not found."); reply(`${ok.lyrics}\n\n${l.substring(0, 3900)}`); } catch { reply("❌ Service down."); }
    }
  },
  { command: "removebg", aliases: ["rbg","nobg"], category: "tools",
    execute: async (s, m, { args, reply }) => {
      if (!m.quoted) return reply(guide("removebg", ".removebg (reply image)")); if (!args[0]) return reply("❌ API key needed.");
      if (!(Object.keys(m.quoted.message || {})[0] || '').includes('image')) return reply("❌ Reply to image!");
      reply("⏳ Removing...");
      try {
        const b = await s.downloadMediaMessage(m.quoted); const fd = new (require('form-data'))(); fd.append('image', b, 'image.jpg');
        const r = await axios.post('https://api.remove.bg/v1.0/removebg', fd, { headers: { 'X-Api-Key': args[0], ...fd.getHeaders() }, responseType: 'arraybuffer', timeout: 30000 });
        await s.sendMessage(m.chat, { image: Buffer.from(r.data), caption: ok.removebg }, { quoted: m });
      } catch { reply("❌ Failed."); }
    }
  },
  { command: "tomp3", aliases: ["toaudio","video2mp3"], category: "tools",
    execute: async (s, m, { reply }) => {
      if (!m.quoted) return reply(guide("tomp3", ".tomp3 (reply video)"));
      if (!(Object.keys(m.quoted.message || {})[0] || '').includes('video')) return reply("❌ Reply to video!");
      reply(ok.tomp3); const tmp = path.join(__dirname, '../temp'); if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
      const vid = path.join(tmp, `v_${Date.now()}.mp4`), aud = path.join(tmp, `a_${Date.now()}.mp3`);
      try {
        const b = await s.downloadMediaMessage(m.quoted); fs.writeFileSync(vid, b);
        await new Promise((res, rej) => { ffmpeg(vid).output(aud).audioCodec('libmp3lame').audioBitrate('128k').format('mp3').on('end', res).on('error', rej).run(); });
        if (fs.existsSync(aud)) { const ab = fs.readFileSync(aud); await s.sendMessage(m.chat, { audio: ab, mimetype: "audio/mpeg", ptt: false }, { quoted: m }); }
        else throw new Error("No audio");
      } catch (e) { console.log("tomp3:", e); reply("❌ Failed."); }
      finally { cleanup(vid); cleanup(aud); }
    }
  },
  { command: "vv", aliases: ["viewonce","saveview","antiselfdestruct","unlock"], category: "tools",
    execute: async (s, m, { reply }) => {
      if (!m.quoted) return reply(guide("vv", ".vv (reply view-once)")); const q = m.quoted, mime = q.mtype || "";
      const isVO = q.message?.imageMessage?.viewOnce || q.message?.videoMessage?.viewOnce || q.message?.audioMessage?.viewOnce;
      if (!isVO) return reply("👀 Not view-once!");
      try {
        const c = q.message.imageMessage || q.message.videoMessage || q.message.audioMessage;
        const st = await downloadContentFromMessage(c, mime.includes('image') ? 'image' : mime.includes('video') ? 'video' : 'audio');
        let b = Buffer.from([]); for await (const ch of st) b = Buffer.concat([b, ch]);
        if (mime.includes('image')) await s.sendMessage(m.chat, { image: b, caption: ok.vv.img }, { quoted: m });
        else if (mime.includes('video')) await s.sendMessage(m.chat, { video: b, caption: ok.vv.vid, gifPlayback: q.message?.videoMessage?.gifPlayback || false }, { quoted: m });
        else if (mime.includes('audio')) { await s.sendMessage(m.chat, { audio: b, mimetype: "audio/mpeg", ptt: true }, { quoted: m }); reply(ok.vv.aud); }
      } catch (e) { console.log("VV:", e.message); reply("❌ Bypass failed."); }
    }
  },
  { command: "url", aliases: ["upload","imageurl"], category: "tools",
    execute: async (s, m, { reply }) => {
      if (!m.quoted?.message) return reply("❌ Reply to image/sticker!"); const q = m.quoted, t = Object.keys(q.message)[0];
      const im = t === 'imageMessage', st = t === 'stickerMessage'; if (!im && !st) return reply("❌ Must be image or sticker!");
      reply("⏳ Uploading..."); const tmp = path.join(__dirname, '../temp'); if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true }); let buf;
      if (im) { const s = await downloadContentFromMessage(q.message.imageMessage, 'image'); buf = Buffer.from([]); for await (const c of s) buf = Buffer.concat([buf, c]); }
      else {
        const wpath = path.join(tmp, `upsticker_${Date.now()}.webp`), ppath = path.join(tmp, `upsticker_${Date.now()}.png`);
        try {
          const ss = await downloadContentFromMessage(q.message.stickerMessage, 'image'); let wb = Buffer.from([]); for await (const c of ss) wb = Buffer.concat([wb, c]);
          fs.writeFileSync(wpath, wb); await new Promise((res, rej) => { ffmpeg(wpath).output(ppath).outputOptions('-vframes 1').on('end', res).on('error', rej).run(); });
          buf = fs.readFileSync(ppath);
        } finally { cleanup(wpath); cleanup(ppath); }
      }
      try { const url = await uploadImage(buf, im ? 'image.jpg' : 'sticker.png'); reply(`${ok.url}\n\n🔗 ${url}`); } catch (e) { console.error("Upload:", e); reply("❌ " + (e.message || "Failed")); }
    }
  },
  { command: "img", aliases: ["image","pic","gimage"], category: "tools",
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply("❌ Usage: .img <search query>"); const query = args.join(" "); reply(`🔍 Searching images for *${query}*...`);
      try {
        const res = await axios.get(`https://api.davidcyriltech.my.id/search/image?query=${encodeURIComponent(query)}`, { timeout: 15000 });
        const images = res.data?.results || res.data?.data || res.data?.images || []; if (!images || images.length === 0) return reply(`❌ No images found for "${query}".`);
        const validImages = images.map(img => typeof img === 'string' ? img : (img.url || img.image || img.link || img.src)).filter(url => url?.startsWith('http')).sort(() => Math.random() - 0.5);
        const selected = validImages.slice(0, 5); if (selected.length === 0) return reply("❌ No valid image URLs found.");
        for (let i = 0; i < selected.length; i++) {
          await s.sendMessage(m.chat, { image: { url: selected[i] }, caption: i === 0 ? `${ok.img}\n🔍 *${query}*` : `🔍 *${query}* (${i+1}/${selected.length})` }, { quoted: i === 0 ? m : undefined });
          if (i < selected.length - 1) await new Promise(r => setTimeout(r, 500));
        }
      } catch (err) { console.error("Img search error:", err); reply(`❌ Image search failed: ${err.message}`); }
    }
  },
  { command: "take", aliases: ["savestatus","getstatus"], category: "tools", owner: true,
    execute: async (s, m, { args, reply }) => {
      let target; if (m.mentionedJid?.[0]) target = m.mentionedJid[0]; else if (m.quoted?.sender) target = m.quoted.sender;
      else if (args[0]) target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'; else return reply("❌ Mention a user or provide a number!");
      if (!global.statusCache || !global.statusCache.has(target)) return reply("❌ No cached status for that user.");
      const statusMsg = global.statusCache.get(target); const msgType = Object.keys(statusMsg.message || {})[0];
      const allowed = ['imageMessage','videoMessage','audioMessage']; if (!allowed.includes(msgType)) return reply("❌ Latest status is not an image/video/audio.");
      reply("⏳ Downloading status..."); const content = statusMsg.message[msgType];
      const stream = await downloadContentFromMessage(content, msgType === 'imageMessage' ? 'image' : msgType === 'videoMessage' ? 'video' : 'audio');
      let buf = Buffer.from([]); for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
      if (msgType === 'imageMessage') await s.sendMessage(m.chat, { image: buf, caption: `📸 Status from @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
      else if (msgType === 'videoMessage') await s.sendMessage(m.chat, { video: buf, caption: `🎥 Status from @${target.split('@')[0]}`, mentions: [target], gifPlayback: false }, { quoted: m });
      else if (msgType === 'audioMessage') { await s.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: true }, { quoted: m }); reply(`🎵 Voice status from @${target.split('@')[0]}`); }
    }
  }
];