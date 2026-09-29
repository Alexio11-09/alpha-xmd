const fs=require('fs'),ax=require('axios'),yts=require('yt-search'),{downloadContentFromMessage}=require('@whiskeysockets/baileys'),{execSync}=require('child_process');
const cl=f=>setTimeout(()=>{try{fs.unlinkSync(f)}catch{}},3e5);
const dl=async(u,o,to=60000)=>{const w=fs.createWriteStream(o),r=await ax({url:u,method:'GET',responseType:'stream',timeout:to,headers:{'User-Agent':'Mozilla/5.0'}});return new Promise((res,rej)=>{const t=setTimeout(()=>{w.destroy();rej(new Error('timeout'))},to);r.data.pipe(w);w.on('finish',()=>{clearTimeout(t);res()});w.on('error',e=>{clearTimeout(t);rej(e)});r.data.on('error',e=>{clearTimeout(t);rej(e)})})};
const bf=async u=>Buffer.from((await ax.get(u,{responseType:'arraybuffer',timeout:15e3})).data);
const B=c=>({forwardingScore:999,isForwarded:!0,forwardedNewsletterMessageInfo:{newsletterJid:c.newsletter.id+'@newsletter',newsletterName:c.newsletter.name}});

module.exports=[
// ===== PLAY — 3-API fallback =====
{command:'play',aliases:['song','music','play2','ytmp3'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{
  let t=args.join(' ');
  if(!t)return reply('🎧 Usage: .play <song name>\nEx: .play faded alan walker');
  try{
    await s.sendMessage(m.chat,{react:{text:'🎶',key:m.key}});
    let sr=await yts(t);
    if(!sr.videos.length){await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});return reply('❌ No song found')}
    let v=sr.videos[0];
    await s.sendMessage(m.chat,{react:{text:'⬇️',key:m.key}});
    let d=null;
    try{const r=await ax.get(`https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(v.url)}`,{timeout:1e4});if(r.data?.status)d={title:r.data.title,thumb:r.data.thumbnail,audio:r.data.audio};}catch{}
    if(!d){try{const r=await ax.get(`https://api.douxx.tech/api/youtube/audio?url=${encodeURIComponent(v.url)}`,{timeout:1e4});if(r.data?.result)d={title:r.data.result.title,thumb:r.data.result.thumbnail,audio:r.data.result.download};}catch{}}
    if(!d){try{const r=await ax.get(`https://api.lolhuman.xyz/api/ytaudio?apikey=GataDios&url=${encodeURIComponent(v.url)}`,{timeout:1e4});if(r.data?.result)d={title:r.data.result.title,thumb:r.data.result.thumbnail,audio:r.data.result.link};}catch{}}
    if(!d?.audio){await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});return reply('⚠️ All audio servers failed. Try again later.')}
    const title=d.title||v.title;
    await s.sendMessage(m.chat,{image:{url:d.thumb||v.thumbnail},caption:`🎵 *${title}*\n\n⬇️ Downloading audio...\n\n👑 ${c.settings.title}`,contextInfo:B(c)},{quoted:m});
    await s.sendMessage(m.chat,{audio:{url:d.audio},mimetype:'audio/mpeg',ptt:!1,fileName:title.replace(/[^a-zA-Z0-9]/g,'_')+'.mp3',contextInfo:{externalAdReply:{title,body:'Now playing 🎧',thumbnailUrl:d.thumb||v.thumbnail,mediaType:1}}},{quoted:m});
    await s.sendMessage(m.chat,{react:{text:'✅',key:m.key}});
  }catch(e){console.log('play error:',e.message);await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});reply('❌ Failed to download audio')}
}},

