// © 2026 Alpha - ANIME & REACTION COMMANDS (COMPLETE)

const axios = require('axios');
const R = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---------- HELPER: fetch image from sfw waifu.pics ----------
const waifuSfw = async (category) => {
    const res = await axios.get(`https://api.waifu.pics/sfw/${category}`);
    return res.data.url;
};

// ---------- HELPER: fetch from nekos.life ----------
const nekosLife = async (endpoint) => {
    const res = await axios.get(`https://nekos.life/api/v2/img/${endpoint}`);
    return res.data.url;
};

// ---------- HELPER: send image with caption ----------
const sendImg = async (sock, m, url, caption) => {
    await sock.sendMessage(m.chat, { image: { url }, caption }, { quoted: m });
};

// ---------- GENERIC REACTION COMMAND FACTORY ----------
const reactCmd = (command, waifuCat, caption) => ({
    command,
    aliases: [command],
    category: "anime",
    execute: async (sock, m, { reply }) => {
        try {
            const url = await waifuSfw(waifuCat);
            await sendImg(sock, m, url, caption);
        } catch {
            try {
                const url = await nekosLife(command);
                await sendImg(sock, m, url, caption);
            } catch {
                reply(`❌ Couldn't fetch ${command} image.`);
            }
        }
    }
});

