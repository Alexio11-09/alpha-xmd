const fs=require('fs'),ax=require('axios'),yts=require('yt-search'),ytdl=require('@distube/ytdl-core'),{downloadContentFromMessage}=require('@whiskeysockets/baileys'),{execSync}=require('child_process');
const cl=f=>setTimeout(()=>{try{fs.unlinkSync(f)}catch{}},3e5);
const dl=async(u,o)=>{const w=fs.createWriteStream(o),r=await ax({url:u,method:'GET',responseType:'stream',timeout:12e4,headers:{'User-Agent':'Mozilla/5.0'}});r.data.pipe(w);return new Promise((a,b)=>{w.on('finish',a);w.on('error',b)})};
const bf=async u=>Buffer.from((await ax.get(u,{responseType:'arraybuffer',timeout:15e3})).data);
const B=c=>({forwardingScore:999,isForwarded:!0,forwardedNewsletterMessageInfo:{newsletterJid:c.newsletter.id+'@newsletter',newsletterName:c.newsletter.name}});
let ytA=null;try{if(fs.existsSync('./cookies.txt')){ytA=ytdl.createAgent(JSON.parse(fs.readFileSync('./cookies.txt','utf8')));console.log('🍪 cookies loaded')}else console.log('⚠️ no cookies.txt')}catch(e){console.log('cookie err:',e.message)}

module.exports=[
{command:'play',aliases:['song','music','play2','ytmp3'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{
  let t=args.join(' ');if(!t)return reply('🎧 .play <song>');
  try{
    await s.sendMessage(m.chat,{react:{text:'🎶',key:m.key}});
    let sr=await yts(t);if(!sr.videos.length){await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});return reply('❌ No song')}
    let v=sr.videos[0];await s.sendMessage(m.chat,{react:{text:'⬇️',key:m.key}});
    if(ytA){try{
      const o=`./p_${Date.now()}.mp3`;
      await new Promise((res,rej)=>{const st=ytdl(v.url,{quality:'highestaudio',filter:'audioonly',agent:ytA}),w=fs.createWriteStream(o);st.pipe(w);w.on('finish',res);w.on('error',rej);st.on('error',rej)});
      if(fs.statSync(o).size<1e4){cl(o);throw new Error('empty')}
      await s.sendMessage(m.chat,{image:{url:v.thumbnail},caption:`🎵 *${v.title}*\n\n👑 ${c.settings.title}`,contextInfo:B(c)},{quoted:m});
      await s.sendMessage(m.chat,{audio:fs.readFileSync(o),mimetype:'audio/mpeg',ptt:!1,fileName:v.title.replace(/[^a-zA-Z0-9]/g,'_')+'.mp3',contextInfo:{externalAdReply:{title:v.title,body:'🎧',thumbnailUrl:v.thumbnail,mediaType:1}}},{quoted:m});
      await s.sendMessage(m.chat,{react:{text:'✅',key:m.key}});cl(o);return;
    }catch(e){console.log('ck play:',e.message)}}
    let d=null;const enc=encodeURIComponent(v.url);
    try{const r=await ax.get(`https://api.ryzendesu.vip/api/downloader/ytmp3?url=${enc}`,{timeout:15e3});if(r.data?.url)d={title:r.data.title||v.title,thumb:r.data.thumbnail||v.thumbnail,audio:r.data.url};}catch(e){console.log('p1:',e.message)}
    if(!d){try{const r=await ax.get(`https://api.lolhuman.xyz/api/ytaudio?apikey=GataDios&url=${enc}`,{timeout:15e3});if(r.data?.result)d={title:r.data.result.title,thumb:r.data.result.thumbnail,audio:r.data.result.link};}catch(e){console.log('p2:',e.message)}}
    if(!d?.audio){await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});return reply('⚠️ All servers failed. Add cookies.txt for reliability.')}
    const title=d.title||v.title;
    await s.sendMessage(m.chat,{image:{url:d.thumb||v.thumbnail},caption:`🎵 *${title}*\n\n👑 ${c.settings.title}`,contextInfo:B(c)},{quoted:m});
    await s.sendMessage(m.chat,{audio:{url:d.audio},mimetype:'audio/mpeg',ptt:!1,fileName:title.replace(/[^a-zA-Z0-9]/g,'_')+'.mp3',contextInfo:{externalAdReply:{title,body:'🎧',thumbnailUrl:d.thumb||v.thumbnail,mediaType:1}}},{quoted:m});
    await s.sendMessage(m.chat,{react:{text:'✅',key:m.key}});
  }catch(e){console.log('play err:',e.message);await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});reply('❌ Failed')}
}},

