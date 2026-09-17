// © 2026 Alpha. All Rights Reserved.

const fs=require("fs");
const {execSync}=require("child_process");

const modules=[
"pino","@whiskeysockets/baileys","@hapi/boom","chalk","axios",
"node-fetch","yt-search","form-data","file-type","moment-timezone",
"human-readable","fluent-ffmpeg","@ffmpeg-installer/ffmpeg",
"crypto-js","adm-zip"
];

for(const mod of modules){
 try{require.resolve(mod)}
 catch{
  try{execSync(`npm install ${mod} --force`,{stdio:"inherit"})}
  catch(e){console.log(`⚠️ Failed installing ${mod}`)}
 }
}

console.clear();

const config=()=>require("./settings/config");

process.on("uncaughtException",e=>{
 console.log("⚠️ Error:",e.message);
});

let makeWASocket;
let Browsers;
let useMultiFileAuthState;
let DisconnectReason;
let jidDecode;

async function loadBaileys(){
 const b=await import("@whiskeysockets/baileys");
 makeWASocket=b.default;
 Browsers=b.Browsers;
 useMultiFileAuthState=b.useMultiFileAuthState;
 DisconnectReason=b.DisconnectReason;
 jidDecode=b.jidDecode;
}

const pino=require("pino");
const readline=require("readline");
const chalk=require("chalk");
const {Boom}=require("@hapi/boom");
const {smsg}=require("./library/serialize");

let autoStatusHandler;
try{
 autoStatusHandler=require("./plugins/autostatus");
}catch{
 autoStatusHandler={handleStatusUpdate:()=>{}};
}

let messageHandler;
try{
 messageHandler=require("./message");
}catch{
 messageHandler=async()=>{};
}

let globalSettings={
 autoread:false,
 autotyping:false,
 autorecording:false,
 autoreact:false,
 antidelete:false,
 antiedit:false
};

let dbPath="./database/groupSettings.json";
let settingsPath="./database/settings.json";

try{
 if(!fs.existsSync("./database"))
  fs.mkdirSync("./database",{recursive:true});

 if(!fs.existsSync(dbPath))
  fs.writeFileSync(dbPath,"{}");

 if(!fs.existsSync(settingsPath))
  fs.writeFileSync(settingsPath,"{}");
}catch{
 dbPath="/tmp/groupSettings.json";
 settingsPath="/tmp/settings.json";
}

const funnyWelcomes=[
 "🌟 A new legend has arrived! Welcome @user! 🎉",
 "👋 Look who decided to join us! Welcome @user! 🥳"
];

const funnyGoodbyes=[
 "🚶‍♂️ @user has left the building. We'll miss the vibes.",
 "😢 Another one bites the dust. Goodbye @user!"
];

const funnyDeleted=[
 "🕵️‍♂️ Someone deleted a message, but I saved it! 🛡️",
 "📝 Deleted message rescued:"
];

const phoneNumberPrompt=text=>new Promise(resolve=>{
 process.stdout.write(chalk.yellow(text));
 const rl=readline.createInterface({
  input:process.stdin,
  output:process.stdout,
  terminal:false
 });
 rl.once("line",answer=>{
  rl.close();
  resolve(answer.trim());
 });
});

function loadGlobalSettings(){
 try{
  const saved=JSON.parse(fs.readFileSync(settingsPath,"utf8"));
  if(saved.global)
   globalSettings={...globalSettings,...saved.global};
 }catch{}
}

function getChannelJid(){
 const c=config();
 return `${c.newsletter.id}@newsletter`;
}

