// © 2026 Alpha - TOOLS (WORKING 🔥)

const QRCode = require("qrcode");
const gtts = require("gtts");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = [

/* ================= CALC ================= */
{
command: "calc",
category: "tools",

execute: async (sock, m, { args, reply }) => {
try {
if (!args[0]) return reply("❌ Use: .calc 2+2");

const result = eval(args.join(" "));
reply(`🧮 Result: ${result}`);

} catch {
reply("❌ Invalid calculation");
}
}
},

/* ================= QR ================= */
{
command: "qr",
category: "tools",

execute: async (sock, m, { args, reply }) => {
try {
if (!args[0]) return reply("❌ Use: .qr text");

const url = await QRCode.toDataURL(args.join(" "));
await sock.sendMessage(m.chat, {
image: { url },
caption: "📌 QR Code"
}, { quoted: m });

} catch {
reply("❌ QR failed");
}
}
},

/* ================= TTS ================= */
{
command: "tts",
category: "tools",

execute: async (sock, m, { args, reply }) => {
try {
if (!args[0]) return reply("❌ Use: .tts hello");

const text = args.join(" ");
const file = "./tts.mp3";

const speech = new gtts(text, "en");
speech.save(file, async () => {

await sock.sendMessage(m.chat, {
audio: fs.readFileSync(file),
mimetype: "audio/mpeg",
ptt: true
}, { quoted: m });

fs.unlinkSync(file);
});

} catch {
reply("❌ TTS failed");
}
}
},

/* ================= TIME ================= */
{
command: "time",
category: "tools",

execute: async (sock, m, { reply }) => {
const now = new Date();

reply(`🕒 Time: ${now.toLocaleTimeString()}\n📅 Date: ${now.toLocaleDateString()}`);
}
},

/* ================= STICKER ================= */
{
command: "sticker",
category: "tools",

execute: async (sock, m, { reply }) => {
try {
if (!m.quoted) return reply("❌ Reply to image");

const msg = m.quoted;
const mime = msg.mimetype || "";

if (!mime.includes("image")) return reply("❌ Reply to image");

const buffer = await msg.download();

await sock.sendMessage(m.chat, {
sticker: buffer
}, { quoted: m });

} catch {
reply("❌ Sticker failed");
}
}
},

/* ================= TOIMG ================= */
{
command: "toimg",
category: "tools",

execute: async (sock, m, { reply }) => {
try {
if (!m.quoted) return reply("❌ Reply to sticker");

const buffer = await m.quoted.download();

await sock.sendMessage(m.chat, {
image: buffer
}, { quoted: m });

} catch {
reply("❌ Convert failed");
}
}
},

/* ================= TOMP3 ================= */
{
command: "tomp3",
category: "tools",

execute: async (sock, m, { reply }) => {
try {
if (!m.quoted) return reply("❌ Reply to video");

const input = "./input.mp4";
const output = "./output.mp3";

const buffer = await m.quoted.download();
fs.writeFileSync(input, buffer);

ffmpeg(input)
.toFormat("mp3")
.on("end", async () => {

await sock.sendMessage(m.chat, {
audio: fs.readFileSync(output),
mimetype: "audio/mpeg"
}, { quoted: m });

fs.unlinkSync(input);
fs.unlinkSync(output);

})
.run();

} catch {
reply("❌ Conversion failed");
}
}
}

];