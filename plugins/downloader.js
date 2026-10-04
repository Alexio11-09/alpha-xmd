const fs=require('fs'),ax=require('axios'),yts=require('yt-search'),{downloadContentFromMessage}=require('@whiskeysockets/baileys'),{execSync}=require('child_process');
const cl=f=>setTimeout(()=>{try{fs.unlinkSync(f)}catch{}},3e5);
const dl=async(u,o)=>{const w=fs.createWriteStream(o),r=await ax({url:u,method:'GET',responseType:'stream',timeout:12e4,headers:{'User-Agent':'Mozilla/5.0'}});r.data.pipe(w);return new Promise((a,b)=>{w.on('finish',a);w.on('error',b)})};
const bf=async u=>Buffer.from((await ax.get(u,{responseType:'arraybuffer',timeout:15e3})).data);
const B=c=>({forwardingScore:999,isForwarded:!0,forwardedNewsletterMessageInfo:{newsletterJid:c.newsletter.id+'@newsletter',newsletterName:c.newsletter.name}});

module.exports=[
{command:'play',aliases:['song','music','ytmp3'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{
  let t=args.join(' ');if(!t)return reply('🎧 .play <song>');
  try{
    await s.sendMessage(m.chat,{react:{text:'🎶',key:m.key}});
    let sr=await yts(t);if(!sr.videos.length)return reply('❌ No song');
    let v=sr.videos[0];await s.sendMessage(m.chat,{react:{text:'⬇️',key:m.key}});
    let d=null;const enc=encodeURIComponent(v.url);
    try{const r=await ax.get(`https://api.ryzendesu.vip/api/downloader/ytmp3?url=${enc}`,{timeout:15e3});if(r.data?.url)d={title:r.data.title||v.title,thumb:r.data.thumbnail||v.thumbnail,audio:r.data.url};}catch(e){console.log('p1:',e.message)}
    if(!d){try{const r=await ax.get(`https://api.lolhuman.xyz/api/ytaudio?apikey=GataDios&url=${enc}`,{timeout:15e3});if(r.data?.result)d={title:r.data.result.title,thumb:r.data.result.thumbnail,audio:r.data.result.link};}catch(e){console.log('p2:',e.message)}}
    if(!d?.audio){await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});return reply('⚠️ All servers failed.')}
    const title=d.title||v.title;
    await s.sendMessage(m.chat,{image:{url:d.thumb||v.thumbnail},caption:`🎵 *${title}*\n👑 ${c.settings.title}`,contextInfo:B(c)},{quoted:m});
    await s.sendMessage(m.chat,{audio:{url:d.audio},mimetype:'audio/mpeg',ptt:!1,fileName:title.replace(/[^a-zA-Z0-9]/g,'_')+'.mp3',contextInfo:{externalAdReply:{title,body:'🎧',thumbnailUrl:d.thumb||v.thumbnail,mediaType:1}}},{quoted:m});
    await s.sendMessage(m.chat,{react:{text:'✅',key:m.key}});
  }catch(e){console.log('play err:',e.message);reply('❌ Failed')}
}},
{command:'video',aliases:['vid','ytmp4'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{
  let t=args.join(' ');if(!t)return reply('🎥 .video <name/url>');
  try{
    await s.sendMessage(m.chat,{react:{text:'⚡',key:m.key}});
    let u=t;
    if(!t.startsWith('http')){const sr=await yts(t);if(!sr.videos.length)return reply('❌ No videos');u=sr.videos[0].url}
    await s.sendMessage(m.chat,{react:{text:'⬇️',key:m.key}});
    let data=null;const enc=encodeURIComponent(u);
    try{const r=await ax.get(`https://api.ryzendesu.vip/api/downloader/ytmp4?url=${enc}`,{timeout:15e3});if(r.data?.url)data={title:r.data.title,thumbnail:r.data.thumbnail,url:r.data.url};}catch(e){console.log('v1:',e.message)}
    if(!data){try{const r=await ax.get(`https://api.lolhuman.xyz/api/youtube?apikey=GataDios&url=${enc}`,{timeout:15e3});if(r.data?.result)data={title:r.data.result.title,thumbnail:r.data.result.thumbnail,url:r.data.result.link};}catch(e){console.log('v2:',e.message)}}
    if(!data?.url){await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});return reply('⚠️ All servers failed.')}
    const title=data.title||'Video';
    await s.sendMessage(m.chat,{video:{url:data.url},mimetype:'video/mp4',fileName:title.replace(/[^a-zA-Z0-9]/g,'_')+'.mp4',caption:`✅ *${title}*\n👑 ${c.settings.title}`,contextInfo:B(c)},{quoted:m});
    await s.sendMessage(m.chat,{react:{text:'✅',key:m.key}});
  }catch(e){console.log('vid err:',e.message);reply('❌ Failed')}
}},
{command:'tiktok',aliases:['tt','tiktokdl'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{if(!args[0])return reply('❌ TT link?');reply('🎵...');try{let r=await ax.get(`https://tikwm.com/api/?url=${encodeURIComponent(args[0])}`),d=r.data?.data;if(!d?.play)return reply('❌ Failed.');let o=`./tt_${Date.now()}.mp4`;await dl(d.play,o);await s.sendMessage(m.chat,{video:fs.readFileSync(o),caption:`🎬 *TikTok*\n👤 @${d.author?.nickname||'?'}\n⚡ *${c.settings.title}*`,contextInfo:B(c)},{quoted:m});cl(o)}catch(e){reply('❌ '+e.message)}}},
{command:'ig',aliases:['instagram','igdl'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{if(!args[0])return reply('❌ IG link?');let u=args[0],o=`./i_${Date.now()}`;reply('📸...');for(let a of[`https://api.nyxs.pw/dl/ig?url=${encodeURIComponent(u)}`,`https://api.lolhuman.xyz/api/instagram?apikey=GataDios&url=${encodeURIComponent(u)}`]){try{let r=await ax.get(a,{timeout:15e3});let md=r.data?.result?.[0]?.url||r.data?.result?.url||r.data?.url;if(md){let vd=md.includes('.mp4'),fp=vd?o+'.mp4':o+'.jpg';await dl(md,fp);let cx=B(c);if(vd)await s.sendMessage(m.chat,{video:fs.readFileSync(fp),caption:'✅ IG',contextInfo:cx},{quoted:m});else await s.sendMessage(m.chat,{image:fs.readFileSync(fp),caption:'✅ IG',contextInfo:cx},{quoted:m});cl(fp);return}}catch{}}reply('❌ Failed')}},
{command:'fb',aliases:['facebook','fbdl'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{if(!args[0])return reply('❌ FB link?');let u=args[0],o=`./f_${Date.now()}.mp4`;reply('📘...');for(let a of[`https://api.nyxs.pw/dl/fb?url=${encodeURIComponent(u)}`,`https://api.lolhuman.xyz/api/fb?apikey=GataDios&url=${encodeURIComponent(u)}`]){try{let r=await ax.get(a,{timeout:15e3});let v=r.data?.result?.url||r.data?.url;if(v){await dl(v,o);await s.sendMessage(m.chat,{video:fs.readFileSync(o),caption:'✅ FB',contextInfo:B(c)},{quoted:m});cl(o);return}}catch{}}reply('❌ Failed')}},
{command:'lyrics',aliases:['lirik'],category:'downloader',execute:async(s,m,{args,reply})=>{if(!args[0])return reply('❌ Song?');let q=args.join(' ');try{let r=await ax.get(`https://api.lolhuman.xyz/api/lirik?apikey=GataDios&query=${encodeURIComponent(q)}`,{timeout:15e3});if(r.data?.status===200&&r.data.result)return reply(`🎵 *${q}*\n\n${r.data.result.substring(0,2e3)}`);reply('❌ Not found')}catch{reply('❌ Failed')}}},
{command:'yts',aliases:['ytsearch'],category:'downloader',execute:async(s,m,{args,reply})=>{if(!args[0])return reply('❌ Query?');let q=args.join(' ');try{let r=await yts(q);if(!r.videos?.length)return reply('❌ No results');let t=`🔎 *${q}*\n\n`;for(let i=0;i<Math.min(10,r.videos.length);i++){let v=r.videos[i];t+=`${i+1}. *${v.title}*\n   🔗 ${v.url}\n\n`}reply(t)}catch{reply('❌ Failed')}}}
];