// © 2026 Alpha - ALL IN ONE DOWNLOADER 🔥

const yts = require('yt-search');
const axios = require('axios');

module.exports = [

/* ==================== 🎵 PLAY ==================== */
{
command: 'play',
category: 'downloader',

execute: async (sock, m, { args, reply, send, config }) => {
try {
if (!args[0]) return reply("🎧 Use: .play song name");

const text = args.join(" ");

// 🎶 reaction
await sock.sendMessage(m.chat, { react: { text: "🎶", key: m.key } });

const search = await yts(text);
if (!search.videos.length) {
await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
return reply("❌ No results");
}

const vid = search.videos[0];

await sock.sendMessage(m.chat, { react: { text: "⬇️", key: m.key } });

let data = null;

// API 1
try {
const r = await axios.get(`https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(vid.url)}`);
if (r.data?.status) {
data = { title: r.data.title, thumbnail: r.data.thumbnail, audio: r.data.audio };
}
} catch {}

// API 2
if (!data) {
try {
const r = await axios.get(`https://api.douxx.tech/api/youtube/audio?url=${encodeURIComponent(vid.url)}`);
if (r.data?.result) {
data = { title: r.data.result.title, thumbnail: r.data.result.thumbnail, audio: r.data.result.download };
}
} catch {}
}

// API 3
if (!data) {
try {
const r = await axios.get(`https://api.lolhuman.xyz/api/ytaudio?apikey=GataDios&url=${encodeURIComponent(vid.url)}`);
if (r.data?.result) {
data = { title: r.data.result.title, thumbnail: r.data.result.thumbnail, audio: r.data.result.link };
}
} catch {}
}

if (!data) {
await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
return reply("⚠️ Servers failed");
}

await send({
image: { url: data.thumbnail || vid.thumbnail },
caption: `🎵 *${data.title || vid.title}*\n⬇️ Downloading...\n\n👑 ${config.settings.title}`
});

await sock.sendMessage(m.chat, {
audio: { url: data.audio },
mimetype: "audio/mpeg"
}, { quoted: m });

await sock.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

} catch (e) {
console.log(e);
reply("❌ Play failed");
}
}
},

/* ==================== 🎧 YTMP3 ==================== */
{
command: 'ytmp3',
category: 'downloader',

execute: async (sock, m, { args, reply }) => {
try {
if (!args[0]) return reply("❌ Give link");

const url = args[0];

await sock.sendMessage(m.chat, { react: { text: "⬇️", key: m.key } });

const dl = `https://api.douxx.tech/api/youtube/audio?url=${encodeURIComponent(url)}`;

const res = await axios.get(dl);

await sock.sendMessage(m.chat, {
audio: { url: res.data.result.download },
mimetype: "audio/mpeg"
}, { quoted: m });

await sock.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

} catch {
reply("❌ Failed");
}
}
},

/* ==================== 🎬 YTMP4 ==================== */
{
command: 'ytmp4',
category: 'downloader',

execute: async (sock, m, { args, reply }) => {
try {
if (!args[0]) return reply("❌ Give link");

await sock.sendMessage(m.chat, { react: { text: "⬇️", key: m.key } });

const res = await axios.get(`https://api.douxx.tech/api/youtube/video?url=${encodeURIComponent(args[0])}`);

await sock.sendMessage(m.chat, {
video: { url: res.data.result.download },
caption: "🎬 Downloading video..."
}, { quoted: m });

await sock.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

} catch {
reply("❌ Failed");
}
}
},

/* ==================== 🎵 TIKTOK ==================== */
{
command: 'tiktok',
category: 'downloader',

execute: async (sock, m, { args, reply }) => {
try {
if (!args[0]) return reply("❌ Give TikTok link");

await sock.sendMessage(m.chat, { react: { text: "⬇️", key: m.key } });

const res = await axios.get(`https://api.douxx.tech/api/tiktok?url=${encodeURIComponent(args[0])}`);

await sock.sendMessage(m.chat, {
video: { url: res.data.result.nowm },
caption: "🎵 TikTok Download"
}, { quoted: m });

await sock.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

} catch {
reply("❌ Failed");
}
}
},

/* ==================== 📸 INSTAGRAM ==================== */
{
command: 'ig',
category: 'downloader',

execute: async (sock, m, { args, reply }) => {
try {
if (!args[0]) return reply("❌ Give IG link");

await sock.sendMessage(m.chat, { react: { text: "⬇️", key: m.key } });

const res = await axios.get(`https://api.douxx.tech/api/igdl?url=${encodeURIComponent(args[0])}`);

await sock.sendMessage(m.chat, {
video: { url: res.data.result[0].url },
caption: "📸 Instagram Download"
}, { quoted: m });

await sock.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

} catch {
reply("❌ Failed");
}
}
},

/* ==================== 📘 FACEBOOK ==================== */
{
command: 'fb',
category: 'downloader',

execute: async (sock, m, { args, reply }) => {
try {
if (!args[0]) return reply("❌ Give FB link");

await sock.sendMessage(m.chat, { react: { text: "⬇️", key: m.key } });

const res = await axios.get(`https://api.douxx.tech/api/facebook?url=${encodeURIComponent(args[0])}`);

await sock.sendMessage(m.chat, {
video: { url: res.data.result.hd },
caption: "📘 Facebook Download"
}, { quoted: m });

await sock.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

} catch {
reply("❌ Failed");
}
}
}

];