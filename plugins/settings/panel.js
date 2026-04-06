// © 2026 Alpha - SETTINGS PANEL (UPDATED 💯)

const fs = require("fs");
const settingsPath = "./database/settings.json";

const loadSettings = () => {
    try {
        return JSON.parse(fs.readFileSync(settingsPath));
    } catch {
        return {
            autoread: false,
            autotyping: false,
            autorecord: false,
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
⌨️ AutoTyping: ${s.autotyping ? ON : OFF}
🎤 AutoRecord: ${s.autorecord ? ON : OFF}
❤️ AutoReact: ${s.autoreact ? ON : OFF}
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
                        buttonId: ".toggle autotyping",
                        buttonText: { displayText: "⌨️ Toggle AutoTyping" },
                        type: 1
                    },
                    {
                        buttonId: ".toggle autorecord",
                        buttonText: { displayText: "🎤 Toggle AutoRecord" },
                        type: 1
                    },
                    {
                        buttonId: ".toggle autoreact",
                        buttonText: { displayText: "❤️ Toggle AutoReact" },
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