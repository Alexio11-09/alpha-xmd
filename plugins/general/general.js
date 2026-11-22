// © 2026 Alpha - GENERAL COMMANDS (FULL SYNCHRONIZED MENU + INTERACTIVE LIST)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { parsePhoneNumber } = require('awesome-phonenumber');
const config = require("../../settings/config");

const R = (arr) => arr[Math.floor(Math.random() * arr.length)];
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

function runtime(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

// ======================================================
// MENU IMAGE: download/read once, then reuse the Buffer
// ======================================================
let menuImg = null;

async function getMenuImg() {
    if (menuImg) return menuImg;

    const src = config.thumbUrl;
    let buf;

    if (/^https?:\/\//i.test(src)) {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`Menu image HTTP ${res.status}`);
        buf = Buffer.from(await res.arrayBuffer());
    } else {
        buf = fs.readFileSync(src);
    }

    if (buf.length < 300 * 1024) menuImg = buf;
    return buf;
}

// ======================================================
// COUNTRY DETECTION
// ======================================================
const getCountry = async (m, sock) => {
    try {
        let jid = m.key?.participantAlt || m.key?.remoteJidAlt || m.sender;
        let num = jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');

        if ((jid.includes('@lid') || num.length < 9) && m.isGroup) {
            const md = await sock.groupMetadata(m.chat);
            const p = md.participants.find(x => x.id === m.sender || x.lid === m.sender);
            const real = p?.phoneNumber || (p?.jid && !p.jid.includes('@lid') ? p.jid : '');
            if (real) num = real.split('@')[0].replace(/[^0-9]/g, '');
        }

        if (num.length < 9) return "Unknown 🌍";

        const pn = parsePhoneNumber('+' + num);
        if (!pn.valid || !pn.regionCode) return "Unknown 🌍";

        const flag = pn.regionCode.replace(/./g, c =>
            String.fromCodePoint(c.charCodeAt(0) + 127397)
        );

        return `${regionNames.of(pn.regionCode)} ${flag}`;
    } catch (e) {
        return "Unknown 🌍";
    }
};

const SECTIONS = [
  { title: '📊 GENERAL', cat: ['general', 'main'], cmds: ['menu', 'ping', 'alive', 'info', 'owner', 'repo', 'pair'] },
  { title: '👑 OWNER', cat: ['owner'], cmds: ['update', 'restart', 'shutdown', 'eval', 'bc', 'join', 'leave', 'block', 'unblock', 'blocklist', 'pm', 'addowner', 'delowner', 'owners', 'getchannel', 'anticall', 'poststatus', 'cleartmp', 'clearsession', 'sudo', 'clear', 'tostatus', 'toviewonce', 'autobio', 'channel', 'disk', 'deljunk'] },
  { title: '👥 GROUP', cat: ['group'], cmds: ['tagall', 'kick', 'add', 'promote', 'demote', 'mute', 'unmute', 'hidetag', 'groupinfo', 'grouplink', 'getlink', 'revokelink', 'welcome on/off', 'goodbye on/off', 'antilink', 'antidemote', 'antisticker', 'antitag', 'antiforeign', 'antibot', 'antigroupmention', 'antistatusgroupmention', 'poll', 'listadmin', 'tagadmin', 'vcf', 'promoteall', 'demoteall', 'kickinactive', 'approveall', 'approve', 'disapproveall', 'invite', 'gcstatus', 'getname', 'getdeskgc', 'getppgc', 'setppgc', 'listactive', 'listinactive', 'totalmembers', 'addcode', 'delcode', 'listcode', 'removes', 'mediatag', 'ban', 'unban', 'banlist'] },
  { title: '⚙️ SETTINGS', cat: ['setting'], cmds: ['mode', 'autoread', 'autotyping', 'autorecording', 'autoreact', 'autostatus', 'antiblock', 'ghost', 'antiedit', 'antidelete', 'autoreply', 'autosticker', 'autovoice', 'dmblocker', 'antispam', 'chatbot', 'autosavestatus', 'lastseen', 'ppprivacy', 'readreceipts'] },
  { title: '📥 DOWNLOADER', cat: ['download'], cmds: ['play', 'video', 'tiktok', 'instagram', 'facebook', 'pindl', 'spotify', 'mediafire', 'gitclone', 'apk', 'ringtone', 'wallpaper', 'img', 'shazam', 'yts', 'ytpost', 'gdrive', 'movie'] },
  { title: '🔧 TOOLS', cat: ['tool'], cmds: ['calc', 'qr', 'tts', 'time', 'sticker', 'toimg', 'getpp', 'getpp2', 'setpp', 'getid', 'translate', 'weather', 'lyrics', 'removebg', 'tomp3', 'vv', 'vv2', 'url', 'take', 'steal', 'blur', 'attp', 'ttp', 'ss', 'stickertelegram', 'imgscan', 'tovideo', 'toptt', 'topdf', 'smeme', 'wasted', 'font', 'webzip', 'botip', 'debugid'] },
  { title: '🛠️ UTILITIES', cat: ['utilit'], cmds: ['save', 'delete', 'hack', 'tinyurl', 'fliptext', 'genpass', 'device', 'browse', 'fancy', 'carbon', 'obfuscate', 'tozip', 'readmore', 'ngldm'] },
  { title: '🤖 AI & IMAGE GEN', cat: ['ai', 'imagegen'], cmds: ['gpt', 'gemini', 'blackbox', 'deepseek', 'copilot', 'claude', 'perplexity', 'venice', 'dalle', 'flux', 'imagine', 'animagine', 'dreamshaper', 'pony', 'pixar', 'cartoon', 'seedream', 'toghibili'] },
  { title: '🔍 SEARCH', cat: ['search'], cmds: ['gsmarena', 'google', 'bing', 'livewallpapers', 'imdb', 'define', 'wiki'] },
  { title: '🌐 INFORMATION', cat: ['info'], cmds: ['news', 'countryinfo', 'check', 'bible', 'quran', 'inspect', 'webcrawl'] },
  { title: '🎨 PHOTO EFFECTS', cat: ['photo', 'effect', 'imageedit'], cmds: ['zombie', 'figure', 'underground', 'oldage', 'turky', 'train', 'streetwear', 'tatoo', 'satan', 'sdm', 'spirit', 'toroblox', 'mirror', 'partner', 'bf', 'gf', 'polaroid', 'punk', 'piramid', 'peci', 'island', 'mangu', 'liquor', 'mecca', 'mayan', 'maid', 'glasses', 'cambodia', 'japan', 'hijab', 'hitam', 'tupai', 'vintage'] },
  { title: '🎨 LOGO & TEXT MAKERS', cat: ['logo', 'textmaker', 'maker'], cmds: ['hacker', 'neon', 'fire', 'gold', 'logo', 'glitch', 'avenger', 'pubg', 'naruto', 'matrix', 'graffiti', '1000d', '3d', 'rainbow', 'metallic', 'ice', 'snow', 'purple', 'thunder', 'water', 'underwater', '4d', 'luxury', 'silver', 'foggyglass', 'wetglass', 'candy', 'christmas', '3dchristmas', 'sparklechristmas', 'deepsea', 'scifi', 'waterpipe', 'spooky', 'pencil', 'circuit', 'discovery', 'fiction', 'transformer', 'berry', 'magma', '3dstone', 'neonlight', 'harrypotter', 'brokenglass', 'papercut', 'watercolor', 'multicolor', 'neondevil', 'graffitibike', 'cloud', 'honey', 'fruitjuice', 'biscuit', 'wood', 'chocolate', 'strawberry', 'blood', 'dropwater', 'toxic', 'lava', 'rock', 'bloodglass', 'halloween', 'darkgold', 'joker', 'wicker', 'firework', 'skeleton', 'sand', 'glue', '1917', 'leaves'] },
  { title: '🎵 AUDIO EFFECTS', cat: ['audio'], cmds: ['deep', 'smooth', 'fat', 'blown', 'radio', 'robot', 'chipmunk', 'nightcore', 'earrape', 'bass', 'reverse', 'slow', 'fast', 'baby', 'demon'] },
  { title: '😂 EMOJI ANIMATIONS', cat: ['emoji'], cmds: ['happy', 'heart', 'angry', 'sad', 'shy', 'moon', 'confused', 'hot', 'nikal'] },
  { title: '🎮 GAMES & FUN', cat: ['game', 'fun'], cmds: ['tictactoe', 'hangman', 'guess', 'quiz', 'trivia', 'answer', 'truth', 'dare', '8ball', 'compliment', 'insult', 'flirt', 'shayari', 'simp', 'stupid', 'goodnight', 'meme', 'squidgame', 'konami', 'lovetest', 'aura', 'dice', 'roll', 'joke', 'quote', 'fact', 'flip', 'rps', 'ship', 'hug', 'emojimix', 'wcg'] },
  { title: '🎌 ANIME & REACTIONS', cat: ['anime', 'reaction'], cmds: ['waifu', 'neko', 'shinobu', 'megumin', 'aizen', 'animequote', 'anime', 'manga', 'topanime', 'topmanga', 'character', 'randomanime', 'seasonal', 'hentai 🔞', 'hentaigif 🔞', 'nom', 'poke', 'cry', 'kiss', 'pat', 'wink', 'facepalm', 'slap', 'bite'] },
  { title: '🎬 MOVIES / SERIES', cat: ['movie', 'series'], cmds: ['selectmovie', 'dlmovie', 'dlseries', 'selectseries', 'seriesinfo'] },
  { title: '⚽ FOOTBALL', cat: ['football', 'soccer', 'sport'], cmds: ['livescore', 'competitions', 'matches', 'standings', 'team', 'head2head', 'matchlist', 'teamperson', 'teammatches', 'areas'] },
  { title: '👁️ STALK', cat: ['stalk'], cmds: ['npmstalk', 'wastalk', 'igstalk', 'tiktokstalk', 'twitterstalk', 'ytstalk', 'tgstalk', 'minecraftstalk', 'xboxstalk', 'steamstalk', 'githubstalk'] },
  { title: '🐙 GITHUB', cat: ['github'], cmds: ['ghlogin', 'ghtoken', 'ghcreate', 'ghdelete', 'ghpush', 'ghpushall', 'ghcommit', 'ghfork', 'ghlist', 'ghbranches', 'ghdeletefile', 'ghcreatebranch', 'ghlogout'] },
  { title: '📺 CHANNEL', cat: ['channel'], cmds: ['createchannel', 'followchannel', 'unfollowchannel', 'updatechannelname', 'updatechannelpic', 'updatechanneldesc', 'mutechannel', 'unmutechannel', 'deletechannel'] },
  { title: '💰 FINANCE', cat: ['finance', 'money', 'currency', 'crypto'], cmds: ['currencylist', 'rates', 'exchange', 'forex'] },
  { title: '📧 TEMP MAIL / NUMBER', cat: ['temp', 'mail'], cmds: ['tempmail', 'tempinbox', 'tempnumber', 'checksms', 'listcountries'] },
  { title: '🖥️ CPANEL', cat: ['cpanel', 'panel', 'hosting'], cmds: ['addserver', 'delserver', 'listservers', 'sendpanel', '1gb…9gb', 'unli', 'admin', 'addprem', 'delprem', 'premiumlist', 'bothosting'] }
];

function getRegistry() {
  try {
    const list = require('../../message').commands;
    if (!Array.isArray(list) || !list.length) return null;
    const names = new Set();
    for (const c of list) {
      names.add(String(c.command).toLowerCase());
      for (const a of c.aliases || []) names.add(String(a).toLowerCase());
    }
    return { list, names };
  } catch {
    return null;
  }
}

const baseName = entry => entry.split(/[\s…]/)[0].toLowerCase();

function expandRange(entry) {
  const r = /^(\d+)([a-z]+)…(\d+)([a-z]+)$/i.exec(entry);
  if (!r || r[2].toLowerCase() !== r[4].toLowerCase()) return null;
  const from = +r[1], to = +r[3];
  if (to < from || to - from > 50) return null;
  return Array.from({ length: to - from + 1 }, (_, i) => `${from + i}${r[2].toLowerCase()}`);
}

const box = (title, items) =>
  `╭───〔 ${title} 〕───⬣\n${items.map(i => `│ • .${i}`).join('\n')}\n╰────────────⬣`;

function sectionByCategory(category) {
  const c = String(category || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!c) return null;
  return SECTIONS.find(sec => (sec.cat || []).some(k => c.startsWith(k))) || null;
}

function buildSections() {
  const reg = getRegistry();
  const shown = new Set();
  const listed = new Set();
  const out = [];

  for (const sec of SECTIONS) {
    for (const e of sec.cmds) {
      for (const n of (expandRange(e) || [baseName(e)])) listed.add(n);
    }
  }

  const auto = new Map();
  const extra = [];

  if (reg) {
    for (const c of reg.list) {
      if (c.hidden) continue;
      const all = [String(c.command).toLowerCase(), ...(c.aliases || []).map(a => String(a).toLowerCase())];
      if (all.some(n => listed.has(n))) continue;

      const sec = sectionByCategory(c.category);
      if (sec) {
        if (!auto.has(sec.title)) auto.set(sec.title, []);
        auto.get(sec.title).push(c.command);
      } else if (!extra.includes(c.command)) {
        extra.push(c.command);
      }
    }
  }

  for (const sec of SECTIONS) {
    const items = [];
    for (const entry of sec.cmds) {
      const range = expandRange(entry);
      if (range) {
        const have = range.filter(n => !shown.has(n) && (!reg || reg.names.has(n)));
        if (!have.length) continue;
        have.forEach(n => shown.add(n));
        items.push(have.length > 1 ? `${have[0]}…${have[have.length - 1]}` : have[0]);
        continue;
      }
      const base = baseName(entry);
      if (shown.has(base)) continue;
      if (reg && !reg.names.has(base)) continue;
      shown.add(base);
      items.push(entry);
    }

    for (const name of auto.get(sec.title) || []) {
      if (!shown.has(name.toLowerCase())) { shown.add(name.toLowerCase()); items.push(name); }
    }

    if (items.length) out.push(box(sec.title, items));
  }

  if (extra.length) out.push(box('🆕 MORE COMMANDS', extra));
  return out.join('\n\n');
}

module.exports = [
    {
        command: "menu",
        aliases: ["help", "commands"],
        category: "general",
        execute: async (sock, m, { args, prefix = ".", send, reply }) => {
            try {
                const requestedCat = args[0]?.toUpperCase();

                // If user typed ".menu GENERAL" or clicked a category
                if (requestedCat) {
                    const foundSec = SECTIONS.find(s => s.title.toUpperCase().includes(requestedCat) || s.cat.includes(requestedCat.toLowerCase()));
                    if (foundSec) {
                        let sectionText = `╭───〔 ${foundSec.title} 〕───⬣\n`;
                        for (const c of foundSec.cmds) {
                            sectionText += `│ • .${c}\n`;
                        }
                        sectionText += `╰────────────⬣`;
                        return reply(sectionText);
                    }
                }

                // Try sending WhatsApp Native Interactive List
                try {
                    const rows = SECTIONS.map(s => ({
                        title: s.title,
                        rowId: `${prefix}menu ${s.title.replace(/^[^\w\s]+\s*/, '').trim()}`,
                        description: `View ${s.title} commands (${s.cmds.length})`
                    }));

                    const buttonMessage = {
                        text: `Hello *${m.pushName || "User"}*,\nSelect a command category below to explore Alpha-XMD.`,
                        footer: `Prefix: ${prefix} | Alpha-XMD Bot`,
                        title: `⚡ ${config.settings.title} ⚡`,
                        buttonText: "📑 Open Categories",
                        sections: [
                            {
                                title: "Command Modules",
                                rows: rows
                            }
                        ]
                    };

                    await sock.sendMessage(m.chat, buttonMessage, { quoted: m });
                    return;

                } catch (interactiveErr) {
                    console.log("Interactive list error, falling back to text:", interactiveErr.message);
                }

                // Fallback Classic Text Menu
                const now = new Date();
                const time = now.toLocaleTimeString();
                const date = now.toLocaleDateString();
                const pushname = m.pushName || "User";
                const uptime = runtime(process.uptime());
                const country = await getCountry(m, sock);

                const menu = `
╭───〔 ${config.settings.title} 〕───⬣

👤 *User:* ${pushname}
🌍 *Country:* ${country}
🕒 *Time:* ${time}
📅 *Date:* ${date}
⚡ *Uptime:* ${uptime}

╰────────────⬣

${buildSections()}

${config.settings.footer}
`;

                let image = null;
                try { image = await getMenuImg(); } catch (e) {}

                if (image) {
                    await send({ image, caption: menu });
                } else {
                    await send({ text: menu });
                }

            } catch (err) {
                console.log("Menu error:", err);
                await sock.sendMessage(m.chat, { text: "❌ Menu failed to load" }, { quoted: m });
            }
        }
    },

    {
        command: "ping",
        aliases: ["p"],
        category: "general",
        execute: async (sock, m, { reply }) => {
            const latency = m.messageTimestamp ? (Date.now() - (m.messageTimestamp * 1000)) : '??';
            const pings = [
                `🏓 Pong! ${latency}ms — faster than your WiFi on a good day.`,
                `⚡ ${latency}ms — I'm basically speed.`,
                `📡 ${latency}ms — the connection is so good I can hear you thinking.`,
                `🛰️ ${latency}ms — signal came from Mars, apparently.`,
                `🤖 ${latency}ms — beep boop, I'm alive!`
            ];
            reply(R(pings));
        }
    },

    {
        command: "alive",
        aliases: ["online", "test"],
        category: "general",
        execute: async (sock, m, { reply }) => {
            const uptime = runtime(process.uptime());
            const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            const ping = m.messageTimestamp ? (Date.now() - (m.messageTimestamp * 1000)) : '??';

            const quotes = [
                `✅ I'm alive and kicking! ⏳ Uptime: ${uptime} | 🧠 RAM: ${memory}MB | 📡 Ping: ${ping}ms`,
                `🟢 Reporting for duty! Uptime: ${uptime} | Ping: ${ping}ms | RAM: ${memory}MB`,
                `💪 Still breathing, human. Uptime: ${uptime} | Ping: ${ping}ms`,
                `🤖 Beep boop… I'm online! Uptime: ${uptime} | Memory: ${memory}MB`,
                `🏃‍♂️ Running like a champ. Uptime: ${uptime} | Ping: ${ping}ms`
            ];
            reply(R(quotes));
        }
    },

    {
        command: "info",
        aliases: ["botinfo", "status"],
        category: "general",
        execute: async (sock, m, { reply }) => {
            const uptime = runtime(process.uptime());
            const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            const platform = os.platform();
            const hostname = os.hostname();
            const nodeVersion = process.version;
            const botName = config.settings?.title || 'Alpha Bot';
            const owner = config.owner?.[0] || 'Unknown';
            const ownerJid = owner.includes('@') ? owner : owner + '@s.whatsapp.net';

            const infos = [
                `📊 *${botName} Info*\n\n⏳ Uptime: ${uptime}\n🧠 Memory: ${memory} MB\n💻 Platform: ${platform}\n🖥️ Host: ${hostname}\n🔧 Node.js: ${nodeVersion}\n👑 Owner: @${owner}`,
                `🤖 *Bot Status*\n\n🟢 Status: Online\n⏱️ Running: ${uptime}\n📡 Ping: Fast\n🧠 RAM: ${memory}MB\n👤 Owner: @${owner}`,
                `📋 *Technical Info*\n\n⚡ Uptime: ${uptime}\n💾 Memory: ${memory}MB\n🖥️ OS: ${platform}\n🔢 Node: ${nodeVersion}\n👑 @${owner}`
            ];
            reply(R(infos), { mentions: [ownerJid] });
        }
    },

    {
        command: "owner",
        aliases: ["creator", "dev"],
        category: "general",
        execute: async (sock, m, { reply }) => {
            const ownerNumber = config.owner?.[0] || 'Unknown';
            const ownerName = config.settings?.title?.split(' ')[0] || 'Alpha';
            const ownerJid = ownerNumber.includes('@') ? ownerNumber : ownerNumber + '@s.whatsapp.net';

            const messages = [
                `👑 *Owner:* @${ownerNumber}\n👤 *Name:* ${ownerName}\n\n💬 DM anytime.`,
                `🤴 *The Boss*\n📞 @${ownerNumber}\n👤 ${ownerName}\n\nMessage for business/support.`,
                `🫅 *Contact*\n👤 ${ownerName}\n📱 @${ownerNumber}\n\nDMs open.`,
                `👤 *Bot Creator*\n${ownerName}\n📞 @${ownerNumber}\n\nReach out anytime.`
            ];
            reply(R(messages), { mentions: [ownerJid] });
        }
    },

    {
        command: "repo",
        aliases: ["source", "github", "sc"],
        category: "general",
        execute: async (sock, m, { reply }) => {
            const repoLink = "https://github.com/Alexio11-09/alpha-xmd";
            const ownerName = "Alpha";
            const ownerContact = "wa.me/263784969735";
            const botName = config.settings?.title || "Alpha Bot";

            const texts = [
                `📂 *${botName} – Source Code*\n\n🔗 *Repo:* ${repoLink}\n👤 *Owner:* ${ownerName}\n📞 *Contact:* ${ownerContact}\n\n⭐ Star & fork freely!`,
                `🧬 *Open Source Bot*\n\n💻 *Repo:* ${repoLink}\n👑 *Dev:* ${ownerName}\n📱 *WhatsApp:* ${ownerContact}\n\n🤖 Build your own version.`,
                `⚡ *Alpha XMD Repository*\n\n🔗 ${repoLink}\n👤 *Maintainer:* ${ownerName}\n📞 ${ownerContact}\n\n📥 Clone, modify, deploy.`
            ];
            reply(texts[Math.floor(Math.random() * texts.length)]);
        }
    },

    {
        command: "pair",
        aliases: ["pairing", "session"],
        category: "general",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a phone number with country code!\n\n📌 Example: .pair 263784969735");
            const rawNumber = args[0].replace(/[^0-9]/g, "");
            if (!/^\d{10,15}$/.test(rawNumber)) return reply("❌ Invalid phone number. Use 10–15 digits with country code.");
            if (typeof global.pairAccount !== "function") {
                return reply("❌ Pairing service is not ready. Please try again shortly.");
            }

            await reply(`🔐 Requesting a WhatsApp pairing code for +${rawNumber}... Please wait.`);
            try {
                await global.pairAccount(rawNumber, {
                    onCode: async formatted => reply(
                        `✅ *Pairing Code Ready*\n\n📞 *Number:* +${rawNumber}\n🔢 *Code:* *${formatted}*\n\n⏱️ The code expires shortly.\n📱 Open WhatsApp → Linked devices → Link with phone number → Enter this code.`
                    ),
                    onConnected: async () => reply(
                        `🎉 *Successfully connected +${rawNumber}!*\n\nYour Alpha XMD account is starting now.`
                    ),
                    onError: async err => reply(`❌ Pairing failed: ${err.message || String(err)}`)
                });
            } catch (err) {
                return reply(`❌ ${err.message || String(err)}`);
            }
        }
    }
];
