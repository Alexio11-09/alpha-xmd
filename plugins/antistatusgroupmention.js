// © 2026 Alpha - ANTI STATUS GROUP MENTION
//
// When someone posts a status that mentions this group, WhatsApp drops a
// "group mentioned in a status" message into the group chat. This plugin
// catches that message and either:
//   • delete mode (default): deletes it and warns the person.
//                            At 3 warnings the person is removed from the group.
//   • kick mode:             deletes it and removes the person straight away.
//
// Group admins and the bot owner are never touched.
// The bot must be an admin of the group for this to work.
//
// Commands (group admins only):
//   .antistatusgroupmention            show the current settings
//   .antistatusgroupmention on|off     turn it on / off
//   .antistatusgroupmention delete     delete + warn (3 warnings, then kick)
//   .antistatusgroupmention kick       delete + kick immediately
//   .antistatusgroupmention warns      list people with warnings
//   .antistatusgroupmention reset @user | all     clear warnings

const tenant = require('../library/tenant');

const FILE = 'antistatusgroupmention.json';
const MAX_WARNS = 3;

// WhatsApp message types used for "this group was mentioned in a status"
const TYPES = ['groupStatusMentionMessage', 'groupMentionedMessage'];

const loadAll = s => { try { return tenant.read(s, FILE, {}) || {}; } catch { return {}; } };
const saveAll = (s, d) => { try { tenant.write(s, FILE, d); } catch (e) { console.log('[ASGM] could not save:', e.message); } };
const settingsOf = (all, chat) => ({ enabled: false, action: 'delete', warns: {}, ...(all[chat] || {}) });

// warnings are stored by the number part of the id so mentions and messages match
const keyOf = jid => String(jid || '').split('@')[0].split(':')[0];

// remember which messages were already handled (WhatsApp can deliver a message twice)
const handled = new Set();
const remember = id => {
  handled.add(id);
  if (handled.size > 300) handled.delete(handled.values().next().value);
};

const panel = cfg => `🛡️ *Anti Status Group Mention*

• Status: ${cfg.enabled ? 'ON ✅' : 'OFF ❌'}
• Action: ${cfg.action === 'kick' ? '🚪 Kick immediately' : `🗑️ Delete + warn (${MAX_WARNS} warnings, then kick)`}

*Commands*
.antistatusgroupmention on / off
.antistatusgroupmention delete
.antistatusgroupmention kick
.antistatusgroupmention warns
.antistatusgroupmention reset @user | all

_Admins and the bot owner are never affected. I must be an admin._`;

