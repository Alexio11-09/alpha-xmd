// © 2026 Alpha - TOOLS (STICKER FINAL DEBUG)

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const axios = require('axios');
const QRCode = require('qrcode');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const moment = require('moment-timezone');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const webp = require('node-webpmux');

// ---------- STICKER CONVERSION ----------
async function createStickerFromBuffer(mediaBuffer, isVideo) {
    const tmpDir = os.tmpdir();
    const input = path.join(tmpDir, `${crypto.randomBytes(6).toString('hex')}.${isVideo ? 'mp4' : 'jpg'}`);
    const output = path.join(tmpDir, `${crypto.randomBytes(6).toString('hex')}.webp`);
    fs.writeFileSync(input, mediaBuffer);

    await new Promise((resolve, reject) => {
        const ff = ffmpeg(input);
        const args = [
            "-vcodec", "libwebp",
            "-vf", "scale='min(320,iw)':'min(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0"
        ];
        if (isVideo) args.push("-loop", "0", "-ss", "00:00:00", "-t", "00:00:05", "-an");
        ff.addOutputOptions(args).toFormat("webp").on("error", reject).on("end", resolve).save(output);
    });

    const webpBuf = fs.readFileSync(output);
    fs.unlinkSync(input);
    fs.unlinkSync(output);

    // Attach EXIF
    const img = new webp.Image();
    const exifAttr = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00]);
    const json = { "sticker-pack-id": crypto.randomBytes(16).toString("hex"), "sticker-pack-name": "Alpha Bot", "sticker-pack-publisher": "Sticker Maker", "emojis": ["🤖"] };
    const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);
    await img.load(webpBuf);
    img.exif = exif;
    return await img.save(null);
}

// ---------- FUNNY REPLIES ----------
const F = (arr) => arr[Math.floor(Math.random() * arr.length)];
const fail = ["👾 Oops, circuits tangled. Try again?","💥 Failed! But I'm still cool.","😅 Something broke.","🤷‍♂️ Blame the internet gremlins."];
const guide = (cmd, usage) => F([`🧐 Missing! Use: *${usage}*`,`🤔 Hmm, try: *${usage}*`,`😜 Right way: *${usage}*`,`🙈 Lost? Type: *${usage}*`]);
const success = {
    calc: (expr, res) => F([`🧮 ${expr} = ${res}`,`🤓 ${res}`,`💡 ${expr}? ${res}.`]),
    qr: F(["📱 QR ready!","🎯 Scan me!","🔳 Generated."]),
    tts: F(["🗣️ Speaking!","🔊 Hear this!","🎙️ TTS done."]),
    time: F(["🕐 Time is illusion.","⏰ Clock says:","⌛ Current time."]),
    sticker: F(["🖼️ Sticker created!","🤳 Ready!","✨ Ta‑da!"]),
    toimg: F(["🖼️ Sticker→Image!","📸 Extracted."]),
    getpp: (name) => F([`📸 ${name}'s pic`,`👀 Found`,`🖼️ PP of ${name}`]),
    getid: (id) => F([`🆔 ${id}`,`🔢 ID: ${id}`,`👤 ${id}`]),
    getlink: F(["🔗 Link!","📎 Here!","🔗 Group link."]),
    translate: (lang, text) => F([`🌐 ${lang}: ${text}`,`🗣️ ${text}`,`📖 ${lang}: ${text}`]),
    weather: (city, data) => F([`🌤️ ${city}: ${data}`,`🌡️ ${data}`,`☁️ ${city}: ${data}`]),
    lyrics: F(["🎵 Lyrics found!","🎤 Sing along.","📝 Words."]),
    removebg: F(["✨ Background gone!","🪄 Magic!","🎨 No bg."]),
    tomp3: F(["⏳ Converting…","🎧 MP3 ready!","🔊 Music extracted."]),
    vv: {
        image: F(["👀 Saved!","📸 Snapped!","🖼️ Bypass."]),
        video: F(["🎥 Rescued!","📹 Saved!","🎬 Bypass."]),
        audio: F(["🎵 Saved!","🔊 Voice note.","🎤 Bypass."])
    }
};

