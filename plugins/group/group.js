const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const tenant = require('../../library/tenant');
const defaults = () => ({ welcome:false, welcomeMsg:"Welcome @user! 🎉", goodbye:false, goodbyeMsg:"Goodbye @user! 👋", antilink:false, antilinkAction:"delete", antilinkMode:"admins", blockedCountries:[], antiforeign:false, antibot:false, antidemote:false, antisticker:false, antitag:false });
const c = (sock) => tenant.read(sock, 'groupSettings.json', {});
const d = (sock, data) => tenant.write(sock, 'groupSettings.json', data);
const f = (chat, sock) => ({ ...defaults(), ...(c(sock)[chat] || {}) });
const i = (chat, changes, sock) => { const data = c(sock); data[chat] = { ...f(chat, sock), ...changes }; return d(sock, data); };
const getGB = (sock) => tenant.read(sock, 'groupBans.json', {});
const saveGB = (sock, data) => tenant.write(sock, 'groupBans.json', data);
const l = (arr) => arr[Math.floor(Math.random() * arr.length)];
const m = ["👾 Oops, circuits tangled. Retry?", "💥 Failed! But I'm still cool.", "😅 Something broke. Try again?"];
const n = ["🤖 I need admin powers. Promote me!", "⚡ Admin required, I'm just a servant."];
const o = (_e, usage) => l([`🧐 Use: *${usage}*`, `🤔 Try: *${usage}*`, `😜 Right: *${usage}*`, `🙈 Type: *${usage}*`]);
const warnings = (sock) => tenant.read(sock, 'warnings.json', {});
const saveWarnings = (sock, data) => tenant.write(sock, 'warnings.json', data);
const addWarning = (chat, user, sock) => { const data = warnings(sock); data[chat] ||= {}; data[chat][user] = (data[chat][user] || 0) + 1; saveWarnings(sock, data); return data[chat][user]; };
const getWarning = (chat, user, sock) => warnings(sock)[chat]?.[user] || 0;
const clearWarning = (chat, user, sock) => { const data = warnings(sock); if (data[chat]) delete data[chat][user]; saveWarnings(sock, data); };

