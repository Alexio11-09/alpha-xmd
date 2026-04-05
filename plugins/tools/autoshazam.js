// © 2026 Alpha - AUTO SHAZAM 🔥

const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const axios = require("axios");

module.exports = {
    command: "autoshazam",
    description: "Auto detect songs",
    category: "tools",

    execute: async (sock, m, { args, settings, saveSettings, reply }) => {
        const state = args[0];

        if (!["on", "off"].includes(state)) {
            return reply("Usage: .autoshazam on/off");
        }

        settings.autoshazam = state === "on";
        saveSettings(settings);

        reply(`🎧 Auto Shazam is now ${state.toUpperCase()}`);
    },

    // 🔥 AUTO LISTENER
    onMessage: async (sock, m, { settings }) => {
        try {
            if (!settings.autoshazam) return;

            const msg = m.message;
            const isAudio = msg?.audioMessage;
            const isVideo = msg?.videoMessage;

            if (!isAudio && !isVideo) return;

            // ⏱️ Ignore long videos
            if (isVideo && (msg.videoMessage.seconds || 0) > 15) return;

            const stream = await downloadContentFromMessage(
                isAudio ? isAudio : isVideo,
                isAudio ? "audio" : "video"
            );

            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const res = await axios.post(
                "https://api.siputzx.my.id/api/tools/whatmusic",
                buffer,
                {
                    headers: {
                        "Content-Type": "application/octet-stream"
                    }
                }
            );

            const data = res.data;
            if (!data?.status) return;

            const result = data.data;

            await sock.sendMessage(m.chat, {
                text: `🎵 Auto Detected:\n${result.title} - ${result.artist}`
            }, { quoted: m });

        } catch (e) {
            // silent fail
        }
    }
};