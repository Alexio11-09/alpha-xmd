// © 2026 Alpha

module.exports = {
    command: "tagall",
    description: "Tag all group members",
    category: "group",
    group: true,

    async execute(sock, m, { reply }) {
        try {
            const metadata = await sock.groupMetadata(m.chat);
            const participants = metadata.participants || [];

            if (!participants.length) {
                return reply("❌ No members found");
            }

            let teks = "👥 *TAG ALL MEMBERS*\n\n";

            const mentions = participants.map(p => p.id);

            teks += mentions
                .map(id => `➤ @${id.split("@")[0]}`)
                .join("\n");

            await sock.sendMessage(m.chat, {
                text: teks,
                mentions
            });

        } catch (err) {
            console.log("Tagall error:", err);
            reply("❌ Failed to tag all members");
        }
    }
};