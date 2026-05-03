module.exports = [
  {
    command: "save", category: "utility",
    execute: async (s, m, { reply }) => {
      if (!m.quoted) return reply("❌ Reply to a message to save.");
      const savedMsg = m.quoted.text || (m.quoted.message?.conversation) || (m.quoted.message?.extendedTextMessage?.text) || "[Media]";
      if (!global._savedMessages) global._savedMessages = [];
      global._savedMessages.push(savedMsg);
      reply(`✅ Saved! You have ${global._savedMessages.length} saved messages.`);
    }
  },
  {
    command: "delete", aliases: ["del"], category: "utility",
    execute: async (s, m, { reply }) => {
      if (!m.quoted) return reply("❌ Reply to a message to delete.");
      if (!m.isBotAdmin && !m.isAdmin) return reply("❌ I need admin powers.");
      try {
        await s.sendMessage(m.chat, { delete: m.quoted.key });
        reply("🗑️ Deleted.");
      } catch { reply("❌ Failed to delete."); }
    }
  },
  {
    command: "hack", category: "utility",
    execute: async (s, m, { args, reply }) => {
      const target = args[0] || "NASA";
      reply(`👨‍💻 *Hacking ${target}...*\n[▓▓▓▓░░░░] 20%`);
      setTimeout(() => reply(`[▓▓▓▓▓▓▓▓░░] 50%`), 1000);
      setTimeout(() => reply(`[▓▓▓▓▓▓▓▓▓▓▓▓] 90%`), 2000);
      setTimeout(() => reply(`✅ Successfully hacked ${target}!\n\nJust kidding 😂`), 3000);
    }
  },
  {
    command: "antispam", category: "utility", owner: true,
    execute: async (s, m, { args, reply }) => {
      const action = args[0]?.toLowerCase();
      if (action === 'on') { global._antispam = true; reply("🛡️ Anti‑spam enabled."); }
      else if (action === 'off') { global._antispam = false; reply("❌ Anti‑spam disabled."); }
      else { reply(`🛡️ Anti‑spam: ${global._antispam ? 'ON' : 'OFF'}\nUsage: .antispam on/off`); }
    }
  },
  {
    command: "autosticker", category: "utility", owner: true,
    execute: async (s, m, { args, reply }) => {
      const action = args[0]?.toLowerCase();
      if (action === 'on') { global._autosticker = true; reply("🖼️ Auto‑sticker enabled."); }
      else if (action === 'off') { global._autosticker = false; reply("❌ Auto‑sticker disabled."); }
      else { reply(`🖼️ Auto‑sticker: ${global._autosticker ? 'ON' : 'OFF'}\nUsage: .autosticker on/off`); }
    }
  },
  {
    command: "autovoice", category: "utility", owner: true,
    execute: async (s, m, { args, reply }) => {
      const action = args[0]?.toLowerCase();
      if (action === 'on') { global._autovoice = true; reply("🎤 Auto‑voice enabled."); }
      else if (action === 'off') { global._autovoice = false; reply("❌ Auto‑voice disabled."); }
      else { reply(`🎤 Auto‑voice: ${global._autovoice ? 'ON' : 'OFF'}\nUsage: .autovoice on/off`); }
    }
  }
];
