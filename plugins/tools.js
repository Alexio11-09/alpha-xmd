const fs = require('fs'), path = require('path'), axios = require('axios'), QR = require('qrcode'),
  { downloadContentFromMessage: dl } = require('@whiskeysockets/baileys'),
  moment = require('moment-timezone'), ffmpeg = require('fluent-ffmpeg'),
  { writeExif } = require('../library/exif');

// ======================================================
// HELPERS
// ======================================================

// delete a temp file right away (it used to linger for 5 minutes and fill storage)
const cl = f => { try { fs.unlinkSync(f) } catch {} };

// read a download stream into one Buffer (faster and lighter than Buffer.concat in a loop)
const rd = async st => { const a = []; for await (const c of st) a.push(c); return Buffer.concat(a) };

// view-once helpers
const kindOf = t => t.includes('image') ? 'image' : t.includes('video') ? 'video' : 'audio';

// try the direct download first; if that fails, try Baileys' own downloader (it can ask the phone to re-upload expired media)
async function vvFetch(q, t, c) {
  try { return await rd(await dl(c, kindOf(t))); }
  catch (e1) {
    try { return await q.download(); } catch (e2) { throw e1; }
  }
}

const vvError = e => /40[34]|410|gone|not found|expired/i.test(String(e.message))
  ? "❌ WhatsApp no longer has that media (it was already opened on this account, or it expired)."
  : "❌ Failed: " + String(e.message).slice(0, 120);

const up = async (b, f = 'img.png') => {
  const fd = new (require('form-data'))();
  fd.append('reqtype', 'fileupload');
  fd.append('fileToUpload', b, { filename: f, contentType: 'image/png' });
  const r = await axios.post('https://catbox.moe/user/api.php', fd, { headers: { ...fd.getHeaders(), 'User-Agent': 'AlphaBot/1.0' }, timeout: 15e3 });
  if (typeof r.data === 'string' && r.data.startsWith('http')) return r.data;
  throw new Error(r.data);
};

const A = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const F = ["𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙", "𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧", "𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛", "𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃", "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫", "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷", "𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟", "𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇", "𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻", "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ", "🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉"];

// The fancy letters are outside the basic character range, so split them
// into whole characters first (the old code cut them in half and printed garbage).
function ct(t, m) {
  const g = Array.from(m);
  let r = '';
  for (const c of t) {
    const i = A.indexOf(c);
    r += i < 0 ? c : (g[i] ?? g[i % 26] ?? c);
  }
  return r;
}

// Work out who a command is aimed at: mention > replied message > number > chat/sender
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