module.exports=[
{command:"tagall",group:!0,admin:!0,execute:async(e,t,{reply:u})=>{if(!t.isBotAdmin)return u(l(n));try{let v=await e.groupMetadata(t.chat),w=v.participants,x=l(["📢 Everyone!","📣 Squad!"])+"\n\n";for(let y of w)x+=`@${y.id.split("@")[0]}\n`;await e.sendMessage(t.chat,{text:x,mentions:w.map(y=>y.id)},{quoted:t})}catch{u(l(m))}}},
{command:"kick",group:!0,admin:!0,execute:async(e,t,{reply:u})=>{let v=t.mentionedJid?.[0]||t.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];if(!v)return u(o("kick",".kick @user"));if(!t.isBotAdmin)return u(l(n));try{await e.groupParticipantsUpdate(t.chat,[v],"remove"),u(l([`👢 @${v.split("@")[0]} kicked!`]),{mentions:[v]})}catch{u(l(m))}}},
{command:"add",group:!0,admin:!0,execute:async(e,t,{args:u,reply:v})=>{if(!u[0])return v(o("add",".add 123456789"));let w=u[0].replace(/[^0-9]/g,"")+"@s.whatsapp.net";if(!t.isBotAdmin)return v(l(n));try{await e.groupParticipantsUpdate(t.chat,[w],"add"),v(l([`🚀 @${w.split("@")[0]} joined!`]),{mentions:[w]})}catch{v(l(m))}}},
{command:"promote",group:!0,admin:!0,execute:async(e,t,{reply:u})=>{let v=t.mentionedJid?.[0]||t.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];if(!v)return u(o("promote",".promote @user"));if(!t.isBotAdmin)return u(l(n));try{await e.groupParticipantsUpdate(t.chat,[v],"promote"),u(l([`👑 @${v.split("@")[0]} is admin.`]),{mentions:[v]})}catch{u(l(m))}}},
{command:"demote",group:!0,admin:!0,execute:async(e,t,{reply:u})=>{let v=t.mentionedJid?.[0]||t.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];if(!v)return u(o("demote",".demote @user"));if(!t.isBotAdmin)return u(l(n));try{await e.groupParticipantsUpdate(t.chat,[v],"demote"),u(l([`📉 @${v.split("@")[0]} demoted.`]),{mentions:[v]})}catch{u(l(m))}}},
{command:"mute",group:!0,admin:!0,execute:async(e,t,{reply:u})=>{if(!t.isBotAdmin)return u(l(n));try{await e.groupSettingUpdate(t.chat,"announcement"),u(l(["🔇 Muted!","🤫 Silent."]))}catch{u(l(m))}}},
{command:"unmute",group:!0,admin:!0,execute:async(e,t,{reply:u})=>{if(!t.isBotAdmin)return u(l(n));try{await e.groupSettingUpdate(t.chat,"not_announcement"),u(l(["🔊 Unmuted!","🗣️ Talk."]))}catch{u(l(m))}}},
{command:"hidetag",group:!0,admin:!0,execute:async(e,t,{args:u,reply:v})=>{try{let w=await e.groupMetadata(t.chat),x=u.join(" ")||"👀";await e.sendMessage(t.chat,{text:x,mentions:w.participants.map(y=>y.id)})}catch{v(l(m))}}},
{command:"groupinfo",group:!0,execute:async(e,t,{reply:u})=>{try{let v=await e.groupMetadata(t.chat);u(`📌 *${v.subject}*\n👥 ${v.participants.length} members\n👮 ${v.participants.filter(w=>w.admin).length} admins`)}catch{u(l(m))}}},
{command:"grouplink",group:!0,admin:!0,execute:async(e,t,{reply:u})=>{if(!t.isBotAdmin)return u(l(n));try{let v=await e.groupInviteCode(t.chat);u(`🔗 https://chat.whatsapp.com/${v}`)}catch{u(l(m))}}},
{command:"revokelink",group:!0,admin:!0,execute:async(e,t,{reply:u})=>{if(!t.isBotAdmin)return u(l(n));try{await e.groupRevokeInvite(t.chat),u(l(["♻️ Link reset!"]))}catch{u(l(m))}}},
{command:"listadmin",group:!0,execute:async(e,t,{reply:u})=>{try{let v=await e.groupMetadata(t.chat),w=v.participants.filter(z=>z.admin),x=`👑 *Admins (${w.length})*\n`;for(let y of w)x+=`• @${y.id.split("@")[0]}\n`;await e.sendMessage(t.chat,{text:x,mentions:w.map(y=>y.id)})}catch{u(l(m))}}},
{command:"tagadmin",group:!0,admin:!0,execute:async(e,t,{args:u,reply:v})=>{try{let w=await e.groupMetadata(t.chat),x=w.participants.filter(z=>z.admin),y=u.join(" ")||"Admin!",z=`👑 *${y}*\n`;for(let A of x)z+=`@${A.id.split("@")[0]} `;await e.sendMessage(t.chat,{text:z,mentions:x.map(A=>A.id)})}catch{v(l(m))}}},
{command:"vcf",group:!0,execute:async(e,t,{reply:u})=>{try{let v=await e.groupMetadata(t.chat),w="";for(let x of v.participants){let y=x.id.split("@")[0];w+=`BEGIN:VCARD\nVERSION:3.0\nFN:${y}\nTEL:${y}\nEND:VCARD\n`}await e.sendMessage(t.chat,{document:Buffer.from(w),fileName:"contacts.vcf",mimetype:"text/vcard"})}catch{u(l(m))}}},
{command:"promoteall",group:!0,admin:!0,execute:async(e,t,{reply:u})=>{try{let v=await e.groupMetadata(t.chat),w=v.participants.filter(x=>!x.admin);if(!w.length)return u("👑 Already admins.");u(`⏳ Promoting ${w.length}...`);for(let x of w){await e.groupParticipantsUpdate(t.chat,[x.id],"promote");await new Promise(y=>setTimeout(y,1e3))}u("✅ Done")}catch{u(l(m))}}},
{command:"demoteall",group:!0,admin:!0,execute:async(e,t,{reply:u})=>{try{let v=await e.groupMetadata(t.chat),w=e.user.id,x=v.participants.filter(y=>y.admin&&y.id!==w);if(!x.length)return u("🤴 No one to demote.");u(`⏳ Demoting ${x.length}...`);for(let y of x){await e.groupParticipantsUpdate(t.chat,[y.id],"demote");await new Promise(z=>setTimeout(z,1e3))}u("✅ Done")}catch{u(l(m))}}},
{command:"poll",group:!0,execute:async(e,t,{args:u,reply:v})=>{let w=u.join(" ");if(!w.includes("|"))return v(o("poll",".poll Question | Opt1 | Opt2"));let[x,...y]=w.split("|").map(z=>z.trim());if(y.length<2)return v(o("poll",".poll Question | Opt1 | Opt2"));try{await e.sendMessage(t.chat,{poll:{name:x,values:y,selectableCount:1}})}catch{v(l(m))}}},
{command:"welcome",group:!0,admin:!0,execute:async(e,t,{args:u,reply:v})=>{let w=u[0]?.toLowerCase(),x=f(t.chat,e);w==="on"?v(i(t.chat,{welcome:!0},e)?l(["✅ Welcome ON!"]):l(m)):w==="off"?v(i(t.chat,{welcome:!1},e)?l(["❌ Welcome off."]):l(m)):v(`📊 Welcome: ${x.welcome?"ON":"OFF"}\n.welcome on/off`)}},
{command:"goodbye",group:!0,admin:!0,execute:async(e,t,{args:u,reply:v})=>{let w=u[0]?.toLowerCase(),x=f(t.chat,e);w==="on"?v(i(t.chat,{goodbye:!0},e)?l(["👋 Goodbye ON!"]):l(m)):w==="off"?v(i(t.chat,{goodbye:!1},e)?l(["❌ Goodbye off."]):l(m)):v(`📊 Goodbye: ${x.goodbye?"ON":"OFF"}\n.goodbye on/off`)}},
{command:"antilink",group:!0,admin:!0,execute:async(e,t,{args:u,reply:v})=>{let w=u[0]?.toLowerCase(),x=f(t.chat,e);if(w==="delete"||w==="warn"||w==="kick"){v(i(t.chat,{antilink:!0,antilinkAction:w},e)?l([`🛡️ ${w} mode!`]):l(m))}else if(w==="mode"){let y=u[1]?.toLowerCase();y==="owner"||y==="admins"?v(i(t.chat,{antilinkMode:y},e)?l([`👑 Mode: ${y}`]):l(m)):v(o("antilink mode",".antilink mode owner/admins"))}else if(w==="off"){v(i(t.chat,{antilink:!1},e)?l(["❌ Anti-link off."]):l(m))}else{let y=x.antilinkAction||"delete",z=x.antilinkMode||"admins";v(`🛡️ Anti-Link\nAction:${y}\nMode:${z}\n.antilink delete/warn/kick\n.antilink mode owner/admins\n.antilink off`)}}},
{command:"approveall",group:!0,admin:!0,execute:async(e,t,{reply:u})=>{try{let v=await e.groupMetadata(t.chat),w=v.joinRequests||[];if(!w.length)return u("📋 No requests.");let x=0;for(let y of w)try{await e.groupRequestApproval(t.chat,y.jid,'approve'),x++}catch{}u(`✅ ${x}/${w.length} approved!`)}catch{u(l(m))}}},
{command:"kickinactive",group:!0,admin:!0,execute:async(e,t,{reply:u})=>{if(!t.isBotAdmin)return u(l(n));try{let v=await e.groupMetadata(t.chat),w=0;for(let x of v.participants){if(x.admin)continue;try{await e.groupParticipantsUpdate(t.chat,[x.id],'remove'),w++;await new Promise(y=>setTimeout(y,1e3))}catch{}}u(l([`✅ ${w} gone!`]))}catch{u(l(m))}}},
{command:"antidemote",group:!0,admin:!0,execute:async(e,t,{args:u,reply:v})=>{let w=u[0]?.toLowerCase();if(w==="on"){i(t.chat,{antidemote:!0},e);v("🛡️ Anti‑demote ON")}else if(w==="off"){i(t.chat,{antidemote:!1},e);v("❌ Anti‑demote OFF")}else v(`🛡️ Anti‑demote: ${f(t.chat,e).antidemote?"ON":"OFF"}\n.antidemote on/off`)}},
{command:"antisticker",group:!0,admin:!0,execute:async(e,t,{args:u,reply:v})=>{let w=u[0]?.toLowerCase();if(w==="on"){i(t.chat,{antisticker:!0},e);v("🛡️ Anti‑sticker ON")}else if(w==="off"){i(t.chat,{antisticker:!1},e);v("❌ Anti‑sticker OFF")}else v(`🛡️ Anti‑sticker: ${f(t.chat,e).antisticker?"ON":"OFF"}\n.antisticker on/off`)}},
{command:"antitag",group:!0,admin:!0,execute:async(e,t,{args:u,reply:v})=>{let w=u[0]?.toLowerCase();if(w==="on"){i(t.chat,{antitag:!0},e);v("🛡️ Anti‑tag ON")}else if(w==="off"){i(t.chat,{antitag:!1},e);v("❌ Anti‑tag OFF")}else v(`🛡️ Anti‑tag: ${f(t.chat,e).antitag?"ON":"OFF"}\n.antitag on/off`)}},
{command:"invite",group:!0,admin:!0,execute:async(e,t,{args:u,reply:v})=>{if(!u[0])return v(o("invite",".invite 123456789"));let w=u[0].replace(/[^0-9]/g,"")+"@s.whatsapp.net";try{await e.groupParticipantsUpdate(t.chat,[w],"add");v(`📨 Invited @${w.split('@')[0]}`)}catch{v("❌ Failed")}}},
{command:"listactive",group:!0,execute:async(e,t,{reply:u})=>{try{let v=await e.groupMetadata(t.chat);u(`👥 Active members: ${v.participants.length}`)}catch{u(l(m))}}},
{command:"listinactive",group:!0,execute:async(e,t,{reply:u})=>{try{let v=await e.groupMetadata(t.chat);u(`👥 Inactive not determined, total: ${v.participants.length}`)}catch{u(l(m))}}},
{command:"totalmembers",group:!0,execute:async(e,t,{reply:u})=>{try{let v=await e.groupMetadata(t.chat);u(`👥 Total members: ${v.participants.length}`)}catch{u(l(m))}}},
{command:"mediatag",group:!0,admin:!0,execute:async(e,t,{args:u,reply:v})=>{if(!t.quoted)return v(o("mediatag",".mediatag (reply to media with caption)"));let w=u.join(" ")||"📢";try{let x=await e.groupMetadata(t.chat);await e.sendMessage(t.chat,{caption:w,mentions:x.participants.map(p=>p.id),...t.quoted.message},{quoted:t})}catch{v("❌ Failed")}}},
{command:"getname",group:!0,execute:async(e,t,{reply:u})=>{try{let v=await e.groupMetadata(t.chat);u(`📌 *${v.subject}*`)}catch{u(l(m))}}},
{command:"getdeskgc",group:!0,execute:async(e,t,{reply:u})=>{try{let v=await e.groupMetadata(t.chat);u(`📝 Description: ${v.desc||'None'}`)}catch{u(l(m))}}},
{command:"getppgc",group:!0,execute:async(e,t,{reply:u})=>{try{let v=await e.profilePictureUrl(t.chat,'image');await e.sendMessage(t.chat,{image:{url:v},caption:"🖼️ Group profile picture"},{quoted:t})}catch{u("❌ No group picture.")}}},
{command:"addcode",group:!0,admin:!0,execute:async(e,t,{args:u,reply:v})=>{if(!u[0])return v("❌ .addcode <code>");let w=f(t.chat,e);w.codes=w.codes||[];w.codes.push(u[0]);i(t.chat,w,e);v(`✅ Code added: ${u[0]}`)}},
{command:"delcode",group:!0,admin:!0,execute:async(e,t,{args:u,reply:v})=>{if(!u[0])return v("❌ .delcode <code>");let w=f(t.chat,e);w.codes=w.codes||[];let x=w.codes.indexOf(u[0]);if(x>-1){w.codes.splice(x,1);i(t.chat,w,e);v(`✅ Code removed: ${u[0]}`)}else v("❌ Code not found")}},
{command:"listcode",group:!0,execute:async(e,t,{reply:u})=>{let v=f(t.chat,e);u(v.codes?.length?`📋 Codes: ${v.codes.join(', ')}`:"📋 No codes set.")}},
{command:"removes",group:!0,admin:!0,execute:async(e,t,{args:u,reply:v})=>{if(!u[0])return v(o("removes",".removes <country code>"));let w=u[0].replace(/[^0-9]/g,'');if(!w)return v("❌ Invalid code");let x=await e.groupMetadata(t.chat),y=0;for(let z of x.participants){if(z.id.split('@')[0].startsWith(w)){try{await e.groupParticipantsUpdate(t.chat,[z.id],'remove');y++;await new Promise(C=>setTimeout(C,500))}catch{}}}v(y?`👢 Removed ${y} members from +${w}`:`No members found from +${w}`)}},
{command:"gcstatus",group:!0,execute:async(e,t,{reply:u})=>{let v=f(t.chat,e);u(`📊 *Group Status*\nWelcome: ${v.welcome?'✅':'❌'}\nGoodbye: ${v.goodbye?'✅':'❌'}\nAnti-link: ${v.antilink?'✅':'❌'}\nAnti-demote: ${v.antidemote?'✅':'❌'}\nAnti-sticker: ${v.antisticker?'✅':'❌'}\nAnti-tag: ${v.antitag?'✅':'❌'}`)}},