{command:'video',aliases:['vid','dl','yt','ytmp4'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{
  let t=args.join(' ');if(!t)return reply('🎥 .video <name/url>');
  try{
    await s.sendMessage(m.chat,{react:{text:'⚡',key:m.key}});
    let u=t,info=null;
    if(!t.startsWith('http')){const sr=await yts(t);if(!sr.videos.length){await s.sendMessage(m.chat,{react:{text:'🔍',key:m.key}});return reply('❌ No videos')}info=sr.videos[0];u=info.url}
    if(!u.includes('youtube.com')&&!u.includes('youtu.be')){await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});return reply('❌ Invalid YT link')}
    await s.sendMessage(m.chat,{react:{text:'⬇️',key:m.key}});
    if(ytA){try{
      const info2=await ytdl.getInfo(u,{agent:ytA});
      const f=ytdl.chooseFormat(info2.formats,{quality:'highest',filter:'audioandvideo'});
      if(!f?.url)throw new Error('no fmt');
      const title=info2.videoDetails.title,o=`./v_${Date.now()}.mp4`;
      await new Promise((res,rej)=>{const st=ytdl(u,{quality:'highest',filter:'audioandvideo',agent:ytA}),w=fs.createWriteStream(o);st.pipe(w);w.on('finish',res);w.on('error',rej);st.on('error',rej)});
      const sz=fs.statSync(o).size;
      if(sz<1e4){cl(o);throw new Error('empty')}
      if(sz>104857600){cl(o);return reply('❌ >100MB')}
      await s.sendMessage(m.chat,{image:{url:info2.videoDetails.thumbnails[0].url},caption:`🎬 *${title}*\n\n👑 ${c.settings.title}`,contextInfo:B(c)},{quoted:m});
      await s.sendMessage(m.chat,{video:fs.readFileSync(o),mimetype:'video/mp4',fileName:title.replace(/[^a-zA-Z0-9]/g,'_')+'.mp4',caption:`✅ *${title}*\n\n👑 ${c.settings.title}`,contextInfo:B(c)},{quoted:m});
      await s.sendMessage(m.chat,{react:{text:'✅',key:m.key}});cl(o);return;
    }catch(e){console.log('ck vid:',e.message)}}
    let data=null;const enc=encodeURIComponent(u);
    try{const r=await ax.get(`https://api.ryzendesu.vip/api/downloader/ytmp4?url=${enc}`,{timeout:15e3});if(r.data?.url)data={title:r.data.title,thumbnail:r.data.thumbnail,url:r.data.url};}catch(e){console.log('v1:',e.message)}
    if(!data){try{const r=await ax.get(`https://api.lolhuman.xyz/api/youtube?apikey=GataDios&url=${enc}`,{timeout:15e3});if(r.data?.result)data={title:r.data.result.title,thumbnail:r.data.result.thumbnail,url:r.data.result.link};}catch(e){console.log('v2:',e.message)}}
    if(!data?.url){await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});return reply('⚠️ All servers failed. Add cookies.txt for reliability.')}
    const title=data.title||info?.title||'Video';
    await s.sendMessage(m.chat,{image:{url:data.thumbnail||info?.thumbnail},caption:`🎬 *${title}*\n\n👑 ${c.settings.title}`,contextInfo:B(c)},{quoted:m});
    await s.sendMessage(m.chat,{video:{url:data.url},mimetype:'video/mp4',fileName:title.replace(/[^a-zA-Z0-9]/g,'_')+'.mp4',caption:`✅ *${title}*\n\n👑 ${c.settings.title}`,contextInfo:B(c)},{quoted:m});
    await s.sendMessage(m.chat,{react:{text:'✅',key:m.key}});
  }catch(e){console.log('vid err:',e.message);await s.sendMessage(m.chat,{react:{text:'❌',key:m.key}});reply('❌ Failed')}
}},

