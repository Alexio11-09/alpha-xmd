// © 2026 Alpha

module.exports = {
    command: "tagall",
    category: "group", // ✅ FIXED (shows in menu)
    group: true,

    async execute(sock, m, context) {
        const { reply } = context;

        try {
            if (!m.isGroup) {
                return reply("❌ This command works in groups only");
            }

            const metadata = await sock.groupMetadata(m.chat);
            const participants = metadata.participants;

            let teks = "👥 *TAG ALL MEMBERS*\n\n";

            for (let mem of participants) {
                teks += `➤ @${mem.id.split("@")[0]}\n`;
            }

            await sock.sendMessage(m.chat, {
                text: teks,
                mentions: participants.map(a => a.id)
            });

        } catch (err) {
            console.log("Tagall error:", err);
            reply("❌ Failed to tag all");
        }
    }
};