// © 2026 Alpha - LOGO COMMANDS (JIMP - REAL EFFECTS, NO API)

const Jimp = require('jimp');

/**
 * Draw a gradient over the whole image
 */
function gradientFill(image, startColor, endColor, vertical = false) {
    const w = image.bitmap.width, h = image.bitmap.height;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const t = vertical ? y / h : x / w;
            const r = ((endColor >> 24 & 0xFF) - (startColor >> 24 & 0xFF)) * t + (startColor >> 24 & 0xFF);
            const g = ((endColor >> 16 & 0xFF) - (startColor >> 16 & 0xFF)) * t + (startColor >> 16 & 0xFF);
            const b = ((endColor >> 8 & 0xFF) - (startColor >> 8 & 0xFF)) * t + (startColor >> 8 & 0xFF);
            image.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
        }
    }
}

/**
 * Draw text with an outline (by printing in multiple positions)
 */
async function drawOutlinedText(image, text, x, y, mainColor, outlineColor = 0x000000ff, outlineWidth = 3) {
    const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
    const opts = { text, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE };
    // outline
    for (let dx = -outlineWidth; dx <= outlineWidth; dx++)
        for (let dy = -outlineWidth; dy <= outlineWidth; dy++)
            if (dx || dy) image.print(font, x + dx, y + dy, opts, image.bitmap.width, image.bitmap.height);
    image.color([{ apply: 'xor', params: [outlineColor] }]);
    // main text
    image.print(font, x, y, opts, image.bitmap.width, image.bitmap.height);
    image.color([{ apply: 'xor', params: [mainColor] }]);
}

