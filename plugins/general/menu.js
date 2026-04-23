// © 2026 Alpha - ADVANCED MENU (BRANDED 🔥)

const config = require("../../settings/config");

// ⏱️ RUNTIME
const runtime = (seconds) => {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
};

// 🌍 REAL COUNTRY DETECTOR
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
    } catch (err) {
        if (jid.startsWith("263")) return "Zimbabwe 🇿🇼";
        if (jid.startsWith("234")) return "Nigeria 🇳🇬";
        if (jid.startsWith("27")) return "South Africa 🇿🇦";
        if (jid.startsWith("254")) return "Kenya 🇰🇪";
        if (jid.startsWith("255")) return "Tanzania 🇹🇿";
        if (jid.startsWith("256")) return "Uganda 🇺🇬";
        if (jid.startsWith("1")) return "USA/Canada 🇺🇸";
        if (jid.startsWith("44")) return "UK 🇬🇧";
        if (jid.startsWith("91")) return "India 🇮🇳";
        if (jid.startsWith("92")) return "Pakistan 🇵🇰";
        if (jid.startsWith("880")) return "Bangladesh 🇧🇩";
        if (jid.startsWith("62")) return "Indonesia 🇮🇩";
        if (jid.startsWith("60")) return "Malaysia 🇲🇾";
        if (jid.startsWith("55")) return "Brazil 🇧🇷";
        if (jid.startsWith("52")) return "Mexico 🇲🇽";
        if (jid.startsWith("34")) return "Spain 🇪🇸";
        if (jid.startsWith("33")) return "France 🇫🇷";
        if (jid.startsWith("49")) return "Germany 🇩🇪";
        if (jid.startsWith("39")) return "Italy 🇮🇹";
        if (jid.startsWith("7")) return "Russia 🇷🇺";
        if (jid.startsWith("81")) return "Japan 🇯🇵";
        if (jid.startsWith("82")) return "South Korea 🇰🇷";
        if (jid.startsWith("86")) return "China 🇨🇳";
        if (jid.startsWith("61")) return "Australia 🇦🇺";
        if (jid.startsWith("64")) return "New Zealand 🇳🇿";
        if (jid.startsWith("20")) return "Egypt 🇪🇬";
        if (jid.startsWith("212")) return "Morocco 🇲🇦";
        if (jid.startsWith("966")) return "Saudi Arabia 🇸🇦";
        if (jid.startsWith("971")) return "UAE 🇦🇪";
        if (jid.startsWith("90")) return "Turkey 🇹🇷";
        return "Unknown 🌍";
    }
};

module.exports = {
    command: "menu",
    description: "Show bot menu",
    category: "general",

    execute: async (sock, m, { send }) => {
        try {
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
╰────────────⬣

╭───〔 📥 DOWNLOADER 〕───⬣
│ • .play
│ • .tiktok
│ • .fb
│ • .ig
│ • .mediafire
│ • .twitter
│ • .apk
│ • .movie
│ • .wallpaper
│ • .gitclone
╰────────────⬣

╭───〔 ⚙️ SETTINGS 〕───⬣
│ • .autoread on/off
│ • .autotyping on/off
│ • .autorecording on/off
│ • .autoreact on/off
│ • .antidelete on/off
│ • .antiedit on/off
│ • .autoviewstatus on/off
│ • .autoreactstatus on/off
│ • .autostatus
│ • .setpp
│ • .setbio
│ • .setname
│ • .setprefix
│ • .resetprefix
╰────────────⬣

╭───〔 🛠️ TOOLS 〕───⬣
│ • .calc
│ • .qr
│ • .tts
│ • .time
│ • .sticker
│ • .toimg
│ • .tomp3
│ • .removebg
│ • .getpp
│ • .getid
│ • .getlink
│ • .translate
│ • .weather
│ • .lyrics
╰────────────⬣

╭───〔 🎮 GAMES 〕───⬣
│ • .tictactoe
│ • .guess
│ • .quiz
│ • .riddle
│ • .truth
│ • .dare
╰────────────⬣

╭───〔 🎌 ANIME 〕───⬣
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
╰────────────⬣

╭───〔 🤖 AI 〕───⬣
│ • .ai
│ • .gpt
│ • .imagine
╰────────────⬣

╭───〔 🎉 FUN 〕───⬣
│ • .joke
│ • .quote
│ • .fact
│ • .flip
│ • .roll
╰────────────⬣

╭───〔 🎨 LOGO 〕───⬣
│ • .logo
│ • .textmaker
╰────────────⬣

${config.settings.footer}
`;

            await send({
                image: { url: config.thumbUrl },
                caption: menu
            });

        } catch (err) {
            console.log("Menu error:", err);
            await sock.sendMessage(m.chat, { text: "❌ Menu failed to load" }, { quoted: m });
        }
    }
};