// ===== VIDEO — checks for audio-only + download timeout =====
{command:'video',aliases:['vid','dl','yt','ytmp4'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{
  let t=args.join(' ');
  if(!t)return reply('🎥 Usage: .video <name/url>\nEx: .video drake - gods plan');
  try{
    await s.sendMessage(m.chat,{react:{text:'⚡',key:m.key}});
    let u=t,info=null;
    if(!t.startsWith('http')){
      const sr=await yts(t);
      if(!sr.videos.length){await s.sendMessage(m.chat,{react:{text:'🔍',key:m.key}});return reply('❌ No videos found')}
      info=sr.videos[0];u=info.url;
    }
    if(!u.includes('youtube.com')&&!u.includes('youtu.be')){await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});return reply('❌ Invalid YouTube link')}

    await s.sendMessage(m.chat,{react:{text:'⬇️',key:m.key}});
    let d=null;

    // API 1 — nyxs
    try{
      const r=await ax.get(`https://api.nyxs.pw/dl/ytmp4?url=${encodeURIComponent(u)}`,{timeout:15e3});
      if(r.data?.result?.url)d={title:r.data.result.title,thumb:r.data.result.thumbnail,url:r.data.result.url};
    }catch(e){console.log('v-api1:',e.message)}

    // API 2 — ryzendesu
    if(!d){try{
      const r=await ax.get(`https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(u)}`,{timeout:15e3});
      if(r.data?.url)d={title:r.data.title,thumb:r.data.thumbnail,url:r.data.url};
    }catch(e){console.log('v-api2:',e.message)}}

    // API 3 — hectormanuel
    if(!d){try{
      const r=await ax.get(`https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(u)}`,{timeout:15e3});
      if(r.data?.status){
        const vUrl=r.data.videos?.['360']||r.data.videos?.['720']||r.data.videos?.['480']||r.data.video;
        if(vUrl)d={title:r.data.title,thumb:r.data.thumbnail,url:vUrl};
      }
    }catch(e){console.log('v-api3:',e.message)}}

    if(!d?.url){await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});return reply('⚠️ All download servers failed. Try again later.')}

    const title=d.title||info?.title||'Video';
    console.log('📹 Video URL fetched:',title);
    await s.sendMessage(m.chat,{image:{url:d.thumb||info?.thumbnail},caption:`🎬 *${title}*\n⬇️ Downloading video...\n\n👑 ${c.settings.title}`,contextInfo:B(c)},{quoted:m});

    // Download with 90-second timeout
    const o=`./vid_${Date.now()}.mp4`;
    try{
      await dl(d.url,o,90000);
    }catch(e){
      console.log('video dl error:',e.message);
      try{fs.unlinkSync(o)}catch{}
      await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});
      return reply('❌ Download timeout. Try another video.');
    }

    const stats=fs.statSync(o);
    const sizeMB=(stats.size/1024/1024).toFixed(2);
    console.log('📹 Video size:',sizeMB,'MB');

    // If file is too small, it's probably an error page or audio-only
    if(stats.size<102400){
      cl(o);
      await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});
      return reply('❌ This video is audio-only or unavailable. Try a different one.');
    }

    if(stats.size>104857600){
      cl(o);
      await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});
      return reply('❌ Video too large (>100MB)');
    }

    await s.sendMessage(m.chat,{
      video:fs.readFileSync(o),
      mimetype:'video/mp4',
      fileName:title.replace(/[^a-zA-Z0-9]/g,'_')+'.mp4',
      caption:`✅ *${title}*\n\n👑 ${c.settings.title}`,
      contextInfo:B(c)
    },{quoted:m});

    cl(o);
    await s.sendMessage(m.chat,{react:{text:'✅',key:m.key}});
  }catch(e){
    console.log('video error:',e.message);
    await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});
    reply('❌ Download failed. Try again.');
  }
}},

