// © 2026 Alpha - AI COMMANDS (100% FREE APIs)

const axios = require('axios');

module.exports = [

    // ==================== 1. AI CHAT (FREE) ====================
    {
        command: "ai",
        aliases: ["ask", "chat"],
        category: "ai",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Ask me something!\n\n📌 Example: .ai What is the capital of France?");
            
            const question = args.join(" ");
            
            reply("🤖 *Thinking...*");
            
            try {
                // Free GPT API
                const response = await axios.get(`https://api.affiliateplus.xyz/api/chatbot?message=${encodeURIComponent(question)}&botname=AlphaBot&ownername=Alpha`);
                
                if (response.data && response.data.message) {
                    reply(`🤖 *AI Response:*\n\n${response.data.message}`);
                } else {
                    // Fallback to another free API
                    const res2 = await axios.get(`https://api.simsimi.vn/v1/simtalk?text=${encodeURIComponent(question)}&key=free`);
                    if (res2.data && res2.data.message) {
                        reply(`🤖 *AI Response:*\n\n${res2.data.message}`);
                    } else {
                        reply("❌ AI failed to respond. Try again.");
                    }
                }
            } catch (err) {
                console.log('AI Error:', err.message);
                reply("❌ AI service unavailable. Try again later.");
            }
        }
    },

    // ==================== 2. AI IMAGE GENERATION (FREE) ====================
    {
        command: "imagine",
        aliases: ["imgai", "aigen", "aiimage"],
        category: "ai",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Describe an image!\n\n📌 Example: .imagine a cat wearing sunglasses");
            
            const prompt = args.join(" ");
            
            reply("🎨 *Generating image...*\n\n⏳ This may take 10-20 seconds.");
            
            try {
                // Using free image generation API
                const response = await axios.get(`https://api.nyxs.pw/ai/stable-diffusion?prompt=${encodeURIComponent(prompt)}`, { timeout: 60000 });
                
                if (response.data && response.data.result) {
                    await sock.sendMessage(m.chat, {
                        image: { url: response.data.result },
                        caption: `🎨 *AI Generated Image*\n\n📝 ${prompt}`
                    }, { quoted: m });
                } else {
                    // Fallback to another free API
                    const res2 = await axios.get(`https://api.lolhuman.xyz/api/text2image?apikey=free&text=${encodeURIComponent(prompt)}`, { timeout: 60000 });
                    if (res2.data && res2.data.result) {
                        await sock.sendMessage(m.chat, {
                            image: { url: res2.data.result },
                            caption: `🎨 *AI Generated Image*\n\n📝 ${prompt}`
                        }, { quoted: m });
                    } else {
                        reply("❌ Failed to generate image. Try a different prompt.");
                    }
                }
            } catch (err) {
                console.log('Imagine error:', err.message);
                reply("❌ Image generation failed. Try again later.");
            }
        }
    }

];