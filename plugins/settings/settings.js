// © 2026 Alpha - BOT SETTINGS (FULL FUNNY & CLEAN)

const fs = require('fs');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const settingsPath = './database/settings.json';
if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true });
if (!fs.existsSync(settingsPath)) fs.writeFileSync(settingsPath, JSON.stringify({ global: {} }, null, 2));

const loadSettings = () => { try { return JSON.parse(fs.readFileSync(settingsPath)); } catch { return { global: {} }; } };
const saveSettings = (data) => { try { fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2)); return true; } catch { return false; } };
const getGlobal = () => (loadSettings().global || {});
const setGlobal = (data) => { const s = loadSettings(); s.global = { ...getGlobal(), ...data }; return saveSettings(s); };

// funny helpers
const R = (arr) => arr[Math.floor(Math.random() * arr.length)];
const fail = ["👾 Oops, circuits tangled. Retry?", "💥 Failed! But I'm still cool.", "😅 Something broke. Try again?"];
const guide = (cmd, usage) => R([`🧐 You forgot something! Use: *${usage}*`, `🤔 Hmm, that didn't work. Try: *${usage}*`, `😜 Oops! The right way is: *${usage}*`, `🙈 Without that, I'm lost. Type: *${usage}*`]);

module.exports = [

    // ==================== AUTOREAD ====================
    { command: "autoread", aliases: ["read"], category: "settings", owner: true,
      execute: async (s, m, { args, reply }) => {
          const a = args[0]?.toLowerCase();
          if (a === "on") { setGlobal({ autoread: true }); reply(R(["📖 Auto‑read ON! I'll be your silent reader.", "👀 Now I'll read everything. No secrets."])); }
          else if (a === "off") { setGlobal({ autoread: false }); reply(R(["😴 Auto‑read OFF. I'll pretend I didn't see.", "🙈 No more auto‑reading. Your messages are safe."])); }
          else { const status = getGlobal().autoread ? "ON ✅" : "OFF ❌"; reply(`📊 *Auto‑Read:* ${status}\nChange with: .autoread on/off`); }
      }
    },

    // ==================== AUTOTYPING ====================
    { command: "autotyping", aliases: ["typing"], category: "settings", owner: true,
      execute: async (s, m, { args, reply }) => {
          const a = args[0]?.toLowerCase();
          if (a === "on") { setGlobal({ autotyping: true }); reply(R(["⌨️ Typing indicator ON! I'll look busy.", "✍️ Now I'll fake typing. So professional."])); }
          else if (a === "off") { setGlobal({ autotyping: false }); reply(R(["🤐 Typing indicator OFF. I'll just reply fast.", "🔇 No more fake typing. I'm honest now."])); }
          else { const status = getGlobal().autotyping ? "ON ✅" : "OFF ❌"; reply(`📊 *Auto‑Typing:* ${status}\nChange with: .autotyping on/off`); }
      }
    },

    // ==================== AUTORECORDING ====================
    { command: "autorecording", aliases: ["recording"], category: "settings", owner: true,
      execute: async (s, m, { args, reply }) => {
          const a = args[0]?.toLowerCase();
          if (a === "on") { setGlobal({ autorecording: true }); reply(R(["🎤 Recording indicator ON! I'm like a radio host.", "🔴 Now I'll look like I'm recording a podcast."])); }
          else if (a === "off") { setGlobal({ autorecording: false }); reply(R(["⏹️ Recording OFF. No more fake audio clips.", "🔇 Recording indicator hidden."])); }
          else { const status = getGlobal().autorecording ? "ON ✅" : "OFF ❌"; reply(`📊 *Auto‑Recording:* ${status}\nChange with: .autorecording on/off`); }
      }
    },

    // ==================== AUTOREACT ====================
    { command: "autoreact", aliases: ["react"], category: "settings", owner: true,
      execute: async (s, m, { args, reply }) => {
          const a = args[0]?.toLowerCase();
          if (a === "on") { setGlobal({ autoreact: true }); reply(R(["😍 Auto‑react ON! I'll add flavor to every message.", "❤️ Now I'll react with random emojis. Get ready."])); }
          else if (a === "off") { setGlobal({ autoreact: false }); reply(R(["😑 Auto‑react OFF. No more emoji spamming.", "🙅 Reactions disabled. I'll keep it clean."])); }
          else { const status = getGlobal().autoreact ? "ON ✅" : "OFF ❌"; reply(`📊 *Auto‑React:* ${status}\nChange with: .autoreact on/off`); }
      }
    },

    // ==================== ANTIDELETE ====================
    { command: "antidelete", aliases: ["antidel"], category: "settings", owner: true,
      execute: async (s, m, { args, reply }) => {
          const a = args[0]?.toLowerCase();
          if (a === "on") { setGlobal({ antidelete: true }); reply(R(["🛡️ Anti‑delete ON! I'll catch every sneaky delete.", "🗑️ Deleted messages won't escape me now."])); }
          else if (a === "off") { setGlobal({ antidelete: false }); reply(R(["❌ Anti‑delete OFF. Deletions are free.", "👋 No more message rescue. Whatever you delete is gone."])); }
          else { const status = getGlobal().antidelete ? "ON ✅" : "OFF ❌"; reply(`📊 *Anti‑Delete:* ${status}\nChange with: .antidelete on/off`); }
      }
    },

    // ==================== ANTIEDIT ====================
    { command: "antiedit", aliases: ["antieditmsg"], category: "settings", owner: true,
      execute: async (s, m, { args, reply }) => {
          const a = args[0]?.toLowerCase();
          if (a === "on") { setGlobal({ antiedit: true }); reply(R(["✏️ Anti‑edit ON! I'll expose every change.", "🔍 Now I'll show the original and edited versions."])); }
          else if (a === "off") { setGlobal({ antiedit: false }); reply(R(["❌ Anti‑edit OFF. Edits are forgiven.", "🤐 No more edit alerts. Go ahead, fix your typos."])); }
          else { const status = getGlobal().antiedit ? "ON ✅" : "OFF ❌"; reply(`📊 *Anti‑Edit:* ${status}\nChange with: .antiedit on/off`); }
      }
    },

    // ==================== SET PREFIX ====================
    { command: "setprefix", aliases: ["prefix"], category: "settings", owner: true,
      execute: async (s, m, { args, reply }) => {
          if (!args[0]) return reply(guide("setprefix", ".setprefix !"));
          const p = args[0];
          setGlobal({ prefix: p });
          reply(R([`✅ Prefix changed to *${p}*. Let's hope you remember it.`, `🔧 Now use *${p}* instead of .`]));
      }
    },

    // ==================== RESET PREFIX ====================
    { command: "resetprefix", aliases: ["defaultprefix"], category: "settings", owner: true,
      execute: async (s, m, { reply }) => {
          setGlobal({ prefix: '.' });
          reply(R(["🔄 Prefix reset to the boring old dot. Everything's normal again.", "👌 Back to default. . commands are back."]));
      }
    },

    // ==================== SET BOT NAME ====================
    { command: "setname", aliases: ["botname"], category: "settings", owner: true,
      execute: async (s, m, { args, reply }) => {
          if (!args[0]) return reply(guide("setname", ".setname My Cool Bot"));
          const name = args.join(" ");
          try {
              await s.updateProfileName(name);
              reply(R([`✅ Now I'm *${name}*. Nice choice!`, `🎉 Name updated to *${name}*. I feel reborn.`]));
          } catch (err) { reply(R(["❌ Couldn't change name. WhatsApp said no.", "🙅 Name change failed. Maybe try a shorter name?"])); }
      }
    },

    // ==================== SET BIO ====================
    { command: "setbio", aliases: ["status","about"], category: "settings", owner: true,
      execute: async (s, m, { args, reply }) => {
          if (!args[0]) return reply(guide("setbio", ".setbio I'm a cool bot"));
          const bio = args.join(" ");
          try {
              await s.updateProfileStatus(bio);
              reply(R([`📝 Bio set to: *${bio}*`, `✨ About me: *${bio}*`]));
          } catch (err) { reply(R(["❌ Failed to update bio. Maybe too long?", "🤷 Bio update didn't work. Try again."])); }
      }
    },

    // ==================== SET PROFILE PICTURE ====================
    { command: "setpp", aliases: ["setprofile","botpp"], category: "settings", owner: true,
      execute: async (s, m, { reply }) => {
          if (!m.quoted) return reply(guide("setpp", ".setpp (reply to an image)"));
          const msg = m.quoted;
          try {
              const buffer = await s.downloadMediaMessage(msg);
              await s.updateProfilePicture(s.user.id, buffer);
              reply(R(["🖼️ Profile picture updated! Look at me now.", "📸 New profile pic! I'm feeling pretty."]));
          } catch (err) { reply(R(["❌ Failed to set profile picture. Maybe the image is too large?", "😩 Couldn't change PP. Try a smaller image."])); }
      }
    },

    // ==================== SETTINGS OVERVIEW ====================
    { command: "settings", aliases: ["config","botsettings"], category: "settings", owner: true,
      execute: async (s, m, { reply }) => {
          const cfg = getGlobal();
          let text = `⚙️ *Current Settings*\n\n`;
          text += `📖 Auto‑Read: ${cfg.autoread ? '✅' : '❌'}\n`;
          text += `⌨️ Auto‑Typing: ${cfg.autotyping ? '✅' : '❌'}\n`;
          text += `🎤 Auto‑Recording: ${cfg.autorecording ? '✅' : '❌'}\n`;
          text += `😍 Auto‑React: ${cfg.autoreact ? '✅' : '❌'}\n`;
          text += `🛡️ Anti‑Delete: ${cfg.antidelete ? '✅' : '❌'}\n`;
          text += `✏️ Anti‑Edit: ${cfg.antiedit ? '✅' : '❌'}\n`;
          text += `🔧 Prefix: ${cfg.prefix || '.'}\n\n`;
          text += `💡 *Status auto‑features are now under* .autostatus *(separate module)*`;
          reply(text);
      }
    }
];