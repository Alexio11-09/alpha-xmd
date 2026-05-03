const axios = require('axios');

module.exports = [
  {
    command: "define", category: "info",
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply("❌ .define <word>");
      try {
        const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(args.join(" "))}`);
        const d = res.data[0].meanings[0].definitions[0];
        reply(`📖 *${res.data[0].word}*\n📝 ${d.definition}\n💬 ${d.example || 'No example'}`);
      } catch { reply("❌ Not found."); }
    }
  },
  {
    command: "countryinfo", category: "info",
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply("❌ .countryinfo <name>");
      try {
        const res = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(args.join(" "))}`);
        const c = res.data[0];
        reply(`🌍 ${c.name.common}\n🏛️ Capital: ${c.capital?.[0]}\n👥 Pop: ${c.population.toLocaleString()}\n🗺️ Region: ${c.region}\n💰 Currency: ${Object.keys(c.currencies)[0]}`);
      } catch { reply("❌ Not found."); }
    }
  },
  {
    command: "wiki", category: "info",
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply("❌ .wiki <query>");
      try {
        const res = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(args.join(" "))}`);
        reply(`📚 *${res.data.title}*\n${res.data.extract.substring(0,1000)}...\n🔗 ${res.data.content_urls.desktop.page}`);
      } catch { reply("❌ Not found."); }
    }
  },
  {
    command: "bible", category: "info",
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply("❌ .bible John 3:16");
      try {
        const res = await axios.get(`https://bible-api.com/${encodeURIComponent(args.join(" "))}`);
        reply(`📖 ${res.data.reference}\n${res.data.text}`);
      } catch { reply("❌ Not found."); }
    }
  },
  {
    command: "quran", category: "info",
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply("❌ .quran 1:1");
      const [sura, ayah] = args[0].split(':');
      try {
        const res = await axios.get(`https://api.alquran.cloud/ayah/${sura}:${ayah}`);
        const v = res.data.data;
        reply(`📖 Surah ${v.surah.englishName} (${v.surah.name}) ${ayah}\n${v.text}`);
      } catch { reply("❌ Not found."); }
    }
  },
  {
    command: "githubstalk", category: "info",
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply("❌ .githubstalk <user>");
      try {
        const res = await axios.get(`https://api.github.com/users/${args[0]}`);
        const u = res.data;
        reply(`🐙 ${u.login}\n🏢 ${u.company||'N/A'}\n📍 ${u.location||'N/A'}\n📦 ${u.public_repos} repos\n👥 ${u.followers} followers\n🔗 ${u.html_url}`);
      } catch { reply("❌ Not found."); }
    }
  },
  {
    command: "tiktokstalk", category: "info",
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply("❌ .tiktokstalk <user>");
      try {
        const res = await axios.get(`https://api.davidcyriltech.my.id/tiktok/stalk?username=${args[0]}`);
        const u = res.data;
        reply(`🎵 ${u.username}\n👤 ${u.nickname}\n👥 Followers: ${u.followers}\n❤️ Likes: ${u.likes}\n📹 Videos: ${u.videos}`);
      } catch { reply("❌ Not found."); }
    }
  },
  {
    command: "obfuscate", category: "info",
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply("❌ .obfuscate <code>");
      const obf = Buffer.from(args.join(" ")).toString('base64');
      reply(`🔒 \`\`\`\n${obf}\n\`\`\``);
    }
  },
  {
    command: "news", category: "info",
    execute: async (s, m, { reply }) => {
      try {
        const res = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=YOUR_KEY`);
        const articles = res.data.articles.slice(0,5);
        let msg = "📰 *Top Headlines*\n\n";
        for (const a of articles) msg += `• ${a.title}\n  ${a.url}\n\n`;
        reply(msg);
      } catch { reply("❌ Set your NewsAPI key."); }
    }
  }
];