function attachHandlers(sock,store){
 loadGlobalSettings();

 const channelJid=getChannelJid();

 sock.ev.on("messages.upsert",async({messages})=>{
  try{
   const msg=messages?.[0];
   if(!msg)return;

   if(msg.key?.remoteJid==="status@broadcast" &&
      autoStatusHandler.handleStatusUpdate){
    await autoStatusHandler.handleStatusUpdate(sock,{messages:[msg]});
   }
  }catch{}
 });

 sock.ev.on("messages.upsert",async({messages})=>{
  try{
   const msg=messages?.[0];
   if(!msg||msg.key?.remoteJid!==channelJid)return;

   loadGlobalSettings();

   const cr=globalSettings.chreact||{
    enabled:false,
    emojis:["💬"]
   };

   if(!cr.enabled)return;

   for(const emoji of cr.emojis||[]){
    try{
     if(sock.newsletterReact){
      await sock.newsletterReact(channelJid,msg.key.id,emoji);
     }else{
      await sock.relayMessage(channelJid,{
       reactionMessage:{
        key:{
         remoteJid:channelJid,
         id:msg.key.id,
         fromMe:false
        },
        text:emoji,
        senderTimestampMs:Date.now()
       }
      },{});
     }
     await new Promise(r=>setTimeout(r,1000));
    }catch{}
   }
  }catch{}
 });

 sock.ev.on("messages.upsert",async chatUpdate=>{
  try{
   const messages=chatUpdate.messages;
   if(!messages?.length)return;

   for(const mek of messages){
    if(!mek.message)continue;

    if(mek.key.fromMe){
     const txt=
      mek.message?.conversation||
      mek.message?.extendedTextMessage?.text||
      "";
     if(!txt.startsWith("."))continue;
    }

    const remote=mek.key?.remoteJid;
    if(remote==="status@broadcast"||remote===channelJid)continue;

    const m=await smsg(sock,mek);

    store.set(mek.key.id,{
     text:m.text||"",
     message:mek.message,
     sender:m.sender,
     pushName:m.pushName||null
    });

    if(m.isGroup){
     try{
      const metadata=await sock.groupMetadata(m.chat);
      const sender=sock.decodeJid(m.sender);
      const senderNumber=sender.split("@")[0].replace(/[^0-9]/g,"");

      m.isAdmin=metadata.participants.some(p=>{
       const pj=sock.decodeJid(p.id);
       const pn=pj.split("@")[0].replace(/[^0-9]/g,"");
       return pn===senderNumber &&
        (p.admin==="admin"||p.admin==="superadmin"||p.admin===true);
      });

      const botJid=sock.decodeJid(sock.user?.id);
      m.isBotAdmin=metadata.participants.some(p=>{
       return sock.decodeJid(p.id)===botJid &&
        (p.admin==="admin"||p.admin==="superadmin"||p.admin===true);
      });
     }catch{
      m.isAdmin=false;
      m.isBotAdmin=false;
     }
    }

    if(globalSettings.autoread){
     try{await sock.readMessages([mek.key])}catch{}
    }

    if(globalSettings.autotyping){
     try{await sock.sendPresenceUpdate("composing",m.chat)}catch{}
    }

    if(globalSettings.autorecording){
     try{await sock.sendPresenceUpdate("recording",m.chat)}catch{}
    }

    if(globalSettings.autoreact){
     const txt=
      mek.message?.conversation||
      mek.message?.extendedTextMessage?.text||
      "";

     if(!txt.startsWith(".")){
      const emojis=["🔥","😂","😍","😎","🤖","⚡","💯","👀","🥶","😈"];
      try{
       await sock.sendMessage(m.chat,{
        react:{
         text:emojis[Math.floor(Math.random()*emojis.length)],
         key:mek.key
        }
       });
      }catch{}
     }
    }

    await messageHandler(sock,m);
   }
  }catch(err){
   console.log("⚠️ Message handler:",err.message);
  }
 });

 sock.ev.on("messages.update",async updates=>{
  try{
   loadGlobalSettings();

   const ad=globalSettings.antidelete||{
    enabled:false,
    mode:"chat",
    style:"fancy",
    react:true
   };

   const ownerNumber=(config().owner?.[0]||"").replace(/[^0-9]/g,"");
   const ownerJid=ownerNumber?
    `${ownerNumber}@s.whatsapp.net`:null;

   for(const update of updates){
    const oldMsg=store.get(update.key.id);
    if(!oldMsg)continue;

    if(update.update?.message===null){
     if(!ad.enabled)continue;

     const chat=update.key.remoteJid;
     if(!chat)continue;

     const isGroup=chat.endsWith("@g.us");
     const sender=oldMsg.sender||
      update.key.participant||
      chat;

     const senderNumber=sender.split("@")[0].replace(/[^0-9]/g,"");
     const privateName=oldMsg.pushName?.trim()||senderNumber;

     let chatName="Private Chat";

     if(isGroup){
      try{
       const gm=await sock.groupMetadata(chat);
       chatName=gm.subject;
      }catch{
       chatName="Group";
      }
     }

     const now=new Date();
     const time=now.toLocaleTimeString();
     const date=now.toLocaleDateString();
     const deleted=(oldMsg.text||"Media").replace(/\n/g,"\n│ │ ");

     let text;

     if(ad.style==="fancy"){
      if(isGroup){
       text=`╭───〔 👁️‍🗨️ ANTIDELETE 〕───⬣
│
│ 👤 @${senderNumber}
│ 📍 ${chatName}
│ 🕒 ${time}
│ 📅 ${date}
│
│ 🗑️:
│ ┌─
│ │ ${deleted}
│ └─
│ 🛡️ Alpha
╰──`;
      }else{
       text=`╭───〔 👁️‍🗨️ ANTIDELETE 〕───⬣
│
│ 👤 ${privateName}
│ 📍 Private
│ 🕒 ${time}
│ 📅 ${date}
│
│ 🗑️:
│ ┌─
│ │ ${deleted}
│ └─
│ 🛡️ Alpha
╰──`;
      }
     }else{
      text=`${funnyDeleted[0]}\n\n${oldMsg.text||"Media"}`;
     }

     const destinations=[];

     if(ad.mode==="chat"||ad.mode==="both")
      destinations.push(chat);

     if((ad.mode==="owner"||ad.mode==="both")&&ownerJid)
      destinations.push(ownerJid);

     for(const dest of destinations){
      const opts={};

      if(isGroup&&ad.style==="fancy"&&dest===chat){
       opts.mentions=[sender];
      }

      if(ad.style==="fancy"){
       await sock.sendMessage(dest,{
        text,
        contextInfo:{
         forwardingScore:999,
         isForwarded:true,
         forwardedNewsletterMessageInfo:{
          newsletterJid:channelJid,
          newsletterName:config().newsletter.name
         }
        },
        ...opts
       });
      }else{
       await sock.sendMessage(dest,{text,...opts});
      }

      if(ad.react&&dest===chat){
       try{
        await sock.sendMessage(dest,{
         react:{text:"👀",key:update.key}
        });
       }catch{}
      }
     }
    }

    if(globalSettings.antiedit&&update.update?.message){
     let newText="";

     try{
      const msg=update.update.message;
      const type=Object.keys(msg)[0];
      newText=
       msg[type]?.text||
       msg[type]?.caption||
       "";
     }catch{}

     if(oldMsg.text&&newText&&oldMsg.text!==newText){
      try{
       await sock.sendMessage(update.key.remoteJid,{
        text:`✏️ Edited.

📌 Old: ${oldMsg.text}
🆕 New: ${newText}`
       });
      }catch{}
     }
    }
   }
  }catch{}
 });

 sock.ev.on("group-participants.update",async update=>{
  try{
   const {id,participants,action}=update;

   let gs={
    welcome:false,
    welcomeMsg:"🌟 A new legend has arrived! Welcome @user! 🎉",
    goodbye:false,
    goodbyeMsg:"🚶‍♂️ @user has left the building. We'll miss the vibes."
   };

   try{
    const all=JSON.parse(fs.readFileSync(dbPath,"utf8"));
    gs=all[id]||gs;
   }catch{}

   if(action==="add"&&gs.welcome){
    for(const user of participants){
     const msg=gs.welcomeMsg.replace(
      /@user/g,`@${user.split("@")[0]}`
     );
     await sock.sendMessage(id,{
      text:msg,
      mentions:[user]
     });
    }
   }

   if(action==="remove"&&gs.goodbye){
    for(const user of participants){
     const msg=gs.goodbyeMsg.replace(
      /@user/g,`@${user.split("@")[0]}`
     );
     await sock.sendMessage(id,{
      text:msg,
      mentions:[user]
     });
    }
   }
  }catch{}
 });

 setTimeout(async()=>{
  try{
   await sock.newsletterFollow(channelJid);
  }catch{}
 },3000);

 setTimeout(async()=>{
  try{
   const botName=config().settings?.title||"Alpha Bot";
   const repo="https://github.com/Alexio11-09/alpha-xmd";
   const channel=`https://whatsapp.com/channel/${config().newsletter.id}`;

   const text=`╭───〔 🤖 ${botName} 〕───⬣

✅ Bot Online
👑 Owner: Alpha
📞 Contact: wa.me/263786641436
📂 Repo: ${repo}
📢 Channel: ${channel}

🔥 Ready to use.`;

   await sock.sendMessage(sock.user.id,{
    text,
    contextInfo:{
     forwardingScore:999,
     isForwarded:true,
     forwardedNewsletterMessageInfo:{
      newsletterJid:channelJid,
      newsletterName:config().newsletter.name
     }
    }
   });
  }catch{}
 },4000);
}

