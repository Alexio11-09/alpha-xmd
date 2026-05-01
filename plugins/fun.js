
const axios = require('axios');
module.exports = [
  { command: "joke", aliases: ["jokes"], category: "fun",
    execute: async (sock, m, { reply }) => {
      try { const res = await axios.get('https://v2.jokeapi.dev/joke/Any?type=single'); reply(res.data.joke); } catch { reply("Why did the bot stop? It needed a recharge."); }
    }
  },
  { command: "quote", aliases: ["quotes"], category: "fun",
    execute: async (sock, m, { reply }) => {
      try { const res = await axios.get('https://api.quotable.io/random'); reply(`💬 "${res.data.content}" — ${res.data.author}`); } catch { reply("💬 \"Believe you can and you're halfway there.\" — T. Roosevelt"); }
    }
  },
  { command: "fact", aliases: ["facts"], category: "fun",
    execute: async (sock, m, { reply }) => {
      try { const res = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en'); reply(`📚 ${res.data.text}`); } catch { reply("📚 Honey never spoils."); }
    }
  },
  { command: "flip", aliases: ["coin"], category: "fun",
    execute: async (sock, m, { reply }) => { reply(Math.random() < 0.5 ? "🪙 Heads!" : "🪙 Tails!"); }
  },
  { command: "roll", aliases: ["dice"], category: "fun",
    execute: async (sock, m, { args, reply }) => { const sides = parseInt(args[0]) || 6; reply(`🎲 ${Math.floor(Math.random() * sides) + 1}`); }
  },
  { command: "8ball", aliases: ["magicball"], category: "fun",
    execute: async (sock, m, { args, reply }) => { if (!args[0]) return reply("❌ Ask a question!"); const answers = ["Yes","No","Maybe","Ask again"]; reply(`🎱 ${answers[Math.floor(Math.random() * answers.length)]}`); }
  },
  { command: "rps", aliases: ["rockpaperscissors"], category: "fun",
    execute: async (sock, m, { args, reply }) => { const opts = ["rock","paper","scissors"]; const user = args[0]?.toLowerCase(); if (!opts.includes(user)) return reply("❌ Rock, Paper, Scissors?"); const bot = opts[Math.floor(Math.random() * 3)]; reply(`You: ${user} | Bot: ${bot}`); }
  },
  { command: "ship", aliases: ["love"], category: "fun",
    execute: async (sock, m, { args, reply }) => { if (args.length < 2) return reply("❌ .ship name1 name2"); reply(`💕 ${args[0]} + ${args[1]} = ${Math.floor(Math.random() * 101)}%`); }
  },
  { command: "hug", aliases: [], category: "fun",
    execute: async (sock, m, { reply }) => { const sender = m.sender.split('@')[0]; reply(`🤗 @${sender} gives a hug!`, { mentions: [m.sender] }); }
  },
  { command: "compliment", aliases: [], category: "fun",
    execute: async (sock, m, { reply }) => { const c = ["You're awesome!","You light up the room!","Keep being you!"]; reply(`💐 ${c[Math.floor(Math.random() * c.length)]}`); }
  },
  { command: "emojimix", aliases: ["emix"], category: "fun",
    execute: async (sock, m, { args, reply }) => { const text = args.join(" ").trim(); if (!text) return reply("🧪 Usage: .emojimix 😀 😎"); const emojis = [...text.matchAll(/\p{Extended_Pictographic}/gu)].map(m => m[0]); if (emojis.length < 2) return reply("🧪 Need two emojis!"); const url = `https://api.popcat.xyz/emojimix?emoji1=${encodeURIComponent(emojis[0])}&emoji2=${encodeURIComponent(emojis[1])}`; try { const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 }); await sock.sendMessage(m.chat, { image: Buffer.from(res.data), caption: "🧪 Mixed!" }, { quoted: m }); } catch { reply("❌ Couldn't mix those emojis."); } }
  }
];
