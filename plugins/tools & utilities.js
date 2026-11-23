const fs = require('fs'), path = require('path'), axios = require('axios'), os = require('os'), crypto = require('crypto');
const QR = require('qrcode');
const { downloadContentFromMessage: dl } = require('@whiskeysockets/baileys');
const moment = require('moment-timezone');
const ffmpeg = require('fluent-ffmpeg');
const { writeExif } = require('../library/exif');
const FormData = require('form-data');

// ======================================================
// HELPERS
// ======================================================
const cl = f => { try { fs.unlinkSync(f) } catch {} };
const rd = async st => { const a = []; for await (const c of st) a.push(c); return Buffer.concat(a) };

// 🎯 NEW: Robust View Once Unwrapper
function getViewOnceMedia(m) {
  if (!m.quoted || !m.quoted.message) return null;
  
  let quotedMsg = m.quoted.message;
  let type = m.quoted.mtype;
  let media = quotedMsg[type];

  if (!media) return null;

  // Unwrap View Once wrappers
  if (type === 'viewOnceMessageV2' || type === 'viewOnceMessage' || type === 'viewOnceMessageV2Extension') {
    media = media.message;
    type = Object.keys(media)[0];
    media = media[type];
  }

  if (!type || (!type.includes('image') && !type.includes('video') && !type.includes('audio') && !type.includes('voice'))) {
    return null;
  }

  return { type, media };
}

// 🎯 NEW: Bulletproof fetcher that uses Baileys' native downloader first
async function vvFetch(s, q, mediaObj, type) {
  // 1. Try native Baileys downloader (handles view once, re-uploads, etc.)
  if (q && q.download) {
    try {
      const buf = await q.download();
      if (buf && buf.length > 0) return buf;
    } catch (e) {
      console.log('[VV NATIVE DOWNLOAD FAILED]', e.message);
    }
  }

  // 2. Fallback to manual download
  const mtype = type.includes('image') ? 'image' : type.includes('video') ? 'video' : 'audio';
  try {
    return await rd(await dl(mediaObj, mtype)); 
  } catch (e) {
    console.log('[VV MANUAL DOWNLOAD FAILED]', e.message);
    throw e;
  }
}

const vvError = e => /40[34]|410|gone|not found|expired/i.test(String(e.message))
  ? "❌ WhatsApp no longer has that media (expired or already opened)."
  : "❌ Failed: " + String(e.message).slice(0, 120);

const up = async (b, f = 'img.png') => {
  const fd = new FormData();
  fd.append('reqtype', 'fileupload');
  fd.append('fileToUpload', b, { filename: f, contentType: 'image/png' });
  const r = await axios.post('https://catbox.moe/user/api.php', fd, { headers: { ...fd.getHeaders(), 'User-Agent': 'AlphaBot/1.0' }, timeout: 15000 });
  if (typeof r.data === 'string' && r.data.startsWith('http')) return r.data;
  throw new Error(r.data);
};

const A = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const F = ["𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙", "𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧", "𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛", "𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃", "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫", "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷", "𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟", "𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇", "𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻", "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ", "🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉"];

function ct(t, m) {
  const g = Array.from(m);
  let r = '';
  for (const c of t) {
    const i = A.indexOf(c);
    r += i < 0 ? c : (g[i] ?? g[i % 26] ?? c);
  }
  return r;
}

async function resolveTarget(s, m, args) {
  let t = m.mentionedJid && m.mentionedJid.length > 0 ? m.mentionedJid[0]
    : (m.quoted && m.quoted.sender ? m.quoted.sender
      : (args && args[0] ? (args[0].replace(/[^0-9]/g, '').length > 5 ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)
        : (!m.isGroup ? m.chat : m.sender)));
  if (!t) return null;

  t = t.toString().split(':')[0];
  if (!t.includes('@')) t += '@s.whatsapp.net';

  if (t.endsWith('@lid') && m.isGroup) {
    try {
      const mt = await s.groupMetadata(m.chat);
      const p = mt.participants.find(x => x.id === t || x.lid === t || x.jid === t || (x.id && x.id.split('@')[0] === t.split('@')[0]) || (x.lid && x.lid.split('@')[0] === t.split('@')[0]));
      if (p) {
        if (p.jid && !p.jid.endsWith('@lid')) t = p.jid;
        else if (p.phoneNumber) t = p.phoneNumber.includes('@') ? p.phoneNumber : p.phoneNumber + '@s.whatsapp.net';
        else if (p.id && !p.id.endsWith('@lid')) t = p.id;
      }
    } catch (e) {}

    if (t.endsWith('@lid')) {
      const fb = t.split('@')[0] + '@s.whatsapp.net';
      try { await s.profilePictureUrl(fb, 'image'); t = fb; } catch (e) {}
    }
  }
  return t;
}

