// © 2026 Alpha - DOWNLOADERS (WITH WORKING PLAY API)

const fs = require('fs');
const axios = require('axios');
const yts = require('yt-search');

const cleanupFile = (filepath) => {
    setTimeout(() => { try { fs.unlinkSync(filepath); } catch {} }, 300000);
};

const downloadFromUrl = async (url, outputPath) => {
    const writer = fs.createWriteStream(outputPath);
    const response = await axios({ url, method: 'GET', responseType: 'stream', timeout: 120000 });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};

console.log("✅ Downloaders Loaded! (Working PLAY API)");

module.exports = [
    
    // ==================== PLAY (WORKING API VERSION) ====================
    {
        command: "play",
        aliases: ["song", "music"],
        category: "downloader",
        execute: async (sock, m, { args, reply, config }) => {
            const text = args.join(" ");
            if (!text) return reply(`🎧 Usage: .play <song name>\nEx: .play faded alan walker`);
            
            try {
                await sock.sendMessage(m.chat, { react: { text: "🎶", key: m.key } });
                
                const search = await yts(text);
                if (!search.videos.length) {
                    await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                    return reply("❌ No song found");
                }
                
                const vid = search.videos[0];
                await sock.sendMessage(m.chat, { react: { text: "⬇️", key: m.key } });
                
                let data = null;
                
                // API 1
                try {
                    const res1 = await axios.get(`https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(vid.url)}`, { timeout: 10000 });
                    if (res1.data?.status) {
                        data = { title: res1.data.title, thumbnail: res1.data.thumbnail, audio: res1.data.audio };
                    }
                } catch {}
                
                // API 2
                if (!data) {
                    try {
                        const res2 = await axios.get(`https://api.douxx.tech/api/youtube/audio?url=${encodeURIComponent(vid.url)}`, { timeout: 10000 });
                        if (res2.data?.result) {
                            data = { title: res2.data.result.title, thumbnail: res2.data.result.thumbnail, audio: res2.data.result.download };
                        }
                    } catch {}
                }
                
                // API 3
                if (!data) {
                    try {
                        const res3 = await axios.get(`https://api.lolhuman.xyz/api/ytaudio?apikey=GataDios&url=${encodeURIComponent(vid.url)}`, { timeout: 10000 });
                        if (res3.data?.result) {
                            data = { title: res3.data.result.title, thumbnail: res3.data.result.thumbnail, audio: res3.data.result.link };
                        }
                    } catch {}
                }
                
                if (!data || !data.audio) {
                    await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                    return reply("⚠️ All audio servers failed. Try again later.");
                }
                
                const title = data.title || vid.title;
                
                await sock.sendMessage(m.chat, {
                    image: { url: data.thumbnail || vid.thumbnail },
                    caption: `🎵 *${title}*\n\n⬇️ Downloading audio...\n\n👑 Alpha Bot`
                }, { quoted: m });
                
                await sock.sendMessage(m.chat, {
                    audio: { url: data.audio },
                    mimetype: "audio/mpeg",
                    ptt: false,
                    fileName: title.replace(/[^a-zA-Z0-9]/g, "_") + ".mp3"
                }, { quoted: m });
                
                await sock.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
                
            } catch (err) {
                console.log(err);
                await sock.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                reply("❌ Failed to download audio");
            }
        }
    },

    // ==================== TIKTOK ====================
    {
        command: "tiktok",
        aliases: ["tt", "tiktokdl"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a TikTok link!");
            const url = args[0];
            const outputPath = `./temp_tt_${Date.now()}.mp4`;
            reply("🎵 *Downloading TikTok...*");
            try {
                const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(url)}`;
                const response = await axios.get(apiUrl);
                if (!response.data || !response.data.data || !response.data.data.play) return reply("❌ Failed.");
                await downloadFromUrl(response.data.data.play, outputPath);
                await sock.sendMessage(m.chat, { video: fs.readFileSync(outputPath), caption: "✅ Downloaded from TikTok" }, { quoted: m });
                cleanupFile(outputPath);
            } catch (err) { reply("❌ Download failed."); }
        }
    },

    // ==================== FACEBOOK ====================
    {
        command: "fb",
        aliases: ["facebook", "fbdl"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a Facebook video link!");
            const url = args[0];
            const outputPath = `./temp_fb_${Date.now()}.mp4`;
            reply("📘 *Downloading Facebook video...*");
            try {
                const apiUrl = `https://api.nyxs.pw/dl/fb?url=${encodeURIComponent(url)}`;
                const response = await axios.get(apiUrl);
                if (!response.data || !response.data.result || !response.data.result.url) return reply("❌ Failed.");
                await downloadFromUrl(response.data.result.url, outputPath);
                await sock.sendMessage(m.chat, { video: fs.readFileSync(outputPath), caption: "✅ Downloaded from Facebook" }, { quoted: m });
                cleanupFile(outputPath);
            } catch (err) { reply("❌ Download failed."); }
        }
    },

    // ==================== INSTAGRAM ====================
    {
        command: "ig",
        aliases: ["insta", "instagram", "igdl"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide an Instagram link!");
            const url = args[0];
            const outputPath = `./temp_ig_${Date.now()}`;
            reply("📸 *Downloading from Instagram...*");
            try {
                const apiUrl = `https://api.nyxs.pw/dl/ig?url=${encodeURIComponent(url)}`;
                const response = await axios.get(apiUrl);
                if (!response.data || !response.data.result || !response.data.result[0]) return reply("❌ Failed.");
                const mediaUrl = response.data.result[0].url;
                const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('video');
                const finalPath = isVideo ? outputPath + '.mp4' : outputPath + '.jpg';
                await downloadFromUrl(mediaUrl, finalPath);
                if (isVideo) {
                    await sock.sendMessage(m.chat, { video: fs.readFileSync(finalPath), caption: "✅ Downloaded from Instagram" }, { quoted: m });
                } else {
                    await sock.sendMessage(m.chat, { image: fs.readFileSync(finalPath), caption: "✅ Downloaded from Instagram" }, { quoted: m });
                }
                cleanupFile(finalPath);
            } catch (err) { reply("❌ Download failed."); }
        }
    },

    // ==================== MEDIAFIRE ====================
    {
        command: "mediafire",
        aliases: ["mf", "mfdl"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a MediaFire link!");
            const url = args[0];
            const outputPath = `./temp_mf_${Date.now()}`;
            reply("📦 *Downloading from MediaFire...*");
            try {
                const apiUrl = `https://api.nyxs.pw/dl/mediafire?url=${encodeURIComponent(url)}`;
                const response = await axios.get(apiUrl);
                if (!response.data || !response.data.result || !response.data.result.link) return reply("❌ Failed.");
                const downloadUrl = response.data.result.link;
                const fileName = response.data.result.filename || 'file';
                const finalPath = outputPath + '_' + fileName;
                await downloadFromUrl(downloadUrl, finalPath);
                await sock.sendMessage(m.chat, { document: fs.readFileSync(finalPath), fileName: fileName, mimetype: "application/octet-stream" }, { quoted: m });
                cleanupFile(finalPath);
            } catch (err) { reply("❌ Download failed."); }
        }
    },

    // ==================== TWITTER/X ====================
    {
        command: "twitter",
        aliases: ["x", "tw", "tweet"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a Twitter/X link!");
            const url = args[0];
            const outputPath = `./temp_tw_${Date.now()}.mp4`;
            reply("🐦 *Downloading Twitter video...*");
            try {
                const apiUrl = `https://api.nyxs.pw/dl/twitter?url=${encodeURIComponent(url)}`;
                const response = await axios.get(apiUrl);
                if (!response.data || !response.data.result || !response.data.result.url) return reply("❌ Failed.");
                await downloadFromUrl(response.data.result.url, outputPath);
                await sock.sendMessage(m.chat, { video: fs.readFileSync(outputPath), caption: "✅ Downloaded from Twitter/X" }, { quoted: m });
                cleanupFile(outputPath);
            } catch (err) { reply("❌ Download failed."); }
        }
    },

    // ==================== APK ====================
    {
        command: "apk",
        aliases: ["app", "apkdl"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide an app name or direct APK link!");
            const input = args[0];
            if (input.includes('.apk') && input.includes('http')) {
                const outputPath = `./temp_apk_${Date.now()}.apk`;
                reply("📱 *Downloading APK...*");
                try {
                    await downloadFromUrl(input, outputPath);
                    await sock.sendMessage(m.chat, { document: fs.readFileSync(outputPath), fileName: "app.apk", mimetype: "application/vnd.android.package-archive" }, { quoted: m });
                    cleanupFile(outputPath);
                } catch (err) { reply("❌ Download failed."); }
                return;
            }
            const query = encodeURIComponent(args.join(" "));
            reply(`📱 *APK Search*\n\n🔗 https://apkpure.net/search?q=${query}`);
        }
    },

    // ==================== MOVIE ====================
    {
        command: "movie",
        aliases: ["film", "moviesearch"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a movie name!");
            const query = encodeURIComponent(args.join(" "));
            reply(`🎬 *Searching: ${args.join(" ")}*`);
            try {
                const response = await axios.get(`http://www.omdbapi.com/?t=${query}&apikey=thewdb`);
                if (response.data.Response === "False") return reply("❌ Movie not found.");
                const movie = response.data;
                let info = `🎬 *${movie.Title}* (${movie.Year})\n\n⭐ IMDb: ${movie.imdbRating}/10\n⏱️ Runtime: ${movie.Runtime}\n🎭 Genre: ${movie.Genre}\n👥 Cast: ${movie.Actors}\n\n📖 ${movie.Plot}\n\n🔗 https://imdb.com/title/${movie.imdbID}`;
                if (movie.Poster && movie.Poster !== "N/A") {
                    const posterPath = `./temp_poster_${Date.now()}.jpg`;
                    try {
                        await downloadFromUrl(movie.Poster, posterPath);
                        await sock.sendMessage(m.chat, { image: fs.readFileSync(posterPath), caption: info }, { quoted: m });
                        cleanupFile(posterPath);
                    } catch { await sock.sendMessage(m.chat, { text: info }, { quoted: m }); }
                } else { await sock.sendMessage(m.chat, { text: info }, { quoted: m }); }
            } catch (err) { reply("❌ Movie search failed."); }
        }
    },

    // ==================== WALLPAPER ====================
    {
        command: "wallpaper",
        aliases: ["wall", "wp"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a search query!");
            const query = encodeURIComponent(args.join(" "));
            const outputPath = `./temp_wall_${Date.now()}.jpg`;
            reply(`🖼️ *Downloading wallpaper...*`);
            try {
                await downloadFromUrl(`https://source.unsplash.com/1080x1920/?${query}`, outputPath);
                await sock.sendMessage(m.chat, { image: fs.readFileSync(outputPath), caption: `✅ Wallpaper: ${args.join(" ")}` }, { quoted: m });
                cleanupFile(outputPath);
            } catch (err) { reply("❌ Failed to fetch wallpaper."); }
        }
    },

    // ==================== GITCLONE ====================
    {
        command: "gitclone",
        aliases: ["git", "clone", "github"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a GitHub repo link!");
            let url = args[0].replace(/\/$/, '');
            if (!url.includes("github.com")) return reply("❌ Invalid GitHub link!");
            const parts = url.split('/');
            const repoName = parts[parts.length - 1];
            const userName = parts[parts.length - 2];
            const outputPath = `./temp_git_${Date.now()}.zip`;
            reply(`📦 *Downloading ${userName}/${repoName}...*`);
            try {
                let zipUrl = `${url}/archive/refs/heads/main.zip`;
                try { await downloadFromUrl(zipUrl, outputPath); } catch { zipUrl = `${url}/archive/refs/heads/master.zip`; await downloadFromUrl(zipUrl, outputPath); }
                await sock.sendMessage(m.chat, { document: fs.readFileSync(outputPath), fileName: `${repoName}.zip`, mimetype: "application/zip", caption: `✅ ${userName}/${repoName}` }, { quoted: m });
                cleanupFile(outputPath);
            } catch (err) { reply("❌ Download failed."); }
        }
    }

];