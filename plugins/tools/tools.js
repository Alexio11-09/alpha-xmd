// © 2026 Alpha - TOOLS (FULL FIXED 🔥)

const QRCode = require("qrcode");
const axios = require("axios");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const moment = require("moment-timezone");

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = [

/* ================= CALC ================= */
{
    command: "calc",
    aliases: ["calculator", "math"],
    category: "tools",
    execute: async (sock, m, { args, reply }) => {
        try {
            if (!args[0]) return reply("❌ Use: .calc 2+2");
            
            const expression = args.join(" ").replace(/[^0-9+\-*/()%.]/g, "");
            const result = eval(expression);
            reply(`🧮 *Calculator*\n\n${args.join(" ")} = ${result}`);
        } catch {
            reply("❌ Invalid calculation");
        }
    }
},

/* ================= QR ================= */
{
    command: "qr",
    aliases: ["qrcode"],
    category: "tools",
    execute: async (sock, m, { args, reply }) => {
        try {
            if (!args[0]) return reply("❌ Use: .qr text or link");
            
            const url = await QRCode.toDataURL(args.join(" "));
            await sock.sendMessage(m.chat, {
                image: { url },
                caption: "📌 QR Code Generated"
            }, { quoted: m });
        } catch {
            reply("❌ QR generation failed");
        }
    }
},

/* ================= TTS ================= */
{
    command: "tts",
    aliases: ["speak", "say"],
    category: "tools",
    execute: async (sock, m, { args, reply }) => {
        try {
            if (!args[0]) return reply("❌ Use: .tts hello world");
            
            const text = encodeURIComponent(args.join(" "));
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${text}&tl=en&client=tw-ob`;
            
            await sock.sendMessage(m.chat, {
                audio: { url },
                mimetype: "audio/mpeg",
                ptt: true
            }, { quoted: m });
        } catch {
            reply("❌ TTS failed");
        }
    }
},

/* ================= TIME (FIXED - SHOWS REAL LOCAL TIME) ================= */
{
    command: "time",
    aliases: ["clock", "date"],
    category: "tools",
    execute: async (sock, m, { reply }) => {
        const now = moment();
        
        const timezones = [
            { name: "🇿🇦 South Africa", tz: "Africa/Johannesburg" },
            { name: "🇳🇬 Nigeria", tz: "Africa/Lagos" },
            { name: "🇰🇪 Kenya", tz: "Africa/Nairobi" },
            { name: "🇬🇧 UK", tz: "Europe/London" },
            { name: "🇺🇸 US Eastern", tz: "America/New_York" },
            { name: "🇮🇳 India", tz: "Asia/Kolkata" }
        ];
        
        let text = `🕐 *CURRENT TIME*\n\n`;
        text += `📅 Date: ${now.format("dddd, MMMM Do YYYY")}\n`;
        text += `⏰ UTC: ${moment.utc().format("hh:mm:ss A")}\n\n`;
        text += `🌍 *World Times:*\n`;
        
        for (let t of timezones) {
            text += `${t.name}: ${moment().tz(t.tz).format("hh:mm A")}\n`;
        }
        
        reply(text);
    }
},

/* ================= STICKER (FIXED PACKNAME/AUTHOR) ================= */
{
    command: "sticker",
    aliases: ["s", "st"],
    category: "tools",
    execute: async (sock, m, { args, reply }) => {
        try {
            if (!m.quoted) return reply("❌ Reply to an image or short video!");
            
            const mime = m.quoted.mtype || "";
            const input = "./sticker_input";
            const output = "./sticker.webp";
            
            let packname = "Alpha Bot";
            let author = "Alpha";
            
            if (args.length > 0) {
                const parts = args.join(" ").split("|");
                packname = parts[0]?.trim() || packname;
                author = parts[1]?.trim() || author;
            }
            
            // ===== IMAGE =====
            if (mime.includes("image")) {
                const stream = await downloadContentFromMessage(m.quoted.msg, "image");
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                
                fs.writeFileSync(input + ".jpg", buffer);
                
                await new Promise((resolve, reject) => {
                    ffmpeg(input + ".jpg")
                        .outputOptions([
                            "-vcodec", "libwebp",
                            "-vf", "scale=512:512:force_original_aspect_ratio=decrease",
                            "-lossless", "1",
                            "-qscale", "75",
                            "-preset", "default",
                            "-loop", "0",
                            "-an",
                            "-vsync", "0"
                        ])
                        .save(output)
                        .on("end", resolve)
                        .on("error", reject);
                });
                
                const stickerBuffer = fs.readFileSync(output);
                
                await sock.sendMessage(m.chat, {
                    sticker: stickerBuffer,
                    packname: packname,
                    author: author
                }, { quoted: m });
                
                try { fs.unlinkSync(input + ".jpg"); } catch {}
                try { fs.unlinkSync(output); } catch {}
            }
            
            // ===== VIDEO =====
            else if (mime.includes("video")) {
                reply("⏳ Making animated sticker...");
                
                const stream = await downloadContentFromMessage(m.quoted.msg, "video");
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                
                if (buffer.length > 8 * 1024 * 1024) {
                    return reply("❌ Video too big (max 8MB)");
                }
                
                fs.writeFileSync(input + ".mp4", buffer);
                
                await new Promise((resolve, reject) => {
                    ffmpeg(input + ".mp4")
                        .outputOptions([
                            "-vcodec", "libwebp",
                            "-vf", "scale=512:512:force_original_aspect_ratio=decrease,fps=15",
                            "-loop", "0",
                            "-ss", "00:00:00",
                            "-t", "00:00:07",
                            "-preset", "default",
                            "-an",
                            "-vsync", "0"
                        ])
                        .save(output)
                        .on("end", resolve)
                        .on("error", reject);
                });
                
                const stickerBuffer = fs.readFileSync(output);
                
                await sock.sendMessage(m.chat, {
                    sticker: stickerBuffer,
                    packname: packname,
                    author: author
                }, { quoted: m });
                
                try { fs.unlinkSync(input + ".mp4"); } catch {}
                try { fs.unlinkSync(output); } catch {}
            }
            
            else {
                return reply("❌ Reply to an image or video!");
            }
            
        } catch (e) {
            console.log("Sticker Error:", e);
            reply("❌ Sticker creation failed");
        }
    }
},

/* ================= TOIMG ================= */
{
    command: "toimg",
    aliases: ["stickertoimg", "simg"],
    category: "tools",
    execute: async (sock, m, { reply }) => {
        try {
            if (!m.quoted) return reply("❌ Reply to a sticker!");
            
            const mime = m.quoted.mtype || "";
            if (!mime.includes("sticker")) return reply("❌ Reply to a sticker!");
            
            const stream = await downloadContentFromMessage(m.quoted.msg, "sticker");
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            await sock.sendMessage(m.chat, {
                image: buffer,
                caption: "✅ Sticker converted to image"
            }, { quoted: m });
            
        } catch (e) {
            console.log("ToImg Error:", e);
            reply("❌ Conversion failed");
        }
    }
},

/* ================= TOMP3 ================= */
{
    command: "tomp3",
    aliases: ["toaudio", "video2mp3"],
    category: "tools",
    execute: async (sock, m, { reply }) => {
        try {
            if (!m.quoted) return reply("❌ Reply to a video or audio message!");
            
            const mime = m.quoted.mtype || "";
            let buffer = Buffer.from([]);
            
            if (mime.includes("video")) {
                const stream = await downloadContentFromMessage(m.quoted.msg, "video");
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
            } else if (mime.includes("audio")) {
                const stream = await downloadContentFromMessage(m.quoted.msg, "audio");
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
            } else {
                return reply("❌ Reply to a video or audio message!");
            }
            
            const input = "./input_media";
            const output = "./output.mp3";
            
            fs.writeFileSync(input, buffer);
            
            reply("⏳ Converting to MP3...");
            
            await new Promise((resolve, reject) => {
                ffmpeg(input)
                    .toFormat("mp3")
                    .on("end", resolve)
                    .on("error", reject)
                    .save(output);
            });
            
            await sock.sendMessage(m.chat, {
                audio: fs.readFileSync(output),
                mimetype: "audio/mpeg"
            }, { quoted: m });
            
            try { fs.unlinkSync(input); } catch {}
            try { fs.unlinkSync(output); } catch {}
            
        } catch (e) {
            console.log("MP3 Error:", e);
            reply("❌ Conversion failed");
        }
    }
},

/* ================= TICTACTOE ================= */
{
    command: "tictactoe",
    aliases: ["ttt", "xo"],
    category: "games",
    execute: async (sock, m, { args, reply, games }) => {
        if (!m.isGroup) return reply("❌ This game only works in groups!");
        if (!m.mentionedJid || !m.mentionedJid[0]) {
            return reply("❌ Tag someone to play!\nExample: .tictactoe @user");
        }
        
        const opponent = m.mentionedJid[0];
        const challenger = m.sender;
        
        if (opponent === challenger) return reply("❌ You can't play with yourself!");
        
        const gameId = `${m.chat}_${challenger}_${opponent}`;
        
        if (!games.tictactoe) games.tictactoe = {};
        
        games.tictactoe[gameId] = {
            gameId: gameId,
            chatId: m.chat,
            board: ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"],
            turn: challenger,
            challenger: challenger,
            opponent: opponent,
            moves: 0,
            active: true
        };
        
        let text = `🎮 *TIC TAC TOE*\n\n`;
        text += `❌ @${challenger.split("@")[0]} vs ⭕ @${opponent.split("@")[0]}\n\n`;
        text += `1️⃣ │ 2️⃣ │ 3️⃣\n`;
        text += `──┼───┼──\n`;
        text += `4️⃣ │ 5️⃣ │ 6️⃣\n`;
        text += `──┼───┼──\n`;
        text += `7️⃣ │ 8️⃣ │ 9️⃣\n\n`;
        text += `🎯 @${challenger.split("@")[0]}'s turn (❌)\n`;
        text += `Type 1-9 to place your mark!`;
        
        await sock.sendMessage(m.chat, {
            text: text,
            mentions: [challenger, opponent]
        }, { quoted: m });
    }
},

/* ================= GUESS ================= */
{
    command: "guess",
    aliases: ["guessgame", "numbergame"],
    category: "games",
    execute: async (sock, m, { reply, games }) => {
        if (!games.guess) games.guess = {};
        
        const number = Math.floor(Math.random() * 100) + 1;
        
        games.guess[m.chat] = {
            number: number,
            attempts: 0,
            maxAttempts: 7,
            active: true
        };
        
        reply(`🎲 *NUMBER GUESSING GAME*\n\nI'm thinking of a number between 1-100.\nYou have 7 attempts!\n\nType your guess (just the number).`);
    }
},

/* ================= QUIZ ================= */
{
    command: "quiz",
    aliases: ["quizgame", "trivia"],
    category: "games",
    execute: async (sock, m, { reply, games }) => {
        const questions = [
            { q: "What is the capital of France?", a: "paris" },
            { q: "What is 5 + 7?", a: "12" },
            { q: "What color is the sky on a clear day?", a: "blue" },
            { q: "How many days in a week?", a: "7" },
            { q: "What is the opposite of hot?", a: "cold" },
            { q: "What is 10 x 5?", a: "50" },
            { q: "What animal says 'meow'?", a: "cat" },
            { q: "How many hours in a day?", a: "24" }
        ];
        
        if (!games.quiz) games.quiz = {};
        
        const q = questions[Math.floor(Math.random() * questions.length)];
        
        games.quiz[m.chat] = {
            answer: q.a,
            active: true
        };
        
        reply(`📝 *QUIZ TIME!*\n\n${q.q}\n\nType your answer!`);
    }
},

/* ================= RIDDLE ================= */
{
    command: "riddle",
    aliases: ["riddles", "puzzle"],
    category: "games",
    execute: async (sock, m, { reply, games }) => {
        const riddles = [
            { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", a: "echo" },
            { q: "What has keys but no locks, space but no room, and you can enter but not go in?", a: "keyboard" },
            { q: "What gets wetter as it dries?", a: "towel" },
            { q: "What has a head, a tail, is brown, and has no legs?", a: "penny" },
            { q: "What has an eye but cannot see?", a: "needle" },
            { q: "What has hands but can't clap?", a: "clock" },
            { q: "What has a neck but no head?", a: "bottle" },
            { q: "What comes down but never goes up?", a: "rain" }
        ];
        
        if (!games.riddle) games.riddle = {};
        
        const r = riddles[Math.floor(Math.random() * riddles.length)];
        
        games.riddle[m.chat] = {
            answer: r.a,
            active: true
        };
        
        reply(`🤔 *RIDDLE ME THIS!*\n\n${r.q}\n\nType your answer!`);
    }
},

/* ================= REMOVEBG ================= */
{
    command: "removebg",
    aliases: ["rbg", "nobg"],
    category: "tools",
    execute: async (sock, m, { args, reply }) => {
        if (!args[0]) {
            return reply("⚠️ *Remove.bg Instructions*\n\n1. Get free API key at: https://www.remove.bg/api\n2. Use: .removebg YOUR_API_KEY (reply to image)");
        }
        
        if (!m.quoted) return reply("❌ Reply to an image!");
        
        const mime = m.quoted.mtype || "";
        if (!mime.includes("image")) return reply("❌ Reply to an image!");
        
        reply("⏳ Removing background...\n⚠️ This feature requires API key setup.");
    }
}

];