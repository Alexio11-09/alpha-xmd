// © 2026 Alpha - SETTINGS PANEL (BUTTON UI)

const fs = require("fs");
const settingsPath = "./database/settings.json";

const loadSettings = () => {
    try {
        return JSON.parse(fs.readFileSync(settingsPath));
    } catch {
        return {
            autoread: false,
            typing: false,
            autoreact: false,
            antidelete: false,
            antidelete_mode: "chat"
        };
    }
};

module.exports = {
    command: "settings",
    description: "Open settings panel",
    category: "settings",
    owner: true,

    execute: async (sock, m, { reply }) => {
        try {
            const s = loadSettings();

            const ON = "ON ✅";
            const OFF = "OFF ❌";

            const text =
`⚙️ *SETTINGS PANEL*

👁️ Autoread: ${s.autoread ? ON : OFF}
⌨️ Typing: ${s.typing ? ON : OFF}
❤️ React: ${s.autoreact ? ON : OFF}
🛡️ Antidelete: ${s.antidelete ? ON : OFF}

Tap a button to toggle 👇`;

            const buttons = [
                { buttonId: ".toggle autoread", buttonText: { displayText: "👁️ Autoread" }, type: 1 },
                { buttonId: ".toggle typing", buttonText: { displayText: "⌨️ Typing" }, type: 1 },
                { buttonId: ".toggle react", buttonText: { displayText: "❤️ React" }, type: 1 },
                { buttonId: ".toggle antidelete", buttonText: { displayText: "🛡️ AntiDelete" }, type: 1 }
            ];

            await sock.sendMessage(m.chat, {
                text,
                buttons,
                headerType: 1
            });

        } catch (err) {
            console.log("Settings panel error:", err);
            reply("❌ Failed to open settings panel");
        }
    }
};