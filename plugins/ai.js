// © 2026 Alpha - AI COMMANDS (WORKING FREE APIs)

const axios = require('axios');

module.exports = [

    // ==================== 1. AI CHAT (BLACKBOX) ====================
    {
        command: "ai",
        aliases: ["ask", "chat", "gpt"],
        category: "ai",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Ask me something!\n\n📌 Example: .ai What is the capital of France?");
            
            const question = args.join(" ");
            
            reply("🤖 *Thinking...*");
            
            try {
                // Using Blackbox AI API (free & reliable)
                const response = await axios.post('https://api.blackbox.ai/api/chat', {
                    messages: [{ role: 'user', content: question }],
                    model: 'deepseek-ai/DeepSeek-V3'
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                });
                
                if (response.data) {
                    reply(`🤖 *AI Response:*\n\n${response.data}`);
                } else {
                    throw new Error('Empty response');
                }
            } catch (err) {
                console.log('AI Error:', err.message);
                reply("❌ AI service temporarily unavailable. Try again in a few minutes.");
            }
        }
    },

    // ==================== 2. AI IMAGE GENERATION (WORKING) ====================
    {
        command: "imagine",
        aliases: ["imgai", "aigen", "aiimage"],
        category: "ai",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Describe an image!\n\n📌 Example: .imagine a cat wearing sunglasses on a beach");
            
            const prompt = encodeURIComponent(args.join(" "));
            
            reply("🎨 *Generating image...*\n\n⏳ This may take 10-15 seconds.");
            
            try {
                // Using Pollinations.ai (Stable Diffusion - reliable)
                const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&nologo=true`;
                
                await sock.sendMessage(m.chat, {
                    image: { url: imageUrl },
                    caption: `🎨 *AI Generated Image*\n\n📝 ${args.join(" ")}`
                }, { quoted: m });
                
            } catch (err) {
                console.log('Imagine error:', err.message);
                reply("❌ Failed to generate image. Try a different prompt.");
            }
        }
    }

];