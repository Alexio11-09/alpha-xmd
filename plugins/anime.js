// © 2026 Alpha - ANIME COMMANDS (15 COMMANDS)

const axios = require('axios');

module.exports = [

    // ==================== 1. WAIFU ====================
    {
        command: "waifu",
        aliases: ["waifuimg"],
        category: "anime",
        execute: async (sock, m, { reply }) => {
            try {
                const response = await axios.get('https://api.waifu.pics/sfw/waifu');
                const url = response.data.url;
                
                await sock.sendMessage(m.chat, {
                    image: { url },
                    caption: "🌸 *Your Waifu!*"
                }, { quoted: m });
                
            } catch (err) {
                reply("❌ Failed to fetch waifu image.");
            }
        }
    },

    // ==================== 2. NEKO ====================
    {
        command: "neko",
        aliases: ["nekoimg", "catgirl"],
        category: "anime",
        execute: async (sock, m, { reply }) => {
            try {
                const response = await axios.get('https://api.waifu.pics/sfw/neko');
                const url = response.data.url;
                
                await sock.sendMessage(m.chat, {
                    image: { url },
                    caption: "🐱 *Neko Girl!*"
                }, { quoted: m });
                
            } catch (err) {
                reply("❌ Failed to fetch neko image.");
            }
        }
    },

    // ==================== 3. SHINOBU ====================
    {
        command: "shinobu",
        aliases: ["shinobuimg"],
        category: "anime",
        execute: async (sock, m, { reply }) => {
            try {
                const response = await axios.get('https://api.waifu.pics/sfw/shinobu');
                const url = response.data.url;
                
                await sock.sendMessage(m.chat, {
                    image: { url },
                    caption: "🦋 *Shinobu Kocho!*"
                }, { quoted: m });
                
            } catch (err) {
                reply("❌ Failed to fetch shinobu image.");
            }
        }
    },

    // ==================== 4. MEGUMIN ====================
    {
        command: "megumin",
        aliases: ["meguminimg", "explosion"],
        category: "anime",
        execute: async (sock, m, { reply }) => {
            try {
                const response = await axios.get('https://api.waifu.pics/sfw/megumin');
                const url = response.data.url;
                
                await sock.sendMessage(m.chat, {
                    image: { url },
                    caption: "💥 *EXPLOSION! Megumin!*"
                }, { quoted: m });
                
            } catch (err) {
                reply("❌ Failed to fetch megumin image.");
            }
        }
    },

    // ==================== 5. AIZEN ====================
    {
        command: "aizen",
        aliases: ["aizenimg", "sosuke"],
        category: "anime",
        execute: async (sock, m, { reply }) => {
            try {
                const response = await axios.get('https://api.waifu.pics/sfw/aizen');
                const url = response.data.url;
                
                await sock.sendMessage(m.chat, {
                    image: { url },
                    caption: "👓 *Sosuke Aizen - Since when were you under the impression I wasn't using Kyoka Suigetsu?*"
                }, { quoted: m });
                
            } catch (err) {
                try {
                    const res = await axios.get('https://nekos.best/api/v2/aizen');
                    const url = res.data.results[0].url;
                    await sock.sendMessage(m.chat, { image: { url }, caption: "👓 *Sosuke Aizen*" }, { quoted: m });
                } catch {
                    reply("❌ Failed to fetch Aizen image.");
                }
            }
        }
    },

    // ==================== 6. ANIME QUOTE ====================
    {
        command: "animequote",
        aliases: ["aquote", "animeq"],
        category: "anime",
        execute: async (sock, m, { reply }) => {
            try {
                const response = await axios.get('https://animechan.xyz/api/random');
                const data = response.data;
                
                let text = `💬 *ANIME QUOTE*\n\n`;
                text += `"${data.quote}"\n\n`;
                text += `— *${data.character}*\n`;
                text += `📺 *${data.anime}*`;
                
                reply(text);
                
            } catch (err) {
                reply("❌ Failed to fetch anime quote.");
            }
        }
    },

    // ==================== 7. ANIME SEARCH ====================
    {
        command: "anime",
        aliases: ["animeinfo", "anisearch"],
        category: "anime",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide an anime name!\n\n📌 Example: .anime Naruto");
            
            const query = encodeURIComponent(args.join(" "));
            
            try {
                const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${query}&limit=1`);
                const anime = response.data.data[0];
                
                if (!anime) return reply("❌ Anime not found!");
                
                let text = `🎬 *${anime.title}* (${anime.type})\n\n`;
                text += `⭐ *Score:* ${anime.score || 'N/A'}/10\n`;
                text += `📺 *Episodes:* ${anime.episodes || 'Ongoing'}\n`;
                text += `🎭 *Status:* ${anime.status}\n`;
                text += `📅 *Aired:* ${anime.aired?.string || 'Unknown'}\n`;
                text += `🎬 *Studios:* ${anime.studios?.map(s => s.name).join(', ') || 'Unknown'}\n`;
                text += `🔞 *Rating:* ${anime.rating || 'N/A'}\n\n`;
                text += `📖 *Synopsis:* ${anime.synopsis?.substring(0, 200)}...\n\n`;
                text += `🔗 ${anime.url}`;
                
                await sock.sendMessage(m.chat, {
                    image: { url: anime.images.jpg.image_url },
                    caption: text
                }, { quoted: m });
                
            } catch (err) {
                reply("❌ Failed to fetch anime info.");
            }
        }
    },

    // ==================== 8. MANGA SEARCH ====================
    {
        command: "manga",
        aliases: ["mangainfo", "mangasearch"],
        category: "anime",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a manga name!\n\n📌 Example: .manga One Piece");
            
            const query = encodeURIComponent(args.join(" "));
            
            try {
                const response = await axios.get(`https://api.jikan.moe/v4/manga?q=${query}&limit=1`);
                const manga = response.data.data[0];
                
                if (!manga) return reply("❌ Manga not found!");
                
                let text = `📚 *${manga.title}* (${manga.type})\n\n`;
                text += `⭐ *Score:* ${manga.score || 'N/A'}/10\n`;
                text += `📖 *Chapters:* ${manga.chapters || 'Ongoing'}\n`;
                text += `📚 *Volumes:* ${manga.volumes || 'Ongoing'}\n`;
                text += `🎭 *Status:* ${manga.status}\n`;
                text += `📅 *Published:* ${manga.published?.string || 'Unknown'}\n`;
                text += `✍️ *Authors:* ${manga.authors?.map(a => a.name).join(', ') || 'Unknown'}\n`;
                text += `🔞 *Rating:* ${manga.rating || 'N/A'}\n\n`;
                text += `📖 *Synopsis:* ${manga.synopsis?.substring(0, 200)}...\n\n`;
                text += `🔗 ${manga.url}`;
                
                await sock.sendMessage(m.chat, {
                    image: { url: manga.images.jpg.image_url },
                    caption: text
                }, { quoted: m });
                
            } catch (err) {
                reply("❌ Failed to fetch manga info.");
            }
        }
    },

    // ==================== 9. TOP ANIME ====================
    {
        command: "topanime",
        aliases: ["animetop", "bestanime"],
        category: "anime",
        execute: async (sock, m, { reply }) => {
            try {
                const response = await axios.get('https://api.jikan.moe/v4/top/anime?limit=10');
                const animes = response.data.data;
                
                let text = `🏆 *TOP 10 ANIME*\n\n`;
                animes.forEach((anime, i) => {
                    text += `${i+1}. *${anime.title}*\n`;
                    text += `   ⭐ ${anime.score}/10 | 📺 ${anime.episodes || '?'} eps\n\n`;
                });
                
                reply(text);
                
            } catch (err) {
                reply("❌ Failed to fetch top anime.");
            }
        }
    },

    // ==================== 10. TOP MANGA ====================
    {
        command: "topmanga",
        aliases: ["mangatop", "bestmanga"],
        category: "anime",
        execute: async (sock, m, { reply }) => {
            try {
                const response = await axios.get('https://api.jikan.moe/v4/top/manga?limit=10');
                const mangas = response.data.data;
                
                let text = `🏆 *TOP 10 MANGA*\n\n`;
                mangas.forEach((manga, i) => {
                    text += `${i+1}. *${manga.title}*\n`;
                    text += `   ⭐ ${manga.score}/10 | 📖 ${manga.chapters || '?'} ch\n\n`;
                });
                
                reply(text);
                
            } catch (err) {
                reply("❌ Failed to fetch top manga.");
            }
        }
    },

    // ==================== 11. CHARACTER SEARCH ====================
    {
        command: "character",
        aliases: ["animechar", "char"],
        category: "anime",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a character name!\n\n📌 Example: .character Naruto");
            
            const query = encodeURIComponent(args.join(" "));
            
            try {
                const response = await axios.get(`https://api.jikan.moe/v4/characters?q=${query}&limit=1`);
                const char = response.data.data[0];
                
                if (!char) return reply("❌ Character not found!");
                
                let text = `👤 *${char.name}*\n\n`;
                text += `📺 *Anime:* ${char.anime?.map(a => a.anime.title).slice(0, 3).join(', ') || 'N/A'}\n`;
                text += `📚 *Manga:* ${char.manga?.map(m => m.manga.title).slice(0, 3).join(', ') || 'N/A'}\n`;
                text += `❤️ *Favorites:* ${char.favorites || 0}\n\n`;
                text += `📖 *About:* ${char.about?.substring(0, 200) || 'No description available'}...\n\n`;
                text += `🔗 ${char.url}`;
                
                await sock.sendMessage(m.chat, {
                    image: { url: char.images.jpg.image_url },
                    caption: text
                }, { quoted: m });
                
            } catch (err) {
                reply("❌ Failed to fetch character info.");
            }
        }
    },

    // ==================== 12. RANDOM ANIME ====================
    {
        command: "randomanime",
        aliases: ["ranime", "surpriseanime"],
        category: "anime",
        execute: async (sock, m, { reply }) => {
            try {
                const response = await axios.get('https://api.jikan.moe/v4/random/anime');
                const anime = response.data.data;
                
                let text = `🎲 *RANDOM ANIME*\n\n`;
                text += `🎬 *${anime.title}*\n`;
                text += `⭐ Score: ${anime.score || 'N/A'}/10\n`;
                text += `📺 Episodes: ${anime.episodes || 'Ongoing'}\n`;
                text += `🎭 Status: ${anime.status}\n\n`;
                text += `📖 ${anime.synopsis?.substring(0, 150)}...\n\n`;
                text += `🔗 ${anime.url}`;
                
                await sock.sendMessage(m.chat, {
                    image: { url: anime.images.jpg.image_url },
                    caption: text
                }, { quoted: m });
                
            } catch (err) {
                reply("❌ Failed to fetch random anime.");
            }
        }
    },

    // ==================== 13. SEASONAL ANIME ====================
    {
        command: "seasonal",
        aliases: ["currentanime", "newanime"],
        category: "anime",
        execute: async (sock, m, { reply }) => {
            try {
                const response = await axios.get('https://api.jikan.moe/v4/seasons/now');
                const animes = response.data.data.slice(0, 10);
                
                let text = `📅 *CURRENT SEASON ANIME*\n\n`;
                animes.forEach((anime, i) => {
                    text += `${i+1}. *${anime.title}*\n`;
                    text += `   ⭐ ${anime.score || '?'} | 📺 ${anime.episodes || '?'} eps\n`;
                    text += `   🎭 ${anime.genres?.map(g => g.name).slice(0, 2).join(', ') || 'N/A'}\n\n`;
                });
                
                reply(text);
                
            } catch (err) {
                reply("❌ Failed to fetch seasonal anime.");
            }
        }
    },

    // ==================== 14. HENTAI (NSFW - GROUP ONLY) ====================
    {
        command: "hentai",
        aliases: ["h", "nsfw"],
        category: "anime",
        group: true, // Only works in groups
        execute: async (sock, m, { reply }) => {
            try {
                // Using waifu.pics NSFW endpoint
                const response = await axios.get('https://api.waifu.pics/nsfw/waifu');
                const url = response.data.url;
                
                await sock.sendMessage(m.chat, {
                    image: { url },
                    caption: "🔞 *NSFW CONTENT*\n\n⚠️ Age restricted content.",
                    viewOnce: true // Makes it view once for privacy
                }, { quoted: m });
                
            } catch (err) {
                // Fallback to nekos.life API
                try {
                    const res = await axios.get('https://nekos.life/api/v2/img/hentai');
                    const url = res.data.url;
                    
                    await sock.sendMessage(m.chat, {
                        image: { url },
                        caption: "🔞 *NSFW CONTENT*\n\n⚠️ Age restricted content.",
                        viewOnce: true
                    }, { quoted: m });
                } catch {
                    reply("❌ Failed to fetch content.");
                }
            }
        }
    },

    // ==================== 15. HENTAI GIF (NSFW - GROUP ONLY) ====================
    {
        command: "hentaigif",
        aliases: ["hgif", "nsfwgif"],
        category: "anime",
        group: true, // Only works in groups
        execute: async (sock, m, { reply }) => {
            try {
                const response = await axios.get('https://nekos.life/api/v2/img/Random_hentai_gif');
                const url = response.data.url;
                
                await sock.sendMessage(m.chat, {
                    video: { url },
                    caption: "🔞 *NSFW GIF*\n\n⚠️ Age restricted content.",
                    gifPlayback: true,
                    viewOnce: true
                }, { quoted: m });
                
            } catch (err) {
                reply("❌ Failed to fetch content.");
            }
        }
    }

];