// Where to send "private" results: the person who ran the command
async function resolveDest(s, m) {
  let dest = m.key.participantAlt || (!m.isGroup && m.key.remoteJidAlt) || m.key.participant || m.participant || m.sender;
  dest = dest.toString().split(':')[0];
  if (!dest.includes('@')) dest += '@s.whatsapp.net';

  if (dest.endsWith('@lid') && m.isGroup) {
    try {
      const mt = await s.groupMetadata(m.chat);
      const p = mt.participants.find(x => x.id === dest || x.lid === dest || (x.jid && x.jid.split('@')[0] === dest.split('@')[0]));
      if (p) {
        if (p.phoneNumber) dest = p.phoneNumber.includes('@') ? p.phoneNumber : p.phoneNumber + '@s.whatsapp.net';
        else if (p.jid && !p.jid.endsWith('@lid')) dest = p.jid;
        else if (p.id && !p.id.endsWith('@lid')) dest = p.id;
      }
    } catch (e) {}
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
// (.lyrics and .img now live in the downloader plugin)
// ======================================================
module.exports = [

{ command: "calc", category: "tools", execute: (s, m, { args, reply }) => {
  if (!args[0]) return reply("❌ .calc 2+2");
  try { reply("✅ " + eval(args.join("").replace(/[^0-9+\-*/()%. ]/g, ""))) } catch { reply("❌ Failed") }
} },

{ command: "qr", category: "tools", execute: async (s, m, { args, reply }) => {
  if (!args[0]) return reply("❌ .qr text");
  try {
    const b = await QR.toBuffer(args.join(" "), { type: 'png' });
    await s.sendMessage(m.chat, { image: b, caption: "✅ QR ready" }, { quoted: m });
  } catch (e) { console.log('[QR]', e.message); reply("❌ Failed"); }
} },

{ command: "tts", category: "tools", execute: (s, m, { args, reply }) => {
  if (!args[0]) return reply("❌ .tts text");
  s.sendMessage(m.chat, { audio: { url: `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(args.join(" "))}&tl=en&client=tw-ob` }, mimetype: "audio/mpeg", ptt: true }, { quoted: m }).catch(e => { console.log('[TTS]', e.message); reply("❌ Failed"); });
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
  } catch (e) { console.log('[STICKER]', e.message); reply("❌ Failed"); }
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
  } catch (e) { console.log('[TOIMG]', e.message); reply("❌ Failed"); }
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

{ command: "getpp2", category: "tools", execute: async (s, m, { args }) => {
  const t = await resolveTarget(s, m, args);
  if (!t) return;
  try {
    const u = await getPpUrl(s, t);
    const dest = await resolveDest(s, m);
    await s.sendMessage(dest, { image: { url: u }, caption: `📸 @${t.split('@')[0]}`, mentions: [t] }, { quoted: m });
    await s.sendMessage(m.chat, { react: { text: "👀", key: m.key } });
  } catch (e) { console.log("GetPP2 Err:", e.message); }
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
  // Use the REMOVEBG_KEY environment variable if set, otherwise the key typed after the command
  const key = process.env.REMOVEBG_KEY || args[0];
  if (!key) return reply("❌ .removebg <remove.bg API key>  (reply to an image)");
  const q = m.quoted;
  if (!(q.mtype || '').includes('image')) return reply("❌ Image only");
  try {
    const b = await q.download();
    const fd = new (require('form-data'))();
    fd.append('image_file', b, 'img.jpg');
    fd.append('size', 'auto');
    const r = await axios.post('https://api.remove.bg/v1.0/removebg', fd, { headers: { 'X-Api-Key': key, ...fd.getHeaders() }, responseType: 'arraybuffer', timeout: 6e4 });
    await s.sendMessage(m.chat, { image: Buffer.from(r.data), caption: "✅ No bg" }, { quoted: m });
  } catch (e) { console.log('[REMOVEBG]', e.message); reply("❌ Failed (check your remove.bg API key)"); }
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
  } catch (e) { console.log('[TOMP3]', e.message); reply("❌ Failed"); }
  finally { cl(v); cl(a); }
} },

{ command: "vv", category: "tools", execute: async (s, m, { reply }) => {
  const q = m.quoted;
  if (!q) return reply("❌ Reply view-once");
  const t = q.mtype, c = q.message?.[t];
  if (!c) return reply("❌ I can't read that message");
  if (!(c.viewOnce || q.viewOnce)) return reply("❌ Not view-once");
  try {
    const b = await vvFetch(q, t, c);
    if (t.includes('image')) await s.sendMessage(m.chat, { image: b, caption: "✅ Unlocked" }, { quoted: m });
    else if (t.includes('video')) await s.sendMessage(m.chat, { video: b, caption: "✅ Unlocked" }, { quoted: m });
    else { await s.sendMessage(m.chat, { audio: b, mimetype: "audio/mpeg", ptt: true }, { quoted: m }); reply("✅ Voice saved"); }
  } catch (e) { console.log('[VV]', e.message); reply(vvError(e)); }
} },

{ command: "vv2", category: "tools", execute: async (s, m) => {
  const q = m.quoted;
  if (!q) return;
  const t = q.mtype, c = q.message?.[t];
  if (!c || !(c.viewOnce || q.viewOnce)) return;
  try {
    const b = await vvFetch(q, t, c);
    const dest = await resolveDest(s, m);
    if (t.includes('image')) await s.sendMessage(dest, { image: b, caption: "🔓 VV2 Unlocked" }, { quoted: m });
    else if (t.includes('video')) await s.sendMessage(dest, { video: b, caption: "🔓 VV2 Unlocked" }, { quoted: m });
    else await s.sendMessage(dest, { audio: b, mimetype: "audio/mpeg", ptt: true }, { quoted: m });
    await s.sendMessage(m.chat, { react: { text: "👀", key: m.key } });
  } catch (e) { console.log("[VV2]", e.message); }
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
  } catch (e) { console.log('[BLUR]', e.message); reply("❌ Failed") }
} },

{ command: "attp", category: "tools", execute: async (s, m, { args, reply }) => {
  if (!args[0]) return reply("❌ .attp text");
  try {
    const r = await axios.get(`https://api.lolhuman.xyz/api/attp?apikey=GataDios&text=${encodeURIComponent(args.join(" "))}`, { responseType: 'arraybuffer', timeout: 3e4 });
    await s.sendMessage(m.chat, { sticker: Buffer.from(r.data) }, { quoted: m });
  } catch (e) { console.log('[ATTP]', e.message); reply("❌ This service is unavailable right now") }
} },

{ command: "ttp", category: "tools", execute: async (s, m, { args, reply }) => {
  if (!args[0]) return reply("❌ .ttp text");
  try {
    const r = await axios.get(`https://api.popcat.xyz/ttp?text=${encodeURIComponent(args.join(" "))}`, { responseType: 'arraybuffer', timeout: 3e4 });
    await s.sendMessage(m.chat, { image: Buffer.from(r.data), caption: "✅ TTP" }, { quoted: m });
  } catch (e) { console.log('[TTP]', e.message); reply("❌ This service is unavailable right now") }
} },

{ command: "ss", category: "tools", execute: async (s, m, { args, reply }) => {
  if (!args[0]) return reply("❌ .ss url");
  try {
    const r = await axios.get(`https://api.popcat.xyz/screenshot?url=${encodeURIComponent(args[0])}`, { responseType: 'arraybuffer', timeout: 3e4 });
    await s.sendMessage(m.chat, { image: Buffer.from(r.data), caption: "✅ Screenshot" }, { quoted: m });
  } catch (e) { console.log('[SS]', e.message); reply("❌ This service is unavailable right now") }
} },

{ command: "stickertelegram", category: "tools", execute: async (s, m, { args, reply }) => {
  if (!args[0]) return reply("❌ .stickertelegram url");
  try {
    const r = await axios.get(`https://api.davidcyriltech.my.id/download/telesticker?url=${encodeURIComponent(args[0])}`, { responseType: 'arraybuffer', timeout: 3e4 });
    await s.sendMessage(m.chat, { sticker: Buffer.from(r.data) }, { quoted: m });
  } catch (e) { console.log('[TELESTICKER]', e.message); reply("❌ This service is unavailable right now") }
} },

{ command: "imgscan", category: "tools", execute: async (s, m, { reply }) => {
  const q = m.quoted;
  if (!q?.message || q.mtype !== 'imageMessage') return reply("❌ Reply image");
  try {
    const b = await rd(await dl(q.message.imageMessage, 'image'));
    const url = await up(b, 'scan.jpg');
    const r = await axios.get(`https://api.popcat.xyz/ocr?image=${encodeURIComponent(url)}`, { timeout: 3e4 });
    reply(r.data?.text ? `📝 ${r.data.text}` : "❌ No text");
  } catch (e) { console.log('[IMGSCAN]', e.message); reply("❌ Failed") }
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
  } catch (e) { console.log('[TOVIDEO]', e.message); reply("❌ Failed") }
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
  } catch (e) { console.log('[TOPDF]', e.message); reply("❌ Failed") }
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
  } catch (e) { console.log('[SMEME]', e.message); reply("❌ Failed") }
} },

{ command: "wasted", category: "tools", execute: async (s, m, { reply }) => {
  const q = m.quoted;
  if (!q?.message || q.mtype !== 'imageMessage') return reply("❌ Reply image");
  try {
    const b = await rd(await dl(q.message.imageMessage, 'image'));
    const url = await up(b, 'wasted.jpg');
    const r = await axios.get(`https://api.popcat.xyz/wasted?image=${encodeURIComponent(url)}`, { responseType: 'arraybuffer', timeout: 3e4 });
    await s.sendMessage(m.chat, { image: Buffer.from(r.data), caption: "💀 WASTED" }, { quoted: m });
  } catch (e) { console.log('[WASTED]', e.message); reply("❌ Failed") }
} },

{ command: "font", category: "tools", execute: async (s, m, { args, reply }) => {
  if (!args[0]) return reply("❌ .font <text>");
  let t = args.join(" "), r = `🔤 *Font Styles for "${t}"*\n\n`;
  F.forEach((x, i) => { r += `${i + 1}. ${ct(t, x)}\n` });
  reply(r.substring(0, 4000));
} }

];
