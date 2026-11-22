// © 2026 Alpha XMD
// ANIME, MANGA & SFW REACTION COMMANDS

const axios = require("axios");

const API = axios.create({
    timeout: 15000,
    headers: {
        "User-Agent": "Alpha-XMD (https://github.com/Alexio11-09/alpha-xmd)"
    }
});

const JIKAN = "https://api.jikan.moe/v4";
const NEKOS = "https://nekos.best/api/v2";

// ==================== HELPERS ====================

const R = arr => arr[Math.floor(Math.random() * arr.length)];

const clean = (value, max = 350) => {
    if (!value) return "Not available.";
    return String(value).replace(/\s+/g, " ").slice(0, max);
};

const getNekos = async category => {
    const res = await API.get(
        `${NEKOS}/${encodeURIComponent(category)}`
    );

    const result = res.data?.results?.[0];

    if (!result?.url || !/^https:\/\//i.test(result.url)) {
        throw new Error("Invalid API response");
    }

    return result;
};

const getImage = async category => {
    const result = await getNekos(category);

    if (!/\.(png|jpg|jpeg|webp)(\?.*)?$/i.test(result.url)) {
        throw new Error("Expected an image");
    }

    return result;
};

const getGif = async category => {
    const result = await getNekos(category);

    if (!/\.gif(\?.*)?$/i.test(result.url)) {
        throw new Error("Expected an animated GIF");
    }

    return result;
};

const getJikan = async (endpoint, params = {}) => {
    const res = await API.get(`${JIKAN}${endpoint}`, { params });
    return res.data?.data;
};

const sendImage = async (sock, m, url, caption) => {
    return sock.sendMessage(
        m.chat,
        {
            image: { url },
            caption
        },
        { quoted: m }
    );
};

const sendGif = async (sock, m, url, caption) => {
    return sock.sendMessage(
        m.chat,
        {
            video: { url },
            gifPlayback: true,
            caption
        },
        { quoted: m }
    );
};

const sendJikanImage = async (sock, m, item, caption) => {
    const url =
        item?.images?.jpg?.large_image_url ||
        item?.images?.jpg?.image_url ||
        item?.images?.webp?.image_url;

    if (!url) {
        return sock.sendMessage(
            m.chat,
            { text: caption },
            { quoted: m }
        );
    }

    return sendImage(sock, m, url, caption);
};

const reportError = async (reply, command, error) => {
    console.error(
        `[ALPHA XMD] ${command}:`,
        error?.response?.status || "",
        error?.message || error
    );

    if (error?.response?.status === 429) {
        return reply(
            "⏳ API is busy. Please try again shortly."
        );
    }

    if (error?.code === "ECONNABORTED") {
        return reply(
            "⏳ Request timed out. Please try again."
        );
    }

    return reply(
        `❌ ${command} failed. Please try again later.`
    );
};

// ==================== REACTION FACTORY ====================

const reactCmd = (command, category, caption) => ({
    command,
    category: "anime",

    execute: async (sock, m, { reply }) => {
        try {
            const result = await getGif(category);

            await sendGif(
                sock,
                m,
                result.url,
                caption
            );
        } catch (error) {
            await reportError(reply, command, error);
        }
    }
});

// ==================== QUOTES ====================

const animeQuotes = [
    {
        quote: "Hard work is worthless for those that don't believe in themselves.",
        character: "Naruto Uzumaki",
        anime: "Naruto"
    },
    {
        quote: "If you don't take risks, you can't create a future.",
        character: "Monkey D. Luffy",
        anime: "One Piece"
    },
    {
        quote: "A lesson without pain is meaningless.",
        character: "Edward Elric",
        anime: "Fullmetal Alchemist"
    },
    {
        quote: "Knowing you're different is only the beginning.",
        character: "Gintoki Sakata",
        anime: "Gintama"
    },
    {
        quote: "Whatever happens, happens.",
        character: "Spike Spiegel",
        anime: "Cowboy Bebop"
    }
];