// ===== TIKTOK =====
{command:'tiktok',aliases:['tt','tiktokdl'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{if(!args[0])return reply('❌ Provide a TikTok link!');reply('🎵 *Fetching...*');try{let r=await ax.get(`https://tikwm.com/api/?url=${encodeURIComponent(args[0])}`),d=r.data?.data;if(!d?.play)return reply('❌ Failed.');let cp=`🎬 *TikTok*\n`;if(d.author?.nickname)cp+=`👤 @${d.author.nickname}\n`;if(d.title)cp+=`💬 "${d.title}"\n`;if(d.digg_count)cp+=`❤️ ${d.digg_count} `;if(d.comment_count)cp+=`💬 ${d.comment_count} `;if(d.share_count)cp+=`🔁 ${d.share_count}\n`;cp+=`⚡ *${c.settings.title}*`;let o=`./tt_${Date.now()}.mp4`;await dl(d.play,o);await s.sendMessage(m.chat,{video:fs.readFileSync(o),caption:cp,contextInfo:B(c)},{quoted:m});cl(o)}catch(e){reply('❌ '+e.message)}}},

// ===== GITCLONE =====
{command:'gitclone',aliases:['git','clone','github'],category:'downloader',execute:async(s,m,{args,reply})=>{if(!args[0])return reply('❌ GitHub link?');let u=args[0].replace(/\/$/,'');if(!u.includes('github.com'))return reply('❌ Invalid!');let p=u.split('/'),rp=p[p.length-1],us=p[p.length-2],o=`./g_${Date.now()}.zip`;reply(`📦 ${us}/${rp}...`);try{let z=`${u}/archive/refs/heads/main.zip`;try{await dl(z,o)}catch{z=`${u}/archive/refs/heads/master.zip`;await dl(z,o)}await s.sendMessage(m.chat,{document:fs.readFileSync(o),fileName:`${rp}.zip`,mimetype:'application/zip',caption:`✅ ${us}/${rp}`},{quoted:m});cl(o)}catch{reply('❌ Failed')}}},

// ===== MOVIE =====
{command:'movie',aliases:['film','moviesearch'],category:'downloader',execute:async(s,m,{args,reply})=>{if(!args[0])return reply('❌ Movie name?');let q=args.join(' ');reply('🎬...');try{let r=await ax.get(`http://www.omdbapi.com/?t=${encodeURIComponent(q)}&apikey=thewdb`);if(r.data.Response==='False')return reply('❌ Not found');let v=r.data,info=`🎬 *${v.Title}* (${v.Year})\n⭐ ${v.imdbRating}/10\n🎭 ${v.Genre}\n👥 ${v.Actors}\n\n📖 ${v.Plot}\n\n🔗 https://imdb.com/title/${v.imdbID}`;if(v.Poster!=='N/A')await s.sendMessage(m.chat,{image:{url:v.Poster},caption:info},{quoted:m});else reply(info)}catch{reply('❌ Failed')}}},

// ===== APK =====
{command:'apk',aliases:['app','apkdl'],category:'downloader',execute:async(s,m,{args,reply})=>{if(!args[0])return reply('❌ App name?');let q=args.join(' ');reply(`📱 ${q}...`);try{let r=await ax.get(`https://apkcombo.com/apk-downloader/?q=${encodeURIComponent(q)}`,{headers:{'User-Agent':'Mozilla/5.0'}});let m1=r.data.match(/href="(https:\/\/apkcombo\.com\/api\/apk-download\?id=[^"]+)/);if(m1){let a=await ax.get(m1[1]);let m2=a.data.match(/href="(https:\/\/apk\.apkcombo\.com\/[^"]+)"/);if(m2){let dk=m2[1];reply('📱 Downloading...');let o=`./a_${Date.now()}.apk`;await dl(dk,o);if(fs.statSync(o).size>104857600)reply(`Too large\n${dk}`);else{await s.sendMessage(m.chat,{document:fs.readFileSync(o),fileName:`${q.replace(/ /g,'_')}.apk`,mimetype:'application/vnd.android.package-archive'},{quoted:m});cl(o)}return}}reply('❌ Not found')}catch{reply('❌ Failed')}}},

// ===== WALLPAPER =====
{command:'wallpaper',aliases:['wall','wp'],category:'downloader',execute:async(s,m,{args,reply})=>{if(!args[0])return reply('❌ Query?');let q=args.join(' ');reply('🖼️...');try{let b=await bf(`https://source.unsplash.com/1080x1920/?${encodeURIComponent(q)}`);await s.sendMessage(m.chat,{image:b,caption:`✅ ${q}`},{quoted:m})}catch{reply('❌ Failed')}}},

// ===== IMG =====
{command:'img',aliases:['image','searchimg'],category:'downloader',execute:async(s,m,{args,reply})=>{if(!args[0])return reply('❌ .img query');let q=args.join(' ');reply(`🔍 5 imgs: ${q}`);try{for(let i=0;i<5;i++){let u=`https://source.unsplash.com/featured/?${encodeURIComponent(q)}&sig=${i}`;let b=await bf(u);await s.sendMessage(m.chat,{image:b,caption:`📸 *${q}* (${i+1}/5)`},{quoted:i===0?m:undefined});if(i<4)await new Promise(r=>setTimeout(r,500))}}catch{reply('❌ Failed')}}},

// ===== FACEBOOK =====
{command:'fb',aliases:['facebook','fbdl'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{if(!args[0])return reply('❌ FB link?');let u=args[0],o=`./f_${Date.now()}.mp4`;reply('📘...');for(let a of[`https://api.nyxs.pw/dl/fb?url=${encodeURIComponent(u)}`,`https://api.lolhuman.xyz/api/fb?apikey=GataDios&url=${encodeURIComponent(u)}`]){try{let r=await ax.get(a,{timeout:15e3});let v=r.data?.result?.url||r.data?.url;if(v){await dl(v,o);await s.sendMessage(m.chat,{video:fs.readFileSync(o),caption:'✅ Facebook',contextInfo:B(c)},{quoted:m});cl(o);return}}catch{}}reply('❌ Failed')}},

// ===== INSTAGRAM =====
{command:'ig',aliases:['insta','instagram','igdl'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{if(!args[0])return reply('❌ IG link?');let u=args[0],o=`./i_${Date.now()}`;reply('📸...');for(let a of[`https://api.nyxs.pw/dl/ig?url=${encodeURIComponent(u)}`,`https://api.lolhuman.xyz/api/instagram?apikey=GataDios&url=${encodeURIComponent(u)}`]){try{let r=await ax.get(a,{timeout:15e3});let md=r.data?.result?.[0]?.url||r.data?.result?.url||r.data?.url;if(md){let vd=md.includes('.mp4')||md.includes('video'),fp=vd?o+'.mp4':o+'.jpg';await dl(md,fp);let cx=B(c);if(vd)await s.sendMessage(m.chat,{video:fs.readFileSync(fp),caption:'✅ Instagram',contextInfo:cx},{quoted:m});else await s.sendMessage(m.chat,{image:fs.readFileSync(fp),caption:'✅ Instagram',contextInfo:cx},{quoted:m});cl(fp);return}}catch{}}reply('❌ Failed')}},

// ===== MEDIAFIRE =====
{command:'mediafire',aliases:['mf','mfdl'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{if(!args[0])return reply('❌ MF link?');let u=args[0],o=`./m_${Date.now()}`;reply('📦...');try{let r=await ax.get(`https://api.nyxs.pw/dl/mediafire?url=${encodeURIComponent(u)}`,{timeout:15e3});let dk=r.data?.result?.link,fn=r.data?.result?.filename||'file';if(!dk)return reply('❌ Failed');let fp=o+'_'+fn;await dl(dk,fp);await s.sendMessage(m.chat,{document:fs.readFileSync(fp),fileName:fn,mimetype:'application/octet-stream',contextInfo:B(c)},{quoted:m});cl(fp)}catch{reply('❌ Failed')}}},

// ===== TWITTER =====
{command:'twitter',aliases:['x','tw','tweet'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{if(!args[0])return reply('❌ X link?');let u=args[0],o=`./tw_${Date.now()}.mp4`;reply('🐦...');for(let a of[`https://api.nyxs.pw/dl/twitter?url=${encodeURIComponent(u)}`,`https://api.lolhuman.xyz/api/twitter?apikey=GataDios&url=${encodeURIComponent(u)}`]){try{let r=await ax.get(a,{timeout:15e3});let v=r.data?.result?.url||r.data?.url;if(v){await dl(v,o);await s.sendMessage(m.chat,{video:fs.readFileSync(o),caption:'✅ Twitter/X',contextInfo:B(c)},{quoted:m});cl(o);return}}catch{}}reply('❌ Failed')}},

// ===== SPOTIFY =====
{command:'spotify',aliases:['sp','spotdl'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{if(!args[0])return reply('❌ Track/URL?');let q=args.join(' ');reply('🎵...');try{let r=await ax.get(`https://api.spotify-dl.workers.dev/?url=${encodeURIComponent(q)}`,{timeout:2e4});if(r.data?.success&&r.data?.audio){let t=r.data;await s.sendMessage(m.chat,{image:{url:t.cover||t.thumbnail},caption:`🎧 *${t.title}*\n👤 ${t.artist||''}\n💿 ${t.album||''}`},{quoted:m});await s.sendMessage(m.chat,{audio:{url:t.audio},mimetype:'audio/mpeg',ptt:!1,fileName:`${(t.title||'sp').replace(/[^\w\s-]/g,'_')}.mp3`,contextInfo:{externalAdReply:{title:t.title,body:t.artist,thumbnailUrl:t.cover,mediaType:1}}},{quoted:m});return}reply('❌ Not found')}catch{reply('❌ Failed')}}},

// ===== PINTEREST =====
{command:'pindl',aliases:['pinterest','pin'],category:'downloader',execute:async(s,m,{args,reply})=>{if(!args[0])return reply('❌ Pin link?');let u=args[0];if(!/pinterest\.com|pin\.it/.test(u))return reply('❌ Invalid');reply('📌...');try{let r=await ax.get(`https://api.nyxs.pw/dl/pinterest?url=${encodeURIComponent(u)}`,{timeout:15e3});let d=r.data?.result;if(d?.url){let vd=d.url.includes('.mp4'),o=`./p_${Date.now()}.${vd?'mp4':'jpg'}`;await dl(d.url,o);if(vd)await s.sendMessage(m.chat,{video:fs.readFileSync(o)},{quoted:m});else await s.sendMessage(m.chat,{image:fs.readFileSync(o)},{quoted:m});cl(o);return}reply('❌ No media')}catch{reply('❌ Failed')}}},

// ===== GDRIVE =====
{command:'gdrive',aliases:['googledrive','gd'],category:'downloader',execute:async(s,m,{args,reply})=>{if(!args[0])return reply('❌ GD link?');let id=args[0].match(/[-\w]{25,}/)||args[0].match(/\/d\/([^\/]+)/);if(!id)return reply('❌ Bad ID');id=Array.isArray(id)?id[1]||id[0]:id;let dk=`https://drive.google.com/uc?export=download&id=${id}`;reply('📦...');try{let o=`./gd_${Date.now()}`;await dl(dk,o);await s.sendMessage(m.chat,{document:fs.readFileSync(o),fileName:`gd_${id}.bin`,mimetype:'application/octet-stream'},{quoted:m});cl(o)}catch{reply('❌ Failed')}}},

// ===== RINGTONE =====
{command:'ringtone',aliases:['rington','ring'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{if(!args[0])return reply('❌ Name?');let q=args.join(' ');reply('🔔...');try{let r=await ax.get(`https://api.lolhuman.xyz/api/ringtone?apikey=GataDios&query=${encodeURIComponent(q)}`,{timeout:15e3});let d=r.data?.result;if(d?.name&&d?.link){let o=`./r_${Date.now()}.mp3`;await dl(d.link,o);await s.sendMessage(m.chat,{audio:fs.readFileSync(o),mimetype:'audio/mpeg',ptt:!0,fileName:`${d.name.replace(/[^\w\s-]/g,'_')}.mp3`,contextInfo:B(c)},{quoted:m});cl(o);return}reply('❌ Not found')}catch{reply('❌ Failed')}}},

// ===== YTS =====
{command:'yts',aliases:['ytsearch','youtubesearch'],category:'downloader',execute:async(s,m,{args,reply})=>{if(!args[0])return reply('❌ Query?');let q=args.join(' ');reply(`🔍 ${q}`);try{let r=await yts(q);if(!r.videos?.length)return reply('❌ No results');let t=`🔎 *${q}*\n\n`;for(let i=0;i<Math.min(10,r.videos.length);i++){let v=r.videos[i];t+=`${i+1}. *${v.title}*\n   ⏱️ ${v.timestamp} | 👁️ ${v.views}\n   🔗 ${v.url}\n\n`}reply(t)}catch{reply('❌ Failed')}}},

// ===== LYRICS =====
{command:'lyrics2',aliases:['lyrics','lirik'],category:'downloader',execute:async(s,m,{args,reply})=>{if(!args[0])return reply('❌ Song?');let q=args.join(' ');reply(`🎤 ${q}`);try{let r=await ax.get(`https://api.lolhuman.xyz/api/lirik?apikey=GataDios&query=${encodeURIComponent(q)}`,{timeout:15e3});if(r.data?.status===200&&r.data.result)return reply(`🎵 *${q}*\n\n${r.data.result.substring(0,2e3)}`);reply('❌ Not found')}catch{reply('❌ Failed')}}},

// ===== SHAZAM =====
{command:'shazam',aliases:['identify','whatsong','namethatsong'],category:'downloader',execute:async(s,m,{reply})=>{if(!m.quoted)return reply('❌ Reply to audio/video!');let qt=m.quoted.message;if(!qt)return reply('❌ Cannot read');let t=Object.keys(qt)[0];if(!['audioMessage','voiceMessage','videoMessage'].includes(t))return reply('❌ Unsupported');reply('🎧...');let inf,ouf;try{let st=await downloadContentFromMessage(qt[t],t==='videoMessage'?'video':'audio'),b=Buffer.from([]);for await(let c of st)b=Buffer.concat([b,c]);inf=`./si_${Date.now()}`,ouf=`./so_${Date.now()}.mp3`;fs.writeFileSync(inf,b);try{execSync(`ffmpeg -y -i ${inf} -vn -ar 44100 -ac 2 -b:a 128k ${ouf}`,{stdio:'ignore'})}catch{fs.copyFileSync(inf,ouf)}let ab=fs.readFileSync(ouf).toString('base64'),r=await ax.post('https://api.audd.io/',{api_token:'test',audio:ab,return:'apple_music,spotify'},{headers:{'Content-Type':'application/json'},timeout:15e3});let d=r.data;if(d.status==='success'&&d.result){let g=d.result,cu=g.apple_music?.artwork?.url?.replace('{w}','300').replace('{h}','300')||g.spotify?.album?.images?.[0]?.url||'',tx=`🎵 *${g.title||'?'}*\n👤 ${g.artist||'?'}\n💿 ${g.album||'?'}\n\n🔊 Identified!`;if(cu)await s.sendMessage(m.chat,{image:{url:cu},caption:tx},{quoted:m});else reply(tx)}else reply('❌ Not recognized')}catch(e){console.error(e);reply('❌ Failed')}finally{try{fs.unlinkSync(inf)}catch{}try{fs.unlinkSync(ouf)}catch{}}}}
];