{command:'tiktok',aliases:['tt','tiktokdl'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{if(!args[0])return reply('❌ TT link?');reply('🎵...');try{let r=await ax.get(`https://tikwm.com/api/?url=${encodeURIComponent(args[0])}`),d=r.data?.data;if(!d?.play)return reply('❌ Failed.');let o=`./tt_${Date.now()}.mp4`;await dl(d.play,o);await s.sendMessage(m.chat,{video:fs.readFileSync(o),caption:`🎬 *TikTok*\n👤 @${d.author?.nickname||'?'}\n⚡ *${c.settings.title}*`,contextInfo:B(c)},{quoted:m});cl(o)}catch(e){reply('❌ '+e.message)}}},

{command:'fb',aliases:['facebook','fbdl'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{if(!args[0])return reply('❌ FB link?');let u=args[0],o=`./f_${Date.now()}.mp4`;reply('📘...');for(let a of[`https://api.nyxs.pw/dl/fb?url=${encodeURIComponent(u)}`,`https://api.lolhuman.xyz/api/fb?apikey=GataDios&url=${encodeURIComponent(u)}`]){try{let r=await ax.get(a,{timeout:15e3});let v=r.data?.result?.url||r.data?.url;if(v){await dl(v,o);await s.sendMessage(m.chat,{video:fs.readFileSync(o),caption:'✅ FB',contextInfo:B(c)},{quoted:m});cl(o);return}}catch{}}reply('❌ Failed')}},

{command:'ig',aliases:['insta','instagram','igdl'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{if(!args[0])return reply('❌ IG link?');let u=args[0],o=`./i_${Date.now()}`;reply('📸...');for(let a of[`https://api.nyxs.pw/dl/ig?url=${encodeURIComponent(u)}`,`https://api.lolhuman.xyz/api/instagram?apikey=GataDios&url=${encodeURIComponent(u)}`]){try{let r=await ax.get(a,{timeout:15e3});let md=r.data?.result?.[0]?.url||r.data?.result?.url||r.data?.url;if(md){let vd=md.includes('.mp4'),fp=vd?o+'.mp4':o+'.jpg';await dl(md,fp);let cx=B(c);if(vd)await s.sendMessage(m.chat,{video:fs.readFileSync(fp),caption:'✅ IG',contextInfo:cx},{quoted:m});else await s.sendMessage(m.chat,{image:fs.readFileSync(fp),caption:'✅ IG',contextInfo:cx},{quoted:m});cl(fp);return}}catch{}}reply('❌ Failed')}},

{command:'spotify',aliases:['sp','spotdl'],category:'downloader',execute:async(s,m,{args,reply,config:c})=>{if(!args[0])return reply('❌ Track/URL?');let q=args.join(' ');reply('🎵...');try{let r=await ax.get(`https://api.spotify-dl.workers.dev/?url=${encodeURIComponent(q)}`,{timeout:2e4});if(r.data?.success&&r.data?.audio){let t=r.data;await s.sendMessage(m.chat,{image:{url:t.cover},caption:`🎧 *${t.title}*\n👤 ${t.artist||''}`},{quoted:m});await s.sendMessage(m.chat,{audio:{url:t.audio},mimetype:'audio/mpeg',ptt:!1,fileName:`${(t.title||'sp').replace(/[^\w\s-]/g,'_')}.mp3`,contextInfo:{externalAdReply:{title:t.title,body:t.artist,thumbnailUrl:t.cover,mediaType:1}}},{quoted:m});return}reply('❌ Not found')}catch{reply('❌ Failed')}}},

{command:'shazam',aliases:['identify','whatsong'],category:'downloader',execute:async(s,m,{reply})=>{if(!m.quoted)return reply('❌ Reply to audio!');let qt=m.quoted.message;if(!qt)return reply('❌ Cannot read');let t=Object.keys(qt)[0];if(!['audioMessage','voiceMessage','videoMessage'].includes(t))return reply('❌ Unsupported');reply('🎧...');let inf,ouf;try{let st=await downloadContentFromMessage(qt[t],t==='videoMessage'?'video':'audio'),b=Buffer.from([]);for await(let c of st)b=Buffer.concat([b,c]);inf=`./si_${Date.now()}`,ouf=`./so_${Date.now()}.mp3`;fs.writeFileSync(inf,b);try{execSync(`ffmpeg -y -i ${inf} -vn -ar 44100 -ac 2 -b:a 128k ${ouf}`,{stdio:'ignore'})}catch{fs.copyFileSync(inf,ouf)}let ab=fs.readFileSync(ouf).toString('base64'),r=await ax.post('https://api.audd.io/',{api_token:'test',audio:ab,return:'apple_music,spotify'},{headers:{'Content-Type':'application/json'},timeout:15e3});let d=r.data;if(d.status==='success'&&d.result){let g=d.result,cu=g.apple_music?.artwork?.url?.replace('{w}','300').replace('{h}','300')||g.spotify?.album?.images?.[0]?.url||'',tx=`🎵 *${g.title||'?'}*\n👤 ${g.artist||'?'}\n💿 ${g.album||'?'}`;if(cu)await s.sendMessage(m.chat,{image:{url:cu},caption:tx},{quoted:m});else reply(tx)}else reply('❌ Not recognized')}catch(e){console.error(e);reply('❌ Failed')}finally{try{fs.unlinkSync(inf)}catch{}try{fs.unlinkSync(ouf)}catch{}}}},

{command:'yts',aliases:['ytsearch'],category:'downloader',execute:async(s,m,{args,reply})=>{if(!args[0])return reply('❌ Query?');let q=args.join(' ');try{let r=await yts(q);if(!r.videos?.length)return reply('❌ No results');let t=`🔎 *${q}*\n\n`;for(let i=0;i<Math.min(10,r.videos.length);i++){let v=r.videos[i];t+=`${i+1}. *${v.title}*\n   🔗 ${v.url}\n\n`}reply(t)}catch{reply('❌ Failed')}}},

{command:'movie',aliases:['film'],category:'downloader',execute:async(s,m,{args,reply})=>{if(!args[0])return reply('❌ Movie?');let q=args.join(' ');try{let r=await ax.get(`http://www.omdbapi.com/?t=${encodeURIComponent(q)}&apikey=thewdb`);if(r.data.Response==='False')return reply('❌ Not found');let v=r.data,info=`🎬 *${v.Title}* (${v.Year})\n⭐ ${v.imdbRating}/10\n📖 ${v.Plot}`;if(v.Poster!=='N/A')await s.sendMessage(m.chat,{image:{url:v.Poster},caption:info},{quoted:m});else reply(info)}catch{reply('❌ Failed')}}},

{command:'img',aliases:['image'],category:'downloader',execute:async(s,m,{args,reply})=>{if(!args[0])return reply('❌ Query?');let q=args.join(' ');try{for(let i=0;i<3;i++){let u=`https://source.unsplash.com/featured/?${encodeURIComponent(q)}&sig=${i}`;let b=await bf(u);await s.sendMessage(m.chat,{image:b,caption:`📸 ${q}`},{quoted:i===0?m:undefined});if(i<2)await new Promise(r=>setTimeout(r,500))}}catch{reply('❌ Failed')}}},

{command:'gitclone',aliases:['git'],category:'downloader',execute:async(s,m,{args,reply})=>{if(!args[0])return reply('❌ GitHub link?');let u=args[0].replace(/\/$/,'');if(!u.includes('github.com'))return reply('❌ Invalid');let p=u.split('/'),rp=p[p.length-1],o=`./g_${Date.now()}.zip`;reply('📦...');try{let z=`${u}/archive/refs/heads/main.zip`;try{await dl(z,o)}catch{z=`${u}/archive/refs/heads/master.zip`;await dl(z,o)}await s.sendMessage(m.chat,{document:fs.readFileSync(o),fileName:`${rp}.zip`,mimetype:'application/zip'},{quoted:m});cl(o)}catch{reply('❌ Failed')}}},

{command:'lyrics',aliases:['lirik'],category:'downloader',execute:async(s,m,{args,reply})=>{if(!args[0])return reply('❌ Song?');let q=args.join(' ');try{let r=await ax.get(`https://api.lolhuman.xyz/api/lirik?apikey=GataDios&query=${encodeURIComponent(q)}`,{timeout:15e3});if(r.data?.status===200&&r.data.result)return reply(`🎵 *${q}*\n\n${r.data.result.substring(0,2e3)}`);reply('❌ Not found')}catch{reply('❌ Failed')}}}
];