// ==================== COMMANDS ====================

module.exports = [

    // 1. WAIFU
    {
        command: "waifu",
        aliases: ["waifuimg"],
        category: "anime",

        execute: async (sock, m, { reply }) => {
            try {
                const result = await getImage("waifu");

                await sendImage(
                    sock,
                    m,
                    result.url,
                    "🌸 *Your Waifu!*"
                );
            } catch (e) {
                await reportError(reply, "waifu", e);
            }
        }
    },

    // 2. NEKO
    {
        command: "neko",
        aliases: ["nekoimg", "catgirl"],
        category: "anime",

        execute: async (sock, m, { reply }) => {
            try {
                const result = await getImage("neko");

                await sendImage(
                    sock,
                    m,
                    result.url,
                    "🐱 *Neko Girl!*"
                );
            } catch (e) {
                await reportError(reply, "neko", e);
            }
        }
    },

    // 3. SHINOBU
    {
        command: "shinobu",
        aliases: ["shinobuimg"],
        category: "anime",

        execute: async (sock, m, { reply }) => {
            try {
                const data = await getJikan("/characters", {
                    q: "Shinobu Kocho",
                    limit: 1
                });

                const ch = data?.[0];

                if (!ch) {
                    return reply("❌ Shinobu was not found.");
                }

                await sendJikanImage(
                    sock,
                    m,
                    ch,
                    `🦋 *${ch.name}*\n\n🔗 ${ch.url}`
                );
            } catch (e) {
                await reportError(reply, "shinobu", e);
            }
        }
    },

    // 4. MEGUMIN
    {
        command: "megumin",
        aliases: ["meguminimg", "explosion"],
        category: "anime",

        execute: async (sock, m, { reply }) => {
            try {
                const data = await getJikan("/characters", {
                    q: "Megumin",
                    limit: 1
                });

                const ch = data?.[0];

                if (!ch) {
                    return reply("❌ Megumin was not found.");
                }

                await sendJikanImage(
                    sock,
                    m,
                    ch,
                    `💥 *${ch.name}*\n\n🔗 ${ch.url}`
                );
            } catch (e) {
                await reportError(reply, "megumin", e);
            }
        }
    },

    // 5. AIZEN
    {
        command: "aizen",
        aliases: ["aizenimg", "sosuke"],
        category: "anime",

        execute: async (sock, m, { reply }) => {
            try {
                const data = await getJikan("/characters", {
                    q: "Sosuke Aizen",
                    limit: 1
                });

                const ch = data?.[0];

                if (!ch) {
                    return reply("❌ Aizen was not found.");
                }

                await sendJikanImage(
                    sock,
                    m,
                    ch,
                    `👓 *${ch.name}*\n\n🔗 ${ch.url}`
                );
            } catch (e) {
                await reportError(reply, "aizen", e);
            }
        }
    },

    // 6. ANIME QUOTE
    {
        command: "animequote",
        aliases: ["aquote", "animeq"],
        category: "anime",

        execute: async (sock, m, { reply }) => {
            const q = R(animeQuotes);

            await reply(
                `💬 *"${q.quote}"*\n\n` +
                `— *${q.character}*\n` +
                `📺 ${q.anime}`
            );
        }
    },

    // 7. ANIME SEARCH
    {
        command: "anime",
        aliases: ["animeinfo", "anisearch"],
        category: "anime",

        execute: async (sock, m, { args, reply }) => {
            if (!args?.length) {
                return reply(
                    "❌ Provide an anime name.\n\n" +
                    "📌 Example: .anime Naruto"
                );
            }

            try {
                const data = await getJikan("/anime", {
                    q: args.join(" "),
                    limit: 1
                });

                const a = data?.[0];

                if (!a) {
                    return reply("❌ Anime not found.");
                }

                const caption =
                    `🎬 *${a.title}*\n\n` +
                    `🇯🇵 Japanese: ${a.title_japanese || "?"}\n` +
                    `⭐ Score: ${a.score || "?"}/10\n` +
                    `📺 Episodes: ${a.episodes ?? "?"}\n` +
                    `🎭 Status: ${a.status || "?"}\n` +
                    `📅 Aired: ${a.aired?.string || "?"}\n\n` +
                    `📝 ${clean(a.synopsis)}\n\n` +
                    `🔗 ${a.url}`;

                await sendJikanImage(sock, m, a, caption);
            } catch (e) {
                await reportError(reply, "anime", e);
            }
        }
    },

    // 8. MANGA SEARCH
    {
        command: "manga",
        aliases: ["mangainfo", "mangasearch"],
        category: "anime",

        execute: async (sock, m, { args, reply }) => {
            if (!args?.length) {
                return reply(
                    "❌ Provide a manga name.\n\n" +
                    "📌 Example: .manga One Piece"
                );
            }

            try {
                const data = await getJikan("/manga", {
                    q: args.join(" "),
                    limit: 1
                });

                const a = data?.[0];

                if (!a) {
                    return reply("❌ Manga not found.");
                }

                const authors =
                    a.authors?.map(x => x.name).join(", ") || "?";

                const caption =
                    `📚 *${a.title}*\n\n` +
                    `⭐ Score: ${a.score || "?"}/10\n` +
                    `📖 Chapters: ${a.chapters ?? "?"}\n` +
                    `📕 Volumes: ${a.volumes ?? "?"}\n` +
                    `📅 Published: ${a.published?.string || "?"}\n` +
                    `✍️ Authors: ${authors}\n\n` +
                    `📝 ${clean(a.synopsis)}\n\n` +
                    `🔗 ${a.url}`;

                await sendJikanImage(sock, m, a, caption);
            } catch (e) {
                await reportError(reply, "manga", e);
            }
        }
    },

    // 9. TOP ANIME
    {
        command: "topanime",
        aliases: ["animetop", "bestanime"],
        category: "anime",

        execute: async (sock, m, { reply }) => {
            try {
                const data = await getJikan(
                    "/top/anime",
                    { limit: 10 }
                );

                if (!data?.length) {
                    return reply("❌ No anime results found.");
                }

                const list = data.map((a, i) =>
                    `${i + 1}. *${a.title}*\n⭐ ${a.score || "?"}/10`
                ).join("\n\n");

                await reply(`🏆 *TOP 10 ANIME*\n\n${list}`);
            } catch (e) {
                await reportError(reply, "topanime", e);
            }
        }
    },

    // 10. TOP MANGA
    {
        command: "topmanga",
        aliases: ["mangatop", "bestmanga"],
        category: "anime",

        execute: async (sock, m, { reply }) => {
            try {
                const data = await getJikan(
                    "/top/manga",
                    { limit: 10 }
                );

                if (!data?.length) {
                    return reply("❌ No manga results found.");
                }

                const list = data.map((a, i) =>
                    `${i + 1}. *${a.title}*\n⭐ ${a.score || "?"}/10`
                ).join("\n\n");

                await reply(`🏆 *TOP 10 MANGA*\n\n${list}`);
            } catch (e) {
                await reportError(reply, "topmanga", e);
            }
        }
    },

    // 11. CHARACTER SEARCH
    {
        command: "character",
        aliases: ["animechar", "char"],
        category: "anime",

        execute: async (sock, m, { args, reply }) => {
            if (!args?.length) {
                return reply(
                    "❌ Provide a character name.\n\n" +
                    "📌 Example: .character Naruto"
                );
            }

            try {
                const data = await getJikan("/characters", {
                    q: args.join(" "),
                    limit: 1
                });

                const ch = data?.[0];

                if (!ch) {
                    return reply("❌ Character not found.");
                }

                const caption =
                    `👤 *${ch.name}*\n\n` +
                    `❤️ Favorites: ${ch.favorites ?? 0}\n\n` +
                    `📝 ${clean(ch.about)}\n\n` +
                    `🔗 ${ch.url}`;

                await sendJikanImage(sock, m, ch, caption);
            } catch (e) {
                await reportError(reply, "character", e);
            }
        }
    },

    // 12. RANDOM ANIME
    {
        command: "randomanime",
        aliases: ["ranime", "surpriseanime"],
        category: "anime",

        execute: async (sock, m, { reply }) => {
            try {
                const a = await getJikan("/random/anime");

                if (!a) {
                    return reply("❌ No random anime found.");
                }

                const caption =
                    `🎲 *${a.title}*\n\n` +
                    `⭐ Score: ${a.score || "?"}/10\n` +
                    `📺 Episodes: ${a.episodes ?? "?"}\n` +
                    `🎭 Status: ${a.status || "?"}\n\n` +
                    `📝 ${clean(a.synopsis)}\n\n` +
                    `🔗 ${a.url}`;

                await sendJikanImage(sock, m, a, caption);
            } catch (e) {
                await reportError(reply, "randomanime", e);
            }
        }
    },

    // 13. SEASONAL ANIME
    {
        command: "seasonal",
        aliases: ["currentanime", "newanime"],
        category: "anime",

        execute: async (sock, m, { reply }) => {
            try {
                const data = await getJikan(
                    "/seasons/now",
                    { limit: 10 }
                );

                if (!data?.length) {
                    return reply("❌ No seasonal anime found.");
                }

                const list = data.slice(0, 10).map((a, i) =>
                    `${i + 1}. *${a.title}*\n⭐ ${a.score || "?"}/10`
                ).join("\n\n");

                await reply(
                    `📺 *CURRENT SEASONAL ANIME*\n\n${list}`
                );
            } catch (e) {
                await reportError(reply, "seasonal", e);
            }
        }
    },

    // 14. HENTAI - SFW ANIME IMAGE
    {
        command: "hentai",
        aliases: ["h", "nsfw"],
        category: "anime",
        group: true,

        execute: async (sock, m, { reply }) => {
            try {
                const result = await getImage("waifu");

                await sendImage(
                    sock,
                    m,
                    result.url,
                    "🌸 *ALPHA XMD ANIME IMAGE*\n\nSFW content."
                );
            } catch (e) {
                await reportError(reply, "hentai", e);
            }
        }
    },

    // 15. HENTAIGIF - SFW ANIMATED GIF
    {
        command: "hentaigif",
        aliases: ["hgif", "nsfwgif"],
        category: "anime",
        group: true,

        execute: async (sock, m, { reply }) => {
            try {
                const result = await getGif("wink");

                await sendGif(
                    sock,
                    m,
                    result.url,
                    `🎞️ *ALPHA XMD ANIME GIF*\n\n` +
                    `📺 Anime: ${result.anime_name || "Unknown"}\n` +
                    `⚡ Powered by Alpha XMD`
                );
            } catch (e) {
                await reportError(reply, "hentaigif", e);
            }
        }
    },

    // ==================== REACTION COMMANDS ====================

    reactCmd("nom", "nom", "🍪 *Nom nom!*"),

    reactCmd("cry", "cry", "😭 *Waah!*"),

    reactCmd("kiss", "kiss", "💋 *Muah!*"),

    reactCmd("pat", "pat", "🫳 *Pat pat!*"),

    reactCmd("wink", "wink", "😉 *Wink!*"),

    reactCmd("facepalm", "facepalm", "🤦‍♀️ *Facepalm!*"),

    reactCmd("hug", "hug", "🤗 *Hug!*"),

    reactCmd("poke", "poke", "👉 *Poke!*"),

    reactCmd("slap", "slap", "👋 *Slap!*"),

    reactCmd("bite", "bite", "😬 *Bite!*")

];