// © 2026 Alpha - AI COMMANDS (FINAL BOSS VERSION)

const axios = require('axios');

// Your OpenRouter API key
const OPENROUTER_API_KEY = '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';

// AI Chat function using OpenRouter FREE models
async function chatWithAI(prompt) {
    // List of free models to try
    const freeModels = [
        'meta-llama/llama-3-8b-instruct:free',
        'google/gemini-2.0-flash-001',
        'deepseek/deepseek-r1:free',
        'microsoft/phi-3-mini-128k-instruct:free'
    ];

    for (let model of freeModels) {
        try {
            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 500
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://alpha-xmd.vercel.app',
                        'X-Title': 'Alpha Bot'
                    }
                }
            );

            if (response.data && response.data.choices && response.data.choices[0]) {
                return response.data.choices[0].message.content;
            }
        } catch (err) {
            console.log(`Model ${model} failed:`, err.message);
            // Try next model
        }
    }
    return null;
}

module.exports = [

    // ==================== 1. AI CHAT (OpenRouter FREE models) ====================
    {
        command: "ai",
        aliases: ["ask", "chat", "gpt", "deepseek"],
        category: "ai",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Ask me something!\n\n📌 Example: .ai What is the capital of France?");
            
            const question = args.join(" ");
            
            reply("🤖 *Thinking...*");
            
            const answer = await chatWithAI(question);
            
            if (answer) {
                reply(`🤖 *AI Response:*\n\n${answer}`);
            } else {
                reply("❌ All AI models are busy. Try again in a minute.");
            }
        }
    },

    // ==================== 2. AI IMAGE GENERATION (Pollinations) ====================
    {
        command: "imagine",
        aliases: ["imgai", "aigen", "aiimage", "draw"],
        category: "ai",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Describe an image!\n\n📌 Example: .imagine a dragon flying over mountains");
            
            const prompt = encodeURIComponent(args.join(" "));
            
            reply("🎨 *Generating image...*\n\n⏳ This may take 10-15 seconds.");
            
            try {
                // Multiple fallback URLs for Pollinations
                const urls = [
                    `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&nologo=true`,
                    `https://pollinations.ai/p/${prompt}?width=512&height=512&nologo=true`
                ];
                
                let success = false;
                
                for (let url of urls) {
                    try {
                        await sock.sendMessage(m.chat, {
                            image: { url: url },
                            caption: `🎨 *AI Generated Image*\n\n📝 ${args.join(" ")}`
                        }, { quoted: m });
                        success = true;
                        break;
                    } catch {}
                }
                
                if (!success) {
                    reply("❌ Failed to generate image. Try a simpler prompt.");
                }
                
            } catch (err) {
                console.log('Imagine error:', err.message);
                reply("❌ Image generation failed. Try again later.");
            }
        }
    }

];