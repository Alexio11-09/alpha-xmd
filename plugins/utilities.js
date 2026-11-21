const axios = require('axios'), os = require('os'), crypto = require('crypto');

module.exports = [

{ command: "tinyurl", category: "utilities", execute: async (s, m, { args, reply }) => {
  if (!args[0]) return reply("❌ .tinyurl <url>");
  try {
    let r = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(args[0])}`, { timeout: 15e3 });
    reply(`✅ ${r.data}`);
  } catch { reply("❌ Failed") }
} },

{ command: "fliptext", category: "utilities", execute: async (s, m, { args, reply }) => {
  if (!args[0]) return reply("❌ .fliptext <text>");
  reply(Array.from(args.join(" ")).reverse().join(''));
} },

// Length is limited (4-64). The old version let anyone ask for a huge password,
// which used up all the memory and crashed the whole bot.
{ command: "genpass", category: "utilities", execute: async (s, m, { args, reply }) => {
  const len = Math.min(Math.max(parseInt(args[0]) || 12, 4), 64);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$";
  reply([...Array(len)].map(() => chars[crypto.randomInt(chars.length)]).join(''));
} },

{ command: "device", category: "utilities", execute: async (s, m, { reply }) => {
  reply(`💻 Platform: ${os.platform()}\n🖥️ Host: ${os.hostname()}\n🔧 Node: ${process.version}\n📦 RAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
} },

// Limited page size, and addresses that point at the server itself or the local network are blocked
{ command: "browse", category: "utilities", execute: async (s, m, { args, reply }) => {
  if (!args[0]) return reply("❌ .browse <url>");
  try {
    const u = new URL(args[0].startsWith('http') ? args[0] : 'https://' + args[0]);
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[?::1)/i.test(u.hostname)) return reply("❌ Not allowed");
    let r = await axios.get(u.href, { timeout: 8e3, responseType: 'text', maxContentLength: 2e5, maxBodyLength: 2e5, transformResponse: x => x });
    reply(`🌐 *Source (first 1000 chars):*\n\`\`\`\n${String(r.data).substring(0, 1000)}\n\`\`\``);
  } catch { reply("❌ Failed") }
} },

{ command: "fancy", aliases: ["styletext"], category: "utilities", execute: async (s, m, { args, reply }) => {
  if (!args[0]) return reply("❌ .fancy <text>");
  try {
    let r = await axios.get(`https://api.popcat.xyz/fancy?text=${encodeURIComponent(args.join(" "))}`, { timeout: 15e3 });
    reply("🎀 *Fancy text:*\n" + r.data.fancy);
  } catch { reply("❌ Failed") }
} },

{ command: "carbon", category: "utilities", execute: async (s, m, { args, reply }) => {
  if (!args[0]) return reply("❌ .carbon <code>");
  let url = `https://carbonnowsh.herokuapp.com/?code=${encodeURIComponent(args.join(" "))}&theme=one-dark&language=auto`;
  try {
    await s.sendMessage(m.chat, { image: { url }, caption: "✅ Code capture" }, { quoted: m });
  } catch (e) { console.log('[CARBON]', e.message); reply("❌ The code-image service is unavailable right now") }
} },

{ command: "obfuscate", category: "utilities", execute: async (s, m, { args, reply }) => {
  if (!args[0]) return reply("❌ .obfuscate <code>");
  reply(`🔒 \`${Buffer.from(args.join(" ")).toString('base64')}\``);
} },

{ command: "tozip", category: "utilities", execute: async (s, m, { args, reply }) => {
  if (!args[0]) return reply("❌ .tozip <url>");
  try {
    let r = await axios.get(`https://api.popcat.xyz/zip?url=${encodeURIComponent(args[0])}`, { responseType: 'arraybuffer', timeout: 3e4, maxContentLength: 2e7 });
    await s.sendMessage(m.chat, { document: Buffer.from(r.data), fileName: 'file.zip', mimetype: 'application/zip' }, { quoted: m });
  } catch { reply("❌ Failed") }
} },

{ command: "readmore", category: "utilities", execute: async (s, m, { args, reply }) => {
  if (!args[0]) return reply("❌ .readmore <text>");
  let t = args.join(" ");
  reply(t.substring(0, 100) + (t.length > 100 ? '... read more' : ''));
} },

{ command: "ngldm", category: "utilities", execute: async (s, m, { args, reply }) => {
  if (!args[0]) return reply("❌ .ngldm <username>");
  reply(`🎮 NGLdm not yet implemented. Use .fancy or .carbon instead.`);
} }

];
