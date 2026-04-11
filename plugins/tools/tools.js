// © 2026 Alpha - TOOLS COMMANDS (WITH VIEW ONCE BYPASS)

const fs = require('fs');
const axios = require('axios');
const QRCode = require('qrcode');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const moment = require('moment-timezone');

// Cleanup old files
const cleanupFile = (filepath) => {
    setTimeout(() => {
        try { fs.unlinkSync(filepath); } catch {}
    }, 300000);
};

// Download file from URL
const downloadFromUrl = async (url, outputPath) => {
    const writer = fs.createWriteStream(outputPath);
    const response = await axios({ url, method: 'GET', responseType: 'stream', timeout: 60000 });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};

module.exports = [

    // ==================== 1. CALCULATOR ====================
    {
        command: "calc",
        aliases: ["calculator", "math"],
        category: "tools",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Use: .calc 2+2");
            try {
                const expression = args.join(" ").replace(/[^0-9+\-*/()%.]/g, "");
                const result = eval(expression);
                reply(`🧮 *Calculator*\n\n${args.join(" ")} = ${result}`);
            } catch {
                reply("❌ Invalid calculation!");
            }
        }
    },

    // ==================== 2. QR GENERATOR ====================
    {
        command: "qr",
        aliases: ["qrcode"],
        category: "tools",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Use: .qr text or link");
            try {
                const qrBuffer = await QRCode.toBuffer(args.join(" "), { scale: 8 });
                await sock.sendMessage(m.chat, { image: qrBuffer, caption: "📌 QR Code Generated" }, { quoted: m });
            } catch {
                reply("❌ QR generation failed!");
            }
        }
    },

    // ==================== 3. TEXT TO SPEECH ====================
    {
        command: "tts",
        aliases: ["speak", "say"],
        category: "tools",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Use: .tts hello world");
            try {
                const text = encodeURIComponent(args.join(" "));
                const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${text}&tl=en&client=tw-ob`;
                await sock.sendMessage(m.chat, { audio: { url }, mimetype: "audio/mpeg", ptt: true }, { quoted: m });
            } catch {
                reply("❌ TTS failed!");
            }
        }
    },

    // ==================== 4. TIME ====================
    {
        command: "time",
        aliases: ["clock", "date"],
        category: "tools",
        execute: async (sock, m, { reply }) => {
            const now = moment();
            let text = `🕐 *CURRENT TIME*\n\n`;
            text += `📅 ${now.format("dddd, MMMM Do YYYY")}\n`;
            text += `⏰ ${now.format("hh:mm:ss A")}\n\n`;
            text += `🌍 *World Times:*\n`;
            text += `🇿🇦 SA: ${moment().tz("Africa/Johannesburg").format("hh:mm A")}\n`;
            text += `🇳🇬 NG: ${moment().tz("Africa/Lagos").format("hh:mm A")}\n`;
            text += `🇰🇪 KE: ${moment().tz("Africa/Nairobi").format("hh:mm A")}\n`;
            text += `🇬🇧 UK: ${moment().tz("Europe/London").format("hh:mm A")}\n`;
            text += `🇺🇸 US: ${moment().tz("America/New_York").format("hh:mm A")}\n`;
            text += `🇮🇳 IN: ${moment().tz("Asia/Kolkata").format("hh:mm A")}`;
            reply(text);
        }
    },

    // ==================== 5. STICKER MAKER ====================
    {
        command: "sticker",
        aliases: ["s", "st"],
        category: "tools",
        execute: async (sock, m, { args, reply }) => {
            if (!m.quoted) return reply("❌ Reply to an image or short video!");
            
            const msg = m.quoted;
            const mime = msg.mtype || "";
            
            if (mime.includes("image")) {
                reply("⏳ Creating sticker...");
                try {
                    const buffer = await sock.downloadMediaMessage(msg);
                    await sock.sendMessage(m.chat, { sticker: buffer }, { quoted: m });
                } catch {
                    reply("❌ Failed to create sticker!");
                }
            } else if (mime.includes("video")) {
                if (msg.seconds > 10) return reply("❌ Video too long! Max 10 seconds.");
                reply("⏳ Creating animated sticker...");
                try {
                    const buffer = await sock.downloadMediaMessage(msg);
                    await sock.sendMessage(m.chat, { sticker: buffer }, { quoted: m });
                } catch {
                    reply("❌ Failed to create sticker!");
                }
            } else {
                reply("❌ Reply to an image or video!");
            }
        }
    },

    // ==================== 6. STICKER TO IMAGE ====================
    {
        command: "toimg",
        aliases: ["stickertoimg", "simg"],
        category: "tools",
        execute: async (sock, m, { reply }) => {
            if (!m.quoted) return reply("❌ Reply to a sticker!");
            
            const msg = m.quoted;
            const mime = msg.mtype || "";
            
            if (!mime.includes("sticker")) return reply("❌ Reply to a STICKER!");
            
            try {
                const buffer = await sock.downloadMediaMessage(msg);
                await sock.sendMessage(m.chat, { image: buffer, caption: "✅ Sticker converted!" }, { quoted: m });
            } catch {
                reply("❌ Conversion failed!");
            }
        }
    },

    // ==================== 7. GET PROFILE PICTURE ====================
    {
        command: "getpp",
        aliases: ["getprofile", "pp"],
        category: "tools",
        execute: async (sock, m, { reply }) => {
            let target;
            
            if (m.mentionedJid && m.mentionedJid[0]) {
                target = m.mentionedJid[0];
            } else if (m.quoted) {
                target = m.quoted.sender;
            } else {
                target = m.sender;
            }
            
            try {
                const ppUrl = await sock.profilePictureUrl(target, 'image');
                await sock.sendMessage(m.chat, {
                    image: { url: ppUrl },
                    caption: `📸 Profile Picture of @${target.split('@')[0]}`,
                    mentions: [target]
                }, { quoted: m });
            } catch {
                reply("❌ No profile picture found!");
            }
        }
    },

    // ==================== 8. GET ID ====================
    {
        command: "getid",
        aliases: ["id", "userid"],
        category: "tools",
        execute: async (sock, m, { reply }) => {
            let target;
            
            if (m.mentionedJid && m.mentionedJid[0]) {
                target = m.mentionedJid[0];
            } else if (m.quoted) {
                target = m.quoted.sender;
            } else {
                target = m.sender;
            }
            
            const id = target.split('@')[0];
            reply(`🆔 *User ID:* \`${id}\``);
        }
    },

    // ==================== 9. GET GROUP LINK ====================
    {
        command: "getlink",
        aliases: ["grouplink", "invitelink"],
        category: "tools",
        group: true,
        admin: true,
        execute: async (sock, m, { reply }) => {
            try {
                const code = await sock.groupInviteCode(m.chat);
                reply(`🔗 *Group Invite Link*\n\nhttps://chat.whatsapp.com/${code}`);
            } catch {
                reply("❌ Failed to get group link! Make sure bot is admin.");
            }
        }
    },

    // ==================== 10. TRANSLATE ====================
    {
        command: "translate",
        aliases: ["tr"],
        category: "tools",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Use: .translate en Hello\n\nLanguages: en, es, fr, de, it, pt, ru, zh, ja, ko, ar, hi");
            
            const lang = args[0].toLowerCase();
            const text = args.slice(1).join(" ");
            
            if (!text) return reply("❌ Provide text to translate!");
            
            try {
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
                const response = await axios.get(url);
                const translated = response.data[0][0][0];
                reply(`🌐 *Translated (${lang})*\n\n${translated}`);
            } catch {
                reply("❌ Translation failed!");
            }
        }
    },

    // ==================== 11. WEATHER ====================
    {
        command: "weather",
        aliases: ["forecast"],
        category: "tools",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Use: .weather Harare");
            
            const city = args.join(" ");
            
            try {
                const url = `https://wttr.in/${encodeURIComponent(city)}?format=%C+%t+%w+%h`;
                const response = await axios.get(url);
                reply(`🌤️ *Weather in ${city}*\n\n${response.data}`);
            } catch {
                reply("❌ Weather fetch failed!");
            }
        }
    },

    // ==================== 12. LYRICS ====================
    {
        command: "lyrics",
        aliases: ["lyric"],
        category: "tools",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Use: .lyrics Song Name - Artist");
            
            const query = args.join(" ");
            
            try {
                const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(query)}`;
                const response = await axios.get(url);
                const lyrics = response.data.lyrics;
                
                if (lyrics.length > 4000) {
                    reply(`📝 *Lyrics too long!*\n\n${lyrics.substring(0, 3900)}...`);
                } else {
                    reply(`📝 *Lyrics*\n\n${lyrics}`);
                }
            } catch {
                reply("❌ Lyrics not found! Try: Song Name - Artist");
            }
        }
    },

    // ==================== 13. REMOVE BACKGROUND ====================
    {
        command: "removebg",
        aliases: ["rbg", "nobg"],
        category: "tools",
        execute: async (sock, m, { args, reply }) => {
            if (!m.quoted) return reply("❌ Reply to an image!");
            if (!args[0]) return reply("❌ Provide remove.bg API key!\n\nGet free key at: https://www.remove.bg/api");
            
            const msg = m.quoted;
            const mime = msg.mtype || "";
            if (!mime.includes("image")) return reply("❌ Reply to an IMAGE!");
            
            reply("⏳ Removing background...");
            
            try {
                const buffer = await sock.downloadMediaMessage(msg);
                const FormData = require('form-data');
                const formData = new FormData();
                formData.append('image', buffer, 'image.jpg');
                
                const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
                    headers: {
                        'X-Api-Key': args[0],
                        ...formData.getHeaders()
                    },
                    responseType: 'arraybuffer'
                });
                
                await sock.sendMessage(m.chat, { image: response.data, caption: "✅ Background removed!" }, { quoted: m });
            } catch (err) {
                reply("❌ Failed! Check your API key.");
            }
        }
    },

    // ==================== 14. VIDEO TO MP3 ====================
    {
        command: "tomp3",
        aliases: ["toaudio", "video2mp3"],
        category: "tools",
        execute: async (sock, m, { reply }) => {
            if (!m.quoted) return reply("❌ Reply to a video!");
            
            const msg = m.quoted;
            const mime = msg.mtype || "";
            
            if (!mime.includes("video")) return reply("❌ Reply to a VIDEO!");
            
            reply("⏳ Converting to MP3...\n\n⚠️ This feature requires ffmpeg on server.");
        }
    },

    // ==================== 15. VIEW ONCE BYPASS ====================
    {
        command: "vv",
        aliases: ["viewonce", "saveview", "antiselfdestruct", "unlock"],
        category: "tools",
        execute: async (sock, m, { reply }) => {
            if (!m.quoted) return reply("❌ Reply to a View Once message!");
            
            const msg = m.quoted;
            const mime = msg.mtype || "";
            
            // Check if it's a view once message
            const isViewOnce = msg.message?.imageMessage?.viewOnce || 
                              msg.message?.videoMessage?.viewOnce ||
                              msg.message?.audioMessage?.viewOnce;
            
            if (!isViewOnce) return reply("❌ This is NOT a View Once message!");
            
            try {
                // Download the media
                const buffer = await sock.downloadMediaMessage(msg);
                
                // Send back as normal media (bypasses view once)
                if (mime.includes("image")) {
                    await sock.sendMessage(m.chat, { 
                        image: buffer, 
                        caption: "✅ *View Once Bypassed!*\n\n📸 Image saved!" 
                    }, { quoted: m });
                } else if (mime.includes("video")) {
                    await sock.sendMessage(m.chat, { 
                        video: buffer, 
                        caption: "✅ *View Once Bypassed!*\n\n🎥 Video saved!",
                        gifPlayback: msg.message?.videoMessage?.gifPlayback || false
                    }, { quoted: m });
                } else if (mime.includes("audio")) {
                    await sock.sendMessage(m.chat, { 
                        audio: buffer, 
                        mimetype: "audio/mpeg",
                        ptt: true
                    }, { quoted: m });
                    reply("✅ *View Once Bypassed!*\n\n🎵 Audio saved!");
                }
                
            } catch (err) {
                console.log("VV error:", err.message);
                reply("❌ Failed! The media may have already expired.");
            }
        }
    }

];