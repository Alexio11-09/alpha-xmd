// © 2026 Alpha - AI COMMANDS (STABLE & FREE)

const axios = require('axios');

module.exports = [

    // ==================== 1. AI CHAT ====================
    {
        command: "ai",
        aliases: ["ask", "chat", "gpt"],
        category: "ai",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Ask me something!\n\n📌 Example: .ai What is the capital of France?");
            
            const question = args.join(" ");
            
            reply("🤖 *Thinking...*");
            
            try {
                // Using Free GPT-3.5 Turbo API
                const response = await axios.post(
                    'https://api.pawan.krd/v1/chat/completions',
                    {
                        model: 'gpt-3.5-turbo',
                        messages: [{ role: 'user', content: question }],
                        temperature: 0.7,
                        max_tokens: 500
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer pk-this-is-a-free-api-key'
                        }
                    }
                );
                
                if (response.data && response.data.choices && response.data.choices[0]) {
                    const answer = response.data.choices[0].message.content;
                    reply(`🤖 *AI Response:*\n\n${answer}`);
                } else {
                    throw new Error('Empty response');
                }
            } catch (err) {
                console.log('AI Error:', err.message);
                reply("❌ AI service temporarily unavailable. Try again in a few minutes.");
            }
        }
    },

    // ==================== 2. AI IMAGE GENERATION ====================
    {
        command: "imagine",
        aliases: ["imgai", "aigen", "aiimage"],
        category: "ai",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Describe an image!\n\n📌 Example: .imagine a cat wearing sunglasses on a beach");
            
            const prompt = encodeURIComponent(args.join(" "));
            
            reply("🎨 *Generating image...*\n\n⏳ This may take 10-15 seconds.");
            
            try {
                // Using Pollinations.ai (Stable Diffusion)
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