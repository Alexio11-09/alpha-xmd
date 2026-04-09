// © 2026 Alpha - COMPLETE DOWNLOADER (ALL 18 COMMANDS)

const fs = require('fs');
const axios = require('axios');
const ytdl = require('ytdl-core');
const yts = require('yt-search');

const cleanupFile = (filepath) => {
    setTimeout(() => {
        try { fs.unlinkSync(filepath); } catch {}
    }, 300000);
};

const downloadFromUrl = async (url, outputPath, headers = {}) => {
    const writer = fs.createWriteStream(outputPath);
    const response = await axios({ 
        url, 
        method: 'GET', 
        responseType: 'stream', 
        timeout: 120000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ...headers
        }
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};

console.log("✅ Complete Downloader Loaded! (18 Commands)");

module.exports = [

    {
        command: "play",
        aliases: ["song", "music"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a song name!");
            const query = args.join(" ");
            reply(`🎵 *Searching:* ${query}`);
            try {
                const search = await yts(query);
                if (!search.videos || search.videos.length === 0) return reply("❌ No results found.");
                const video = search.videos[0];
                const outputPath = `./temp_play_${Date.now()}.mp3`;
                const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });
                const writer = fs.createWriteStream(outputPath);
                stream.pipe(writer);
                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
                await sock.sendMessage(m.chat, { audio: fs.readFileSync(outputPath), mimetype: "audio/mpeg" }, { quoted: m });
                cleanupFile(outputPath);
            } catch (err) {
                reply("❌ Failed to play song.");
            }
        }
    },
    {
        command: "video",
        aliases: ["vid", "dl", "yt", "ytmp4"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a YouTube link or search query!");
            const input = args.join(" ");
            let url = input;
            if (!input.includes("youtube.com") && !input.includes("youtu.be")) {
                reply(`🔍 *Searching:* ${input}`);
                const search = await yts(input);
                if (!search.videos || search.videos.length === 0) return reply("❌ No results found.");
                url = search.videos[0].url;
            }
            if (!ytdl.validateURL(url)) return reply("❌ Invalid YouTube link!");
            const outputPath = `./temp_video_${Date.now()}.mp4`;
            reply("⏳ *Downloading video...*");
            try {
                const stream = ytdl(url, { filter: 'videoandaudio', quality: '18' });
                const writer = fs.createWriteStream(outputPath);
                stream.pipe(writer);
                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
                await sock.sendMessage(m.chat, { video: fs.readFileSync(outputPath), caption: "✅ Downloaded by Alpha Bot" }, { quoted: m });
                cleanupFile(outputPath);
            } catch (err) {
                reply("❌ Download failed.");
            }
        }
    },
    {
        command: "ytmp3",
        aliases: ["ytaudio", "yta"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a YouTube link!");
            const url = args[0];
            if (!ytdl.validateURL(url)) return reply("❌ Invalid YouTube link!");
            const outputPath = `./temp_audio_${Date.now()}.mp3`;
            reply("🎵 *Downloading MP3...*");
            try {
                const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });
                const writer = fs.createWriteStream(outputPath);
                stream.pipe(writer);
                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
                await sock.sendMessage(m.chat, { audio: fs.readFileSync(outputPath), mimetype: "audio/mpeg" }, { quoted: m });
                cleanupFile(outputPath);
            } catch (err) {
                reply("❌ Download failed.");
            }
        }
    },
    {
        command: "ytmp4",
        aliases: ["ytvideo"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a YouTube link!");
            const url = args[0];
            if (!ytdl.validateURL(url)) return reply("❌ Invalid YouTube link!");
            const outputPath = `./temp_ytmp4_${Date.now()}.mp4`;
            reply("📹 *Downloading YouTube video...*");
            try {
                const stream = ytdl(url, { filter: 'videoandaudio', quality: '18' });
                const writer = fs.createWriteStream(outputPath);
                stream.pipe(writer);
                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
                await sock.sendMessage(m.chat, { video: fs.readFileSync(outputPath), caption: "✅ YouTube Video" }, { quoted: m });
                cleanupFile(outputPath);
            } catch (err) {
                reply("❌ Download failed.");
            }
        }
    },
    {
        command: "tiktok",
        aliases: ["tt", "tiktokdl"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a TikTok link!");
            const url = args[0];
            const outputPath = `./temp_tt_${Date.now()}.mp4`;
            reply("🎵 *Downloading TikTok video...*");
            try {
                const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(url)}`;
                const response = await axios.get(apiUrl);
                if (!response.data || !response.data.data || !response.data.data.play) return reply("❌ Failed to download.");
                await downloadFromUrl(response.data.data.play, outputPath);
                await sock.sendMessage(m.chat, { video: fs.readFileSync(outputPath), caption: "✅ Downloaded from TikTok" }, { quoted: m });
                cleanupFile(outputPath);
            } catch (err) {
                reply("❌ Download failed.");
            }
        }
    },
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
                if (!response.data || !response.data.result || !response.data.result.url) return reply("❌ Failed to download.");
                await downloadFromUrl(response.data.result.url, outputPath);
                await sock.sendMessage(m.chat, { video: fs.readFileSync(outputPath), caption: "✅ Downloaded from Facebook" }, { quoted: m });
                cleanupFile(outputPath);
            } catch (err) {
                reply("❌ Download failed.");
            }
        }
    },
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
                if (!response.data || !response.data.result || !response.data.result[0]) return reply("❌ Failed to get media.");
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
            } catch (err) {
                reply("❌ Download failed.");
            }
        }
    },
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
                if (!response.data || !response.data.result || !response.data.result.link) return reply("❌ Failed to get download link.");
                const downloadUrl = response.data.result.link;
                const fileName = response.data.result.filename || 'file';
                const finalPath = outputPath + '_' + fileName;
                await downloadFromUrl(downloadUrl, finalPath);
                await sock.sendMessage(m.chat, { document: fs.readFileSync(finalPath), fileName: fileName, mimetype: "application/octet-stream" }, { quoted: m });
                cleanupFile(finalPath);
            } catch (err) {
                reply("❌ Download failed.");
            }
        }
    },
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
                if (!response.data || !response.data.result || !response.data.result.url) return reply("❌ Failed to download.");
                await downloadFromUrl(response.data.result.url, outputPath);
                await sock.sendMessage(m.chat, { video: fs.readFileSync(outputPath), caption: "✅ Downloaded from Twitter/X" }, { quoted: m });
                cleanupFile(outputPath);
            } catch (err) {
                reply("❌ Download failed.");
            }
        }
    },
    {
        command: "spotify",
        aliases: ["spotifydl", "spotdl"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a song name!");
            const query = args.join(" ");
            const outputPath = `./temp_spotify_${Date.now()}.mp3`;
            reply("🎧 *Downloading...*");
            try {
                const search = await yts(query);
                if (!search.videos || search.videos.length === 0) return reply("❌ No results found.");
                const video = search.videos[0];
                const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });
                const writer = fs.createWriteStream(outputPath);
                stream.pipe(writer);
                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
                await sock.sendMessage(m.chat, { audio: fs.readFileSync(outputPath), mimetype: "audio/mpeg" }, { quoted: m });
                cleanupFile(outputPath);
            } catch (err) {
                reply("❌ Download failed.");
            }
        }
    },
    {
        command: "soundcloud",
        aliases: ["sc", "scdl"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a song name!");
            const query = args.join(" ");
            const outputPath = `./temp_sc_${Date.now()}.mp3`;
            reply("☁️ *Downloading...*");
            try {
                const search = await yts(query);
                if (!search.videos || search.videos.length === 0) return reply("❌ No results found.");
                const video = search.videos[0];
                const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });
                const writer = fs.createWriteStream(outputPath);
                stream.pipe(writer);
                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
                await sock.sendMessage(m.chat, { audio: fs.readFileSync(outputPath), mimetype: "audio/mpeg" }, { quoted: m });
                cleanupFile(outputPath);
            } catch (err) {
                reply("❌ Download failed.");
            }
        }
    },
    {
        command: "apk",
        aliases: ["app", "apkdl"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide an app name or direct APK link!");
            const input = args[0];
            if (input.includes('.apk') && (input.includes('http') || input.includes('cdn'))) {
                const outputPath = `./temp_apk_${Date.now()}.apk`;
                reply("📱 *Downloading APK...*");
                try {
                    await downloadFromUrl(input, outputPath);
                    await sock.sendMessage(m.chat, { document: fs.readFileSync(outputPath), fileName: "app.apk", mimetype: "application/vnd.android.package-archive" }, { quoted: m });
                    cleanupFile(outputPath);
                } catch (err) {
                    reply("❌ Download failed.");
                }
                return;
            }
            const query = encodeURIComponent(args.join(" "));
            reply(`📱 *APK Search: ${args.join(" ")}*\n\n🔗 https://apkpure.net/search?q=${query}\n\n📌 *Tip:* Copy direct .apk link and use .apk [link]`);
        }
    },
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
                let info = `🎬 *${movie.Title}* (${movie.Year})\n\n`;
                info += `⭐ *IMDb:* ${movie.imdbRating}/10\n⏱️ *Runtime:* ${movie.Runtime}\n🎭 *Genre:* ${movie.Genre}\n👥 *Cast:* ${movie.Actors}\n\n📖 *Plot:* ${movie.Plot}\n\n🔗 https://imdb.com/title/${movie.imdbID}`;
                if (movie.Poster && movie.Poster !== "N/A") {
                    const posterPath = `./temp_poster_${Date.now()}.jpg`;
                    try {
                        await downloadFromUrl(movie.Poster, posterPath);
                        await sock.sendMessage(m.chat, { image: fs.readFileSync(posterPath), caption: info }, { quoted: m });
                        cleanupFile(posterPath);
                    } catch {
                        await sock.sendMessage(m.chat, { text: info }, { quoted: m });
                    }
                } else {
                    await sock.sendMessage(m.chat, { text: info }, { quoted: m });
                }
            } catch (err) {
                reply("❌ Movie search failed.");
            }
        }
    },
    {
        command: "ringtone",
        aliases: ["ring", "tone"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a ringtone name!");
            const query = encodeURIComponent(args.join(" "));
            const outputPath = `./temp_ring_${Date.now()}.mp3`;
            reply(`🔔 *Downloading ringtone: ${args.join(" ")}*`);
            try {
                const apiUrl = `https://api.nyxs.pw/search/zedge?q=${query}&type=ringtone`;
                const response = await axios.get(apiUrl);
                if (!response.data || !response.data.result || response.data.result.length === 0) {
                    return reply(`❌ No ringtone found.\n\n🔗 https://www.zedge.net/find/ringtones/${query}`);
                }
                const ringtone = response.data.result[0];
                const downloadUrl = ringtone.download || ringtone.url;
                if (!downloadUrl) return reply("❌ Download link not available.");
                await downloadFromUrl(downloadUrl, outputPath);
                await sock.sendMessage(m.chat, { audio: fs.readFileSync(outputPath), mimetype: "audio/mpeg", fileName: `${args.join("_")}.mp3` }, { quoted: m });
                cleanupFile(outputPath);
            } catch (err) {
                reply(`🔔 *Ringtone Search*\n\n🔗 https://www.zedge.net/find/ringtones/${query}`);
            }
        }
    },
    {
        command: "wallpaper",
        aliases: ["wall", "wp"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a search query!");
            const query = encodeURIComponent(args.join(" "));
            const outputPath = `./temp_wall_${Date.now()}.jpg`;
            reply(`🖼️ *Downloading wallpaper: ${args.join(" ")}*`);
            try {
                const url = `https://source.unsplash.com/1080x1920/?${query}`;
                await downloadFromUrl(url, outputPath);
                await sock.sendMessage(m.chat, { image: fs.readFileSync(outputPath), caption: `✅ Wallpaper: ${args.join(" ")}` }, { quoted: m });
                cleanupFile(outputPath);
            } catch (err) {
                try {
                    const wallUrl = `https://wallhaven.cc/api/v1/search?q=${query}&sorting=random`;
                    const response = await axios.get(wallUrl);
                    if (response.data && response.data.data && response.data.data.length > 0) {
                        await downloadFromUrl(response.data.data[0].path, outputPath);
                        await sock.sendMessage(m.chat, { image: fs.readFileSync(outputPath), caption: `✅ Wallpaper: ${args.join(" ")}` }, { quoted: m });
                        cleanupFile(outputPath);
                        return;
                    }
                } catch {}
                reply("❌ Failed to fetch wallpaper.");
            }
        }
    },
    {
        command: "pinterest",
        aliases: ["pin", "pint"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a Pinterest link or search query!");
            const input = args[0];
            if (input.includes("pinterest.com") || input.includes("pin.it")) {
                const outputPath = `./temp_pin_${Date.now()}.mp4`;
                reply("📌 *Downloading from Pinterest...*");
                try {
                    const apiUrl = `https://api.nyxs.pw/dl/pinterest?url=${encodeURIComponent(input)}`;
                    const response = await axios.get(apiUrl);
                    if (response.data && response.data.result && response.data.result.url) {
                        await downloadFromUrl(response.data.result.url, outputPath);
                        await sock.sendMessage(m.chat, { video: fs.readFileSync(outputPath), caption: "✅ Downloaded from Pinterest" }, { quoted: m });
                        cleanupFile(outputPath);
                        return;
                    }
                } catch (err) {}
            }
            const query = encodeURIComponent(args.join(" "));
            reply(`📌 *Pinterest Search*\n\n🔗 https://pinterest.com/search/pins/?q=${query}`);
        }
    },
    {
        command: "threads",
        aliases: ["thread", "threadsdl"],
        category: "downloader",
        execute: async (sock, m, { args, reply }) => {
            if (!args[0]) return reply("❌ Provide a Threads link!");
            const url = args[0];
            const outputPath = `./temp_threads_${Date.now()}.mp4`;
            reply("🧵 *Downloading from Threads...*");
            try {
                const apiUrl = `https://api.nyxs.pw/dl/threads?url=${encodeURIComponent(url)}`;
                const response = await axios.get(apiUrl);
                if (!response.data || !response.data.result || !response.data.result[0]) return reply("❌ Failed to download.");
                await downloadFromUrl(response.data.result[0].url, outputPath);
                await sock.sendMessage(m.chat, { video: fs.readFileSync(outputPath), caption: "✅ Downloaded from Threads" }, { quoted: m });
                cleanupFile(outputPath);
            } catch (err) {
                reply("❌ Download failed.");
            }
        }
    },
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
                try {
                    await downloadFromUrl(zipUrl, outputPath);
                } catch {
                    zipUrl = `${url}/archive/refs/heads/master.zip`;
                    await downloadFromUrl(zipUrl, outputPath);
                }
                await sock.sendMessage(m.chat, { document: fs.readFileSync(outputPath), fileName: `${repoName}.zip`, mimetype: "application/zip", caption: `✅ ${userName}/${repoName}` }, { quoted: m });
                cleanupFile(outputPath);
            } catch (err) {
                reply("❌ Download failed. Repo may be private.");
            }
        }
    }

];
```
