// © 2026 Alpha - AI COMMANDS (OpenRouter)

const axios = require('axios');

const OPENROUTER_API_KEY = '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';

// AI Chat function
async function chatWithAI(prompt, model = 'deepseek/deepseek-chat') {
    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: model,
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 500
        }, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        return response.data.choices[0].message.content;
    } catch (err) {
        console.log('AI Error:', err.message);
        return null;
    }
}

module.exports = [

    // ==================== 1. AI CHAT ====================
    {
        command: "ai",
        aliases: ["ask", "chat", "deepseek"],
        category: "ai",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Ask me something!\n\n📌 Example: .ai What is the capital of France?");
            
            const question = args.join(" ");
            
            reply("🤖 *Thinking...*");
            
            const answer = await chatWithAI(question);
            
            if (answer) {
                reply(`🤖 *AI Response:*\n\n${answer}`);
            } else {
                reply("❌ AI failed to respond. Try again later.");
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
            
            const prompt = args.join(" ");
            
            reply("🎨 *Generating image...*\n\n⏳ This may take 10-20 seconds.");
            
            try {
                // Using Prodia API (free image generation)
                const generate = await axios.get(`https://api.prodia.com/v1/sd/generate`, {
                    params: {
                        prompt: prompt,
                        model: 'sdxl',
                        negative_prompt: 'bad quality, blurry',
                        steps: 20,
                        cfg_scale: 7,
                        seed: Math.floor(Math.random() * 1000000),
                        width: 512,
                        height: 512
                    },
                    headers: {
                        'X-Prodia-Key': 'free'
                    },
                    timeout: 30000
                });
                
                if (generate.data && generate.data.job) {
                    const jobId = generate.data.job;
                    
                    // Wait for image
                    await new Promise(r => setTimeout(r, 8000));
                    
                    // Get result
                    const result = await axios.get(`https://api.prodia.com/v1/job/${jobId}`, {
                        headers: { 'X-Prodia-Key': 'free' },
                        timeout: 30000
                    });
                    
                    if (result.data && result.data.imageUrl) {
                        await sock.sendMessage(m.chat, {
                            image: { url: result.data.imageUrl },
                            caption: `🎨 *AI Generated Image*\n\n📝 ${prompt}`
                        }, { quoted: m });
                    } else {
                        reply("❌ Failed to generate image. Try a different prompt.");
                    }
                } else {
                    reply("❌ Failed to generate image.");
                }
            } catch (err) {
                console.log('Imagine error:', err.message);
                reply("❌ Image generation failed. Try again later.");
            }
        }
    }

];