// ======================================================
// HOOK: runs on every group message (called by message.js)
// ======================================================
async function onMessage(sock, m, helpers = {}) {
  // quick exit for ordinary messages
  if (!m.message || !TYPES.some(t => m.message[t] != null)) return;
  if (m.fromMe || !m.isGroup) return;

  // never act on old messages (e.g. a backlog delivered after a reconnect)
  const ts = Number(m.messageTimestamp || 0);
  if (ts && Date.now() / 1000 - ts > 300) return;

  const chat = m.chat;
  const all = loadAll(sock);
  const cfg = settingsOf(all, chat);
  if (!cfg.enabled) return;

  if (m.id && handled.has(m.id)) return;
  if (m.id) remember(m.id);

  const user = m.sender;
  const tag = '@' + keyOf(user);

  // admins, the owner and the bot itself are exempt; the bot needs admin rights to act
  let isSenderAdmin = false, isBotAdmin = false;
  if (helpers.checkAdmin) {
    ({ isSenderAdmin, isBotAdmin } = await helpers.checkAdmin(sock, chat, user, sock.user.id));
  }
  if (isSenderAdmin || m.isOwner) return;
  if (!isBotAdmin) return;

  console.log(`[ASGM] status group mention from ${keyOf(user)} in ${chat} (${cfg.action})`);

  // 1) delete the mention message
  try { await sock.sendMessage(chat, { delete: m.key }); } catch (e) { console.log('[ASGM] delete failed:', e.message); }

  const kick = async () => {
    try { await sock.groupParticipantsUpdate(chat, [user], 'remove'); return true; }
    catch (e) { console.log('[ASGM] kick failed:', e.message); return false; }
  };

  // 2a) kick mode
  if (cfg.action === 'kick') {
    const ok = await kick();
    await sock.sendMessage(chat, {
      text: ok ? `🚫 ${tag} was removed for mentioning this group in a status.`
               : `⚠️ ${tag} mentioned this group in a status, but I couldn't remove them.`,
      mentions: [user]
    });
    return;
  }

  // 2b) delete mode: warn, and kick on the 3rd warning
  const key = keyOf(user);
  const count = (cfg.warns[key] || 0) + 1;

  if (count >= MAX_WARNS) {
    delete cfg.warns[key];
    all[chat] = cfg;
    saveAll(sock, all);

    const ok = await kick();
    await sock.sendMessage(chat, {
      text: ok ? `🚫 ${tag} was removed after ${MAX_WARNS} warnings for mentioning this group in a status.`
               : `⚠️ ${tag} reached ${MAX_WARNS} warnings, but I couldn't remove them.`,
      mentions: [user]
    });
    return;
  }

  cfg.warns[key] = count;
  all[chat] = cfg;
  saveAll(sock, all);

  await sock.sendMessage(chat, {
    text: `⚠️ *Warning ${count}/${MAX_WARNS}*\n${tag} mentioned this group in a status, which is not allowed here.\nAt ${MAX_WARNS} warnings you will be removed.`,
    mentions: [user]
  });
}

// ======================================================
// COMMAND
// ======================================================
module.exports = [{
  command: 'antistatusgroupmention',
  aliases: ['antistatusmention', 'asgm'],
  category: 'group',
  group: true,
  admin: true,
  onMessage,

  execute: async (s, m, { args, reply }) => {
    const all = loadAll(s);
    const cfg = settingsOf(all, m.chat);
    const a = (args[0] || '').toLowerCase();
    const save = () => { all[m.chat] = cfg; saveAll(s, all); };

    if (!a || a === 'status') return reply(panel(cfg));

    if (a === 'on' || a === 'off') {
      cfg.enabled = a === 'on';
      save();
      return reply(cfg.enabled
        ? `✅ Anti status group mention is ON.\nAction: ${cfg.action === 'kick' ? 'kick immediately' : `delete + warn (${MAX_WARNS} warnings, then kick)`}`
        : '❌ Anti status group mention is OFF.');
    }

    if (a === 'delete' || a === 'kick') {
      cfg.action = a;
      cfg.enabled = true;
      save();
      return reply(a === 'kick'
        ? '✅ ON. Anyone who mentions this group in a status will be *removed immediately*.'
        : `✅ ON. Status mentions are *deleted* and the person gets a warning. After ${MAX_WARNS} warnings they are removed.`);
    }

    if (a === 'warns') {
      const list = Object.entries(cfg.warns || {}).filter(([, n]) => n > 0);
      if (!list.length) return reply('✅ Nobody has warnings in this group.');
      return reply(`⚠️ *Warnings in this group*\n\n${list.map(([k, n]) => `• @${k}: ${n}/${MAX_WARNS}`).join('\n')}`, { mentions: list.map(([k]) => k + '@s.whatsapp.net') });
    }

    if (a === 'reset') {
      const target = m.mentionedJid?.[0] || m.quoted?.sender || (args[1] && args[1] !== 'all' ? args[1].replace(/[^0-9]/g, '') : null);
      if (args[1] === 'all') {
        cfg.warns = {};
        save();
        return reply('✅ All warnings in this group were cleared.');
      }
      if (!target) return reply('❌ Mention the person, reply to their message, or use: .antistatusgroupmention reset all');
      delete cfg.warns[keyOf(target)];
      save();
      return reply(`✅ Warnings cleared for @${keyOf(target)}.`, { mentions: [String(target).includes('@') ? target : target + '@s.whatsapp.net'] });
    }

    reply(panel(cfg));
  }
}];
