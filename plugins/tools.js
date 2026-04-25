// © 2026 Alpha - FUN COMMANDS (11 WORKING COMMANDS)

const axios = require('axios');
const { Sticker } = require('wa-sticker-formatter');

// --- emojimix replies ---
const emojimixSuccess = [
    "🔀 Here's your emoji mix!",
    "✨ Emoticombination complete.",
    "🧪 Mixed! Science baby.",
    "🤝 Two emojis became one."
];
const emojimixFail = [
    "😵 I can't mix those two. Try different emojis!",
    "❌ That combo doesn't exist in my chemistry book.",
    "🤷‍♂️ No result. Maybe the emojis aren't compatible.",
    "💔 Those two refused to mix. Try another pair."
];

module.exports = [

    // ==================== 1. JOKE ====================
    {
        command: "joke",
        aliases: ["jokes", "tellmeajoke"],
        category: "fun",
        execute: async (sock, m, { reply }) => {
            try {
                const res = await axios.get('https://v2.jokeapi.dev/joke/Any?type=single');
                const joke = res.data.joke || "Why did the bot cross the road? To get to the other side!";
                reply(`😂 *Joke:*\n\n${joke}`);
            } catch {
                reply("😂 *Joke:*\n\nWhy did the bot go to school? To improve its byte-size knowledge!");
            }
        }
    },

    // ==================== 2. QUOTE ====================
    {
        command: "quote",
        aliases: ["quotes", "inspire"],
        category: "fun",
        execute: async (sock, m, { reply }) => {
            try {
                const res = await axios.get('https://api.quotable.io/random');
                const quote = res.data.content;
                const author = res.data.author;
                reply(`💬 *Quote:*\n\n"${quote}"\n\n— *${author}*`);
            } catch {
                reply(`💬 *Quote:*\n\n"Believe you can and you're halfway there."\n\n— *Theodore Roosevelt*`);
            }
        }
    },

    // ==================== 3. FACT ====================
    {
        command: "fact",
        aliases: ["facts", "funfact"],
        category: "fun",
        execute: async (sock, m, { reply }) => {
            try {
                const res = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
                const fact = res.data.text;
                reply(`📚 *Did you know?*\n\n${fact}`);
            } catch {
                reply("📚 *Fact:*\n\nHoney never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs!");
            }
        }
    },

    // ==================== 4. FLIP (Coin Flip) ====================
    {
        command: "flip",
        aliases: ["coin", "coinflip", "toss"],
        category: "fun",
        execute: async (sock, m, { reply }) => {
            const result = Math.random() < 0.5 ? "🪙 *Heads!*" : "🪙 *Tails!*";
            reply(`🔄 *Coin Flip:*\n\n${result}`);
        }
    },

    // ==================== 5. ROLL (Dice Roll) ====================
    {
        command: "roll",
        aliases: ["dice", "diceroll"],
        category: "fun",
        execute: async (sock, m, { args, reply }) => {
            const sides = parseInt(args[0]) || 6;
            const result = Math.floor(Math.random() * sides) + 1;
            reply(`🎲 *Dice Roll (1-${sides}):*\n\n🔹 ${result}`);
        }
    },

    // ==================== 6. MAGIC 8-BALL ====================
    {
        command: "8ball",
        aliases: ["eightball", "magicball"],
        category: "fun",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Ask a question!\n\n📌 Example: .8ball Will I win?");
            const answers = [
                "It is certain.", "Without a doubt.", "You may rely on it.",
                "Ask again later.", "Cannot predict now.", "Don't count on it.",
                "My sources say no.", "Outlook not so good.", "Yes – definitely!"
            ];
            const answer = answers[Math.floor(Math.random() * answers.length)];
            reply(`🎱 *Magic 8-Ball says:*\n\n${answer}`);
        }
    },

    // ==================== 7. ROCK PAPER SCISSORS ====================
    {
        command: "rps",
        aliases: ["rockpaperscissors"],
        category: "fun",
        execute: async (sock, m, { args, reply }) => {
            const choices = ["rock", "paper", "scissors"];
            const userChoice = args[0]?.toLowerCase();
            if (!userChoice || !choices.includes(userChoice))
                return reply("❌ Choose rock, paper, or scissors!\n\n📌 Example: .rps rock");

            const botChoice = choices[Math.floor(Math.random() * 3)];
            let result;
            if (userChoice === botChoice) result = "🤝 *It's a tie!*";
            else if (
                (userChoice === "rock" && botChoice === "scissors") ||
                (userChoice === "paper" && botChoice === "rock") ||
                (userChoice === "scissors" && botChoice === "paper")
            ) result = "🎉 *You win!*";
            else result = "😢 *Bot wins!*";

            reply(`✊ *You:* ${userChoice}\n🤖 *Bot:* ${botChoice}\n\n${result}`);
        }
    },

    // ==================== 8. SHIP (Love Calculator) ====================
    {
        command: "ship",
        aliases: ["love", "lovecalc"],
        category: "fun",
        execute: async (sock, m, { args, reply }) => {
            let name1, name2;
            if (m.mentionedJid && m.mentionedJid.length >= 2) {
                name1 = m.mentionedJid[0].split('@')[0];
                name2 = m.mentionedJid[1].split('@')[0];
            } else if (m.mentionedJid && m.mentionedJid[0]) {
                name1 = m.sender.split('@')[0];
                name2 = m.mentionedJid[0].split('@')[0];
            } else if (args.length >= 2) {
                name1 = args[0];
                name2 = args[1];
            } else {
                return reply("❌ Tag two people or provide two names!\n\n📌 Example: .ship @user1 @user2");
            }

            const percentage = Math.floor(Math.random() * 101);
            const hearts = '❤️'.repeat(Math.floor(percentage / 20));
            reply(`💕 *Love Calculator*\n\n${name1} + ${name2}\n${hearts} *${percentage}%*`);
        }
    },

    // ==================== 9. HUG ====================
    {
        command: "hug",
        aliases: ["virtualhug"],
        category: "fun",
        execute: async (sock, m, { reply }) => {
            const target = m.mentionedJid?.[0] || m.sender;
            const sender = m.sender.split('@')[0];
            const receiver = target.split('@')[0];
            reply(`🤗 @${sender} gives @${receiver} a big warm hug! 🫂`, { mentions: [m.sender, target] });
        }
    },

    // ==================== 10. COMPLIMENT ====================
    {
        command: "compliment",
        aliases: ["praise", "nice"],
        category: "fun",
        execute: async (sock, m, { reply }) => {
            const compliments = [
                "You light up the room! ✨",
                "Your smile is contagious! 😊",
                "You're one of a kind! 🌟",
                "The world is better with you in it! 🌍",
                "You have a great sense of humor! 😂",
                "You're smarter than you think! 🧠",
                "Your kindness is a gift! 🎁",
                "You're incredibly brave! 💪",
                "You make life fun! 🎉",
                "Your vibes are immaculate! 🥶"
            ];
            const compliment = compliments[Math.floor(Math.random() * compliments.length)];
            reply(`💐 *Compliment:*\n\n${compliment}`);
        }
    },

    // ==================== 11. EMOJIMIX (robust) ====================
    {
        command: "emojimix",
        aliases: ["mixemoji", "emix"],
        category: "fun",
        execute: async (sock, m, { args, reply }) => {
            const fullText = args.join(" ").trim();
            if (!fullText)
                return reply(`🧪 *Emoji Mix*\nCombine two emojis into a sticker.\n\nUsage: .emojimix 😀 😎`);

            // Extract emojis using Unicode property escapes (matches emoji sequences)
            const emojiRegex = /\p{Extended_Pictographic}/gu;
            const emojisFound = [...fullText.matchAll(emojiRegex)].map(m => m[0]);

            if (emojisFound.length < 2)
                return reply(`🧪 *Emoji Mix*\nI need TWO emojis to combine.\n\nUsage: .emojimix 😀 😎`);

            const emoji1 = emojisFound[0];
            const emoji2 = emojisFound[1];

            const url = `https://api.popcat.xyz/emojimix?emoji1=${encodeURIComponent(emoji1)}&emoji2=${encodeURIComponent(emoji2)}`;

            try {
                const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
                const buffer = Buffer.from(res.data);

                const sticker = new Sticker(buffer, {
                    pack: 'Alpha Bot',
                    author: 'EmojiMix',
                    type: 'full',
                    quality: 80
                });
                const stickerBuffer = await sticker.toBuffer();
                await sock.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m });
                reply(emojimixSuccess[Math.floor(Math.random() * emojimixSuccess.length)]);
            } catch (err) {
                console.error("Emojimix error:", err.message);
                reply(emojimixFail[Math.floor(Math.random() * emojimixFail.length)]);
            }
        }
    }

];