module.exports = [

    // 1. WAIFU
    { command: "waifu", aliases: ["waifuimg"], category: "anime",
      execute: async (s, m) => { try { const url = await waifuSfw('waifu'); await sendImg(s, m, url, "🌸 Your Waifu!"); } catch(e) { m.reply("❌ Failed"); } }
    },

    // 2. NEKO
    { command: "neko", aliases: ["nekoimg","catgirl"], category: "anime",
      execute: async (s, m) => { try { const url = await waifuSfw('neko'); await sendImg(s, m, url, "🐱 Neko Girl!"); } catch(e) { m.reply("❌ Failed"); } }
    },

    // 3. SHINOBU
    { command: "shinobu", aliases: ["shinobuimg"], category: "anime",
      execute: async (s, m) => { try { const url = await waifuSfw('shinobu'); await sendImg(s, m, url, "🦋 Shinobu Kocho!"); } catch(e) { m.reply("❌ Failed"); } }
    },

    // 4. MEGUMIN
    { command: "megumin", aliases: ["meguminimg","explosion"], category: "anime",
      execute: async (s, m) => { try { const url = await waifuSfw('megumin'); await sendImg(s, m, url, "💥 EXPLOSION! Megumin!"); } catch(e) { m.reply("❌ Failed"); } }
    },

    // 5. AIZEN
    { command: "aizen", aliases: ["aizenimg","sosuke"], category: "anime",
      execute: async (s, m) => {
          try {
              const url = await waifuSfw('aizen');
              await sendImg(s, m, url, "👓 Sosuke Aizen");
          } catch {
              try {
                  const res = await axios.get('https://nekos.best/api/v2/aizen');
                  await sendImg(s, m, res.data.results[0].url, "👓 Sosuke Aizen");
              } catch {
                  m.reply("❌ Failed");
              }
          }
      }
    },

    // 6. ANIME QUOTE
    { command: "animequote", aliases: ["aquote","animeq"], category: "anime",
      execute: async (s, m, { reply }) => {
          try {
              const res = await axios.get('https://animechan.xyz/api/random');
              reply(`💬 *"${res.data.quote}"*\n— *${res.data.character}* (${res.data.anime})`);
          } catch { reply("❌ Failed"); }
      }
    },

    // 7. ANIME INFO
    { command: "anime", aliases: ["animeinfo","anisearch"], category: "anime",
      execute: async (s, m, { args, reply }) => {
          if (!args[0]) return reply("❌ Provide a name.\n📌 .anime Naruto");
          try {
              const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(args.join(" "))}&limit=1`);
              const a = res.data.data[0];
              if (!a) return reply("❌ Not found");
              let txt = `🎬 *${a.title}* (${a.type})\n⭐ ${a.score||'?'}/10\n📺 ${a.episodes||'?'} eps\n🎭 ${a.status}\n📅 ${a.aired?.string||'?'}\n\n${a.synopsis?.substring(0,200)}...\n🔗 ${a.url}`;
              await s.sendMessage(m.chat, { image: { url: a.images.jpg.image_url }, caption: txt }, { quoted: m });
          } catch { reply("❌ Failed"); }
      }
    },

    // 8. MANGA INFO
    { command: "manga", aliases: ["mangainfo","mangasearch"], category: "anime",
      execute: async (s, m, { args, reply }) => {
          if (!args[0]) return reply("❌ Provide a name.\n📌 .manga One Piece");
          try {
              const res = await axios.get(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(args.join(" "))}&limit=1`);
              const a = res.data.data[0];
              if (!a) return reply("❌ Not found");
              let txt = `📚 *${a.title}* (${a.type})\n⭐ ${a.score||'?'}/10\n📖 ${a.chapters||'?'} ch\n📅 ${a.published?.string||'?'}\n✍️ ${a.authors?.map(x=>x.name).join(', ')||'?'}\n\n${a.synopsis?.substring(0,200)}...\n🔗 ${a.url}`;
              await s.sendMessage(m.chat, { image: { url: a.images.jpg.image_url }, caption: txt }, { quoted: m });
          } catch { reply("❌ Failed"); }
      }
    },

    // 9. TOP ANIME
    { command: "topanime", aliases: ["animetop","bestanime"], category: "anime",
      execute: async (s, m, { reply }) => {
          try {
              const res = await axios.get('https://api.jikan.moe/v4/top/anime?limit=10');
              reply(res.data.data.map((a,i)=>`${i+1}. *${a.title}* ⭐ ${a.score}`).join('\n'));
          } catch { reply("❌ Failed"); }
      }
    },

    // 10. TOP MANGA
    { command: "topmanga", aliases: ["mangatop","bestmanga"], category: "anime",
      execute: async (s, m, { reply }) => {
          try {
              const res = await axios.get('https://api.jikan.moe/v4/top/manga?limit=10');
              reply(res.data.data.map((a,i)=>`${i+1}. *${a.title}* ⭐ ${a.score}`).join('\n'));
          } catch { reply("❌ Failed"); }
      }
    },

    // 11. CHARACTER SEARCH
    { command: "character", aliases: ["animechar","char"], category: "anime",
      execute: async (s, m, { args, reply }) => {
          if (!args[0]) return reply("❌ Provide a character name.\n📌 .character Naruto");
          try {
              const res = await axios.get(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(args.join(" "))}&limit=1`);
              const ch = res.data.data[0];
              if (!ch) return reply("❌ Not found");
              let txt = `👤 *${ch.name}*\n📺 ${ch.anime?.map(a=>a.anime.title).slice(0,2).join(', ')||'?'}\n❤️ ${ch.favorites} faves\n\n${ch.about?.substring(0,200)||''}\n🔗 ${ch.url}`;
              await s.sendMessage(m.chat, { image: { url: ch.images.jpg.image_url }, caption: txt }, { quoted: m });
          } catch { reply("❌ Failed"); }
      }
    },

    // 12. RANDOM ANIME
    { command: "randomanime", aliases: ["ranime","surpriseanime"], category: "anime",
      execute: async (s, m, { reply }) => {
          try {
              const res = await axios.get('https://api.jikan.moe/v4/random/anime');
              const a = res.data.data;
              let txt = `🎲 *${a.title}*\n⭐ ${a.score||'?'}/10\n📺 ${a.episodes||'?'} eps\n📖 ${a.synopsis?.substring(0,150)}...\n🔗 ${a.url}`;
              await s.sendMessage(m.chat, { image: { url: a.images.jpg.image_url }, caption: txt }, { quoted: m });
          } catch { reply("❌ Failed"); }
      }
    },

    // 13. SEASONAL ANIME
    { command: "seasonal", aliases: ["currentanime","newanime"], category: "anime",
      execute: async (s, m, { reply }) => {
          try {
              const res = await axios.get('https://api.jikan.moe/v4/seasons/now');
              reply(res.data.data.slice(0,10).map((a,i)=>`${i+1}. *${a.title}* ⭐ ${a.score||'?'}`).join('\n'));
          } catch { reply("❌ Failed"); }
      }
    },

    // 14. HENTAI (NSFW – group only, now with double API)
    {
        command: "hentai",
        aliases: ["h", "nsfw"],
        category: "anime",
        group: true,
        execute: async (sock, m, { reply }) => {
            try {
                // Try waifu.pics NSFW first
                const url = await axios.get('https://api.waifu.pics/nsfw/waifu').then(r => r.data.url);
                await sock.sendMessage(m.chat, { image: { url }, caption: "🔞 *NSFW CONTENT* ⚠️" }, { quoted: m });
            } catch {
                try {
                    // Fallback nekos.life
                    const url = await axios.get('https://nekos.life/api/v2/img/hentai').then(r => r.data.url);
                    await sock.sendMessage(m.chat, { image: { url }, caption: "🔞 *NSFW CONTENT* ⚠️" }, { quoted: m });
                } catch {
                    reply("❌ Failed to fetch adult content. Maybe the APIs are down.");
                }
            }
        }
    },

    // 15. HENTAI GIF (NSFW – group only)
    {
        command: "hentaigif",
        aliases: ["hgif", "nsfwgif"],
        category: "anime",
        group: true,
        execute: async (sock, m, { reply }) => {
            try {
                const url = await axios.get('https://nekos.life/api/v2/img/Random_hentai_gif').then(r => r.data.url);
                await sock.sendMessage(m.chat, { video: { url }, caption: "🔞 *NSFW GIF* ⚠️", gifPlayback: true }, { quoted: m });
            } catch {
                try {
                    // Fallback waifu.pics nsfw/waifu (static, but at least something)
                    const url = await axios.get('https://api.waifu.pics/nsfw/waifu').then(r => r.data.url);
                    await sock.sendMessage(m.chat, { image: { url }, caption: "🔞 *NSFW (static)* ⚠️" }, { quoted: m });
                } catch {
                    reply("❌ Failed to fetch adult content.");
                }
            }
        }
    },

    // ==================== REACTION COMMANDS ====================
    reactCmd("nom", "nom", "🍪 *Nom nom*"),
    reactCmd("cry", "cry", "😭 *Waah!*"),
    reactCmd("kiss", "kiss", "💋 *Muah!*"),
    reactCmd("pat", "pat", "🫳 *Pat pat*"),
    reactCmd("wink", "wink", "😉 *Wink!*"),
    reactCmd("facepalm", "facepalm", "🤦‍♀️ *Facepalm*"),
    reactCmd("hug", "hug", "🤗 *Hug!*"),
    reactCmd("poke", "poke", "👉 *Poke!*"),
    reactCmd("slap", "slap", "👋 *Slap!*"),     // extra if you want
    reactCmd("bite", "bite", "😬 *Bite!*")       // extra
];