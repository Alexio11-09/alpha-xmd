// © 2026 Alpha - NATIVE LOGO GENERATOR (13 STYLES)

const { createCanvas } = require('canvas');

// Helper function to draw styled logos
async function generateLogo(sock, m, text, style, reply) {
    if (!text) return reply("❌ Provide a name!\n\n📌 Example: .hacker Alpha");
    
    const name = text.toUpperCase();
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    switch (style) {
        case 'hacker':
            // Dark background with green matrix grid
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, width, height);
            ctx.strokeStyle = '#00ff0033';
            ctx.lineWidth = 1;
            for (let i = 0; i < width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
            for (let i = 0; i < height; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 60px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 15;
            ctx.fillText(name, width/2, height/2 + 20);
            break;

        case 'neon':
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);
            ctx.font = 'bold 80px "Arial", sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 30;
            ctx.fillStyle = '#ff00ff';
            ctx.fillText(name, width/2, height/2 + 30);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(name, width/2, height/2 + 30);
            break;

        case 'fire':
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);
            ctx.font = 'bold 70px "Arial", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff4500'; ctx.fillText(name, width/2 + 3, height/2 + 33);
            ctx.fillStyle = '#ff0000'; ctx.fillText(name, width/2 + 1, height/2 + 31);
            ctx.fillStyle = '#ffff00'; ctx.fillText(name, width/2, height/2 + 30);
            break;

        case 'gold':
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, width, height);
            const gradient = ctx.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, '#bf953f');
            gradient.addColorStop(0.5, '#fcf6ba');
            gradient.addColorStop(1, '#b38728');
            ctx.fillStyle = gradient;
            ctx.font = 'bold 70px "Arial", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(name, width/2, height/2 + 30);
            break;

        case 'glitch':
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);
            ctx.font = 'bold 70px "Arial", sans-serif';
            ctx.textAlign = 'center';
            // Red offset
            ctx.fillStyle = '#ff0000';
            ctx.fillText(name, width/2 - 5, height/2 + 25);
            // Blue offset
            ctx.fillStyle = '#00ffff';
            ctx.fillText(name, width/2 + 5, height/2 + 35);
            // White on top
            ctx.fillStyle = '#ffffff';
            ctx.fillText(name, width/2, height/2 + 30);
            break;

        case 'avenger':
            // Marvel-like red gradient
            ctx.fillStyle = '#1a0000';
            ctx.fillRect(0, 0, width, height);
            const avgGrad = ctx.createLinearGradient(0, 0, width, 0);
            avgGrad.addColorStop(0, '#e62429');
            avgGrad.addColorStop(0.5, '#ff6b6b');
            avgGrad.addColorStop(1, '#e62429');
            ctx.fillStyle = avgGrad;
            ctx.font = 'bold 70px "Arial", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(name, width/2, height/2 + 30);
            // White outline effect
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.strokeText(name, width/2, height/2 + 30);
            break;

        case 'pubg':
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, width, height);
            ctx.font = 'bold 60px "Arial", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#f0c040';
            ctx.fillText(name, width/2, height/2 + 20);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.strokeText(name, width/2, height/2 + 20);
            break;

        case 'naruto':
            ctx.fillStyle = '#ff8c00';
            ctx.fillRect(0, 0, width, height);
            ctx.font = 'bold 70px "Arial", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#1e90ff';
            ctx.fillText(name, width/2, height/2 + 30);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.strokeText(name, width/2, height/2 + 30);
            break;

        case 'matrix':
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);
            ctx.font = '20px "Courier New", monospace';
            ctx.fillStyle = '#0f0';
            for (let i = 0; i < 200; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                ctx.fillText(String.fromCharCode(0x30A0 + Math.random() * 96), x, y);
            }
            ctx.font = 'bold 70px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#0f0';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#fff';
            ctx.fillText(name, width/2, height/2 + 30);
            break;

        case 'graffiti':
            ctx.fillStyle = '#d3d3d3';
            ctx.fillRect(0, 0, width, height);
            ctx.font = 'bold 60px "Comic Sans MS", cursive';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff1493';
            ctx.fillText(name, width/2 + 5, height/2 + 35);
            ctx.fillStyle = '#00ffff';
            ctx.fillText(name, width/2 - 5, height/2 + 25);
            ctx.fillStyle = '#000000';
            ctx.fillText(name, width/2, height/2 + 30);
            break;

        case '3d':
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.font = 'bold 80px "Arial", sans-serif';
            ctx.textAlign = 'center';
            for (let i = 5; i > 0; i--) {
                ctx.fillStyle = `rgba(0,0,0,${0.1 * i})`;
                ctx.fillText(name, width/2 + i, height/2 + 30 + i);
            }
            ctx.fillStyle = '#3b82f6';
            ctx.fillText(name, width/2, height/2 + 30);
            break;

        case 'rainbow':
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            const rainbowColors = ['#ff0000','#ff7700','#ffff00','#00ff00','#0000ff','#4b0082','#9400d3'];
            const letterWidth = ctx.measureText(name).width / name.length;
            ctx.font = 'bold 70px "Arial", sans-serif';
            ctx.textAlign = 'left';
            let xStart = (width - ctx.measureText(name).width) / 2;
            for (let i = 0; i < name.length; i++) {
                ctx.fillStyle = rainbowColors[i % rainbowColors.length];
                ctx.fillText(name[i], xStart, height/2 + 30);
                xStart += ctx.measureText(name[i]).width;
            }
            break;

        default:
            ctx.fillStyle = '#111827';
            ctx.fillRect(0, 0, width, height);
            ctx.font = 'bold 50px "Arial", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#3b82f6';
            ctx.fillText(name, width/2, height/2 + 20);
    }

    const buffer = canvas.toBuffer('image/png');
    await sock.sendMessage(m.chat, { image: buffer, caption: `🎨 *${text}*` }, { quoted: m });
}

