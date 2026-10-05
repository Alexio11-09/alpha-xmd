const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// Pollinations image URL builder (free, no API key)
const F = (p, model = 'flux') => `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1024&height=1024&nologo=true&model=${model}&seed=${Math.floor(Math.random() * 1e5)}`;

// Helper: download quoted image as buffer
async function quotedToBuffer(m) {
  const qt = m.quoted?.message;
  if (!qt) return null;
  const type = Object.keys(qt)[0];
  if (!['imageMessage', 'stickerMessage', 'videoMessage'].includes(type)) return null;
  const stream = await downloadContentFromMessage(qt[type], type === 'stickerMessage' ? 'sticker' : 'image');
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  return Buffer.concat(chunks);
}

module.exports = [
  // ===== AI TEXT COMMANDS =====
  {
    command: 'gpt', aliases: ['chatgpt', 'gpt4'], category: 'ai',
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply('❌ .gpt <question>');
      try {
        const r = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(args.join(' '))}`, { timeout: 30000 });
        reply(`🤖 *GPT:*\n\n${r.data}`);
      } catch { reply('❌ GPT failed'); }
    }
  },
  {
    command: 'gemini', aliases: ['googleai'], category: 'ai',
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply('❌ .gemini <question>');
      try {
        const r = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(args.join(' '))}`, { timeout: 30000 });
        reply(`🤖 *Gemini:*\n\n${r.data}`);
      } catch { reply('❌ Gemini failed'); }
    }
  },
  {
    command: 'blackbox', aliases: ['bb'], category: 'ai',
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply('❌ .blackbox <question>');
      try {
        const r = await axios.get(`https://text.pollinations.ai/blackbox%20${encodeURIComponent(args.join(' '))}`, { timeout: 30000 });
        reply(`🤖 *Blackbox:*\n\n${r.data}`);
      } catch { reply('❌ Blackbox failed'); }
    }
  },
  {
    command: 'deepseek', aliases: ['ds'], category: 'ai',
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply('❌ .deepseek <question>');
      try {
        const r = await axios.get(`https://text.pollinations.ai/deepseek%20${encodeURIComponent(args.join(' '))}`, { timeout: 30000 });
        reply(`🤖 *DeepSeek:*\n\n${r.data}`);
      } catch { reply('❌ DeepSeek failed'); }
    }
  },
  {
    command: 'copilot', aliases: ['bing'], category: 'ai',
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply('❌ .copilot <question>');
      try {
        const r = await axios.get(`https://text.pollinations.ai/copilot%20${encodeURIComponent(args.join(' '))}`, { timeout: 30000 });
        reply(`🤖 *Copilot:*\n\n${r.data}`);
      } catch { reply('❌ Copilot failed'); }
    }
  },
  {
    command: 'claude', aliases: ['claudeai'], category: 'ai',
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply('❌ .claude <question>');
      try {
        const r = await axios.get(`https://text.pollinations.ai/claude%20${encodeURIComponent(args.join(' '))}`, { timeout: 30000 });
        reply(`🤖 *Claude:*\n\n${r.data}`);
      } catch { reply('❌ Claude failed'); }
    }
  },
  {
    command: 'perplexity', aliases: ['pplx'], category: 'ai',
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply('❌ .perplexity <question>');
      try {
        const r = await axios.get(`https://text.pollinations.ai/perplexity%20${encodeURIComponent(args.join(' '))}`, { timeout: 30000 });
        reply(`🤖 *Perplexity:*\n\n${r.data}`);
      } catch { reply('❌ Perplexity failed'); }
    }
  },
  {
    command: 'venice', aliases: ['veniceai'], category: 'ai',
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply('❌ .venice <question>');
      try {
        const r = await axios.get(`https://text.pollinations.ai/venice%20${encodeURIComponent(args.join(' '))}`, { timeout: 30000 });
        reply(`🤖 *Venice:*\n\n${r.data}`);
      } catch { reply('❌ Venice failed'); }
    }
  },

  // ===== AI IMAGE COMMANDS =====
  {
    command: 'dalle', aliases: ['dalle3'], category: 'ai',
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply('❌ .dalle <prompt>');
      const p = args.join(' ');
      reply('🎨 Generating...');
      try {
        const url = F(p, 'flux');
        await s.sendMessage(m.chat, { image: { url }, caption: `🎨 *DALL·E:* ${p}` }, { quoted: m });
      } catch { reply('❌ Failed'); }
    }
  },
  {
    command: 'flux', aliases: ['fluxpro'], category: 'ai',
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply('❌ .flux <prompt>');
      const p = args.join(' ');
      reply('🎨 Generating...');
      try {
        const url = F(p, 'flux');
        await s.sendMessage(m.chat, { image: { url }, caption: `🎨 *Flux:* ${p}` }, { quoted: m });
      } catch { reply('❌ Failed'); }
    }
  },
  {
    command: 'imagine', aliases: ['imagine3', 'imagine4'], category: 'ai',
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply('❌ .imagine <prompt>');
      const p = args.join(' ');
      reply('🎨 Generating...');
      try {
        const url = F(p, 'flux');
        await s.sendMessage(m.chat, { image: { url }, caption: `🎨 *Imagine:* ${p}` }, { quoted: m });
      } catch { reply('❌ Failed'); }
    }
  },
  {
    command: 'animagine', category: 'ai',
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply('❌ .animagine <prompt>');
      const p = args.join(' ');
      reply('🎨 Generating...');
      try {
        const url = F(`anime style ${p}`, 'flux');
        await s.sendMessage(m.chat, { image: { url }, caption: `🎨 *Anime:* ${p}` }, { quoted: m });
      } catch { reply('❌ Failed'); }
    }
  },
  {
    command: 'dreamshaper', aliases: ['sdxl'], category: 'ai',
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply('❌ .dreamshaper <prompt>');
      const p = args.join(' ');
      reply('🎨 Generating...');
      try {
        const url = F(p, 'flux');
        await s.sendMessage(m.chat, { image: { url }, caption: `🎨 *SDXL:* ${p}` }, { quoted: m });
      } catch { reply('❌ Failed'); }
    }
  },
  {
    command: 'pony', category: 'ai',
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply('❌ .pony <prompt>');
      const p = args.join(' ');
      reply('🎨 Generating...');
      try {
        const url = F(`pony style ${p}`, 'flux');
        await s.sendMessage(m.chat, { image: { url }, caption: `🎨 *Pony:* ${p}` }, { quoted: m });
      } catch { reply('❌ Failed'); }
    }
  },
  {
    command: 'pixar', category: 'ai',
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply('❌ .pixar <prompt>');
      const p = args.join(' ');
      reply('🎨 Generating...');
      try {
        const url = F(`pixar style ${p}`, 'flux');
        await s.sendMessage(m.chat, { image: { url }, caption: `🎨 *Pixar:* ${p}` }, { quoted: m });
      } catch { reply('❌ Failed'); }
    }
  },
  {
    command: 'cartoon', category: 'ai',
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply('❌ .cartoon <prompt>');
      const p = args.join(' ');
      reply('🎨 Generating...');
      try {
        const url = F(`cartoon style ${p}`, 'flux');
        await s.sendMessage(m.chat, { image: { url }, caption: `🎨 *Cartoon:* ${p}` }, { quoted: m });
      } catch { reply('❌ Failed'); }
    }
  },
  {
    command: 'seedream', category: 'ai',
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply('❌ .seedream <prompt>');
      const p = args.join(' ');
      reply('🎨 Generating...');
      try {
        const url = F(`ghibli style ${p}`, 'flux');
        await s.sendMessage(m.chat, { image: { url }, caption: `🎨 *Seedream:* ${p}` }, { quoted: m });
      } catch { reply('❌ Failed'); }
    }
  },
  {
    command: 'toghibili', category: 'ai',
    execute: async (s, m, { args, reply }) => {
      if (!args[0]) return reply('❌ .toghibili <prompt>');
      const p = args.join(' ');
      reply('🎨 Generating...');
      try {
        const url = F(`ghibli anime ${p}`, 'flux');
        await s.sendMessage(m.chat, { image: { url }, caption: `🎨 *Ghibli:* ${p}` }, { quoted: m });
      } catch { reply('❌ Failed'); }
    }
  }
];