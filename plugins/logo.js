// © 2026 Alpha - LOGO COMMANDS (MULTI-API – REAL EFFECTS)

const axios = require('axios');

// -------------------------------------------------------
// 1) List of reliable API providers (ordered by success rate)
// -------------------------------------------------------
const API_PROVIDERS = [
    {
        name: 'photooxy',
        base: 'https://api.photooxy.com/ephoto/',
        styles: {
            hacker:       'anonymous',
            neon:         'neon',
            fire:         'fire',
            gold:         'gold',
            glitch:       'glitch',
            avenger:      'avenger',
            pubg:         'pubg',
            naruto:       'naruto',
            matrix:       'matrix',
            graffiti:     'graffiti',
            '3d':         '3d',
            rainbow:      'rainbow',
            default:      'logo'
        }
    },
    {
        name: 'nyxs',
        base: 'https://api.nyxs.pw/ephoto360/',
        styles: {
            hacker:       'anonymous',
            neon:         'neon',
            fire:         'fire',
            gold:         'gold',
            glitch:       'glitch',
            avenger:      'avenger',
            pubg:         'pubg',
            naruto:       'naruto',
            matrix:       'matrix',
            graffiti:     'graffiti',
            '3d':         '3d',
            rainbow:      'rainbow',
            default:      'logo'
        }
    },
    {
        name: 'lolhuman',
        base: 'https://api.lolhuman.xyz/api/ephoto1/',
        styles: {
            hacker:       'anonymous',
            neon:         'neon',
            fire:         'fire',
            gold:         'gold',
            glitch:       'glitch',
            avenger:      'avenger',
            pubg:         'pubg',
            naruto:       'naruto',
            matrix:       'matrix',
            graffiti:     'graffiti',
            '3d':         '3d',
            rainbow:      'rainbow',
            default:      'logo'
        }
    }
];

// -------------------------------------------------------
// 2) Style alias mapping (so command names match API endpoints)
// -------------------------------------------------------
const STYLE_MAP = {
    hacker: 'hacker',
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
    default: 'default'
};

// -------------------------------------------------------
// 3) Helper: download image and send
// -------------------------------------------------------
async function downloadAndSend(sock, m, url, caption) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
        if (response.data && response.data.length > 1000) {
            await sock.sendMessage(m.chat, { image: Buffer.from(response.data), caption }, { quoted: m });
            return true;
        }
    } catch {}
    return false;
}

// -------------------------------------------------------
// 4) Main logo generator (tries multiple providers)
// -------------------------------------------------------
async function generateLogo(sock, m, text, style, reply) {
    if (!text) return reply("❌ Provide a name!\n\n📌 Example: .hacker Alpha");

    const prompt = encodeURIComponent(text.toUpperCase());
    const styleId = STYLE_MAP[style] || 'default';

    // Try every provider until one works
    for (const provider of API_PROVIDERS) {
        const endpoint = provider.styles[styleId] || provider.styles.default;
        const url = `${provider.base}${endpoint}?text=${prompt}&apikey=GataDios`; // some need apikey, most ignore it

        try {
            const sent = await downloadAndSend(sock, m, url, `🎨 *${text}*`);
            if (sent) return;
        } catch {
            // continue to next provider
        }
    }

    // If all providers fail, fallback to a simple AI-generated image (Pollinations)
    const fallbackPrompt = {
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
    }[style] || `professional logo text "${text}"`;

    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackPrompt)}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random()*10000)}`;
    const sent = await downloadAndSend(sock, m, fallbackUrl, `🎨 *${text}* (AI fallback)`);
    if (!sent) {
        reply("❌ Failed to generate logo. All services are down. Try a simpler name.");
    }
}

// -------------------------------------------------------
// 5) Command exports (all 13 styles)
// -------------------------------------------------------
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