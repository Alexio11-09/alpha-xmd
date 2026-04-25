const fs = require('fs'), axios = require('axios'), yts = require('yt-search'), ytdl = require('ytdl-core');
const cleanup = f => setTimeout(() => { try { fs.unlinkSync(f) } catch {} }, 300000);
const dl = async (url, out) => {
    const w = fs.createWriteStream(out);
    const r = await axios({ url, method:'GET', responseType:'stream', timeout:120000, headers:{'User-Agent':'Mozilla/5.0'} });
    r.data.pipe(w);
    return new Promise((resolve, reject) => { w.on('finish', resolve); w.on('error', reject); });
};
const buf = async url => Buffer.from((await axios.get(url, { responseType:'arraybuffer', timeout:15000 })).data);
const brand = c => ({ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:c.newsletter.id+"@newsletter", newsletterName:c.newsletter.name } });
const R = arr => arr[Math.floor(Math.random()*arr.length)];

module.exports = [
    // 1. PLAY (unchanged)
    { command: "play", aliases: ["song","music"], category: "downloader",
      execute: async (s, m, { args, reply, config }) => {
          const t = args.join(" "); if(!t) return reply("❌ Use .play song name");
          try {
              await s.sendMessage(m.chat, { react: { text:"🎶", key:m.key } });
              const sr = await yts(t); if(!sr.videos.length) { await s.sendMessage(m.chat, { react:{ text:"❌", key:m.key } }); return reply("❌ No song found"); }
              const v = sr.videos[0]; await s.sendMessage(m.chat, { react:{ text:"⬇️", key:m.key } });
              let d = null;
              for(let api of [`https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(v.url)}`, `https://api.douxx.tech/api/youtube/audio?url=${encodeURIComponent(v.url)}`, `https://api.lolhuman.xyz/api/ytaudio?apikey=GataDios&url=${encodeURIComponent(v.url)}`]) {
                  try {
                      const r = await axios.get(api, { timeout:10000 });
                      if(r.data?.status) d={ title:r.data.title, thumb:r.data.thumbnail, audio:r.data.audio };
                      else if(r.data?.result) d={ title:r.data.result.title, thumb:r.data.result.thumbnail, audio:r.data.result.download||r.data.result.link };
                      if(d) break;
                  } catch {}
              }
              if(!d||!d.audio) { await s.sendMessage(m.chat, { react:{ text:"❌", key:m.key } }); return reply("⚠️ All servers failed"); }
              const ctx = brand(config);
              await s.sendMessage(m.chat, { image:{ url: d.thumb||v.thumbnail }, caption:`🎵 *${d.title||v.title}*\n\n⬇️ Downloading audio...\n\n👑 ${config.settings.title}`, contextInfo:ctx }, { quoted:m });
              await s.sendMessage(m.chat, { audio:{ url:d.audio }, mimetype:"audio/mpeg", ptt:!1, fileName:(d.title||v.title).replace(/[^a-zA-Z0-9]/g,"_")+".mp3", contextInfo:{ externalAdReply:{ title:d.title||v.title, body:`🎧 ${config.settings.title}`, thumbnailUrl:d.thumb||v.thumbnail, mediaType:1 } } }, { quoted:m });
              await s.sendMessage(m.chat, { react:{ text:"✅", key:m.key } });
          } catch { await s.sendMessage(m.chat, { react:{ text:"❌", key:m.key } }); reply("❌ Failed"); }
      }
    },

    // 2. VIDEO — FIXED AND WORKING
    { command: "video", aliases: ["vid","dl","yt"], category: "downloader",
      execute: async (s, m, { args, reply, config }) => {
          if(!args[0]) return reply("❌ Provide a search query or link!\n📌 .video god's plan drake");
          const input = args.join(" "); let url = input;
          const isLink = /youtube\.com|youtu\.be|facebook\.com|fb\.watch|instagram\.com|tiktok\.com|twitter\.com|x\.com/i.test(input);
          if(!isLink) {
              reply(`🔍 *Searching:* ${input}`);
              const sr = await yts(input); if(!sr.videos?.length) return reply("❌ No results");
              url = sr.videos[0].url;
              reply(`📹 *${sr.videos[0].title}*\n⏳ Downloading video...`);
          } else reply("📹 *Downloading video...");
          const out = `./temp_vid_${Date.now()}.mp4`;
          let success = false;
          // YouTube handling with timeout
          if(/youtube\.com|youtu\.be/.test(url)) {
              try {
                  const stream = ytdl(url, { filter:'videoandaudio', quality:'18' });
                  const writer = fs.createWriteStream(out);
                  stream.pipe(writer);
                  await new Promise((resolve, reject) => {
                      const timer = setTimeout(() => reject(new Error('Timeout')), 60000);
                      writer.on('finish', () => { clearTimeout(timer); resolve(); });
                      writer.on('error', err => { clearTimeout(timer); reject(err); });
                  });
                  if(fs.existsSync(out) && fs.statSync(out).size > 0) success = true;
              } catch {}
          }
          // fallback generic downloader (for non‑YouTube or if ytdl failed)
          if(!success && isLink) {
              const apis = [
                  `https://api.nyxs.pw/dl/video?url=${encodeURIComponent(url)}`,
                  `https://api.photooxy.com/dl/video?url=${encodeURIComponent(url)}`,
                  `https://api.lolhuman.xyz/api/video?apikey=GataDios&url=${encodeURIComponent(url)}`
              ];
              for(let api of apis) {
                  try {
                      const r = await axios.get(api, { timeout:15000 });
                      let vidUrl = r.data?.result?.url || r.data?.url;
                      if(vidUrl) {
                          await dl(vidUrl, out);
                          if(fs.existsSync(out) && fs.statSync(out).size>0) { success = true; break; }
                      }
                  } catch {}
              }
          }
          if(success) {
              const ctx = brand(config);
              await s.sendMessage(m.chat, { video: fs.readFileSync(out), caption: "✅ Downloaded by Alpha Bot", contextInfo: ctx }, { quoted: m });
              cleanup(out);
          } else {
              reply("❌ Video download failed. Try another link or a shorter search term.");
          }
      }
    },

    // 3. TIKTOK (unchanged)
    { command: "tiktok", aliases: ["tt","tiktokdl"], category: "downloader",
      execute: async (s, m, { args, reply, config }) => {
          if(!args[0]) return reply("❌ Provide a TikTok link!");
          const out = `./temp_tt_${Date.now()}.mp4`; reply("🎵 *Downloading TikTok...*");
          try {
              const r = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(args[0])}`);
              if(r.data?.data?.play) {
                  await dl(r.data.data.play, out);
                  const ctx = brand(config);
                  await s.sendMessage(m.chat, { video: fs.readFileSync(out), caption: "✅ Downloaded from TikTok", contextInfo: ctx }, { quoted: m });
                  cleanup(out);
              } else reply("❌ Failed");
          } catch { reply("❌ Download failed"); }
      }
    },

    // 4. GITCLONE (unchanged)
    { command: "gitclone", aliases: ["git","clone","github"], category: "downloader",
      execute: async (s, m, { args, reply }) => {
          if(!args[0]) return reply("❌ Provide a GitHub repo link!");
          let url = args[0].replace(/\/$/,''); if(!url.includes("github.com")) return reply("❌ Invalid GitHub link!");
          const parts = url.split('/'), repo = parts[parts.length-1], user = parts[parts.length-2];
          const out = `./temp_git_${Date.now()}.zip`; reply(`📦 *Downloading ${user}/${repo}...*`);
          try {
              let z = `${url}/archive/refs/heads/main.zip`;
              try { await dl(z, out); } catch { z = `${url}/archive/refs/heads/master.zip`; await dl(z, out); }
              await s.sendMessage(m.chat, { document: fs.readFileSync(out), fileName:`${repo}.zip`, mimetype:"application/zip", caption:`✅ ${user}/${repo}` }, { quoted:m });
              cleanup(out);
          } catch { reply("❌ Download failed"); }
      }
    },

    // 5. MOVIE (unchanged)
    { command: "movie", aliases: ["film","moviesearch"], category: "downloader",
      execute: async (s, m, { args, reply }) => {
          if(!args[0]) return reply("❌ Provide a movie name!");
          const q = args.join(" "); reply(`🎬 *Searching movie...*`);
          try {
              const om = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(q)}&apikey=thewdb`);
              if(om.data.Response==="False") return reply("❌ Movie not found");
              const mv = om.data;
              let info = `🎬 *${mv.Title}* (${mv.Year})\n⭐ ${mv.imdbRating}/10\n🎭 ${mv.Genre}\n👥 ${mv.Actors}\n\n📖 ${mv.Plot}\n\n`;
              info += `🔗 IMDB: https://imdb.com/title/${mv.imdbID}`;
              if(mv.Poster!=="N/A") await s.sendMessage(m.chat, { image:{ url: mv.Poster }, caption: info }, { quoted:m });
              else await s.sendMessage(m.chat, { text: info }, { quoted:m });
          } catch { reply("❌ Movie search failed"); }
      }
    },

    // 6. APK (unchanged)
    { command: "apk", aliases: ["app","apkdl"], category: "downloader",
      execute: async (s, m, { args, reply }) => {
          if(!args[0]) return reply("❌ Provide an app name!\n📌 .apk WhatsApp");
          const q = args.join(" "); reply(`📱 *Searching APK: ${q}*`);
          try {
              const sr = await axios.get(`https://apkcombo.com/apk-downloader/?q=${encodeURIComponent(q)}`, { headers:{'User-Agent':'Mozilla/5.0'} });
              const m1 = sr.data.match(/href="(https:\/\/apkcombo\.com\/api\/apk-download\?id=[^"]+)/);
              if(m1) {
                  const ar = await axios.get(m1[1]);
                  const m2 = ar.data.match(/href="(https:\/\/apk\.apkcombo\.com\/[^"]+)"/);
                  if(m2) {
                      const dlink = m2[1]; reply(`📱 *Downloading APK*: ${q}`);
                      const out = `./temp_apk_${Date.now()}.apk`;
                      await dl(dlink, out);
                      if(fs.statSync(out).size > 104857600) reply(`📱 *APK too large (>100MB)*\n\n🔗 ${dlink}`);
                      else { await s.sendMessage(m.chat, { document: fs.readFileSync(out), fileName:`${q.replace(/ /g,'_')}.apk`, mimetype:"application/vnd.android.package-archive" }, { quoted:m }); cleanup(out); }
                      return;
                  }
              }
              reply(`❌ APK not found.\n🔗 https://apkcombo.com/search?q=${encodeURIComponent(q)}`);
          } catch { reply(`❌ Failed. Search: https://apkcombo.com/search?q=${encodeURIComponent(q)}`); }
      }
    },

    // 7. WALLPAPER (unchanged)
    { command: "wallpaper", aliases: ["wall","wp"], category: "downloader",
      execute: async (s, m, { args, reply }) => {
          if(!args[0]) return reply("❌ Provide a search query!");
          const q = args.join(" "); reply(`🖼️ *Fetching wallpaper...*`);
          try {
              const b = await buf(`https://source.unsplash.com/1080x1920/?${encodeURIComponent(q)}`);
              await s.sendMessage(m.chat, { image: Buffer.from(b), caption:`✅ Wallpaper: ${q}` }, { quoted:m });
          } catch {
              try {
                  const r = await axios.get(`https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(q)}&sorting=random`);
                  const u = r.data?.data?.[0]?.path;
                  if(u) { const b = await buf(u); await s.sendMessage(m.chat, { image: Buffer.from(b), caption:`✅ Wallpaper: ${q}` }, { quoted:m }); return; }
              } catch {}
              reply("❌ Failed");
          }
      }
    },

    // 8. IMG (5 images) – unchanged
    { command: "img", aliases: ["image","searchimg"], category: "downloader",
      execute: async (s, m, { args, reply }) => {
          if(!args[0]) return reply("❌ What images do you want?\n📌 .img doja cat");
          const q = args.join(" "); reply(`🔍 *Searching 5 images for: ${q}*`);
          try {
              const r = await axios.get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=5&client_id=demo`);
              const imgs = r.data?.results;
              if(imgs?.length) {
                  for(let i=0; i<imgs.length; i++) {
                      await s.sendMessage(m.chat, { image:{ url: imgs[i].urls.regular }, caption:`📸 *${q}* (${i+1}/5)\n👤 By: ${imgs[i].user.name}\n❤️ ${imgs[i].likes} likes` }, { quoted: i===0 ? m : undefined });
                      await new Promise(r => setTimeout(r, 500));
                  }
              } else reply("❌ No images found.");
          } catch { reply("❌ Image search failed."); }
      }
    },

    // 9. FACEBOOK (unchanged, multi‑API)
    { command: "fb", aliases: ["facebook","fbdl"], category: "downloader",
      execute: async (s, m, { args, reply, config }) => {
          if(!args[0]) return reply("❌ Provide a Facebook video link!");
          const url = args[0]; const out = `./temp_fb_${Date.now()}.mp4`; reply("📘 *Downloading Facebook video...*");
          const apis = [
              `https://api.nyxs.pw/dl/fb?url=${encodeURIComponent(url)}`,
              `https://api.lolhuman.xyz/api/fb?apikey=GataDios&url=${encodeURIComponent(url)}`
          ];
          for(let api of apis) {
              try {
                  const r = await axios.get(api, { timeout:15000 });
                  let vid = r.data?.result?.url || r.data?.url;
                  if(vid) {
                      await dl(vid, out);
                      const ctx = brand(config);
                      await s.sendMessage(m.chat, { video: fs.readFileSync(out), caption:"✅ Downloaded from Facebook", contextInfo:ctx }, { quoted:m });
                      cleanup(out); return;
                  }
              } catch {}
          }
          reply("❌ Download failed.");
      }
    },

    // 10. INSTAGRAM (unchanged)
    { command: "ig", aliases: ["insta","instagram","igdl"], category: "downloader",
      execute: async (s, m, { args, reply, config }) => {
          if(!args[0]) return reply("❌ Provide an Instagram link!");
          const url = args[0]; const out = `./temp_ig_${Date.now()}`; reply("📸 *Downloading from Instagram...*");
          const apis = [
              `https://api.nyxs.pw/dl/ig?url=${encodeURIComponent(url)}`,
              `https://api.lolhuman.xyz/api/instagram?apikey=GataDios&url=${encodeURIComponent(url)}`
          ];
          for(let api of apis) {
              try {
                  const r = await axios.get(api, { timeout:15000 });
                  let media = r.data?.result?.[0]?.url || r.data?.result?.url || r.data?.url;
                  if(media) {
                      const isVid = media.includes('.mp4') || media.includes('video');
                      const fp = isVid ? out+'.mp4' : out+'.jpg';
                      await dl(media, fp);
                      const ctx = brand(config);
                      if(isVid) await s.sendMessage(m.chat, { video: fs.readFileSync(fp), caption:"✅ Downloaded from Instagram", contextInfo:ctx }, { quoted:m });
                      else await s.sendMessage(m.chat, { image: fs.readFileSync(fp), caption:"✅ Downloaded from Instagram", contextInfo:ctx }, { quoted:m });
                      cleanup(fp); return;
                  }
              } catch {}
          }
          reply("❌ Download failed.");
      }
    },

    // 11. MEDIAFIRE (unchanged)
    { command: "mediafire", aliases: ["mf","mfdl"], category: "downloader",
      execute: async (s, m, { args, reply, config }) => {
          if(!args[0]) return reply("❌ Provide a MediaFire link!");
          const url = args[0]; const out = `./temp_mf_${Date.now()}`; reply("📦 *Downloading from MediaFire...*");
          try {
              const r = await axios.get(`https://api.nyxs.pw/dl/mediafire?url=${encodeURIComponent(url)}`, { timeout:15000 });
              let dlUrl = r.data?.result?.link, fn = r.data?.result?.filename||'file';
              if(!dlUrl) return reply("❌ Failed");
              const fp = out+'_'+fn; await dl(dlUrl, fp);
              const ctx = brand(config);
              await s.sendMessage(m.chat, { document: fs.readFileSync(fp), fileName:fn, mimetype:"application/octet-stream", contextInfo:ctx }, { quoted:m });
              cleanup(fp);
          } catch { reply("❌ Download failed."); }
      }
    },

    // 12. TWITTER (unchanged)
    { command: "twitter", aliases: ["x","tw","tweet"], category: "downloader",
      execute: async (s, m, { args, reply, config }) => {
          if(!args[0]) return reply("❌ Provide a Twitter/X link!");
          const url = args[0]; const out = `./temp_tw_${Date.now()}.mp4`; reply("🐦 *Downloading Twitter video...*");
          const apis = [
              `https://api.nyxs.pw/dl/twitter?url=${encodeURIComponent(url)}`,
              `https://api.lolhuman.xyz/api/twitter?apikey=GataDios&url=${encodeURIComponent(url)}`
          ];
          for(let api of apis) {
              try {
                  const r = await axios.get(api, { timeout:15000 });
                  let vid = r.data?.result?.url || r.data?.url;
                  if(vid) {
                      await dl(vid, out);
                      const ctx = brand(config);
                      await s.sendMessage(m.chat, { video: fs.readFileSync(out), caption:"✅ Downloaded from Twitter/X", contextInfo:ctx }, { quoted:m });
                      cleanup(out); return;
                  }
              } catch {}
          }
          reply("❌ Download failed.");
      }
    }
];