// © 2026 Alpha - GENERAL COMMANDS (FULL UPDATED MENU)

const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require("../../settings/config");

const R = (arr) => arr[Math.floor(Math.random() * arr.length)];

function runtime(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

const getCountry = (jid) => {
    if (!jid) return "Unknown 🌍";
    try {
        const PhoneNumber = require('awesome-phonenumber');
        let number = jid.replace(/[^0-9]/g, '');
        const pn = PhoneNumber('+' + number);
        if (pn.getRegionCode()) {
            const country = pn.getCountry();
            const flag = pn.getRegionCode().toUpperCase().replace(/./g, char =>
                String.fromCodePoint(char.charCodeAt(0) + 127397)
            );
            return `${country} ${flag}`;
        }
        return "Unknown 🌍";
    } catch {
        return "Unknown 🌍";
    }
};

module.exports = [
    {
        command: "menu",
        aliases: ["help", "commands"],
        category: "general",
        execute: async (sock, m, { send }) => {
            try {
                const loadMsg = await sock.sendMessage(m.chat, {
                    text: "⏳ Loading 0% ███▒▒▒▒▒▒▒"
                }, { quoted: m });

                await new Promise(resolve => setTimeout(resolve, 700));
                await sock.sendMessage(m.chat, {
                    text: "⚡ Loaded 100% ████████████",
                    edit: loadMsg.key
                });

                const menuSongUrl = path.join(__dirname, "../../test-menu.mp3");

                const now = new Date();
                const time = now.toLocaleTimeString();
                const date = now.toLocaleDateString();
                const pushname = m.pushName || "User";
                const uptime = runtime(process.uptime());
                const country = getCountry((m.sender || "").replace(/[^0-9]/g, ""));

                const menu = `
╭───〔 ${config.settings.title} 〕───⬣

👤 *User:* ${pushname}
🌍 *Country:* ${country}
🕒 *Time:* ${time}
📅 *Date:* ${date}
⚡ *Uptime:* ${uptime}

╰────────────⬣

╭───〔 📊 GENERAL 〕───⬣
│ • .menu
│ • .ping
│ • .alive
│ • .info
│ • .owner
│ • .repo
│ • .pair
╰────────────⬣

╭───〔 👑 OWNER 〕───⬣
│ • .update
│ • .restart
│ • .shutdown
│ • .eval
│ • .bc
│ • .bcgc
│ • .join
│ • .leave
│ • .block
│ • .unblock
│ • .blocklist
│ • .pm
│ • .banuser
│ • .unbanuser
│ • .banlist
│ • .addowner
│ • .delowner
│ • .owners
│ • .mode
│ • .anticall
│ • .autoreply
│ • .autosticker
│ • .autovoice
│ • .dmblocker
│ • .poststatus
│ • .hack
│ • .cleartmp
│ • .clearsession
│ • .bothosting
│ • .webzip
│ • .antispam
│ • .sudo
│ • .antiblock
│ • .chatbot
│ • .clear
│ • .autobio
│ • .deljunk
│ • .disk
│ • .vv2
│ • .tostatus
│ • .toviewonce
│ • .autosavestatus
│ • .lastseen
│ • .ppprivacy
│ • .readreceipts
│ • .save
│ • .delete / .del
╰────────────⬣

╭───〔 👥 GROUP 〕───⬣
│ • .tagall
│ • .kick
│ • .add
│ • .promote
│ • .demote
│ • .mute
│ • .unmute
│ • .hidetag
│ • .groupinfo
│ • .grouplink
│ • .revokelink
│ • .welcome on/off
│ • .goodbye on/off
│ • .antilink
│ • .poll
│ • .listadmin
│ • .tagadmin
│ • .vcf
│ • .promoteall
│ • .demoteall
│ • .kickall
│ • .approveall
│ • .kickinactive
│ • .antibadword
│ • .antiforeign
│ • .antibot
│ • .setgname
│ • .setgdesc
│ • .setgpp
│ • .warn
│ • .warnings
│ • .resetwarn
│ • .tagnotadmin
│ • .requestlist
│ • .rejectall
│ • .newgc
│ • .online
│ • .staff
│ • .myactivity
│ • .rank
│ • .antidemote
│ • .antisticker
│ • .antitag
│ • .invite
│ • .listactive
│ • .listinactive
│ • .totalmembers
│ • .mediatag
│ • .getname
│ • .getdeskgc
│ • .getppgc
│ • .svcontact
│ • .opengroup
│ • .closegroup
│ • .approve
│ • .reject
│ • .disapproveall
│ • .addcode
│ • .delcode
│ • .listcode
│ • .allow
│ • .delallowed
│ • .listallowed
│ • .editsettings
│ • .removes
│ • .gcstatus
╰────────────⬣

╭───〔 📥 DOWNLOADER 〕───⬣
│ • .play
│ • .play2
│ • .song
│ • .music
│ • .video
│ • .spotify
│ • .tiktok
│ • .tt
│ • .instagram
│ • .ig
│ • .facebook
│ • .fb
│ • .ytmp4
│ • .ytmp3
│ • .ytpost
│ • .pindl
│ • .mediafire
│ • .gdrive
│ • .ringtone
│ • .yts
│ • .ytsearch
│ • .lyrics
│ • .lyrics2
│ • .apk
│ • .movie
│ • .wallpaper
│ • .gitclone
│ • .img
│ • .shazam
│ • .itunes
│ • .playdoc
│ • .videodoc
│ • .tiktokaudio
│ • .snackvideo
│ • .soundcloud
│ • .webdl
│ • .savetube
│ • .videy
│ • .aiovideodl
╰────────────⬣

╭───〔 🖥️ CPANEL 〕───⬣
│ • .addserver
│ • .delserver
│ • .listservers
│ • .sendpanel
│ • .1gb…9gb
│ • .unli
│ • .admin
│ • .addprem
│ • .delprem
│ • .premiumlist
╰────────────⬣

╭───〔 🤖 AI & IMAGE GEN 〕───⬣
│ • .gpt
│ • .gemini
│ • .blackbox
│ • .deepseek
│ • .copilot
│ • .claude
│ • .perplexity
│ • .venice
│ • .dalle
│ • .flux
│ • .fluxpro
│ • .imagine
│ • .imagine3
│ • .imagine4
│ • .animagine
│ • .dreamshaper
│ • .sdxl
│ • .pony
│ • .pixar
│ • .cartoon
│ • .seedream
│ • .toghibili
│ • .removebg
│ • .upscale
│ • .restore
│ • .enhance
│ • .filter
│ • .remini
╰────────────⬣

╭───〔 👁️ STALK 〕───⬣
│ • .npmstalk
│ • .wastalk
│ • .igstalk
│ • .tiktokstalk
│ • .twitterstalk
│ • .ytstalk
│ • .tgstalk
│ • .minecraftstalk
│ • .xboxstalk
│ • .steamstalk
│ • .githubstalk
╰────────────⬣

╭───〔 ⚽ FOOTBALL 〕───⬣
│ • .livescore
│ • .competitions
│ • .matches
│ • .standings
│ • .team
│ • .head2head
│ • .matchlist
│ • .teamperson
│ • .teammatches
│ • .areas
╰────────────⬣

╭───〔 🔍 SEARCH 〕───⬣
│ • .gsmarena
│ • .google
│ • .bing
│ • .livewallpapers
│ • .imdb
│ • .define
│ • .countryinfo
│ • .news
│ • .wiki
╰────────────⬣

╭───〔 🔧 UTILITIES 〕───⬣
│ • .tinyurl
│ • .fliptext
│ • .genpass
│ • .device
│ • .browse
│ • .fancy
│ • .font
│ • .carbon
│ • .obfuscate
│ • .calc
│ • .qr
│ • .tts
│ • .translate
│ • .weather
│ • .tozip
│ • .styletext
│ • .readmore
│ • .ngldm
╰────────────⬣

╭───〔 📺 CHANNEL 〕───⬣
│ • .createchannel
│ • .followchannel
│ • .unfollowchannel
│ • .updatechannelname
│ • .updatechannelpic
│ • .updatechanneldesc
│ • .mutechannel
│ • .unmutechannel
│ • .deletechannel
╰────────────⬣

╭───〔 🐙 GITHUB 〕───⬣
│ • .ghlogin
│ • .ghtoken
│ • .ghcreate
│ • .ghdelete
│ • .ghpush
│ • .ghpushall
│ • .ghcommit
│ • .ghfork
│ • .ghlist
│ • .ghbranches
│ • .ghdeletefile
│ • .ghcreatebranch
│ • .ghlogout
╰────────────⬣

╭───〔 🎨 PHOTO EFFECTS 〕───⬣
│ • .zombie
│ • .figure / .figure2 / .figure3
│ • .underground
│ • .oldage
│ • .turky
│ • .train
│ • .streetwear
│ • .tatoo
│ • .satan
│ • .sdm
│ • .spirit
│ • .toroblox
│ • .mirror
│ • .partner / .partner2
│ • .bf / .gf
│ • .polaroid
│ • .punk
│ • .piramid
│ • .peci
│ • .island
│ • .mangu
│ • .liquor
│ • .mecca
│ • .mayan
│ • .maid
│ • .glasses
│ • .cambodia
│ • .japan / .japanese
│ • .hijab
│ • .hitam
│ • .vintage
╰────────────⬣

╭───〔 🎬 MOVIES / SERIES 〕───⬣
│ • .selectmovie
│ • .dlmovie
│ • .dlseries
│ • .selectseries
│ • .seriesinfo
╰────────────⬣

╭───〔 📧 TEMP MAIL / NUMBER 〕───⬣
│ • .tempmail
│ • .tempinbox
│ • .tempnumber
│ • .checksms
│ • .listcountries
╰────────────⬣

╭───〔 🎮 GAMES & FUN 〕───⬣
│ • .tictactoe
│ • .ttt
│ • .hangman
│ • .guess
│ • .quiz
│ • .trivia
│ • .answer
│ • .truth
│ • .dare
│ • .8ball
│ • .compliment
│ • .insult
│ • .flirt
│ • .shayari
│ • .simp
│ • .stupid
│ • .goodnight
│ • .meme
│ • .squidgame
│ • .konami
│ • .lovetest
│ • .aura
│ • .dice
│ • .roll
│ • .joke
│ • .quote
│ • .fact
│ • .flip
│ • .rps
│ • .ship
│ • .hug
│ • .emojimix
│ • .wcg start / join / leave / status / stop / leaderboard
╰────────────⬣

╭───〔 😂 EMOJI ANIMATIONS 〕───⬣
│ • .happy
│ • .heart
│ • .angry
│ • .sad
│ • .shy
│ • .moon
│ • .confused
│ • .hot
│ • .nikal
╰────────────⬣

╭───〔 🎌 ANIME & REACTIONS 〕───⬣
│ • .waifu
│ • .neko
│ • .shinobu
│ • .megumin
│ • .aizen
│ • .animequote
│ • .anime
│ • .manga
│ • .topanime
│ • .topmanga
│ • .character
│ • .randomanime
│ • .seasonal
│ • .hentai 🔞
│ • .hentaigif 🔞
│ • .nom
│ • .poke
│ • .cry
│ • .kiss
│ • .pat
│ • .wink
│ • .facepalm
│ • .slap
│ • .bite
╰────────────⬣

╭───〔 🌐 INFORMATION 〕───⬣
│ • .news
│ • .define
│ • .check
│ • .countryinfo
│ • .topmembers
│ • .bible
│ • .quran
│ • .inspect
│ • .series
│ • .webcrawl
╰────────────⬣

╭───〔 💰 FINANCE 〕───⬣
│ • .currencylist
│ • .rates
│ • .exchange
│ • .forex
╰────────────⬣

╭───〔 ⚙️ SETTINGS 〕───⬣
│ • .autoread on/off
│ • .autotyping on/off
│ • .autorecording on/off
│ • .autoreact on/off
│ • .autoreactstatus on/off
│ • .autoviewstatus on/off
│ • .autostatus
│ • .antidelete
│ • .antiedit on/off
│ • .setpp
│ • .setbio
│ • .setname
│ • .setprefix
│ • .resetprefix
│ • .chreact
│ • .alwaysonline
│ • .fakelastseen on/off
│ • .antibug
│ • .antiviewonce
│ • .autobio
│ • .autoblock
│ • .setcontextlink
│ • .setfont
│ • .setmenu
│ • .setmenuimage
│ • .setownername
│ • .setownernumber
│ • .setstatusemoji
│ • .setstickerauthor
│ • .setstickerpackname
│ • .settimezone
│ • .setwarn
│ • .setwatermark
│ • .setwelcome
│ • .setgoodbye
│ • .showwelcome
│ • .showgoodbye
│ • .testwelcome
│ • .testgoodbye
│ • .statusdelay
│ • .statussettings
│ • .listwarn
╰────────────⬣

╭───〔 🎵 AUDIO EFFECTS 〕───⬣
│ • .deep
│ • .smooth
│ • .fat
│ • .blown
│ • .radio
│ • .robot
│ • .chipmunk
│ • .nightcore
│ • .earrape
│ • .bass
│ • .reverse
│ • .slow
│ • .fast
│ • .baby
│ • .demon
╰────────────⬣

╭───〔 🎨 LOGO & TEXT MAKERS 〕───⬣
│ • .hacker
│ • .neon
│ • .fire
│ • .gold
│ • .logo
│ • .glitch
│ • .avenger
│ • .pubg
│ • .naruto
│ • .matrix
│ • .graffiti
│ • .1000d
│ • .rainbow
│ • .metallic
│ • .ice
│ • .snow
│ • .purple
│ • .thunder
│ • .water
│ • .underwater
│ • .4d
│ • .luxury
│ • .silver
│ • .foggyglass
│ • .wetglass
│ • .fancy
│ • .candy
│ • .christmas
│ • .3dchristmas
│ • .sparklechristmas
│ • .deepsea
│ • .scifi
│ • .waterpipe
│ • .spooky
│ • .pencil
│ • .circuit
│ • .discovery
│ • .fiction
│ • .demon
│ • .transformer
│ • .berry
│ • .magma
│ • .3dstone
│ • .neonlight
│ • .harrypotter
│ • .brokenglass
│ • .papercut
│ • .watercolor
│ • .multicolor
│ • .neondevil
│ • .graffitibike
│ • .cloud
│ • .honey
│ • .fruitjuice
│ • .biscuit
│ • .wood
│ • .chocolate
│ • .strawberry
│ • .blood
│ • .dropwater
│ • .toxic
│ • .lava
│ • .rock
│ • .bloodglass
│ • .halloween
│ • .darkgold
│ • .joker
│ • .wicker
│ • .firework
│ • .skeleton
│ • .sand
│ • .glue
│ • .1917
│ • .leaves
╰────────────⬣

${config.settings.footer}
`;

                await send({
                    image: { url: config.thumbUrl },
                    caption: menu
                });

                try {
                    await sock.sendMessage(m.chat, {
                        audio: { url: menuSongUrl },
                        mimetype: 'audio/mpeg',
                        ptt: true
                    }, { quoted: m });
                } catch (audioErr) {
                    console.log("⚠️ Menu audio failed:", audioErr.message);
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
            const repoLink = "https://GitHub.com/Alexio11-09/alpha-xmd";
            const ownerName = "Alpha";
            const ownerContact = "wa.me/263786641436";
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
            if (!args[0]) return reply("❌ Provide a phone number!\n\n📌 Example: .pair 263786641436");
            const rawNumber = args[0].replace(/[^0-9]/g, "");
            if (rawNumber.length < 10) return reply("❌ Invalid phone number.");

            reply(`🔐 Requesting pairing code for +${rawNumber}...`);

            try {
                const { makeWASocket, Browsers, useMultiFileAuthState, fetchLatestBaileysVersion } = await import('@whiskeysockets/baileys');
                const pino = require('pino');
                const os = require('os');
                const path = require('path');
                const fs = require('fs');

                const tempDir = path.join(os.tmpdir(), `pair_${rawNumber}_${Date.now()}`);
                fs.mkdirSync(tempDir, { recursive: true });

                const { state } = await useMultiFileAuthState(tempDir);
                const { version } = await fetchLatestBaileysVersion();

                const tempSock = makeWASocket({
                    auth: state,
                    version,
                    browser: Browsers.macOS('Chrome'),
                    logger: pino({ level: 'silent' }),
                    printQRInTerminal: false,
                    connectTimeoutMs: 30000
                });

                let pairingCode = null;
                let settled = false;

                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        if (!settled) { settled = true; reject(new Error("Pairing timed out.")); }
                    }, 45000);

                    tempSock.ev.on('connection.update', async (update) => {
                        const { connection } = update;
                        if (connection === 'connecting' && !settled) {
                            settled = true;
                            clearTimeout(timeout);
                            try {
                                pairingCode = await tempSock.requestPairingCode(rawNumber);
                                resolve();
                            } catch (err) { reject(err); }
                        }
                        if (connection === 'close' && !settled) {
                            settled = true;
                            clearTimeout(timeout);
                            reject(new Error("Connection closed"));
                        }
                    });
                });

                tempSock.end();
                fs.rmSync(tempDir, { recursive: true, force: true });

                if (!pairingCode) throw new Error("No pairing code obtained");

                reply(
                    `✅ *Pairing Code Ready*\n\n` +
                    `📞 *Number:* +${rawNumber}\n` +
                    `🔢 *Code:* *${pairingCode}*\n\n` +
                    `⏱️ Expires in 60 seconds.\n` +
                    `📱 Open WhatsApp → Linked devices → Link with phone number → Enter this code.`
                );

            } catch (err) {
                console.error('Pair error:', err);
                reply(`❌ Pairing failed: ${err.message || String(err)}`);
            }
        }
    }
];