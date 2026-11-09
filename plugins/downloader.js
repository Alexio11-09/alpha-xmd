const fs=require('fs'),ax=require('axios'),yts=require('yt-search'),ytdl=require('@pontalabs/ytdl'),{downloadContentFromMessage}=require('@whiskeysockets/baileys'),{execSync}=require('child_process');
const { downloadVideo } = require('@raihan07/vidly');
const os = require('os');
const path = require('path');

// Ensure a temp folder exists
const TMP_DIR = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const dl=async(u,o)=>{const w=fs.createWriteStream(o),r=await ax({url:u,method:'GET',responseType:'stream',timeout:12e4,headers:{'User-Agent':'Mozilla/5.0'}});r.data.pipe(w);return new Promise((a,b)=>{w.on('finish',a);w.on('error',b)})};
const B=c=>({forwardingScore:999,isForwarded:!0,forwardedNewsletterMessageInfo:{newsletterJid:c.newsletter.id+'@newsletter',newsletterName:c.newsletter.name}});

module.exports=[
{command:'play',aliases:['song','music','play2','ytmp3'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{
  let t=args.join(' ');if(!t)return reply('🎧 Usage: .play <song name>');
  try{
    await s.sendMessage(m.chat,{react:{text:'🎶',key:m.key}});
    let sr=await yts(t);if(!sr.videos.length){await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});return reply('❌ No song found')}
    let v=sr.videos[0];
    await s.sendMessage(m.chat,{react:{text:'⬇️',key:m.key}});

    const audio=await ytdl.downloadAudio(v.url,128);
    const audioUrl=audio.download.downloadUrl;

    if(!audioUrl){await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});return reply('⚠️ No audio URL returned.')}

    await s.sendMessage(m.chat,{image:{url:v.thumbnail},caption:`🎵 *${v.title}*\n\n👑 ${c.settings.title}`,contextInfo:B(c)},{quoted:m});
    await s.sendMessage(m.chat,{audio:{url:audioUrl},mimetype:'audio/mpeg',ptt:!1,fileName:v.title.replace(/[^a-zA-Z0-9]/g,'_')+'.mp3',contextInfo:{externalAdReply:{title:v.title,body:'🎧 Now playing',thumbnailUrl:v.thumbnail,mediaType:1}}},{quoted:m});
    await s.sendMessage(m.chat,{react:{text:'✅',key:m.key}});
  }catch(e){console.log('play err:',e.message);await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});reply('❌ Failed')}
}},

{command:'video',aliases:['vid','dl','yt','ytmp4'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{
  let t=args.join(' ');if(!t)return reply('🎥 Usage: .video <name/url>');
  try{
    await s.sendMessage(m.chat,{react:{text:'⚡',key:m.key}});
    let u=t;
    if(!t.startsWith('http')){const sr=await yts(t);if(!sr.videos.length)return reply('❌ No videos');u=sr.videos[0].url}
    await s.sendMessage(m.chat,{react:{text:'⬇️',key:m.key}});

    let videoUrl=null;
    try{ const video=await ytdl.downloadVideo(u); videoUrl=video?.download?.downloadUrl || video?.url || video?.downloadUrl; }catch(e){}
    if(!videoUrl){ try{ const video=await ytdl.downloadVideo(u,360); videoUrl=video?.download?.downloadUrl || video?.url || video?.downloadUrl; }catch(e){} }

    if(!videoUrl){await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});return reply('⚠️ No video URL returned.')}

    await s.sendMessage(m.chat,{video:{url:videoUrl},mimetype:'video/mp4',fileName:'video_'+Date.now()+'.mp4',caption:`✅ Downloaded\n👑 ${c.settings.title}`,contextInfo:B(c)},{quoted:m});
    await s.sendMessage(m.chat,{react:{text:'✅',key:m.key}});
  }catch(e){console.log('video err:',e.message);await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});reply('❌ Failed')}
}},