module.exports = [
    // 1. CALC
    { command: "calc", aliases: ["calculator","math"], category: "tools",
      execute: async (s, m, { args, reply }) => {
          if (!args[0]) return reply(guide("calc", ".calc 2+2"));
          try { const e = args.join(" ").replace(/[^0-9+\-*/()%. ]/g, ""); const r = eval(e); reply(success.calc(e, r)); } catch { reply(F(fail)); }
      }
    },
    // 2. QR
    { command: "qr", aliases: ["qrcode"], category: "tools",
      execute: async (s, m, { args, reply }) => {
          if (!args[0]) return reply(guide("qr", ".qr text/link"));
          try { const buf = await QRCode.toBuffer(args.join(" "), { type: 'png' }); await s.sendMessage(m.chat, { image: buf, caption: success.qr }, { quoted: m }); } catch { reply(F(fail)); }
      }
    },
    // 3. TTS
    { command: "tts", aliases: ["speak","say"], category: "tools",
      execute: async (s, m, { args, reply }) => {
          if (!args[0]) return reply(guide("tts", ".tts text"));
          try { const t = encodeURIComponent(args.join(" ")); await s.sendMessage(m.chat, { audio: { url: `https://translate.google.com/translate_tts?ie=UTF-8&q=${t}&tl=en&client=tw-ob` }, mimetype: "audio/mpeg", ptt: true }, { quoted: m }); reply(success.tts); } catch { reply(F(fail)); }
      }
    },
    // 4. TIME
    { command: "time", aliases: ["clock","date"], category: "tools",
      execute: async (s, m, { reply }) => {
          try { const n = moment(); reply(`${success.time}\n\n📅 ${n.format("dddd, MMMM Do YYYY")}\n⏰ ${n.format("hh:mm:ss A")}\n🌍 SA: ${moment().tz("Africa/Johannesburg").format("hh:mm A")}`); } catch { reply(F(fail)); }
      }
    },
    // 5. STICKER MAKER (FAIL-SAFE)
    {
        command: "sticker", aliases: ["s","st"], category: "tools",
        execute: async (s, m, { reply }) => {
            if (!m.quoted || !m.quoted.message) return reply("❌ Please *reply* to an image or video.");

            const q = m.quoted;
            const msgType = Object.keys(q.message)[0];
            if (msgType !== 'imageMessage' && msgType !== 'videoMessage') return reply("❌ The replied message must be an image or a video.");

            try {
                reply("⏳ Downloading...");
                const content = q.message[msgType];
                const stream = await downloadContentFromMessage(
                    content,
                    msgType === 'imageMessage' ? 'image' : 'video'
                );
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                // Send original back as proof
                if (msgType === 'imageMessage') {
                    await s.sendMessage(m.chat, { image: buffer, caption: "Download OK. Converting to sticker..." }, { quoted: m });
                } else {
                    await s.sendMessage(m.chat, { video: buffer, caption: "Download OK. Converting to sticker..." }, { quoted: m });
                }

                // Convert to sticker
                const stickerBuf = await createStickerFromBuffer(buffer, msgType === 'videoMessage');
                await s.sendMessage(m.chat, { sticker: stickerBuf }, { quoted: m });
                reply(success.sticker);

            } catch (err) {
                console.error("Sticker error:", err);
                reply("❌ Sticker creation failed: " + (err.message || String(err)));
            }
        }
    },
    // 6. STICKER TO IMAGE
    { command: "toimg", aliases: ["stickertoimg","simg"], category: "tools",
      execute: async (s, m, { reply }) => {
          if (!m.quoted || !m.quoted.message) return reply("❌ Reply to a sticker!");
          const q = m.quoted;
          if (Object.keys(q.message)[0] !== 'stickerMessage') return reply("❌ Not a sticker!");
          try {
              const stream = await downloadContentFromMessage(q.message.stickerMessage, 'image');
              let buf = Buffer.from([]);
              for await (const c of stream) buf = Buffer.concat([buf, c]);
              const img = new webp.Image(); await img.load(buf);
              const png = await img.toBuffer('image/png');
              await s.sendMessage(m.chat, { image: png, caption: success.toimg }, { quoted: m });
          } catch (err) {
              console.error("Toimg error:", err);
              reply("❌ Toimg failed: " + (err.message || String(err)));
          }
      }
    },
    // 7. GETPP
    { command: "getpp", aliases: ["getprofile","pp"], category: "tools",
      execute: async (s, m, { reply }) => {
          let t = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : m.sender);
          try {
              const url = await s.profilePictureUrl(t, 'image');
              await s.sendMessage(m.chat, { image: { url }, caption: success.getpp(t.split('@')[0]), mentions: [t] }, { quoted: m });
          } catch { reply("👤 No profile picture."); }
      }
    },
    // 8. GETID
    { command: "getid", aliases: ["id","userid"], category: "tools",
      execute: async (s, m, { reply }) => {
          let t = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : m.sender);
          reply(success.getid(t.split('@')[0]));
      }
    },
    // 9. GETLINK
    { command: "getlink", aliases: ["grouplink","invitelink"], category: "tools", group: true, admin: true,
      execute: async (s, m, { reply }) => {
          try { const c = await s.groupInviteCode(m.chat); reply(`${success.getlink}\nhttps://chat.whatsapp.com/${c}`); } catch { reply("❌ Need admin."); }
      }
    },
    // 10. TRANSLATE
    { command: "translate", aliases: ["tr"], category: "tools",
      execute: async (s, m, { args, reply }) => {
          if (!args[0]) return reply(guide("translate", ".translate en Hello"));
          const l = args[0].toLowerCase(), t = args.slice(1).join(" ");
          if (!t) return reply("❌ Text missing.");
          try { const r = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${l}&dt=t&q=${encodeURIComponent(t)}`, { timeout: 10000 }); reply(success.translate(l, r.data[0][0][0])); } catch { reply(F(fail)); }
      }
    },
    // 11. WEATHER
    { command: "weather", aliases: ["forecast"], category: "tools",
      execute: async (s, m, { args, reply }) => {
          if (!args[0]) return reply(guide("weather", ".weather Harare"));
          try { const r = await axios.get(`https://wttr.in/${encodeURIComponent(args.join(" "))}?format=%C+%t+%w+%h`, { timeout: 10000 }); reply(success.weather(args.join(" "), r.data)); } catch { reply(F(fail)); }
      }
    },
    // 12. LYRICS
    { command: "lyrics", aliases: ["lyric"], category: "tools",
      execute: async (s, m, { args, reply }) => {
          if (!args[0]) return reply(guide("lyrics", ".lyrics Song Name"));
          const q = args.join(" ");
          try { const r = await axios.get(`https://api.davidcyriltech.my.id/lyrics?title=${encodeURIComponent(q)}`, { timeout: 10000 }); const l = r.data?.lyrics || r.data?.result?.lyrics; if (!l) return reply(`❌ Not found: ${q}`); reply(`${success.lyrics}\n\n${l.substring(0, 3900)}`); } catch { reply("❌ Service unavailable."); }
      }
    },
    // 13. REMOVEBG (unchanged)
    { command: "removebg", aliases: ["rbg","nobg"], category: "tools",
      execute: async (s, m, { args, reply }) => {
          if (!m.quoted) return reply(guide("removebg", ".removebg (reply to image)"));
          if (!args[0]) return reply("❌ API key needed.");
          const msg = m.quoted;
          if (!(Object.keys(msg.message||{})[0]||'').includes('image')) return reply("❌ Reply to an image.");
          try {
              const buf = await s.downloadMediaMessage(msg);
              const FormData = require('form-data');
              const f = new FormData(); f.append('image', buf, 'image.jpg');
              const r = await axios.post('https://api.remove.bg/v1.0/removebg', f, { headers: { 'X-Api-Key': args[0], ...f.getHeaders() }, responseType: 'arraybuffer', timeout: 30000 });
              await s.sendMessage(m.chat, { image: Buffer.from(r.data), caption: success.removebg }, { quoted: m });
          } catch { reply("❌ Failed."); }
      }
    },
    // 14. TOMP3 (unchanged)
    { command: "tomp3", aliases: ["toaudio","video2mp3"], category: "tools",
      execute: async (s, m, { reply }) => {
          if (!m.quoted) return reply(guide("tomp3", ".tomp3 (reply to video)"));
          const q = m.quoted;
          if (!(Object.keys(q.message||{})[0]||'').includes('video')) return reply("❌ Reply to a video.");
          const tmp = path.join(__dirname, '../temp');
          if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
          const v = path.join(tmp, `v_${Date.now()}.mp4`), a = path.join(tmp, `a_${Date.now()}.mp3`);
          try {
              const buf = await s.downloadMediaMessage(q); fs.writeFileSync(v, buf);
              await new Promise((res, rej) => { ffmpeg(v).output(a).audioCodec('libmp3lame').audioBitrate('128k').format('mp3').on('end', res).on('error', rej).run(); });
              if (fs.existsSync(a)) { const ab = fs.readFileSync(a); await s.sendMessage(m.chat, { audio: ab, mimetype: "audio/mpeg", ptt: false }, { quoted: m }); }
              else throw new Error("No audio");
          } catch (e) { console.log("tomp3 error:", e); reply("❌ Conversion failed."); }
          finally { setTimeout(() => { try { fs.existsSync(v) && fs.unlinkSync(v); fs.existsSync(a) && fs.unlinkSync(a); } catch {} }, 300000); }
      }
    },
    // 15. VV (UNTOUCHED)
    {
        command: "vv", aliases: ["viewonce","saveview","antiselfdestruct","unlock"], category: "tools",
        execute: async (s, m, { reply }) => {
            if (!m.quoted) return reply(guide("vv", ".vv (reply to view‑once)"));
            const q = m.quoted;
            const mime = q.mtype || "";
            const isVO = q.message?.imageMessage?.viewOnce || q.message?.videoMessage?.viewOnce || q.message?.audioMessage?.viewOnce;
            if (!isVO) return reply("👀 Not a view‑once message.");
            try {
                const content = q.message.imageMessage || q.message.videoMessage || q.message.audioMessage;
                const stream = await downloadContentFromMessage(content, mime.includes('image') ? 'image' : mime.includes('video') ? 'video' : 'audio');
                let buf = Buffer.from([]);
                for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
                if (mime.includes('image')) await s.sendMessage(m.chat, { image: buf, caption: success.vv.image }, { quoted: m });
                else if (mime.includes('video')) await s.sendMessage(m.chat, { video: buf, caption: success.vv.video }, { quoted: m });
                else if (mime.includes('audio')) { await s.sendMessage(m.chat, { audio: buf, mimetype: "audio/mpeg", ptt: true }, { quoted: m }); reply(success.vv.audio); }
            } catch (err) { console.log("VV error:", err.message); reply("❌ Bypass failed."); }
        }
    }
];