async function generateLogo(sock, m, text, style, reply) {
    if (!text) return reply("❌ Provide a name!\n\n📌 Example: .hacker Alpha");
    const name = text.toUpperCase();
    const W = 800, H = 400;
    const img = new Jimp(W, H);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);

    switch (style) {
        case 'hacker':
            // dark bg + green grid + glowing text
            img.scan(0, 0, W, H, (x, y) => img.setPixelColor((x % 40 == 0 || y % 40 == 0) ? 0x00ff0011 : 0x0a0a0aff, x, y));
            // glow layers
            for (let i = 6; i >= 2; i -= 2) {
                img.print(font, W/2, H/2, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
                img.color([{ apply: 'green', params: [20 + i * 5] }]);
            }
            img.print(font, W/2, H/2, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
            img.color([{ apply: 'green', params: [255] }]);
            break;
        case 'neon':
            img.scan(0,0,W,H, (x,y) => img.setPixelColor(0x000000ff, x,y));
            // multiple offsets for glow
            for (let i = 6; i >= 1; i -= 2) {
                img.print(font, W/2, H/2, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
                img.color([{ apply: 'xor', params: [0xff00ff11 * i] }]);
            }
            img.print(font, W/2, H/2, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
            img.color([{ apply: 'xor', params: [0xffffffff] }]);
            break;
        case 'fire':
            gradientFill(img, 0xff4400ff, 0x000000ff, true);
            // flame colours
            img.print(font, W/2-4, H/2-4, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
            img.color([{ apply: 'xor', params: [0xff0000ff] }]);
            img.print(font, W/2-2, H/2-2, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
            img.color([{ apply: 'xor', params: [0xff8800ff] }]);
            img.print(font, W/2, H/2, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
            img.color([{ apply: 'xor', params: [0xffff00ff] }]);
            break;
        case 'gold':
            img.scan(0,0,W,H, (x,y) => img.setPixelColor(0x1a1a1aff, x,y));
            gradientFill(img, 0xbf953fff, 0xfcf6baff, false);
            // subtle shadow
            img.print(font, W/2+2, H/2+2, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
            img.color([{ apply: 'xor', params: [0x00000044] }]);
            img.print(font, W/2, H/2, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
            break;
        case 'glitch':
            img.scan(0,0,W,H, (x,y) => img.setPixelColor(0x000000ff, x,y));
            img.print(font, W/2-5, H/2-5, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
            img.color([{ apply: 'xor', params: [0xff0000ff] }]);
            img.print(font, W/2+5, H/2+5, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
            img.color([{ apply: 'xor', params: [0x00ffffff] }]);
            img.print(font, W/2, H/2, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
            img.color([{ apply: 'xor', params: [0xffffffff] }]);
            break;
        case 'avenger':
            gradientFill(img, 0xe62429ff, 0x1a0000ff, false);
            await drawOutlinedText(img, name, W/2, H/2, 0xfff0f0ff, 0xffffff44, 4);
            break;
        case 'pubg':
            img.scan(0,0,W,H, (x,y) => img.setPixelColor(0x1a1a1aff, x,y));
            await drawOutlinedText(img, name, W/2, H/2, 0xf0c040ff, 0x000000ff, 4);
            break;
        case 'naruto':
            img.scan(0,0,W,H, (x,y) => img.setPixelColor(0xff8c00ff, x,y));
            await drawOutlinedText(img, name, W/2, H/2, 0x1e90ffff, 0xffffffff, 4);
            break;
        case 'matrix':
            img.scan(0,0,W,H, (x,y) => img.setPixelColor(0x000000ff, x,y));
            // random green characters background
            const matrixFont = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
            for (let i = 0; i < 200; i++) {
                const cx = Math.random() * W, cy = Math.random() * H;
                img.print(matrixFont, cx, cy, String.fromCharCode(0x30A0 + Math.random() * 96));
            }
            img.color([{ apply: 'green', params: [80] }]);
            // glowing text
            for (let i = 5; i >= 2; i -= 2) {
                img.print(font, W/2, H/2, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
                img.color([{ apply: 'green', params: [20 + i * 5] }]);
            }
            img.print(font, W/2, H/2, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
            img.color([{ apply: 'green', params: [255] }]);
            break;
        case 'graffiti':
            img.scan(0,0,W,H, (x,y) => img.setPixelColor(0xd3d3d3ff, x,y));
            // multiple colourful offsets
            img.print(font, W/2-4, H/2-4, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
            img.color([{ apply: 'xor', params: [0xff1493ff] }]);
            img.print(font, W/2+4, H/2+4, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
            img.color([{ apply: 'xor', params: [0x00ffffff] }]);
            img.print(font, W/2, H/2, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
            img.color([{ apply: 'xor', params: [0x000000ff] }]);
            break;
        case '3d':
            img.scan(0,0,W,H, (x,y) => img.setPixelColor(0xffffffff, x,y));
            // 3D shadow
            for (let i = 8; i > 0; i--) {
                img.print(font, W/2 + i, H/2 + i, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
                img.color([{ apply: 'xor', params: [0x00000044] }]);
            }
            img.print(font, W/2, H/2, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
            img.color([{ apply: 'xor', params: [0x3b82f6ff] }]);
            break;
        case 'rainbow':
            img.scan(0,0,W,H, (x,y) => img.setPixelColor(0xffffffff, x,y));
            const rainbowColors = [0xff0000ff,0xff7700ff,0xffff00ff,0x00ff00ff,0x0000ffff,0x4b0082ff,0x9400d3ff];
            const letters = name.split('');
            const totalTextWidth = Jimp.measureText(font, name);
            let xPos = (W - totalTextWidth) / 2;
            for (let i = 0; i < letters.length; i++) {
                const color = rainbowColors[i % rainbowColors.length];
                img.print(font, xPos, H/2 - 32, letters[i]);
                img.color([{ apply: 'xor', params: [color] }]);
                xPos += Jimp.measureText(font, letters[i]);
            }
            break;
        default: // clean "logo" style
            img.scan(0,0,W,H, (x,y) => img.setPixelColor(0x111827ff, x,y));
            img.print(font, W/2, H/2, { text: name, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, W, H);
            img.color([{ apply: 'xor', params: [0x3b82f6ff] }]);
    }

    const buffer = await img.getBufferAsync(Jimp.MIME_PNG);
    await sock.sendMessage(m.chat, { image: buffer, caption: `🎨 *${text}*` }, { quoted: m });
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