const axios=require('axios'),R=a=>a[Math.floor(Math.random()*a.length)],M=new Map();
// Helper: save/load game state
const G=(id)=>{if(!M.has(id))M.set(id,{});return M.get(id)};
const D=(id)=>M.delete(id);
module.exports=[
  // EXISTING
  {command:"joke",aliases:["jokes"],category:"fun",execute:async(s,m,{reply})=>{try{const r=await axios.get('https://v2.jokeapi.dev/joke/Any?type=single');reply(r.data.joke)}catch{reply("Why did the bot stop? It needed a recharge.")}}},
  {command:"quote",aliases:["quotes"],category:"fun",execute:async(s,m,{reply})=>{try{const r=await axios.get('https://api.quotable.io/random');reply(`💬 "${r.data.content}" — ${r.data.author}`)}catch{reply("💬 \"Believe you can and you're halfway there.\" — T. Roosevelt")}}},
  {command:"fact",aliases:["facts"],category:"fun",execute:async(s,m,{reply})=>{try{const r=await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');reply(`📚 ${r.data.text}`)}catch{reply("📚 Honey never spoils.")}}},
  {command:"flip",aliases:["coin"],category:"fun",execute:async(s,m,{reply})=>{reply(Math.random()<0.5?"🪙 Heads!":"🪙 Tails!")}},
  {command:"roll",aliases:["dice"],category:"fun",execute:async(s,m,{args,reply})=>{const s=parseInt(args[0])||6;reply(`🎲 ${Math.floor(Math.random()*s)+1}`)}},
  {command:"8ball",aliases:["magicball"],category:"fun",execute:async(s,m,{args,reply})=>{if(!args[0])return reply("❌ Ask a question!");const a=["Yes","No","Maybe","Ask again"];reply(`🎱 ${R(a)}`)}},
  {command:"rps",aliases:["rockpaperscissors"],category:"fun",execute:async(s,m,{args,reply})=>{const o=["rock","paper","scissors"],u=args[0]?.toLowerCase();if(!o.includes(u))return reply("❌ Rock, Paper, Scissors?");const b=R(o);reply(`You: ${u} | Bot: ${b}`)}},
  {command:"ship",aliases:["love"],category:"fun",execute:async(s,m,{args,reply})=>{if(args.length<2)return reply("❌ .ship name1 name2");reply(`💕 ${args[0]} + ${args[1]} = ${Math.floor(Math.random()*101)}%`)}},
  {command:"hug",aliases:[],category:"fun",execute:async(s,m,{reply})=>{const n=m.sender.split('@')[0];reply(`🤗 @${n} gives a hug!`,{mentions:[m.sender]})}},
  {command:"compliment",aliases:[],category:"fun",execute:async(s,m,{reply})=>{const c=["You're awesome!","You light up the room!","Keep being you!"];reply(`💐 ${R(c)}`)}},
  {command:"emojimix",aliases:["emix"],category:"fun",execute:async(s,m,{args,reply})=>{const t=args.join(" ").trim();if(!t)return reply("🧪 Usage: .emojimix 😀 😎");const e=[...t.matchAll(/\p{Extended_Pictographic}/gu)].map(m=>m[0]);if(e.length<2)return reply("🧪 Need two emojis!");try{const r=await axios.get(`https://api.popcat.xyz/emojimix?emoji1=${encodeURIComponent(e[0])}&emoji2=${encodeURIComponent(e[1])}`,{responseType:'arraybuffer'});await s.sendMessage(m.chat,{image:Buffer.from(r.data),caption:"🧪 Mixed!"},{quoted:m})}catch{reply("❌ Couldn't mix.")}}},

  // NEW – TICTACTOE
  {command:"ttt",aliases:["tictactoe"],category:"fun",execute:async(s,m,{args,reply})=>{
    const g=G(m.chat),p=m.sender;
    if(args[0]==="start"){
      if(g.ttt)return reply("❌ Game already running!");
      g.ttt={board:Array(9).fill(' '),turn:p,players:[p,null],active:true};
      reply(`🎮 TicTacToe started! ${p.split('@')[0]} is X. Use .ttt join to play, .ttt <1-9> to move.`)
    }else if(args[0]==="join"){
      if(!g.ttt)return reply("❌ No game. Start with .ttt start");
      if(g.ttt.players[1])return reply("❌ Already 2 players!");
      if(p===g.ttt.players[0])return reply("❌ You can't play yourself!");
      g.ttt.players[1]=p;
      reply(`🎮 ${p.split('@')[0]} joined as O.`);
    }else if(args[0]==="stop"){
      if(!g.ttt)return reply("❌ No game.");
      D(m.chat); reply("❌ Game stopped.");
    }else{
      const n=parseInt(args[0]);
      if(!g.ttt||!g.ttt.active)return reply("❌ No active game. .ttt start");
      if(!g.ttt.players[1])return reply("❌ Waiting for second player. .ttt join");
      if(p!==g.ttt.turn)return reply("❌ Not your turn!");
      if(isNaN(n)||n<1||n>9||g.ttt.board[n-1]!==' ')return reply("❌ Invalid move.");
      const sym=p===g.ttt.players[0]?'X':'O';
      g.ttt.board[n-1]=sym;
      // check win
      const w=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      let win=w.some(c=>c.every(i=>g.ttt.board[i]===sym));
      if(win){reply(`🎉 ${p.split('@')[0]} (${sym}) wins!`);D(m.chat)}
      else if(g.ttt.board.every(c=>c!==' ')){reply("It's a draw!");D(m.chat)}
      else{
        g.ttt.turn=g.ttt.players.find(q=>q!==p);
        reply(`Board: ${g.ttt.board.map((v,i)=>v===' '?i+1:v).join('|')}\nTurn: ${g.ttt.turn.split('@')[0]}`);
      }
    }
  }},

  // HANGMAN
  {command:"hangman",aliases:["hm"],category:"fun",execute:async(s,m,{args,reply})=>{
    const g=G(m.chat);
    if(args[0]==="start"){
      if(g.hm)return reply("❌ Game running!");
      const words=['alpha','bot','whatsapp','javascript','command','fun','hangman','node','code','developer'];
      const word=R(words);
      g.hm={word,guessed:[],wrong:0,active:true};
      reply(`🎩 Hangman started! Word: ${'_ '.repeat(word.length)}\nGuess with .hangman <letter>`);
    }else if(args[0]==="stop"){
      if(!g.hm)return reply("❌ No game.");
      D(m.chat); reply("❌ Game stopped.");
    }else{
      if(!g.hm||!g.hm.active)return reply("❌ No active game. .hangman start");
      const letter=args[0]?.toLowerCase();
      if(!letter||letter.length!==1)return reply("❌ Guess a letter.");
      if(g.hm.guessed.includes(letter))return reply("❌ Already guessed.");
      g.hm.guessed.push(letter);
      if(!g.hm.word.includes(letter))g.hm.wrong++;
      const display=g.hm.word.split('').map(l=>g.hm.guessed.includes(l)?l:'_').join(' ');
      if(!display.includes('_')){
        reply(`🎉 You won! The word was ${g.hm.word}.`);D(m.chat)
      }else if(g.hm.wrong>=6){
        reply(`💀 You lost! The word was ${g.hm.word}.`);D(m.chat)
      }else{
        reply(`🎩 ${display}\nWrong guesses: ${g.hm.guessed.filter(l=>!g.hm.word.includes(l)).join(', ')||'none'} (${g.hm.wrong}/6)`);
      }
    }
  }},

  // GUESS / QUIZ / TRIVIA / ANSWER
  {command:"guess",aliases:["quiz","trivia"],category:"fun",execute:async(s,m,{args,reply})=>{
    if(args[0]==="stop"){D(m.chat);return reply("Quiz stopped.")}
    const g=G(m.chat);
    if(!g.quiz||g.quiz.answered){
      try{
        const r=await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
        const q=r.data.results[0];
        g.quiz={question:q.question,correct:q.correct_answer,options:[...q.incorrect_answers,q.correct_answer].sort(()=>Math.random()-0.5),answered:false};
        reply(`❓ ${g.quiz.question}\n\n${g.quiz.options.map((o,i)=>`${i+1}. ${o}`).join('\n')}\n\nReply .answer <number>`);
      }catch{reply("❌ Couldn't fetch quiz.")}
    }else reply(`❓ ${g.quiz.question}\n\n${g.quiz.options.map((o,i)=>`${i+1}. ${o}`).join('\n')}\n\nReply .answer <number>`);
  }},
  {command:"answer",category:"fun",execute:async(s,m,{args,reply})=>{
    const g=G(m.chat);
    if(!g.quiz||g.quiz.answered)return reply("❌ No active quiz. Use .guess or .trivia");
    const n=parseInt(args[0]);
    if(isNaN(n)||n<1||n>g.quiz.options.length)return reply("❌ Invalid answer number.");
    if(g.quiz.options[n-1]===g.quiz.correct){reply("✅ Correct!");g.quiz.answered=true}else{reply(`❌ Wrong! The answer was ${g.quiz.correct}`);g.quiz.answered=true}
  }},

  // TRUTH / DARE
  {command:"truth",category:"fun",execute:async(s,m,{reply})=>{
    const t=["Have you ever cheated on a test?","What's your biggest fear?","Have you ever stolen something?","Who is your crush?","What's your most embarrassing moment?"];
    reply(`📜 *Truth:* ${R(t)}`)}},
  {command:"dare",category:"fun",execute:async(s,m,{reply})=>{
    const d=["Send a voice note singing","Change your group profile picture to a meme","Send your last selfie","Type with your nose for 5 messages","Do 10 pushups and send proof"];
    reply(`⚡ *Dare:* ${R(d)}`)}},

  // INSULT
  {command:"insult",aliases:["roast"],category:"fun",execute:async(s,m,{args,reply})=>{
    if(args.length>=2){const a=args.join(' ');reply(`🔥 ${a}`);}
    else{const i=["You're like a cloud — when you disappear, it's a beautiful day.","If I had a dollar for every time you said something smart, I'd be broke.","You bring everyone so much joy… when you leave the room."];reply(R(i))}}},

  // FLIRT
  {command:"flirt",aliases:["pickup"],category:"fun",execute:async(s,m,{args,reply})=>{
    if(args.length>=2){const a=args.join(' ');reply(`💌 ${a}`);}
    else{const f=["Are you a magician? Because whenever I look at you, everyone else disappears.","I must be a snowflake, because I've fallen for you.","Do you have a map? I keep getting lost in your eyes."];reply(R(f))}}},

  // SHAYARI
  {command:"shayari",category:"fun",execute:async(s,m,{reply})=>{const s=["तेरी मोहब्बत में सनम, हम क्या से क्या हो गए, देखते ही देखते, तुम्हारे हम हो गए।","दिल के बहलाने को ग़ालिब, ये ख़याल अच्छा है।","इश्क़ ने 'ग़ालिब' निकम्मा कर दिया, वरना हम भी आदमी थे काम के।"];reply(R(s))}},

  // SIMP
  {command:"simp",category:"fun",execute:async(s,m,{reply})=>{reply("😍 I simping hard rn.")}},

  // STUPID
  {command:"stupid",category:"fun",execute:async(s,m,{args,reply})=>{const t=m.mentionedJid?.[0]||m.quoted?.sender||(args[0]?args[0].replace(/[^0-9]/g,'')+'@s.whatsapp.net':null);if(t)reply(`🤪 @${t.split('@')[0]} is stupid!`,{mentions:[t]});else reply("🤪 You're stupid!")}},

  // GOODNIGHT
  {command:"goodnight",aliases:["gn"],category:"fun",execute:async(s,m,{reply})=>{reply("🌙 Goodnight! Sleep tight and dream of code.")}},

  // MEME
  {command:"meme",category:"fun",execute:async(s,m,{reply})=>{try{const r=await axios.get('https://meme-api.com/gimme');await s.sendMessage(m.chat,{image:{url:r.data.url},caption:`📢 ${r.data.title}`},{quoted:m})}catch{reply("❌ Couldn't fetch meme.")}}},

  // SQUIDGAME
  {command:"squidgame",category:"fun",execute:async(s,m,{reply})=>{reply("🦑 Red light? 🟢 Green light! 🎮")}},

  // KONAMI
  {command:"konami",category:"fun",execute:async(s,m,{reply})=>{reply("⬆️⬆️⬇️⬇️⬅️➡️⬅️➡️🅱️🅰️** KONAMI CODE ACTIVATED**")}},

  // LOVETEST
  {command:"lovetest",aliases:["lovecalc"],category:"fun",execute:async(s,m,{args,reply})=>{if(args.length<2)return reply("❌ .lovetest name1 name2");const perc=Math.floor(Math.random()*101);let emoji=perc>80?"❤️":perc>50?"💛":perc>30?"💙":"💔";reply(`${emoji} ${args[0]} + ${args[1]} = ${perc}%`)}},

  // AURA
  {command:"aura",category:"fun",execute:async(s,m,{args,reply})=>{let t;if(m.mentionedJid?.[0])t=m.mentionedJid[0];else if(m.quoted?.sender)t=m.quoted.sender;else if(args[0])t=args[0].replace(/[^0-9]/g,'')+'@s.whatsapp.net';else t=m.sender;const aura=Math.floor(Math.random()*100);reply(`✨ @${t.split('@')[0]}'s aura: ${aura}%`,{mentions:[t]})}}
];