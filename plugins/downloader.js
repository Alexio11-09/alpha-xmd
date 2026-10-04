const fs=require('fs'),ax=require('axios'),yts=require('yt-search'),{downloadContentFromMessage}=require('@whiskeysockets/baileys'),{execSync}=require('child_process');
const cl=f=>setTimeout(()=>{try{fs.unlinkSync(f)}catch{}},3e5);
const dl=async(u,o)=>{const w=fs.createWriteStream(o),r=await ax({url:u,method:'GET',responseType:'stream',timeout:12e4,headers:{'User-Agent':'Mozilla/5.0'}});r.data.pipe(w);return new Promise((a,b)=>{w.on('finish',a);w.on('error',b)})};
const bf=async u=>Buffer.from((await ax.get(u,{responseType:'arraybuffer',timeout:15e3})).data);
const B=c=>({forwardingScore:999,isForwarded:!0,forwardedNewsletterMessageInfo:{newsletterJid:c.newsletter.id+'@newsletter',newsletterName:c.newsletter.name}});

// 🎯 Cobalt API helper — reliable YouTube downloader
const cobalt=async(url,isAudio)=>{
  const endpoints=[
    'https://api.cobalt.tools/api/json',
    'https://co.wuk.sh/api/json'
  ];
  for(const ep of endpoints){
    try{
      const r=await ax.post(ep,{
        url,
        isAudioOnly:isAudio,
        aFormat:isAudio?'mp3':'mp4',
        vQuality:isAudio?'720':'720',
        filenamePattern:'basic'
      },{
        headers:{
          'Content-Type':'application/json',
          'Accept':'application/json'
        },
        timeout:3e4
      });
      if(r.data?.url)return r.data.url;
      if(r.data?.status==='stream'||r.data?.status==='redirect')return r.data.url;
    }catch(e){console.log('cobalt ep fail:',ep,e.message)}
  }
  return null;
};

module.exports=[
{command:'play',aliases:['song','music','play2','ytmp3'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{
  let t=args.join(' ');if(!t)return reply('🎧 Usage: .play <song name>');
  try{
    await s.sendMessage(m.chat,{react:{text:'🎶',key:m.key}});
    let sr=await yts(t);if(!sr.videos.length){await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});return reply('❌ No song found')}
    let v=sr.videos[0];
    await s.sendMessage(m.chat,{react:{text:'⬇️',key:m.key}});

    // 🎯 Try Cobalt API first
    console.log('🎵 Cobalt request for:',v.title);
    let audioUrl=await cobalt(v.url,true);
    if(audioUrl){
      console.log('✅ Cobalt returned URL');
      await s.sendMessage(m.chat,{image:{url:v.thumbnail},caption:`🎵 *${v.title}*\n\n👑 ${c.settings.title}`,contextInfo:B(c)},{quoted:m});
      await s.sendMessage(m.chat,{audio:{url:audioUrl},mimetype:'audio/mpeg',ptt:!1,fileName:v.title.replace(/[^a-zA-Z0-9]/g,'_')+'.mp3',contextInfo:{externalAdReply:{title:v.title,body:'🎧 Now playing',thumbnailUrl:v.thumbnail,mediaType:1}}},{quoted:m});
      await s.sendMessage(m.chat,{react:{text:'✅',key:m.key}});
      return;
    }
    console.log('❌ Cobalt failed, trying fallback APIs');

    // Fallback APIs
    let d=null;const enc=encodeURIComponent(v.url);
    try{const r=await ax.get(`https://api.ryzendesu.vip/api/downloader/ytmp3?url=${enc}`,{timeout:15e3});if(r.data?.url)d={title:r.data.title||v.title,thumb:r.data.thumbnail||v.thumbnail,audio:r.data.url};}catch(e){console.log('p1:',e.message)}
    if(!d){try{const r=await ax.get(`https://api.lolhuman.xyz/api/ytaudio?apikey=GataDios&url=${enc}`,{timeout:15e3});if(r.data?.result)d={title:r.data.result.title,thumb:r.data.result.thumbnail,audio:r.data.result.link};}catch(e){console.log('p2:',e.message)}}
    if(!d?.audio){await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});return reply('⚠️ All servers failed.')}
    const title=d.title||v.title;
    await s.sendMessage(m.chat,{image:{url:d.thumb||v.thumbnail},caption:`🎵 *${title}*\n\n👑 ${c.settings.title}`,contextInfo:B(c)},{quoted:m});
    await s.sendMessage(m.chat,{audio:{url:d.audio},mimetype:'audio/mpeg',ptt:!1,fileName:title.replace(/[^a-zA-Z0-9]/g,'_')+'.mp3',contextInfo:{externalAdReply:{title,body:'🎧 Now playing',thumbnailUrl:d.thumb||v.thumbnail,mediaType:1}}},{quoted:m});
    await s.sendMessage(m.chat,{react:{text:'✅',key:m.key}});
  }catch(e){console.log('play err:',e.message);reply('❌ Failed')}
}},

{command:'video',aliases:['vid','ytmp4'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{
  let t=args.join(' ');if(!t)return reply('🎥 Usage: .video <name/url>');
  try{
    await s.sendMessage(m.chat,{react:{text:'⚡',key:m.key}});
    let u=t;
    if(!t.startsWith('http')){const sr=await yts(t);if(!sr.videos.length)return reply('❌ No videos');u=sr.videos[0].url}
    await s.sendMessage(m.chat,{react:{text:'⬇️',key:m.key}});

    // 🎯 Try Cobalt API first
    console.log('🎬 Cobalt video request');
    let videoUrl=await cobalt(u,false);
    if(videoUrl){
      console.log('✅ Cobalt returned video URL');
      await s.sendMessage(m.chat,{video:{url:videoUrl},mimetype:'video/mp4',fileName:'video_'+Date.now()+'.mp4',caption:`✅ Downloaded\n👑 ${c.settings.title}`,contextInfo:B(c)},{quoted:m});
      await s.sendMessage(m.chat,{react:{text:'✅',key:m.key}});
      return;
    }
    console.log('❌ Cobalt failed, trying fallback');

    // Fallback APIs
    let data=null;const enc=encodeURIComponent(u);
    try{const r=await ax.get(`https://api.ryzendesu.vip/api/downloader/ytmp4?url=${enc}`,{timeout:15e3});if(r.data?.url)data={title:r.data.title,thumbnail:r.data.thumbnail,url:r.data.url};}catch(e){console.log('v1:',e.message)}
    if(!data){try{const r=await ax.get(`https://api.lolhuman.xyz/api/youtube?apikey=GataDios&url=${enc}`,{timeout:15e3});if(r.data?.result)data={title:r.data.result.title,thumbnail:r.data.result.thumbnail,url:r.data.result.link};}catch(e){console.log('v2:',e.message)}}
    if(!data?.url){await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});return reply('⚠️ All servers failed.')}
    const title=data.title||'Video';
    await s.sendMessage(m.chat,{video:{url:data.url},mimetype:'video/mp4',fileName:title.replace(/[^a-zA-Z0-9]/g,'_')+'.mp4',caption:`✅ *${title}*\n👑 ${c.settings.title}`,contextInfo:B(c)},{quoted:m});
    await s.sendMessage(m.chat,{react:{text:'✅',key:m.key}});
  }catch(e){console.log('video err:',e.message);reply('❌ Failed')}
}},

// ... keep the rest of your existing commands (tiktok, ig, fb, lyrics, yts, shazam)
];