let restarting=false;

async function clientstart(){
 await loadBaileys();

 const {state,saveCreds}=await useMultiFileAuthState("./session");

 const sock=makeWASocket({
  logger:pino({level:"silent"}),
  printQRInTerminal:false,
  auth:state,
  browser:["Ubuntu","Chrome","20.0.04"],
  connectTimeoutMs:180000,
  defaultQueryTimeoutMs:180000,
  keepAliveIntervalMs:10000
 });

 sock.decodeJid=jid=>{
  if(!jid)return jid;
  if(/:\d+@/gi.test(jid)){
   const d=jidDecode(jid)||{};
   return d.user&&d.server?
    `${d.user}@${d.server}`:jid;
  }
  return jid;
 };

 const store=new Map();
 let socketClosed=false;
 let pairingInProgress=!state.creds.registered;

 sock.ev.on("connection.update",async update=>{
  const {connection,lastDisconnect}=update;

  if(connection==="open"){
   socketClosed=false;
   pairingInProgress=false;

   console.log(chalk.green("✅ Bot Connected!"));

   attachHandlers(sock,store);
   return;
  }

  if(connection==="close"){
   if(socketClosed)return;
   socketClosed=true;

   const error=lastDisconnect?.error;
   const statusCode=new Boom(error)?.output?.statusCode;

   console.log(
    chalk.yellow(
     `🔌 Connection closed (${statusCode||"unknown"})`
    )
   );

   if(error?.message)
    console.log(chalk.gray(`Reason: ${error.message}`));

   if(
    statusCode===401||
    statusCode===DisconnectReason.loggedOut
   ){
    console.log(chalk.red("❌ WhatsApp session logged out."));

    try{
     fs.rmSync("./session",{recursive:true,force:true});
    }catch{}

    process.exit(0);
   }

   if(pairingInProgress){
    console.log(
     chalk.yellow(
      "⏳ Waiting for the initial pairing process..."
     )
    );
    return;
   }

   if(restarting)return;
   restarting=true;

   console.log(
    chalk.yellow("🔄 Reconnecting in 10 seconds...")
   );

   setTimeout(()=>{
    restarting=false;
    clientstart().catch(err=>{
     console.log(
      chalk.red("⚠️ Reconnect failed:"),
      err.message
     );
    });
   },10000);
  }
 });

 sock.ev.on("creds.update",saveCreds);

 if(!state.creds.registered){
  let number=await phoneNumberPrompt(
   "📱 Enter your WhatsApp number (without + or spaces): "
  );

  number=number.replace(/[^0-9]/g,"");

  if(!number||number.length<10){
   console.log(chalk.red("❌ Invalid number."));
   process.exit(1);
  }

  console.log(
   chalk.green(`✅ Using number: ${number}`)
  );

  try{
   console.log(
    chalk.yellow("⏳ Waiting for WhatsApp connection...")
   );

   await new Promise(r=>setTimeout(r,5000));

   console.log(
    chalk.yellow("📡 Requesting pairing code...")
   );

   const code=await Promise.race([
    sock.requestPairingCode(number),
    new Promise((_,reject)=>
     setTimeout(
      ()=>reject(
       new Error("Pairing code request timed out after 30 seconds")
      ),
      30000
     )
    )
   ]);

   if(!code)
    throw new Error("WhatsApp returned an empty pairing code");

   const formatted=code.match(/.{1,4}/g)?.join("-")||code;

   console.log("");
   console.log(
    chalk.black(
     chalk.bgGreen(`  ✅ PAIRING CODE: ${formatted}  `)
    )
   );
   console.log("");
   console.log(chalk.yellow("📱 Open WhatsApp > Settings > Linked Devices"));
   console.log(chalk.yellow("📱 Tap Link a Device"));
   console.log(chalk.yellow("📱 Enter the pairing code above"));
   console.log("");
   console.log(
    chalk.green("⏳ Waiting for WhatsApp to finish linking...")
   );

   pairingInProgress=true;

  }catch(error){
   console.log(
    chalk.red("❌ Failed to request pairing code:"),
    error.message
   );
  }
 }else{
  console.log(
   chalk.green("✅ Already paired. Starting bot...")
  );
 }

 setInterval(()=>{
  if(sock.user&&!socketClosed){
   sock.sendPresenceUpdate("available").catch(()=>{});
  }
 },20000);
}

setInterval(()=>{},60000);

clientstart().catch(err=>{
 console.log(
  chalk.red("❌ Startup error:"),
  err.message
 );
});