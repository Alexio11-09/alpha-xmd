// © 2026 Alpha - TOOLS (FINAL STABLE 💯🔥)

const QRCode = require("qrcode");
const axios = require("axios");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

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

const text = encodeURIComponent(args.join(" "));
const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${text}&tl=en&client=tw-ob`;

await sock.sendMessage(m.chat, {
audio: { url },
mimetype: "audio/mpeg",
ptt: true
}, { quoted: m });

} catch (e) {
console.log(e);
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

if (!m.quoted) return reply("❌ Reply to image or short video");

const mime = m.quoted.mtype || "";
const input = "./sticker_input";
const output = "./sticker.webp";

const packname = "Alpha XMD 🔥";
const author = "Alpha";

// ===== IMAGE =====
if (mime.includes("image")) {

const stream = await downloadContentFromMessage(m.quoted.msg, "image");

let buffer = Buffer.from([]);
for await (const chunk of stream) {
buffer = Buffer.concat([buffer, chunk]);
}

fs.writeFileSync(input + ".jpg", buffer);

await new Promise((resolve) => {
ffmpeg(input + ".jpg")
.outputOptions([
"-vcodec","libwebp",
"-vf","scale=512:512:force_original_aspect_ratio=decrease",
"-lossless","1",
"-qscale","75",
"-preset","default",
"-loop","0",
"-an",
"-vsync","0"
])
.save(output)
.on("end", resolve);
});

await sock.sendMessage(m.chat, {
sticker: fs.readFileSync(output),
packname,
author
}, { quoted: m });

fs.unlinkSync(input + ".jpg");
fs.unlinkSync(output);

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

await new Promise((resolve) => {
ffmpeg(input + ".mp4")
.outputOptions([
"-vcodec","libwebp",
"-vf","scale=512:512:force_original_aspect_ratio=decrease,fps=15",
"-loop","0",
"-ss","00:00:00",
"-t","00:00:07",
"-preset","default",
"-an",
"-vsync","0"
])
.save(output)
.on("end", resolve);
});

await sock.sendMessage(m.chat, {
sticker: fs.readFileSync(output),
packname,
author
}, { quoted: m });

fs.unlinkSync(input + ".mp4");
fs.unlinkSync(output);

}

else {
return reply("❌ Reply to image or video");
}

} catch (e) {
console.log("Sticker Error:", e);
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

if (!m.quoted) return reply("❌ Reply to a sticker");

const mime = m.quoted.mtype || "";
if (!mime.includes("sticker")) return reply("❌ Reply to a sticker");

const stream = await downloadContentFromMessage(m.quoted.msg, "sticker");

let buffer = Buffer.from([]);
for await (const chunk of stream) {
buffer = Buffer.concat([buffer, chunk]);
}

await sock.sendMessage(m.chat, {
image: buffer
}, { quoted: m });

} catch (e) {
console.log("ToImg Error:", e);
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

if (!m.quoted) return reply("❌ Reply to a video");

const mime = m.quoted.mtype || "";
if (!mime.includes("video")) return reply("❌ Reply to a video");

const stream = await downloadContentFromMessage(m.quoted.msg, "video");

let buffer = Buffer.from([]);
for await (const chunk of stream) {
buffer = Buffer.concat([buffer, chunk]);
}

const input = "./input.mp4";
const output = "./output.mp3";

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

} catch (e) {
console.log("MP3 Error:", e);
reply("❌ Conversion failed");
}
}
}

];