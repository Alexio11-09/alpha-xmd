const fs=require('fs'),{exec}=require('child_process'),os=require('os'),path=require('path'),{downloadContentFromMessage}=require('@whiskeysockets/baileys'),cl=j=>j?j.replace(/[^0-9]/g,''):'';
const op='./database/owners.json';
[op].forEach(p=>{if(!fs.existsSync(path.dirname(p)))fs.mkdirSync(path.dirname(p),{recursive:!0});if(!fs.existsSync(p))fs.writeFileSync(p,JSON.stringify({tempOwners:[]}))});
const LO=()=>{try{return JSON.parse(fs.readFileSync(op))}catch{return{tempOwners:[]}}},SO=d=>fs.writeFileSync(op,JSON.stringify(d,null,2)),T=(s,m)=>m.mentionedJid?.[0]||m.quoted?.sender||(s?s.replace(/[^0-9]/g,'')+'@s.whatsapp.net':null);

module.exports=[
{command:"botip",aliases:["serverip","myip","getip"],category:"owner",owner:!0,execute:async(s,m,{reply:r})=>{exec('curl -s ifconfig.me',(e,o)=>{e?exec('curl -s ipinfo.io/ip',(e2,o2)=>r(`🌐 ${o2.trim()}`)):r(`🌐 ${o.trim()}`)})}},
{command:"restart",aliases:["reboot","reload"],category:"owner",owner:!0,execute:async(s,m,{reply:r})=>{await r("🔄 Restarting session...");setTimeout(async()=>{try{await s.end(undefined)}catch(e){}},2000)}},
{command:"update",aliases:["up"],category:"owner",owner:!0,execute:async(s,m,{reply:r})=>{await r("🔄 Updating...");try{exec('git pull');r("✅ Updated. Restarting...");setTimeout(()=>process.exit(0),2000)}catch(e){r(`❌ ${e.message}`)}}},
{command:"shutdown",aliases:["stop","kill"],category:"owner",owner:!0,execute:async(s,m,{reply:r})=>{await r("🔴 Shutting down...");setTimeout(()=>process.exit(0),1500)}},
{command:"eval",aliases:[">","exec"],category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{if(!a[0])return r("❌ Code?");try{let res=eval(a.join(" "));typeof res==='object'&&(res=JSON.stringify(res,null,2));r(`✅ ${String(res).substring(0,1000)}`)}catch(e){r(`❌ ${e.message}`)}}},
{command:"bc",aliases:["broadcast"],category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{if(!a[0])return r("❌ Msg?");let msg=a.join(" "),chats=Object.keys(await s.groupFetchAllParticipating());if(!chats.length)return r("❌ No groups.");r(`📢 ${chats.length} groups...`);let ok=0,fl=0;for(let c of chats){try{await s.sendMessage(c,{text:`📢 BROADCAST\n\n${msg}`});ok++}catch{fl++};await new Promise(r=>setTimeout(r,500))}r(`✅ ${ok} | ❌ ${fl}`)}},
{command:"join",aliases:["enter"],category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{if(!a[0])return r("❌ Link?");let code=a[0].split('/').pop().replace(/\?.*/,'');try{r(`✅ Joined: ${await s.groupAcceptInvite(code)}`)}catch(e){r(`❌ ${e.message}`)}}},
{command:"leave",aliases:["exit"],category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{if(!m.isGroup)return r("❌ Groups only.");if(a[0]==='all'){let chats=Object.keys(await s.groupFetchAllParticipating()),ok=0;for(let c of chats){try{await s.groupLeave(c);ok++}catch{}}r(`✅ Left ${ok} groups.`)}else{try{await s.groupLeave(m.chat)}catch(e){r(`❌ ${e.message}`)}}}},
{command:"block",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{let target;if(m.isGroup){if(!a[0]&&!m.quoted)return r("❌ Tag a user or reply to their message.");target=T(a[0],m)}else{target=a[0]?T(a[0],m):m.chat}if(!target||target===s.user.id)return r("❌ Invalid target.");let blockJid=target;if(m.isGroup){try{const meta=await s.groupMetadata(m.chat),num=target.split('@')[0].replace(/[^0-9]/g,''),p=meta.participants.find(x=>{const id=x.id?x.id.split('@')[0].replace(/[^0-9]/g,''):'',pn=x.phoneNumber?x.phoneNumber.split('@')[0].replace(/[^0-9]/g,''):'',lid=x.lid?x.lid.split('@')[0].replace(/[^0-9]/g,''):'';return id===num||pn===num||lid===num});if(p){if(p.lid)blockJid=p.lid;else if(p.id)blockJid=p.id}}catch(e){}}try{await s.updateBlockStatus(blockJid,"block");r(`🚫 Blocked @${target.split('@')[0]}`)}catch(e){try{await s.updateBlockStatus(target,"block");r(`🚫 Blocked @${target.split('@')[0]}`)}catch(e2){r(`❌ Failed to block: ${e2.message}`)}}}},
{command:"unblock",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{let target;if(m.isGroup){if(!a[0]&&!m.quoted)return r("❌ Tag a user or reply to their message.");target=T(a[0],m)}else{target=a[0]?T(a[0],m):m.chat}if(!target)return r("❌ Invalid target.");let unblockJid=target;if(m.isGroup){try{const meta=await s.groupMetadata(m.chat),num=target.split('@')[0].replace(/[^0-9]/g,''),p=meta.participants.find(x=>{const id=x.id?x.id.split('@')[0].replace(/[^0-9]/g,''):'',pn=x.phoneNumber?x.phoneNumber.split('@')[0].replace(/[^0-9]/g,''):'',lid=x.lid?x.lid.split('@')[0].replace(/[^0-9]/g,''):'';return id===num||pn===num||lid===num});if(p){if(p.lid)unblockJid=p.lid;else if(p.id)unblockJid=p.id}}catch(e){}}try{await s.updateBlockStatus(unblockJid,"unblock");r(`✅ Unblocked @${target.split('@')[0]}`)}catch(e){try{await s.updateBlockStatus(target,"unblock");r(`✅ Unblocked @${target.split('@')[0]}`)}catch(e2){r(`❌ Failed to unblock: ${e2.message}`)}}}},
{command:"blocklist",category:"owner",owner:!0,execute:async(s,m,{reply:r})=>{try{let b=await s.fetchBlocklist();if(!b.length)return r("📋 None.");let t=`🚫 ${b.length}\n\n`;b.forEach(u=>t+=`• @${u.split('@')[0]}\n`);s.sendMessage(m.chat,{text:t,mentions:b})}catch(e){r(`❌ ${e.message}`)}}},
{command:"pm",aliases:["msg"],category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{if(!a[0]||!a[1])return r("❌ .pm <num> <msg>");try{await s.sendMessage(a[0].replace(/[^0-9]/g,'')+'@s.whatsapp.net',{text:a.slice(1).join(" ")});r("✅ Sent")}catch(e){r(`❌ ${e.message}`)}}},
{command:"addowner",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{let t=T(a[0],m);if(!t)return r("❌ Target?");let o=LO(),n=cl(t);if(!o.tempOwners.includes(n)){o.tempOwners.push(n);SO(o);r(`👑 Added @${t.split('@')[0]}`)}else r("❌ Already owner.")}},
{command:"delowner",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{let t=T(a[0],m);if(!t)return r("❌ Target?");let o=LO(),n=cl(t),i=o.tempOwners.indexOf(n);if(i>-1){o.tempOwners.splice(i,1);SO(o);r(`✅ Removed @${t.split('@')[0]}`)}else r("❌ Not owner.")}},
{command:"owners",category:"owner",owner:!0,execute:async(s,m,{reply:r,config:cfg})=>{let o=LO(),t=`👑 OWNERS\n\n🔷 Main: ${cfg.owner.join(', ')}\n`;if(o.tempOwners.length){t+=`\n🔶 Temp:\n`;o.tempOwners.forEach(x=>t+=`• ${x}\n`)}r(t)}},
{command:"getchannel",aliases:["cjid"],category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{let m2=a[0]?.match(/channel\/([^\/\?]+)/);if(!m2)return r("❌ Link?");r(`✅ \`${m2[1]+'@newsletter'}\``)}},
{command:"anticall",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{let p='./database/anticall.json';if(!fs.existsSync(p))fs.writeFileSync(p,'{"enabled":0,"block":0}');let db=a[0]?.toLowerCase(),arg2=a[1]?.toLowerCase();if(!db){let d=JSON.parse(fs.readFileSync(p));return r(`📵 *Anti-Call Status*\n\nStatus: ${d.enabled?'ON':'OFF'}\nMode: ${d.block?'BLOCK':'WARN'}\n\nUsage:\n.anticall on/off\n.anticall block on/off`)}if(db==='block'){if(arg2==='on'||arg2==='off'){let d=JSON.parse(fs.readFileSync(p));d.block=arg2==='on'?1:0;d.enabled=1;fs.writeFileSync(p,JSON.stringify(d,null,2));r(`📵 *Anti-Call Block* is now *${arg2.toUpperCase()}*`)}else{let d=JSON.parse(fs.readFileSync(p));r(`Usage: .anticall block on/off\nCurrent: ${d.block?'ON':'OFF'}`)}}else if(db==='on'||db==='off'){let d=JSON.parse(fs.readFileSync(p));d.enabled=db==='on'?1:0;if(db==='off')d.block=0;fs.writeFileSync(p,JSON.stringify(d,null,2));r(`📵 *Anti-Call* is now *${db.toUpperCase()}* (Mode: ${d.block?'BLOCK':'WARN'})`)}}},
{command:"hack",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{let t=T(a[0],m);if(!t)return r('❌ Target?');let n=t.split('@')[0];for(let i of[`🔍 0%`, `🛰️ 20%`, `🔓 40%`, `📡 60%`, `🗂️ 80%`, `✅ ${n} hacked! 😂`]){await s.sendMessage(m.chat,{text:i},{quoted:m});await new Promise(x=>setTimeout(x,1000))}}},
{command:"poststatus",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{try{if(m.quoted){let b=await s.downloadMediaMessage(m.quoted),t=Object.keys(m.quoted.message)[0];if(t.includes('image')||t.includes('video')){await s.sendMessage('status@broadcast',{[t.includes('image')?'image':'video']:b,caption:a.join(' ')},{statusJidList:[s.user.id]});r('✅ Posted')}}else if(a[0]){await s.sendMessage('status@broadcast',{text:a.join(' ')},{statusJidList:[s.user.id]});r('✅ Posted')}}catch(e){r(`❌ ${e.message}`)}}},
{command:"cleartmp",category:"owner",owner:!0,execute:async(s,m,{reply:r})=>{try{let t=os.tmpdir(),c=0;fs.readdirSync(t).forEach(f=>{if(f.startsWith('pair_')){fs.rmSync(path.join(t,f),{recursive:1,force:1});c++}});r(`🧹 ${c} files`)}catch(e){r(`❌ ${e.message}`)}}},
{command:"autosticker",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{let p='./database/autosticker.json',c=a[0]?.toLowerCase();if(c==='on'||c==='off'){fs.writeFileSync(p,`{"enabled":${c==='on'?1:0}}`);r(`🖼️ ${c.toUpperCase()}`)}else{let d=fs.existsSync(p)?JSON.parse(fs.readFileSync(p)):{enabled:0};r(`🖼️ ${d.enabled?'ON':'OFF'}`)}}},
{command:"autovoice",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{let p='./database/autovoice.json',c=a[0]?.toLowerCase();if(c==='on'||c==='off'){fs.writeFileSync(p,`{"enabled":${c==='on'?1:0}}`);r(`🎤 ${c.toUpperCase()}`)}else{let d=fs.existsSync(p)?JSON.parse(fs.readFileSync(p)):{enabled:0};r(`🎤 ${d.enabled?'ON':'OFF'}`)}}},
{command:"dmblocker",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{let p='./database/dmblocker.json',c=a[0]?.toLowerCase();if(c==='on'||c==='off'){fs.writeFileSync(p,`{"enabled":${c==='on'?1:0}}`);r(`🚫 ${c.toUpperCase()}`)}else{let d=fs.existsSync(p)?JSON.parse(fs.readFileSync(p)):{enabled:0};r(`🚫 ${d.enabled?'ON':'OFF'}`)}}},
{command:"antispam",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{let p='./database/antispam.json',c=a[0]?.toLowerCase();if(c==='on'||c==='off'){fs.writeFileSync(p,`{"enabled":${c==='on'?1:0}}`);r(`🛡️ ${c.toUpperCase()}`)}else{let d=fs.existsSync(p)?JSON.parse(fs.readFileSync(p)):{enabled:0};r(`🛡️ ${d.enabled?'ON':'OFF'}`)}}},
{command:"chatbot",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{let p='./database/chatbot.json',c=a[0]?.toLowerCase();if(c==='on'||c==='off'){fs.writeFileSync(p,`{"enabled":${c==='on'?1:0}}`);r(`🤖 ${c.toUpperCase()}`)}else{let d=fs.existsSync(p)?JSON.parse(fs.readFileSync(p)):{enabled:0};r(`🤖 ${d.enabled?'ON':'OFF'}`)}}},
{command:"clear",aliases:["purge"],category:"owner",owner:!0,execute:async(s,m,{reply:r})=>{try{const lastMsg=m.quoted||m;await s.chatModify({clear:true,lastMessages:[{key:lastMsg.key,messageTimestamp:lastMsg.messageTimestamp}]},m.chat);}catch(e){console.log("Clear error:",e.message)}}},
{command:"clearsession",category:"owner",owner:!0,execute:async(s,m,{reply:r})=>{let d=path.join(__dirname,'..','sessions',m.sender.split('@')[0].split(':')[0]);if(fs.existsSync(d))fs.rmSync(d,{recursive:true,force:true});await r("✅ Cleared. Disconnecting...");setTimeout(async()=>{try{await s.logout()}catch{}},2000)}},
{command:"sudo",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{let t=T(a[1],m),c=a[0]?.toLowerCase();if(c==='add'&&t){let o=LO(),n=cl(t);if(!o.tempOwners.includes(n)){o.tempOwners.push(n);SO(o);r(`👑 Added @${t.split('@')[0]}`)}}else if(c==='del'&&t){let o=LO(),n=cl(t),i=o.tempOwners.indexOf(n);if(i>-1){o.tempOwners.splice(i,1);SO(o);r(`✅ Removed @${t.split('@')[0]}`)}}else r("Usage: .sudo add/del @user")}},
{command:"bothosting",category:"owner",owner:!0,execute:async(s,m,{reply:r})=>{r("🖥️ Coming soon.")}},
{command:"webzip",category:"owner",owner:!0,execute:async(s,m,{reply:r})=>{r("📦 Dev.")}},
{command:"antiblock",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{let p='./database/antiblock.json',c=a[0]?.toLowerCase();if(c==='on'||c==='off'){fs.writeFileSync(p,`{"enabled":${c==='on'?1:0}}`);r(`🛡️ ${c.toUpperCase()}`)}else{let d=fs.existsSync(p)?JSON.parse(fs.readFileSync(p)):{enabled:0};r(`🛡️ ${d.enabled?'ON':'OFF'}`)}}},
{command:"autobio",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{
    const p='./database/autobio.json';
    if(!fs.existsSync(p))fs.writeFileSync(p,'{"enabled":0}');
    let c=a[0]?.toLowerCase();
    if(c==='on'||c==='off'){
        fs.writeFileSync(p,JSON.stringify({enabled:c==='on'?1:0}));
        r(`📝 Autobio ${c.toUpperCase()}`);
    }else{
        let d=JSON.parse(fs.readFileSync(p));
        r(`📝 Autobio is ${d.enabled?'ON':'OFF'}`);
    }
}},
{command:"deljunk",category:"owner",owner:!0,execute:async(s,m,{reply:r})=>{try{let t=os.tmpdir(),c=0;fs.readdirSync(t).forEach(f=>{if(f.startsWith('junk_')){fs.rmSync(path.join(t,f),{recursive:1,force:1});c++}});r(`🗑️ ${c} files`)}catch{r("❌ Failed")}}},
{command:"disk",category:"owner",owner:!0,execute:async(s,m,{reply:r})=>{try{r(`💾 ${exec('df -h /').toString()}`)}catch{r("❌ Failed")}}},
{command:"tostatus",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{if(!m.quoted)return r("❌ Reply to a message/status to post.");try{const q=m.quoted,type=Object.keys(q.message)[0],sjl=[s.user.id];if(type==='conversation'||type==='extendedTextMessage'){const txt=q.text||q.message?.conversation||q.message?.extendedTextMessage?.text||a.join(' ');if(!txt)return r("❌ No text.");await s.sendMessage('status@broadcast',{text:txt,backgroundColor:'#000000'},{statusJidList:sjl});return r("✅ Text posted!")}if(type==='imageMessage'){const st=await downloadContentFromMessage(q.message.imageMessage,'image');let b=Buffer.from([]);for await(const c of st)b=Buffer.concat([b,c]);await s.sendMessage('status@broadcast',{image:b,caption:a.join(' ')},{statusJidList:sjl});return r("✅ Image posted!")}if(type==='videoMessage'){const st=await downloadContentFromMessage(q.message.videoMessage,'video');let b=Buffer.from([]);for await(const c of st)b=Buffer.concat([b,c]);await s.sendMessage('status@broadcast',{video:b,caption:a.join(' ')},{statusJidList:sjl});return r("✅ Video posted!")}return r("❌ Unsupported type.")}catch(e){return r(`❌ Failed: ${e.message}`)}}},
{command:"save",category:"owner",owner:!0,execute:async(s,m,{reply:r})=>{if(!m.quoted)return r("❌ Reply to media/status to save.");try{const q=m.quoted;let aM=q.message;if(aM?.viewOnceMessageV2)aM=aM.viewOnceMessageV2.message;if(aM?.viewOnceMessage)aM=aM.viewOnceMessage.message;const type=Object.keys(aM)[0];let b=Buffer.from([]);if(type==='imageMessage'){const st=await downloadContentFromMessage(aM.imageMessage,'image');for await(const c of st)b=Buffer.concat([b,c]);await s.sendMessage(m.chat,{image:b,caption:"✅ Saved"},{quoted:m})}else if(type==='videoMessage'){const st=await downloadContentFromMessage(aM.videoMessage,'video');for await(const c of st)b=Buffer.concat([b,c]);await s.sendMessage(m.chat,{video:b,caption:"✅ Saved"},{quoted:m})}else if(type==='audioMessage'){const st=await downloadContentFromMessage(aM.audioMessage,'audio');for await(const c of st)b=Buffer.concat([b,c]);await s.sendMessage(m.chat,{audio:b,mimetype:'audio/mp4'},{quoted:m})}else{return r("❌ Unsupported type.")}}catch(e){return r(`❌ Failed: ${e.message}`)}}},
{command:"toviewonce",category:"owner",owner:!0,execute:async(s,m,{reply:r})=>{if(!m.quoted)return;try{let t=Object.keys(m.quoted.message)[0],b=await s.downloadMediaMessage(m.quoted);if(t.includes('image')||t.includes('video')){await s.sendMessage(m.chat,{[t.includes('image')?'image':'video']:b,caption:"✅ View-once",viewOnce:1},{quoted:m})}}catch{}}},
{command:"autosavestatus",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{r(a[0]==='on'?"ON":"OFF")}},
{command:"lastseen",category:"owner",owner:!0,execute:async(s,m,{reply:r})=>{r("👀 .wastalk")}},
{command:"ppprivacy",category:"owner",owner:!0,execute:async(s,m,{reply:r})=>{r("🔒 Can't change")}},
{command:"readreceipts",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{r(a[0]==='on'?"ON":"OFF")}},
{command:"delete",aliases:["del"],category:"owner",owner:!0,execute:async(s,m,{reply:r})=>{if(!m.quoted||(!m.isBotAdmin&&!m.isAdmin))return;try{await s.sendMessage(m.chat,{delete:m.quoted.key});r("🗑️ Deleted")}catch{}}},
{command:"antigroupmention",aliases:["antigm"],category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{let p='./database/antigroupmention.json',c=a[0]?.toLowerCase();if(c==='on'||c==='off'){fs.writeFileSync(p,`{"enabled":${c==='on'?1:0}}`);r(`🛡️ Antigroupmention ${c.toUpperCase()}`)}else{let d=fs.existsSync(p)?JSON.parse(fs.readFileSync(p)):{enabled:0};r(`🛡️ Antigroupmention is ${d.enabled?'ON':'OFF'}`)}}},
{command:"antibot",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{let p='./database/antibot.json',c=a[0]?.toLowerCase();if(c==='on'||c==='off'){fs.writeFileSync(p,`{"enabled":${c==='on'?1:0}}`);r(`🤖 Antibot ${c.toUpperCase()}`)}else{let d=fs.existsSync(p)?JSON.parse(fs.readFileSync(p)):{enabled:0};r(`🤖 Antibot is ${d.enabled?'ON':'OFF'}`)}}},
{command:"antiforeign",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{let p='./database/antiforeign.json';if(!a[0])return r("Usage: .antiforeign on/off\n.antiforeign +233");let c=a[0]?.toLowerCase();if(c==='on'||c==='off'){fs.writeFileSync(p,`{"enabled":${c==='on'?1:0}}`);r(`🚫 Antiforeign ${c.toUpperCase()}`)}else if(c.startsWith('+')){fs.writeFileSync(p,`{"enabled":1,"code":"${c.replace('+','')}"}`);r(`🚫 Antiforeign enabled for +${c.replace('+','')}`)}else{r(`❌ Invalid input.`)}}},
{command:"channel",category:"owner",owner:!0,execute:async(s,m,{args:a,reply:r})=>{
    if(!a[0]) return r("Usage:\n.channel react <link>\n.channel vote <link> <option_number>\n.channel automation <link> on/off");
    const sub = a[0].toLowerCase();
    const link = a[1];
    if(!link) return r("❌ Provide a channel link.");
    
    let jid = null, msgId = null;
    const parts = link.split('/');
    if (parts.length >= 6) { jid = parts[4] + '@newsletter'; msgId = parts[5]; }
    else if (parts.length === 5) { jid = parts[4] + '@newsletter'; }
    else return r("❌ Invalid channel link format.");

    if (sub === 'react') {
        if (!msgId) return r("❌ You must provide an update link (with the message ID at the end).");
        try {
            const emojis = ["🔥","💯","🚀","❤️","😂","⚡","🎉","👑","💎","🤯"];
            for (const e of emojis) {
                if (s.newsletterReact) {
                    await s.newsletterReact(jid, msgId, e);
                } else {
                    await s.relayMessage(jid, {
                        reactionMessage: {
                            key: { remoteJid: jid, id: msgId, fromMe: false },
                            text: e,
                            senderTimestampMs: Date.now()
                        }
                    }, {});
                }
                await new Promise(res => setTimeout(res, 1000));
            }
            return r("✅ Reacted to the channel post!");
        } catch (e) { return r(`❌ Failed to react: ${e.message}`); }
    }

    if (sub === 'vote') {
        if (!msgId) return r("❌ You must provide a poll update link.");
        const optIndex = parseInt(a[2]);
        if (isNaN(optIndex)) return r("❌ Provide a valid option number (e.g., 1 for first option).");
        
        try {
            if (global.pollCache && global.pollCache.has(msgId)) {
                const pollMsg = global.pollCache.get(msgId);
                const options = pollMsg.message.pollCreationMessage.options;
                if (optIndex < 1 || optIndex > options.length) return r("❌ Invalid option number.");
                const selectedOption = options[optIndex - 1].optionName;
                
                await s.sendMessage(jid, { 
                    pollUpdateMessage: { 
                        pollCreationMessageKey: pollMsg.key, 
                        vote: { [selectedOption]: 1 } 
                    } 
                });
                return r(`✅ Voted for *${selectedOption}*!`);
            } else {
                return r("❌ Poll not found in cache. The bot must see the poll when it's posted to cache it. Please try again after the bot caches a new poll.");
            }
        } catch (e) { return r(`❌ Failed to vote: ${e.message}`); }
    }

    if (sub === 'automation') {
        const status = a[2]?.toLowerCase();
        if (status !== 'on' && status !== 'off') return r("❌ Use on/off.");
        const p = './database/channel_automation.json';
        let db = {};
        if (fs.existsSync(p)) { try { db = JSON.parse(fs.readFileSync(p)); } catch(e){} }
        if (status === 'on') { db[jid] = true; r(`✅ Automation ON for this channel.`); }
        else { delete db[jid]; r(`✅ Automation OFF for this channel.`); }
        fs.writeFileSync(p, JSON.stringify(db, null, 2));
        return;
    }
    return r("❌ Unknown subcommand. Use react, vote, or automation.");
}}
];