// 🎯 GROUP BAN/UNBAN COMMANDS
{command:"ban",group:!0,admin:!0,execute:async(e,t,{args:u,reply:v})=>{
    let target = t.mentionedJid?.[0] || t.quoted?.sender || (u[0] ? u[0].replace(/[^0-9]/g,'')+'@s.whatsapp.net' : null);
    if(!target) return v("❌ Tag a user or reply to their message.");
    let bans = getGB(e);
    if(!bans[t.chat]) bans[t.chat] = [];
    if(bans[t.chat].includes(target)) return v(`❌ @${target.split('@')[0]} is already banned in this group.`);
    bans[t.chat].push(target);
    saveGB(e,bans);
    v(`🚫 @${target.split('@')[0]} has been banned from this group. Their messages will now be deleted.`, {mentions:[target]});
}},
{command:"unban",group:!0,admin:!0,execute:async(e,t,{args:u,reply:v})=>{
    let target = t.mentionedJid?.[0] || t.quoted?.sender || (u[0] ? u[0].replace(/[^0-9]/g,'')+'@s.whatsapp.net' : null);
    if(!target) return v("❌ Tag a user or reply to their message.");
    let bans = getGB(e);
    if(!bans[t.chat] || !bans[t.chat].includes(target)) return v(`❌ @${target.split('@')[0]} is not banned in this group.`);
    bans[t.chat] = bans[t.chat].filter(x => x !== target);
    saveGB(e,bans);
    v(`✅ @${target.split('@')[0]} has been unbanned.`, {mentions:[target]});
}},
{command:"banlist",group:!0,execute:async(e,t,{reply:v})=>{
    let bans = getGB(e);
    if(!bans[t.chat] || !bans[t.chat].length) return v("📋 No banned users in this group.");
    let txt = `🚫 *Banned Users (${bans[t.chat].length})*\n\n`;
    bans[t.chat].forEach(u => { txt += `• @${u.split('@')[0]}\n`; });
    e.sendMessage(t.chat, { text: txt, mentions: bans[t.chat] });
}}
];