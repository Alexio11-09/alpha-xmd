// © 2026 Alpha - TOOLS (FINAL FIXED)

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const QRCode = require('qrcode');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const moment = require('moment-timezone');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const { Sticker } = require('wa-sticker-formatter');

const cleanupFile = (f) => setTimeout(() => { try { fs.unlinkSync(f); } catch {} }, 300000);

const F = (arr) => arr[Math.floor(Math.random() * arr.length)];

const fail = [
    "👾 Oops, my circuits got tangled. Try again?",
    "💥 Failed! But I'm still cool.",
    "😅 Something broke. Could you try again?",
    "🤷‍♂️ Well that didn't work. Blame the internet gremlins."
];

const guide = (cmd, usage) => F([
    `🧐 You forgot something! Use: *${usage}*`,
    `🤔 Hmm, that didn't work. Try: *${usage}*`,
    `😜 Oops! The right way is: *${usage}*`,
    `🙈 Without that, I'm lost. Type: *${usage}*`
]);

const success = {
    calc: (expr, res) => F([ `🧮 Easy peasy: ${expr} = ${res}`, `🤓 According to my calculations: ${res}`, `💡 ${expr}? That's ${res}.` ]),
    qr: F([ "📱 Here's your QR code, fresh off the press!", "🎯 Scan me, I'm famous!", "🔳 QR code generated. Go wild." ]),
    tts: F([ "🗣️ Speaking now! Did I sound okay?", "🔊 Audio incoming, cover your ears!", "🎙️ TTS ready. I hope I pronounced that right." ]),
    time: F([ "🕐 Time is an illusion, but here you go.", "⏰ Clock says:", "⌛ Here's the current time, don't be late!" ]),
    sticker: F([ "🖼️ Sticker created! Slap it everywhere.", "🤳 Your sticker is ready. No refunds.", "✨ Ta‑da! A wild sticker appears." ]),
    toimg: F([ "🖼️ Sticker converted back to image. It's like magic!", "📸 Image extracted. Stickers hate this trick.", "✨ Reversed the sticker spell." ]),
    getpp: (name) => F([ `📸 Here's ${name}'s profile pic.`, `👀 Found ${name}'s picture.`, `🖼️ Profile picture of ${name}, as requested.` ]),
    getid: (id) => F([ `🆔 The ID you asked for: \`${id}\``, `🔢 User ID: \`${id}\`. Don't lose it.`, `👤 That person's ID is \`${id}\`.` ]),
    getlink: F([ "🔗 Here's your VIP pass to the group.", "📎 One group link, coming right up.", "🔗 The golden ticket to the group chat." ]),
    translate: (lang, text) => F([ `🌐 In ${lang}: ${text}`, `🗣️ Translation (${lang}): ${text}`, `📖 Here's that in ${lang}: ${text}` ]),
    weather: (city, data) => F([ `🌤️ Weather in ${city}: ${data}`, `🌡️ ${city} forecast: ${data}`, `☁️ Here's the weather for ${city}: ${data}` ]),
    lyrics: F([ "🎵 Found the lyrics! Sing along.", "🎤 Lyrics loaded. Karaoke time?", "📝 Here are the words. Don't forget the chorus." ]),
    removebg: F([ "✨ Background removed! Magic, right?", "🪄 Abracadabra, no more background.", "🎨 Image background has vanished." ]),
    tomp3: F([ "⏳ Converting to MP3… this might take a moment.", "🎧 Audio extracted successfully! Bump it.", "🔊 Video turned into music. Enjoy!" ]),
    vv: {
        image: F([ "👀 View‑once? Not on my watch! Image saved.", "📸 Snap saved! That view‑once trick won't work here.", "🖼️ Image bypassed. You're welcome." ]),
        video: F([ "🎥 Video rescued from the void. No more self‑destruct.", "📹 View‑once video? I've got it forever now.", "🎬 Video saved! That disappearing act failed." ]),
        audio: F([ "🎵 Audio saved. Nice try, view‑once.", "🔊 Voice note? I'll keep a copy.", "🎤 Audio bypassed. You can replay it now." ])
    }
};

