// © 2026 Alpha - LOGO COMMANDS (MULTI-API – ALWAYS WORKS)

const axios = require('axios');

// ---------- helper: fetch image from URL with timeout ----------
async function fetchImage(url, timeout = 15000) {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout });
    return Buffer.from(res.data);
}

// ---------- helper: send image or text ----------
async function sendResult(sock, m, buffer, caption) {
    if (buffer) {
        await sock.sendMessage(m.chat, { image: buffer, caption }, { quoted: m });
        return true;
    }
    return false;
}

// ---------- style mapping for different APIs ----------
const APIS = {
    // ---- ePhoto360 via nyxs.pw (primary) ----
    nyxs: {
        base: 'https://api.nyxs.pw/ephoto360/',
        styles: {
            hacker: 'anonymous',
            neon: 'neon',
            fire: 'fire',
            gold: 'gold',
            glitch: 'glitch',
            avenger: 'avenger',
            pubg: 'pubg',
            naruto: 'naruto',
            matrix: 'matrix',
            graffiti: 'graffiti',
            '3d': '3d',
            rainbow: 'rainbow',
            default: 'logo'
        }
    },
    // ---- PhotoOxy (more reliable mirror) ----
    photooxy: {
        base: 'https://api.photooxy.com/',
        styles: {
            hacker: 'anonymous',
            neon: 'neon',
            fire: 'fire',
            gold: 'gold',
            glitch: 'glitch',
            avenger: 'avenger',
            pubg: 'pubg',
            naruto: 'naruto',
            matrix: 'matrix',
            graffiti: 'graffiti',
            '3d': '3d',
            rainbow: 'rainbow',
            default: 'logo'
        }
    },
    // ---- FlamingText (some styles) ----
    flamingtext: {
        base: 'https://flamingtext.com/net-fu/proxy_form.cgi?',
        styles: {
            hacker: 'image=anonymous',
            neon: 'image=neon',
            fire: 'image=fire',
            gold: 'image=gold',
            default: 'image=logo'
        }
    }
};

// ---------- main logo generator ----------
async function generateLogo(sock, m, text, style, reply) {
    if (!text) return reply("❌ Provide a name!\n\n📌 Example: .hacker Alpha");

    const name = encodeURIComponent(text);

    // 1) Try nyxs.pw
    try {
        const epStyle = APIS.nyxs.styles[style] || 'logo';
        const url = `${APIS.nyxs.base}${epStyle}?text=${name}`;
        const buffer = await fetchImage(url, 12000);
        if (buffer && buffer.length > 1000) {
            await sendResult(sock, m, buffer, `🎨 *${text}*`);
            return;
        }
    } catch { /* continue */ }

    // 2) Try photooxy
    try {
        const epStyle = APIS.photooxy.styles[style] || 'logo';
        const url = `${APIS.photooxy.base}${epStyle}?text=${name}`;
        const buffer = await fetchImage(url, 12000);
        if (buffer && buffer.length > 1000) {
            await sendResult(sock, m, buffer, `🎨 *${text}*`);
            return;
        }
    } catch { /* continue */ }

    // 3) Try flamingtext
    try {
        const epStyle = APIS.flamingtext.styles[style];
        if (epStyle) {
            const url = `${APIS.flamingtext.base}${epStyle}&text=${name}`;
            const buffer = await fetchImage(url, 10000);
            if (buffer && buffer.length > 500) {
                await sendResult(sock, m, buffer, `🎨 *${text}*`);
                return;
            }
        }
    } catch { /* continue */ }

    // 4) Fallback: Pollinations AI (descriptive prompt)
    try {
        const aiPrompts = {
            hacker: `hacker mask with glowing green text "${text}", dark digital background, anonymous style`,
            neon: `neon sign glowing text "${text}", dark wall, realistic`,
            fire: `text "${text}" on fire, flames, dramatic`,
            gold: `gold 3D text "${text}", luxury background`,
            glitch: `glitch text "${text}", corrupted digital art`,
            avenger: `Avengers logo style text "${text}", Marvel`,
            pubg: `PUBG kill feed text "${text}", game style`,
            naruto: `Naruto logo text "${text}", anime style`,
            matrix: `Matrix green code rain background with text "${text}"`,
            graffiti: `graffiti spray paint text "${text}" on wall`,
            '3d': `3D isometric text "${text}", clean render`,
            rainbow: `rainbow colored text "${text}", vibrant`,
            default: `professional logo text "${text}"`
        };
        const prompt = aiPrompts[style] || aiPrompts.default;
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random()*10000)}`;
        const buffer = await fetchImage(imageUrl, 20000);
        if (buffer && buffer.length > 1000) {
            await sendResult(sock, m, buffer, `🎨 *${text}* (AI generated)`);
            return;
        }
    } catch { /* last resort */ }

    // 5) If everything fails, reply error
    reply("❌ Could not generate logo. Try a different style or shorter text.");
}

module.exports = [
    { command: "hacker", aliases: ["hack","anonymous"], category: "logo", execute: (s,m,a) => generateLogo(s,m,a.args.join(" "),'hacker',a.reply) },
    { command: "neon", aliases: ["neontext"], category: "logo", execute: (s,m,a) => generateLogo(s,m,a.args.join(" "),'neon',a.reply) },
    { command: "fire", aliases: ["firetext","burning"], category: "logo", execute: (s,m,a) => generateLogo(s,m,a.args.join(" "),'fire',a.reply) },
    { command: "gold", aliases: ["goldtext","golden"], category: "logo", execute: (s,m,a) => generateLogo(s,m,a.args.join(" "),'gold',a.reply) },
    { command: "logo", aliases: ["logogen"], category: "logo", execute: (s,m,a) => generateLogo(s,m,a.args.join(" "),'default',a.reply) },
    { command: "glitch", aliases: ["glitchtext"], category: "logo", execute: (s,m,a) => generateLogo(s,m,a.args.join(" "),'glitch',a.reply) },
    { command: "avenger", aliases: ["avengers","marvel"], category: "logo", execute: (s,m,a) => generateLogo(s,m,a.args.join(" "),'avenger',a.reply) },
    { command: "pubg", aliases: ["pubgtext"], category: "logo", execute: (s,m,a) => generateLogo(s,m,a.args.join(" "),'pubg',a.reply) },
    { command: "naruto", aliases: ["narutotext"], category: "logo", execute: (s,m,a) => generateLogo(s,m,a.args.join(" "),'naruto',a.reply) },
    { command: "matrix", aliases: ["matrixtext"], category: "logo", execute: (s,m,a) => generateLogo(s,m,a.args.join(" "),'matrix',a.reply) },
    { command: "graffiti", aliases: ["graff","spray"], category: "logo", execute: (s,m,a) => generateLogo(s,m,a.args.join(" "),'graffiti',a.reply) },
    { command: "3d", aliases: ["3dtext","threed"], category: "logo", execute: (s,m,a) => generateLogo(s,m,a.args.join(" "),'3d',a.reply) },
    { command: "rainbow", aliases: ["rainbowtext","colors"], category: "logo", execute: (s,m,a) => generateLogo(s,m,a.args.join(" "),'rainbow',a.reply) }
];