{command:'tiktok',aliases:['tt','tiktokdl'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{
  if(!args[0])return reply('❌ TT link?');reply('🎵...');
  const o = path.join(TMP_DIR, `tt_${Date.now()}.mp4`);
  try{
    let r=await ax.get(`https://tikwm.com/api/?url=${encodeURIComponent(args[0])}`),d=r.data?.data;
    if(!d?.play)return reply('❌ Failed.');
    await dl(d.play,o);
    await s.sendMessage(m.chat,{video:fs.readFileSync(o),caption:`🎬 *TikTok*\n👤 @${d.author?.nickname||'?'}\n⚡ *${c.settings.title}*`,contextInfo:B(c)},{quoted:m});
  }catch(e){reply('❌ '+e.message)}
  finally{ if(fs.existsSync(o)) fs.unlinkSync(o); }
}},

{command:'fb',aliases:['facebook','fbdl'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{
  if(!args[0]) return reply('❌ FB link?');
  let u=args[0];
  const o = path.join(TMP_DIR, `f_${Date.now()}.mp4`);
  reply('📘 Downloading...');
  try {
    const result = await downloadVideo(u, o);
    if(result && fs.existsSync(o)) {
      await s.sendMessage(m.chat,{video:fs.readFileSync(o),caption:'✅ FB Video',contextInfo:B(c)},{quoted:m});
    } else { reply('❌ Failed to download FB video.'); }
  } catch(e) { reply('❌ Failed: ' + e.message); }
  finally { if(fs.existsSync(o)) fs.unlinkSync(o); }
}},

{command:'ig',aliases:['instagram','igdl'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{
  if(!args[0]) return reply('❌ IG link?');
  let u=args[0];
  const o = path.join(TMP_DIR, `i_${Date.now()}.mp4`);
  reply('📸 Downloading...');
  try {
    const result = await downloadVideo(u, o);
    if(result && fs.existsSync(o)) {
      const isVideo = result.title?.toLowerCase().includes('video') || o.endsWith('.mp4');
      if (isVideo) { await s.sendMessage(m.chat,{video:fs.readFileSync(o),caption:'✅ IG Video',contextInfo:B(c)},{quoted:m}); } 
      else { await s.sendMessage(m.chat,{image:fs.readFileSync(o),caption:'✅ IG Image',contextInfo:B(c)},{quoted:m}); }
    } else { reply('❌ Failed to download IG media.'); }
  } catch(e) { reply('❌ Failed: ' + e.message); }
  finally { if(fs.existsSync(o)) fs.unlinkSync(o); }
}},

{command:'pin',aliases:['pinterest','pindl'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{
  if(!args[0]) return reply('❌ Pinterest link?');
  let u=args[0];
  // We use .mp4 extension for safety, but it might be an image
  const o = path.join(TMP_DIR, `p_${Date.now()}.mp4`);
  reply('📌 Downloading...');
  try {
    const result = await downloadVideo(u, o);
    if(result && fs.existsSync(o)) {
      const isVideo = result.title?.toLowerCase().includes('video') || o.endsWith('.mp4');
      if (isVideo) { await s.sendMessage(m.chat,{video:fs.readFileSync(o),caption:'✅ Pinterest Video',contextInfo:B(c)},{quoted:m}); } 
      else { await s.sendMessage(m.chat,{image:fs.readFileSync(o),caption:'✅ Pinterest Image',contextInfo:B(c)},{quoted:m}); }
    } else { reply('❌ Failed to download Pinterest media.'); }
  } catch(e) { reply('❌ Failed: ' + e.message); }
  finally { if(fs.existsSync(o)) fs.unlinkSync(o); }
}},

{command:'lyrics',aliases:['lirik'],category:'downloader',execute:async(s,m,{args,reply})=>{
  if(!args[0])return reply('❌ Song?');let q=args.join(' ');
  try{let r=await ax.get(`https://api.lolhuman.xyz/api/lirik?apikey=GataDios&query=${encodeURIComponent(q)}`,{timeout:15e3});if(r.data?.status===200&&r.data.result)return reply(`🎵 *${q}*\n\n${r.data.result.substring(0,2e3)}`);reply('❌ Not found')}catch{reply('❌ Failed')}
}},

{command:'yts',aliases:['ytsearch'],category:'downloader',execute:async(s,m,{args,reply})=>{
  if(!args[0])return reply('❌ Query?');let q=args.join(' ');
  try{let r=await yts(q);if(!r.videos?.length)return reply('❌ No results');let t=`🔎 *${q}*\n\n`;for(let i=0;i<Math.min(10,r.videos.length);i++){let v=r.videos[i];t+=`${i+1}. *${v.title}*\n   🔗 ${v.url}\n\n`}reply(t)}catch{reply('❌ Failed')}
}},

{command:'shazam',aliases:['identify','whatsong'],category:'downloader',execute:async(s,m,{reply})=>{
  if(!m.quoted)return reply('❌ Reply to audio!');let qt=m.quoted.message;if(!qt)return reply('❌ Cannot read');
  let t=Object.keys(qt)[0];if(!['audioMessage','voiceMessage','videoMessage'].includes(t))return reply('❌ Unsupported');
  reply('🎧...');let inf,ouf;
  try{let st=await downloadContentFromMessage(qt[t],t==='videoMessage'?'video':'audio'),b=Buffer.from([]);for await(let c of st)b=Buffer.concat([b,c]);
  inf=path.join(TMP_DIR,`si_${Date.now()}`); ouf=path.join(TMP_DIR,`so_${Date.now()}.mp3`);
  fs.writeFileSync(inf,b);try{execSync(`ffmpeg -y -i ${inf} -vn -ar 44100 -ac 2 -b:a 128k ${ouf}`,{stdio:'ignore'})}catch{fs.copyFileSync(inf,ouf)}
  let ab=fs.readFileSync(ouf).toString('base64'),r=await ax.post('https://api.audd.io/',{api_token:'test',audio:ab,return:'apple_music,spotify'},{headers:{'Content-Type':'application/json'},timeout:15e3});let d=r.data;
  if(d.status==='success'&&d.result){let g=d.result,cu=g.apple_music?.artwork?.url?.replace('{w}','300').replace('{h}','300')||g.spotify?.album?.images?.[0]?.url||'',tx=`🎵 *${g.title||'?'}*\n👤 ${g.artist||'?'}\n💿 ${g.album||'?'}`;if(cu)await s.sendMessage(m.chat,{image:{url:cu},caption:tx},{quoted:m});else reply(tx)}else reply('❌ Not recognized')}
  catch(e){console.error(e);reply('❌ Failed')}
  finally{ if(fs.existsSync(inf)) fs.unlinkSync(inf); if(fs.existsSync(ouf)) fs.unlinkSync(ouf); }
}}
];