module.exports = [
    // 0. DIAGNOSTIC – DELETE AFTER TESTING
    {
        command: "toolstest",
        aliases: ["ttest"],
        category: "tools",
        execute: async (s, m, { reply }) => {
            reply("✅ tools.js is loaded and working! The problem is only with specific conversion commands.");
        }
    },
    // 1. CALC
    { command: "calc", aliases: ["calculator","math"], category: "tools",
      execute: async (s, m, { args, reply }) => {
          if (!args[0]) return reply(guide("calc", ".calc 2+2"));
          try {
              const expr = args.join(" ").replace(/[^0-9+\-*/()%. ]/g, "");
              if (!expr) throw new Error("Invalid");
              const result = eval(expr);
              reply(success.calc(expr, result));
          } catch { reply(F(fail)); }
      }
    },
    // 2. QR
    { command: "qr", aliases: ["qrcode"], category: "tools",
      execute: async (s, m, { args, reply }) => {
          if (!args[0]) return reply(guide("qr", ".qr text or link"));
          try {
              const qrBuf = await QRCode.toBuffer(args.join(" "), { type: 'png' });
              await s.sendMessage(m.chat, { image: qrBuf, caption: success.qr }, { quoted: m });
          } catch { reply(F(fail)); }
      }
    },
    // 3. TTS
    { command: "tts", aliases: ["speak","say"], category: "tools",
      execute: async (s, m, { args, reply }) => {
          if (!args[0]) return reply(guide("tts", ".tts hello world"));
          try {
              const text = encodeURIComponent(args.join(" "));
              const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${text}&tl=en&client=tw-ob`;
              await s.sendMessage(m.chat, { audio: { url }, mimetype: "audio/mpeg", ptt: true }, { quoted: m });
              reply(success.tts);
          } catch { reply(F(fail)); }
      }
    },
    // 4. TIME
    { command: "time", aliases: ["clock","date"], category: "tools",
      execute: async (s, m, { reply }) => {
          try {
              const now = moment();
              const text = `${success.time}\n\n📅 ${now.format("dddd, MMMM Do YYYY")}\n⏰ ${now.format("hh:mm:ss A")}\n\n🌍 World Times:\n🇿🇦 SA: ${moment().tz("Africa/Johannesburg").format("hh:mm A")}\n🇳🇬 NG: ${moment().tz("Africa/Lagos").format("hh:mm A")}\n🇰🇪 KE: ${moment().tz("Africa/Nairobi").format("hh:mm A")}\n🇬🇧 UK: ${moment().tz("Europe/London").format("hh:mm A")}\n🇺🇸 US: ${moment().tz("America/New_York").format("hh:mm A")}\n🇮🇳 IN: ${moment().tz("Asia/Kolkata").format("hh:mm A")}`;
              reply(text);
          } catch { reply(F(fail)); }
      }
    },
    // 5. STICKER MAKER (wa-sticker-formatter)
    {
        command: "sticker", aliases: ["s","st"], category: "tools",
        execute: async (s, m, { reply }) => {
            if (!m.quoted) return reply("❌ Reply to an image or video!");
            const quoted = m.quoted;
            const msgType = Object.keys(quoted.message || {})[0];
            if (msgType !== 'imageMessage' && msgType !== 'videoMessage') return reply("❌ Reply to an image or video!");

            try {
                reply("⏳ Cooking a sticker...");
                const content = quoted.message[msgType];
                const stream = await downloadContentFromMessage(
                    content,
                    msgType === 'imageMessage' ? 'image' : 'video'
                );
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                // Convert to sticker
                const sticker = new Sticker(buffer, {
                    pack: 'Alpha Bot',
                    author: 'Sticker Maker',
                    type: 'full',
                    quality: 80
                });
                const stickerBuffer = await sticker.toBuffer();

                await s.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m });
                reply(success.sticker);
            } catch (err) {
                console.error("Sticker error:", err);
                reply("❌ Failed to create sticker. " + err.message);
            }
        }
    },
    // 6. STICKER TO IMAGE (wa-sticker-formatter reverse)
    {
        command: "toimg", aliases: ["stickertoimg","simg"], category: "tools",
        execute: async (s, m, { reply }) => {
            if (!m.quoted) return reply("❌ Reply to a sticker!");
            const quoted = m.quoted;
            const msgType = Object.keys(quoted.message || {})[0];
            if (msgType !== 'stickerMessage') return reply("❌ Reply to a sticker!");

            try {
                const content = quoted.message.stickerMessage;
                const stream = await downloadContentFromMessage(content, 'image');
                let webpBuffer = Buffer.from([]);
                for await (const chunk of stream) webpBuffer = Buffer.concat([webpBuffer, chunk]);

                // Convert webp sticker to image via wa-sticker-formatter
                const sticker = new Sticker(webpBuffer, {
                    pack: 'Alpha Bot',
                    author: 'Sticker Converter',
                    type: 'full',
                    quality: 100
                });
                const imageMessage = await sticker.toMessage();
                
                // Send it directly – toMessage() returns a valid WhatsApp message object
                await s.sendMessage(m.chat, imageMessage, { quoted: m });
                reply(success.toimg);
            } catch (err) {
                console.error("Toimg error:", err);
                reply("❌ Failed to convert sticker. " + err.message);
            }
        }
    },
    // 7. GETPP
    { command: "getpp", aliases: ["getprofile","pp"], category: "tools",
      execute: async (s, m, { reply }) => {
          let target;
          if (m.quoted && m.quoted.sender) target = m.quoted.sender;
          else if (m.mentionedJid && m.mentionedJid.length > 0) target = m.mentionedJid[0];
          else target = m.sender;
          try {
              const ppUrl = await s.profilePictureUrl(target, 'image');
              const name = target.split('@')[0];
              await s.sendMessage(m.chat, { image: { url: ppUrl }, caption: success.getpp(name), mentions: [target] }, { quoted: m });
          } catch { reply("👤 Could not fetch profile picture. They may have hidden it."); }
      }
    },
    // 8. GETID
    { command: "getid", aliases: ["id","userid"], category: "tools",
      execute: async (s, m, { reply }) => {
          let target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : m.sender);
          reply(success.getid(target.split('@')[0]));
      }
    },
    // 9. GETLINK
    { command: "getlink", aliases: ["grouplink","invitelink"], category: "tools", group: true, admin: true,
      execute: async (s, m, { reply }) => {
          try {
              const code = await s.groupInviteCode(m.chat);
              reply(`${success.getlink}\n\n🔗 https://chat.whatsapp.com/${code}`);
          } catch { reply("❌ I need admin powers to fetch the link. Promote me!"); }
      }
    },
    // 10. TRANSLATE
    { command: "translate", aliases: ["tr"], category: "tools",
      execute: async (s, m, { args, reply }) => {
          if (!args[0]) return reply(guide("translate", ".translate en Hello"));
          const lang = args[0].toLowerCase(), text = args.slice(1).join(" ");
          if (!text) return reply("❌ Provide text to translate!");
          try {
              const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
              const res = await axios.get(url, { timeout: 10000 });
              const translated = res.data[0][0][0];
              reply(success.translate(lang, translated));
          } catch { reply(F(fail)); }
      }
    },
    // 11. WEATHER
    { command: "weather", aliases: ["forecast"], category: "tools",
      execute: async (s, m, { args, reply }) => {
          if (!args[0]) return reply(guide("weather", ".weather Harare"));
          try {
              const url = `https://wttr.in/${encodeURIComponent(args.join(" "))}?format=%C+%t+%w+%h`;
              const res = await axios.get(url, { timeout: 10000 });
              reply(success.weather(args.join(" "), res.data));
          } catch { reply(F(fail)); }
      }
    },
    // 12. LYRICS
    { command: "lyrics", aliases: ["lyric"], category: "tools",
      execute: async (s, m, { args, reply }) => {
          if (!args[0]) return reply(guide("lyrics", ".lyrics Song Name"));
          const query = args.join(" ");
          try {
              const res = await axios.get(`https://api.davidcyriltech.my.id/lyrics?title=${encodeURIComponent(query)}`, { timeout: 10000 });
              const data = res.data;
              const lyrics = data?.lyrics || data?.result?.lyrics;
              if (!lyrics) return reply(`❌ Lyrics not found for "${query}".`);
              const output = lyrics.length > 4000 ? lyrics.substring(0, 3900) + '...' : lyrics;
              reply(`${success.lyrics}\n\n${output}`);
          } catch { reply(`❌ Could not fetch lyrics. Service may be unreachable.`); }
      }
    },
    // 13. REMOVEBG
    { command: "removebg", aliases: ["rbg","nobg"], category: "tools",
      execute: async (s, m, { args, reply }) => {
          if (!m.quoted) return reply(guide("removebg", ".removebg (reply to image)"));
          if (!args[0]) return reply("❌ Provide a remove.bg API key!");
          const msg = m.quoted;
          if (!(Object.keys(msg.message || {})[0] || '').includes('image')) return reply("❌ Reply to an IMAGE.");
          reply("⏳ Removing background...");
          try {
              const buffer = await s.downloadMediaMessage(msg);
              const FormData = require('form-data');
              const form = new FormData();
              form.append('image', buffer, 'image.jpg');
              const res = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
                  headers: { 'X-Api-Key': args[0], ...form.getHeaders() },
                  responseType: 'arraybuffer', timeout: 30000
              });
              await s.sendMessage(m.chat, { image: Buffer.from(res.data), caption: success.removebg }, { quoted: m });
          } catch { reply("❌ Failed. Check your API key or the image."); }
      }
    },
    // 14. TOMP3
    { command: "tomp3", aliases: ["toaudio","video2mp3"], category: "tools",
      execute: async (s, m, { reply }) => {
          if (!m.quoted) return reply(guide("tomp3", ".tomp3 (reply to a video)"));
          const quoted = m.quoted;
          if (!(Object.keys(quoted.message || {})[0] || '').includes('video')) return reply("❌ Reply to a VIDEO.");
          reply(success.tomp3);
          const tmp = path.join(__dirname, '../temp');
          if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
          const vid = path.join(tmp, `v_${Date.now()}.mp4`), aud = path.join(tmp, `a_${Date.now()}.mp3`);
          try {
              const buf = await s.downloadMediaMessage(quoted);
              fs.writeFileSync(vid, buf);
              await new Promise((res, rej) => {
                  ffmpeg(vid).output(aud).audioCodec('libmp3lame').audioBitrate('128k').format('mp3').on('end', res).on('error', rej).run();
              });
              if (fs.existsSync(aud)) {
                  const abuf = fs.readFileSync(aud);
                  await s.sendMessage(m.chat, { audio: abuf, mimetype: "audio/mpeg", ptt: false }, { quoted: m });
              } else throw new Error("No audio");
          } catch (e) { console.log("tomp3 error:", e); reply("❌ Conversion failed."); }
          finally { cleanupFile(vid); cleanupFile(aud); }
      }
    },
    // 15. VV (UNTOUCHED)
    {
        command: "vv", aliases: ["viewonce","saveview","antiselfdestruct","unlock"], category: "tools",
        execute: async (s, m, { reply }) => {
            if (!m.quoted) return reply(guide("vv", ".vv (reply to a view‑once message)"));
            const q = m.quoted;
            const mime = q.mtype || "";
            const isViewOnce = q.message?.imageMessage?.viewOnce ||
                             q.message?.videoMessage?.viewOnce ||
                             q.message?.audioMessage?.viewOnce;
            if (!isViewOnce) return reply("👀 That's not a view‑once message. I can already see it!");

            try {
                const content = q.message.imageMessage ||
                                q.message.videoMessage ||
                                q.message.audioMessage;
                const stream = await downloadContentFromMessage(
                    content,
                    mime.includes('image') ? 'image' : mime.includes('video') ? 'video' : 'audio'
                );
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                if (mime.includes('image')) {
                    await s.sendMessage(m.chat, { image: buffer, caption: success.vv.image }, { quoted: m });
                } else if (mime.includes('video')) {
                    await s.sendMessage(m.chat, { video: buffer, caption: success.vv.video, gifPlayback: q.message?.videoMessage?.gifPlayback || false }, { quoted: m });
                } else if (mime.includes('audio')) {
                    await s.sendMessage(m.chat, { audio: buffer, mimetype: "audio/mpeg", ptt: true }, { quoted: m });
                    reply(success.vv.audio);
                }
            } catch (err) {
                console.log("VV error:", err.message);
                reply("❌ Failed to bypass view‑once. The media may have already expired or been read.");
            }
        }
    }
];