module.exports = [
    { command: "hacker", aliases: ["hack", "anonymous"], category: "logo", execute: (s, m, a) => generateLogo(s, m, a.args.join(" "), 'hacker', a.reply) },
    { command: "neon", aliases: ["neontext"], category: "logo", execute: (s, m, a) => generateLogo(s, m, a.args.join(" "), 'neon', a.reply) },
    { command: "fire", aliases: ["firetext", "burning"], category: "logo", execute: (s, m, a) => generateLogo(s, m, a.args.join(" "), 'fire', a.reply) },
    { command: "gold", aliases: ["goldtext", "golden"], category: "logo", execute: (s, m, a) => generateLogo(s, m, a.args.join(" "), 'gold', a.reply) },
    { command: "logo", aliases: ["logogen"], category: "logo", execute: (s, m, a) => generateLogo(s, m, a.args.join(" "), 'default', a.reply) },
    { command: "glitch", aliases: ["glitchtext"], category: "logo", execute: (s, m, a) => generateLogo(s, m, a.args.join(" "), 'glitch', a.reply) },
    { command: "avenger", aliases: ["avengers", "marvel"], category: "logo", execute: (s, m, a) => generateLogo(s, m, a.args.join(" "), 'avenger', a.reply) },
    { command: "pubg", aliases: ["pubgtext"], category: "logo", execute: (s, m, a) => generateLogo(s, m, a.args.join(" "), 'pubg', a.reply) },
    { command: "naruto", aliases: ["narutotext"], category: "logo", execute: (s, m, a) => generateLogo(s, m, a.args.join(" "), 'naruto', a.reply) },
    { command: "matrix", aliases: ["matrixtext"], category: "logo", execute: (s, m, a) => generateLogo(s, m, a.args.join(" "), 'matrix', a.reply) },
    { command: "graffiti", aliases: ["graff", "spray"], category: "logo", execute: (s, m, a) => generateLogo(s, m, a.args.join(" "), 'graffiti', a.reply) },
    { command: "3d", aliases: ["3dtext", "threed"], category: "logo", execute: (s, m, a) => generateLogo(s, m, a.args.join(" "), '3d', a.reply) },
    { command: "rainbow", aliases: ["rainbowtext", "colors"], category: "logo", execute: (s, m, a) => generateLogo(s, m, a.args.join(" "), 'rainbow', a.reply) }
];