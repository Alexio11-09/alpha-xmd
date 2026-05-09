module.exports = [{
  command: "debugid",
  category: "debug",
  execute: async (sock, m, { reply }) => {
    const raw = sock.user.id;
    const cleaned = raw.replace(/[^0-9]/g, '');
    const base = raw.split('@')[0].split(':')[0];
    const cleanedBase = base.replace(/[^0-9]/g, '');
    reply(`📱 raw: ${raw}\n🔢 clean(raw): ${cleaned}\n🧼 base: ${base}\n✅ clean(base): ${cleanedBase}`);
  }
}];