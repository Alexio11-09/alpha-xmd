// © 2026 Alpha - SETTINGS PANEL (NEW WORKING BUTTONS)

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

    execute: async (sock, m) => {
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

Tap below 👇`;

            await sock.sendMessage(m.chat, {
                text,
                footer: "Alpha-XMD",
                buttons: [
                    {
                        buttonId: ".toggle autoread",
                        buttonText: { displayText: "👁️ Toggle Autoread" },
                        type: 1
                    },
                    {
                        buttonId: ".toggle typing",
                        buttonText: { displayText: "⌨️ Toggle Typing" },
                        type: 1
                    },
                    {
                        buttonId: ".toggle react",
                        buttonText: { displayText: "❤️ Toggle React" },
                        type: 1
                    },
                    {
                        buttonId: ".toggle antidelete",
                        buttonText: { displayText: "🛡️ Toggle AntiDelete" },
                        type: 1
                    }
                ],
                headerType: 1
            });

        } catch (err) {
            console.log("Settings panel error:", err);
        }
    }
};