async function resolveDest(s, m) {
  let dest = m.key.participantAlt || m.key.remoteJidAlt || m.sender;
  dest = dest.toString().split(':')[0];
  if (!dest.includes('@')) dest += '@s.whatsapp.net';

  if (dest.endsWith('@lid')) {
    const resolved = await resolveTarget(s, m, []);
    if (resolved) dest = resolved;
  }
  return dest;
}

const getPpUrl = (s, t) => Promise.race([
  s.profilePictureUrl(t, 'image'),
  new Promise((_, rj) => setTimeout(() => rj(new Error('Timeout')), 7000))
]);

const ffconv = (input, output, opts = []) => new Promise((res, rej) => ffmpeg(input).output(output).outputOptions(opts).on('end', res).on('error', rej).run());

// ======================================================
// COMMANDS
// ======================================================
module.exports = [
  { command: "save", category: "utility", execute: async (s, m, { reply }) => {
    if (!m.quoted) return reply("❌ Reply to a message to save.");
    const savedMsg = m.quoted.text || (m.quoted.message?.conversation) || (m.quoted.message?.extendedTextMessage?.text) || "[Media]";
    if (!global._savedMessages) global._savedMessages = [];
    global._savedMessages.push(savedMsg);
    reply(`✅ Saved! You have ${global._savedMessages.length} saved messages.`);
  } },
  { command: "delete", aliases: ["del"], category: "utility", execute: async (s, m, { reply }) => {
    if (!m.quoted) return reply("❌ Reply to a message to delete.");
    if (!m.isBotAdmin && !m.isAdmin) return reply("❌ I need admin powers.");
    try { await s.sendMessage(m.chat, { delete: m.quoted.key }); reply("🗑️ Deleted."); } catch { reply("❌ Failed to delete."); }
  } },
  { command: "hack", category: "utility", execute: async (s, m, { args, reply }) => {
    const target = args[0] || "NASA";
    reply(`👨‍💻 *Hacking ${target}...*\n[▓▓▓▓░░░░] 20%`);
    setTimeout(() => reply(`[▓▓▓▓▓▓▓▓░░] 50%`), 1000);
    setTimeout(() => reply(`[▓▓▓▓▓▓▓▓▓▓▓▓] 90%`), 2000);
    setTimeout(() => reply(`✅ Successfully hacked ${target}!\n\nJust kidding 😂`), 3000);
  } },
  { command: "antispam", category: "utility", owner: true, execute: async (s, m, { args, reply }) => {
    const action = args[0]?.toLowerCase();
    if (action === 'on') { global._antispam = true; reply("🛡️ Anti‑spam enabled."); }
    else if (action === 'off') { global._antispam = false; reply("❌ Anti‑spam disabled."); }
    else { reply(`🛡️ Anti‑spam: ${global._antispam ? 'ON' : 'OFF'}\nUsage: .antispam on/off`); }
  } },
  { command: "autosticker", category: "utility", owner: true, execute: async (s, m, { args, reply }) => {
    const action = args[0]?.toLowerCase();
    if (action === 'on') { global._autosticker = true; reply("🖼️ Auto‑sticker enabled."); }
    else if (action === 'off') { global._autosticker = false; reply("❌ Auto‑sticker disabled."); }
    else { reply(`🖼️ Auto‑sticker: ${global._autosticker ? 'ON' : 'OFF'}\nUsage: .autosticker on/off`); }
  } },
  { command: "autovoice", category: "utility", owner: true, execute: async (s, m, { args, reply }) => {
    const action = args[0]?.toLowerCase();
    if (action === 'on') { global._autovoice = true; reply("🎤 Auto‑voice enabled."); }
    else if (action === 'off') { global._autovoice = false; reply("❌ Auto‑voice disabled."); }
    else { reply(`🎤 Auto‑voice: ${global._autovoice ? 'ON' : 'OFF'}\nUsage: .autovoice on/off`); }
  } },
  { command: "tinyurl", category: "utilities", execute: async (s, m, { args, reply }) => {
    if (!args[0]) return reply("❌ .tinyurl <url>");
    try { let r = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(args[0])}`, { timeout: 15e3 }); reply(`✅ ${r.data}`); } catch { reply("❌ Failed") }
  } },
  { command: "fliptext", category: "utilities", execute: async (s, m, { args, reply }) => {
    if (!args[0]) return reply("❌ .fliptext <text>");
    reply(Array.from(args.join(" ")).reverse().join(''));
  } },
  { command: "genpass", category: "utilities", execute: async (s, m, { args, reply }) => {
    const len = Math.min(Math.max(parseInt(args[0]) || 12, 4), 64);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$";
    reply([...Array(len)].map(() => chars[crypto.randomInt(chars.length)]).join(''));
  } },
  { command: "device", category: "utilities", execute: async (s, m, { reply }) => {
    reply(`💻 Platform: ${os.platform()}\n🖥️ Host: ${os.hostname()}\n🔧 Node: ${process.version}\n📦 RAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
  } },
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
    try { let r = await axios.get(`https://api.popcat.xyz/fancy?text=${encodeURIComponent(args.join(" "))}`, { timeout: 15e3 }); reply("🎀 *Fancy text:*\n" + r.data.fancy); } catch { reply("❌ Failed") }
  } },
  { command: "carbon", category: "utilities", execute: async (s, m, { args, reply }) => {
    if (!args[0]) return reply("❌ .carbon <code>");
    let url = `https://carbonnowsh.herokuapp.com/?code=${encodeURIComponent(args.join(" "))}&theme=one-dark&language=auto`;
    try { await s.sendMessage(m.chat, { image: { url }, caption: "✅ Code capture" }, { quoted: m }); } catch (e) { reply("❌ The code-image service is unavailable right now") }
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
  } },
  { command: "calc", category: "tools", execute: (s, m, { args, reply }) => {
    if (!args[0]) return reply("❌ .calc 2+2");
    try { reply("✅ " + eval(args.join("").replace(/[^0-9+\-*/()%. ]/g, ""))) } catch { reply("❌ Failed") }
  } },
  { command: "qr", category: "tools", execute: async (s, m, { args, reply }) => {
    if (!args[0]) return reply("❌ .qr text");
    try { const b = await QR.toBuffer(args.join(" "), { type: 'png' }); await s.sendMessage(m.chat, { image: b, caption: "✅ QR ready" }, { quoted: m }); } catch (e) { reply("❌ Failed"); }
  } },
  { command: "tts", category: "tools", execute: (s, m, { args, reply }) => {
    if (!args[0]) return reply("❌ .tts text");
    s.sendMessage(m.chat, { audio: { url: `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(args.join(" "))}&tl=en&client=tw-ob` }, mimetype: "audio/mpeg", ptt: true }, { quoted: m }).catch(e => { reply("❌ Failed"); });
  } },
  { command: "time", category: "tools", execute: (s, m, { reply }) => {
    const n = moment();
    reply(`🕐 ${n.format("dddd, MMMM Do YYYY")}\n⏰ ${n.format("hh:mm:ss A")}\n🌍 SA: ${moment().tz("Africa/Johannesburg").format("hh:mm A")}`);
  } },
  { command: "sticker", category: "tools", execute: async (s, m, { reply }) => {
    const q = m.quoted;
    if (!q?.message) return reply("❌ Reply image/video");
    const t = q.mtype;
    if (t !== 'imageMessage' && t !== 'videoMessage') return reply("❌ Image/video only");
    try {
      const st = await dl(q.message[t], t === 'imageMessage' ? 'image' : 'video');
      const b = await rd(st);
      const sb = await writeExif({ data: b, mimetype: t === 'imageMessage' ? 'image/jpeg' : 'video/mp4' }, { packname: 'Alpha', author: 'Sticker', categories: ['🤖'] });
      await s.sendMessage(m.chat, { sticker: sb }, { quoted: m });
    } catch (e) { reply("❌ Failed"); }
  } },
  { command: "toimg", category: "tools", execute: async (s, m, { reply }) => {
    const q = m.quoted;
    if (!q?.message || q.mtype !== 'stickerMessage') return reply("❌ Reply sticker");
    fs.mkdirSync('tmp', { recursive: true });
    const w = `tmp/st_${Date.now()}.webp`, p = `tmp/o_${Date.now()}.png`;
    try {
      const st = await dl(q.message.stickerMessage, 'image');
      fs.writeFileSync(w, await rd(st));
      await ffconv(w, p, ['-vframes 1']);
      if (fs.existsSync(p)) await s.sendMessage(m.chat, { image: fs.readFileSync(p), caption: "✅ Done" }, { quoted: m });
    } catch (e) { reply("❌ Failed"); }
    finally { cl(w); cl(p); }
  } },
  { command: "getpp", category: "tools", execute: async (s, m, { args, reply }) => {
    const t = await resolveTarget(s, m, args);
    if (!t) return reply("❌ Invalid target");
    try {
      const u = await getPpUrl(s, t);
      await s.sendMessage(m.chat, { image: { url: u }, caption: `📸 @${t.split('@')[0]}`, mentions: [t] }, { quoted: m });
    } catch (e) { try { await reply(`❌ No PP or hidden for @${t.split('@')[0]}`) } catch (e2) {} }
  } },
  { command: "setpp", aliases: ["setdp"], category: "tools", owner: true, execute: async (s, m, { reply }) => {
    const q = m.quoted;
    if (!q?.message || q.mtype !== 'imageMessage') return reply("❌ Reply to an image to set as bot profile picture.");
    try {
      const st = await dl(q.message.imageMessage, 'image');
      await s.updateProfilePicture(s.user.id, await rd(st));
      reply("✅ Profile Picture updated successfully!");
    } catch (e) { reply("❌ Failed to update PP: " + e.message); }
  } },
  { command: "setppgc", aliases: ["setgpp"], category: "tools", group: true, admin: true, execute: async (s, m, { reply }) => {
    const q = m.quoted;
    if (!q?.message || q.mtype !== 'imageMessage') return reply("❌ Reply to an image to set as group profile picture.");
    try {
      const st = await dl(q.message.imageMessage, 'image');
      await s.updateProfilePicture(m.chat, await rd(st));
      reply("✅ Group Profile Picture updated successfully!");
    } catch (e) { reply("❌ Failed to update Group PP: " + e.message); }
  } },
  { command: "getpp2", category: "tools", execute: async (s, m, { args, reply }) => {
    const t = await resolveTarget(s, m, args);
    if (!t) return;
    try {
      const u = await getPpUrl(s, t);
      const dest = await resolveDest(s, m);
      await s.sendMessage(dest, { image: { url: u }, caption: `📸 @${t.split('@')[0]}`, mentions: [t] }, { quoted: m });
      await s.sendMessage(m.chat, { react: { text: "👀", key: m.key } });
    } catch (e) {
      console.log("getpp2 error:", e.message);
      reply("❌ Failed to send privately. Make sure I can DM you!");
    }
  } },
  { command: "getid", category: "tools", execute: (s, m, { reply }) => {
    const t = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;
    reply(`🆔 ${t.split('@')[0]}`);
  } },
  { command: "getlink", category: "tools", group: true, admin: true, execute: async (s, m, { reply }) => {
    try { const c = await s.groupInviteCode(m.chat); reply(`🔗 https://chat.whatsapp.com/${c}`) } catch { reply("❌ Need admin") }
  } },
  { command: "translate", category: "tools", execute: async (s, m, { args, reply }) => {
    if (!args[0]) return reply("❌ .translate en Hello");
    const l = args[0].toLowerCase(), t = args.slice(1).join(" ");
    if (!t) return reply("❌ Text?");
    const r = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${l}&dt=t&q=${encodeURIComponent(t)}`);
    reply(`🌐 ${l}: ${r.data[0][0][0]}`);
  } },
  { command: "weather", category: "tools", execute: async (s, m, { args, reply }) => {
    if (!args[0]) return reply("❌ .weather Harare");
    const r = await axios.get(`https://wttr.in/${encodeURIComponent(args.join(" "))}?format=%C+%t+%w+%h`);
    reply(`🌤️ ${args.join(" ")}: ${r.data}`);
  } },
  { command: "removebg", category: "tools", execute: async (s, m, { args, reply }) => {
    if (!m.quoted) return reply("❌ Reply image");
    const key = process.env.REMOVEBG_KEY || args[0];
    if (!key) return reply("❌ .removebg <remove.bg API key>  (reply to an image)");
    const q = m.quoted;
    if (!(q.mtype || '').includes('image')) return reply("❌ Image only");
    try {
      const b = await q.download();
      const fd = new FormData();
      fd.append('image_file', b, 'img.jpg');
      fd.append('size', 'auto');
      const r = await axios.post('https://api.remove.bg/v1.0/removebg', fd, { headers: { 'X-Api-Key': key, ...fd.getHeaders() }, responseType: 'arraybuffer', timeout: 6e4 });
      await s.sendMessage(m.chat, { image: Buffer.from(r.data), caption: "✅ No bg" }, { quoted: m });
    } catch (e) { reply("❌ Failed (check your remove.bg API key)"); }
  } },
  { command: "tomp3", category: "tools", execute: async (s, m, { reply }) => {
    const q = m.quoted;
    if (!q || !(q.mtype || '').includes('video')) return reply("❌ Reply video");
    fs.mkdirSync('tmp', { recursive: true });
    const v = `tmp/v_${Date.now()}.mp4`, a = `tmp/a_${Date.now()}.mp3`;
    try {
      fs.writeFileSync(v, await q.download());
      await new Promise((res, rej) => ffmpeg(v).output(a).audioCodec('libmp3lame').audioBitrate('128k').format('mp3').on('end', res).on('error', rej).run());
      if (fs.existsSync(a)) await s.sendMessage(m.chat, { audio: { url: a }, mimetype: "audio/mpeg", ptt: false }, { quoted: m });
    } catch (e) { reply("❌ Failed"); }
    finally { cl(v); cl(a); }
  } },
  
  // 🎯 FIXED VV COMMAND
  { command: "vv", category: "tools", execute: async (s, m, { reply }) => {
    const vvData = getViewOnceMedia(m);
    if (!vvData) return reply("❌ Reply to a View Once image, video, or audio.");
    const { type, media } = vvData;

    try {
      const b = await vvFetch(s, m.quoted, media, type);
      if (type.includes('image')) await s.sendMessage(m.chat, { image: b, caption: "✅ Unlocked" }, { quoted: m });
      else if (type.includes('video')) await s.sendMessage(m.chat, { video: b, caption: "✅ Unlocked" }, { quoted: m });
      else { await s.sendMessage(m.chat, { audio: b, mimetype: "audio/mpeg", ptt: true }, { quoted: m }); reply("✅ Voice saved"); }
    } catch (e) { reply(vvError(e)); }
  } },

  // 🎯 FIXED VV2 COMMAND
  { command: "vv2", category: "tools", execute: async (s, m, { reply }) => {
    const vvData = getViewOnceMedia(m);
    if (!vvData) return;
    const { type, media } = vvData;

    try {
      const b = await vvFetch(s, m.quoted, media, type);
      const dest = await resolveDest(s, m);
      if (type.includes('image')) await s.sendMessage(dest, { image: b, caption: "🔓 VV2 Unlocked" }, { quoted: m });
      else if (type.includes('video')) await s.sendMessage(dest, { video: b, caption: "🔓 VV2 Unlocked" }, { quoted: m });
      else await s.sendMessage(dest, { audio: b, mimetype: "audio/mpeg", ptt: true }, { quoted: m });
      await s.sendMessage(m.chat, { react: { text: "👀", key: m.key } });
    } catch (e) {
      console.log("vv2 error:", e.message);
      reply("❌ Failed to send privately.");
    }
  } },
  { command: "url", category: "tools", execute: async (s, m, { reply }) => {
    const q = m.quoted;
    if (!q?.message) return reply("❌ Reply media");
    const t = q.mtype;
    if (!['imageMessage', 'stickerMessage'].includes(t)) return reply("❌ Image/sticker");
    let buf;
    if (t === 'imageMessage') {
      buf = await rd(await dl(q.message.imageMessage, 'image'));
    } else {
      fs.mkdirSync('tmp', { recursive: true });
      const w = `tmp/u_${Date.now()}.webp`, p = `tmp/u_${Date.now()}.png`;
      try {
        fs.writeFileSync(w, await rd(await dl(q.message.stickerMessage, 'image')));
        await ffconv(w, p, ['-vframes 1']);
        buf = fs.readFileSync(p);
      } finally { cl(w); cl(p); }
    }
    try { const u = await up(buf, t === 'imageMessage' ? 'img.jpg' : 'sticker.png'); reply(`🔗 ${u}`) } catch { reply("❌ Failed") }
  } },
  { command: "take", category: "tools", owner: true, execute: async (s, m, { args, reply }) => {
    let t;
    if (m.mentionedJid?.[0]) t = m.mentionedJid[0];
    else if (m.quoted?.sender) t = m.quoted.sender;
    else if (args[0]) t = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    else return reply("❌ Mention/number");
    const st = global.statusCache?.get(t);
    if (!st) return reply("❌ No cached status");
    const type = Object.keys(st.message)[0];
    if (!['imageMessage', 'videoMessage', 'audioMessage'].includes(type)) return reply("❌ Not media");
    const c = st.message[type];
    const b = await rd(await dl(c, type === 'imageMessage' ? 'image' : type === 'videoMessage' ? 'video' : 'audio'));
    if (type === 'imageMessage') await s.sendMessage(m.chat, { image: b, caption: `📸 @${t.split('@')[0]}`, mentions: [t] }, { quoted: m });
    else if (type === 'videoMessage') await s.sendMessage(m.chat, { video: b, caption: `🎥 @${t.split('@')[0]}`, mentions: [t] }, { quoted: m });
    else { await s.sendMessage(m.chat, { audio: b, mimetype: 'audio/mpeg', ptt: true }, { quoted: m }); reply(`🎵 Voice from @${t.split('@')[0]}`); }
  } },
  { command: "steal", category: "tools", execute: async (s, m, { reply }) => {
    const t = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;
    try {
      const u = await s.profilePictureUrl(t, 'image');
      await s.sendMessage(m.chat, { image: { url: u }, caption: `📸 @${t.split('@')[0]}` }, { quoted: m });
    } catch { reply("❌ No PP") }
  } },
  { command: "blur", category: "tools", execute: async (s, m, { reply }) => {
    const q = m.quoted;
    if (!q?.message || q.mtype !== 'imageMessage') return reply("❌ Reply image");
    try {
      const b = await rd(await dl(q.message.imageMessage, 'image'));
      const url = await up(b, 'blur.jpg');
      const r = await axios.get(`https://api.popcat.xyz/blur?image=${encodeURIComponent(url)}`, { responseType: 'arraybuffer', timeout: 3e4 });
      await s.sendMessage(m.chat, { image: Buffer.from(r.data), caption: "✅ Blurred" }, { quoted: m });
    } catch (e) { reply("❌ Failed") }
  } },
  { command: "attp", category: "tools", execute: async (s, m, { args, reply }) => {
    if (!args[0]) return reply("❌ .attp text");
    try {
      const r = await axios.get(`https://api.lolhuman.xyz/api/attp?apikey=GataDios&text=${encodeURIComponent(args.join(" "))}`, { responseType: 'arraybuffer', timeout: 3e4 });
      await s.sendMessage(m.chat, { sticker: Buffer.from(r.data) }, { quoted: m });
    } catch (e) { reply("❌ This service is unavailable right now") }
  } },
  { command: "ttp", category: "tools", execute: async (s, m, { args, reply }) => {
    if (!args[0]) return reply("❌ .ttp text");
    try {
      const r = await axios.get(`https://api.popcat.xyz/ttp?text=${encodeURIComponent(args.join(" "))}`, { responseType: 'arraybuffer', timeout: 3e4 });
      await s.sendMessage(m.chat, { image: Buffer.from(r.data), caption: "✅ TTP" }, { quoted: m });
    } catch (e) { reply("❌ This service is unavailable right now") }
  } },
  { command: "ss", category: "tools", execute: async (s, m, { args, reply }) => {
    if (!args[0]) return reply("❌ .ss url");
    try {
      const r = await axios.get(`https://api.popcat.xyz/screenshot?url=${encodeURIComponent(args[0])}`, { responseType: 'arraybuffer', timeout: 3e4 });
      await s.sendMessage(m.chat, { image: Buffer.from(r.data), caption: "✅ Screenshot" }, { quoted: m });
    } catch (e) { reply("❌ This service is unavailable right now") }
  } },
  { command: "stickertelegram", category: "tools", execute: async (s, m, { args, reply }) => {
    if (!args[0]) return reply("❌ .stickertelegram url");
    try {
      const r = await axios.get(`https://api.davidcyriltech.my.id/download/telesticker?url=${encodeURIComponent(args[0])}`, { responseType: 'arraybuffer', timeout: 3e4 });
      await s.sendMessage(m.chat, { sticker: Buffer.from(r.data) }, { quoted: m });
    } catch (e) { reply("❌ This service is unavailable right now") }
  } },
  { command: "imgscan", category: "tools", execute: async (s, m, { reply }) => {
    const q = m.quoted;
    if (!q?.message || q.mtype !== 'imageMessage') return reply("❌ Reply image");
    try {
      const b = await rd(await dl(q.message.imageMessage, 'image'));
      const url = await up(b, 'scan.jpg');
      const r = await axios.get(`https://api.popcat.xyz/ocr?image=${encodeURIComponent(url)}`, { timeout: 3e4 });
      reply(r.data?.text ? `📝 ${r.data.text}` : "❌ No text");
    } catch (e) { reply("❌ Failed") }
  } },
  { command: "tovideo", category: "tools", execute: async (s, m, { reply }) => {
    const q = m.quoted;
    if (!q?.message || q.mtype !== 'stickerMessage') return reply("❌ Reply sticker");
    const stk = q.message.stickerMessage;
    if (!stk.isAnimated) return reply("❌ Not animated");
    fs.mkdirSync('tmp', { recursive: true });
    const i = `tmp/tv_${Date.now()}.webp`, o = `tmp/tv_${Date.now()}.mp4`;
    try {
      fs.writeFileSync(i, await rd(await dl(stk, 'image')));
      await ffconv(i, o, ['-movflags faststart', '-pix_fmt yuv420p']);
      if (fs.existsSync(o)) await s.sendMessage(m.chat, { video: { url: o }, caption: "✅ Video" }, { quoted: m });
    } catch (e) { reply("❌ Failed") }
    finally { cl(i); cl(o); }
  } },
  { command: "toptt", category: "tools", execute: async (s, m, { reply }) => {
    const q = m.quoted;
    if (!q?.message) return reply("❌ Reply audio/video");
    const t = q.mtype;
    if (!['audioMessage', 'voiceMessage', 'videoMessage'].includes(t)) return reply("❌ Audio/voice/video");
    let b = await rd(await dl(q.message[t], t === 'videoMessage' ? 'video' : 'audio'));
    if (t === 'videoMessage') {
      fs.mkdirSync('tmp', { recursive: true });
      const v = `tmp/pttv_${Date.now()}.mp4`, a = `tmp/ptta_${Date.now()}.mp3`;
      try {
        fs.writeFileSync(v, b);
        await new Promise((res, rej) => ffmpeg(v).output(a).audioCodec('libmp3lame').format('mp3').on('end', res).on('error', rej).run());
        b = fs.readFileSync(a);
      } finally { cl(v); cl(a); }
    }
    await s.sendMessage(m.chat, { audio: b, mimetype: 'audio/mpeg', ptt: true }, { quoted: m });
    reply("✅ Voice sent");
  } },
  { command: "topdf", category: "tools", execute: async (s, m, { reply }) => {
    const q = m.quoted;
    if (!q?.message || q.mtype !== 'imageMessage') return reply("❌ Reply image");
    try {
      const b = await rd(await dl(q.message.imageMessage, 'image'));
      const url = await up(b, 'pdf.jpg');
      const r = await axios.get(`https://api.popcat.xyz/imgtopdf?image=${encodeURIComponent(url)}`, { responseType: 'arraybuffer', timeout: 3e4 });
      await s.sendMessage(m.chat, { document: Buffer.from(r.data), fileName: 'doc.pdf', mimetype: 'application/pdf' }, { quoted: m });
    } catch (e) { reply("❌ Failed") }
  } },
  { command: "smeme", category: "tools", execute: async (s, m, { args, reply }) => {
    if (!args[0]) return reply("❌ .smeme top|bottom (reply img)");
    const q = m.quoted;
    if (!q?.message || q.mtype !== 'imageMessage') return reply("❌ Reply image");
    const txt = args.join(" ").split("|").map(x => x.trim());
    if (txt.length < 2) return reply("❌ Need top | bottom");
    try {
      const b = await rd(await dl(q.message.imageMessage, 'image'));
      const url = await up(b, 'meme.jpg');
      const r = await axios.get(`https://api.popcat.xyz/meme?image=${encodeURIComponent(url)}&top=${encodeURIComponent(txt[0])}&bottom=${encodeURIComponent(txt[1] || '')}`, { responseType: 'arraybuffer', timeout: 3e4 });
      await s.sendMessage(m.chat, { image: Buffer.from(r.data), caption: "✅ Meme" }, { quoted: m });
    } catch (e) { reply("❌ Failed") }
  } },
  { command: "wasted", category: "tools", execute: async (s, m, { reply }) => {
    const q = m.quoted;
    if (!q?.message || q.mtype !== 'imageMessage') return reply("❌ Reply image");
    try {
      const b = await rd(await dl(q.message.imageMessage, 'image'));
      const url = await up(b, 'wasted.jpg');
      const r = await axios.get(`https://api.popcat.xyz/wasted?image=${encodeURIComponent(url)}`, { responseType: 'arraybuffer', timeout: 3e4 });
      await s.sendMessage(m.chat, { image: Buffer.from(r.data), caption: "💀 WASTED" }, { quoted: m });
    } catch (e) { reply("❌ Failed") }
  } },
  { command: "font", category: "tools", execute: async (s, m, { args, reply }) => {
    if (!args[0]) return reply("❌ .font <text>");
    let t = args.join(" "), r = `🔤 *Font Styles for "${t}"*\n\n`;
    F.forEach((x, i) => { r += `${i + 1}. ${ct(t, x)}\n` });
    reply(r.substring(0, 4000));
  } },
  { command: 'lyrics', aliases: ['lirik'], category: 'tools', execute: async (s, m, { args, reply }) => {
    if (!args[0]) return reply('❌ Usage: .lyrics <song name>'); 
    let q = args.join(' ');
    try {
      let r = await axios.get(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`, { timeout: 15000 });
      if (r.data && r.data.length > 0) {
        let hit = r.data[0];
        let lyrics = hit.plainLyrics || hit.syncedLyrics || 'No lyrics available.';
        return reply(`🎵 *${hit.trackName}* by *${hit.artistName}*\n\n${lyrics.substring(0, 2000)}`);
      }
      const parts = q.split(/\s+-\s+/);
      if (parts.length >= 2) {
        const artist = parts[0].trim(), title = parts.slice(1).join(' - ').trim();
        let r2 = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`, { timeout: 15000 });
        if (r2.data?.lyrics) return reply(`🎵 *${artist} - ${title}*\n\n${String(r2.data.lyrics).substring(0, 2000)}`);
      }
      reply('❌ Not found. Try: .lyrics artist - song title');
    } catch (e) { reply('❌ Failed to fetch lyrics. Try again in a moment.'); }
  } }
];