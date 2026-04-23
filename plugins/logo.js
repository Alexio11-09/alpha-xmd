// © 2026 Alpha - LOGO COMMANDS (ePhoto360 via Nyxs + AI Fallback)

const axios = require('axios');

// Map a style to its Nyxs ePhoto360 endpoint
const STYLE_MAP = {
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
};

// Helper: generate styled logo image
async function generateLogo(sock, m, text, style, reply) {
    if (!text) return reply("❌ Provide a name!\n\n📌 Example: .hacker Alpha");

    const prompt = encodeURIComponent(text.toUpperCase());
    
    // 1) Try Nyxs ePhoto360 mirror
    try {
        const epEffect = STYLE_MAP[style] || 'logo';
        const url = `https://api.nyxs.pw/ephoto360/${epEffect}?text=${prompt}`;
        // fetch image and send
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
        if (response.data) {
            await sock.sendMessage(m.chat, {
                image: Buffer.from(response.data),
                caption: `🎨 *${text}*`
            }, { quoted: m });
            return;
        }
    } catch {
        // Nyxs failed – fallback to Pollinations
    }

    // 2) Fallback: Pollinations AI with a detailed prompt
    try {
        let aiPrompt = '';
        switch (style) {
            case 'hacker': aiPrompt = 'hacker mask with glowing green text "PROMPT", dark digital background, anonymous style'; break;
            case 'neon':   aiPrompt = 'neon sign glowing text "PROMPT", dark wall, realistic'; break;
            case 'fire':   aiPrompt = 'text "PROMPT" on fire, flames, dramatic'; break;
            case 'gold':   aiPrompt = 'gold 3D text "PROMPT", luxury background'; break;
            case 'glitch': aiPrompt = 'glitch text "PROMPT", corrupted digital art'; break;
            case 'avenger': aiPrompt = 'Avengers logo style text "PROMPT", Marvel'; break;
            case 'pubg':   aiPrompt = 'PUBG kill feed text "PROMPT", game style'; break;
            case 'naruto': aiPrompt = 'Naruto logo text "PROMPT", anime style'; break;
            case 'matrix': aiPrompt = 'Matrix green code rain background with text "PROMPT"'; break;
            case 'graffiti': aiPrompt = 'graffiti spray paint text "PROMPT" on wall'; break;
            case '3d':     aiPrompt = '3D isometric text "PROMPT", clean render'; break;
            case 'rainbow': aiPrompt = 'rainbow colored text "PROMPT", vibrant'; break;
            default:       aiPrompt = 'professional logo text "PROMPT"';
        }
        aiPrompt = aiPrompt.replace('PROMPT', text);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random()*10000)}`;
        await sock.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption: `🎨 *${text}* (AI generated)`
        }, { quoted: m });
    } catch (err) {
        reply("❌ Failed to generate logo. Try again.");
    }
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