// © 2026 Alpha - AI COMMANDS (GEMINI + POLLINATIONS)

const axios = require('axios');

// 🔑 YOUR GOOGLE GEMINI API KEY
const GEMINI_API_KEY = 'AIzaSyBBQVVq50tfdg5YfZ6fEp1tiCEQ2NuLA_w';

module.exports = [

    // ==================== 1. AI CHAT (GOOGLE GEMINI - FREE) ====================
    {
        command: "ai",
        aliases: ["ask", "chat", "gpt", "gemini"],
        category: "ai",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Ask me something!\n\n📌 Example: .ai What is the capital of France?");
            
            const question = args.join(" ");
            
            reply("🤖 *Thinking...*");
            
            try {
                // Google Gemini API (FREE - 1500 requests/day)
                const response = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        contents: [{
                            parts: [{ text: question }]
                        }]
                    },
                    { 
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 30000 
                    }
                );
                
                if (response.data && response.data.candidates && response.data.candidates[0]) {
                    const answer = response.data.candidates[0].content.parts[0].text;
                    reply(`🤖 *AI Response:*\n\n${answer}`);
                } else {
                    reply("❌ No response from AI.");
                }
            } catch (err) {
                console.log('Gemini Error:', err.message);
                reply("❌ AI failed. Try again later.");
            }
        }
    },

    // ==================== 2. AI IMAGE GENERATION ====================
    {
        command: "imagine",
        aliases: ["imgai", "aigen", "aiimage", "draw"],
        category: "ai",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Describe an image!\n\n📌 Example: .imagine a sunset over the ocean");
            
            const prompt = args.join(" ");
            const encodedPrompt = encodeURIComponent(prompt);
            
            reply("🎨 *Generating image...*\n\n⏳ This may take 10-15 seconds.");
            
            // Try multiple methods
            const imageUrls = [
                `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 100000)}`,
                `https://pollinations.ai/p/${encodedPrompt}?width=512&height=512&nologo=true`
            ];
            
            let sent = false;
            
            for (let url of imageUrls) {
                if (sent) break;
                
                try {
                    await sock.sendMessage(m.chat, {
                        image: { url: url },
                        caption: `🎨 *AI Generated*\n\n📝 ${prompt}`
                    }, { quoted: m });
                    sent = true;
                } catch (err) {
                    console.log('Image URL failed:', url.substring(0, 50));
                }
            }
            
            if (!sent) {
                reply("❌ Failed to generate. Try a different prompt like 'sunset over ocean'.");
            }
        }
    }

];