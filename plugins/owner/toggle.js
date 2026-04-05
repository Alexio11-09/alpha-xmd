// © 2026 Alpha - SMART TOGGLE FINAL

module.exports = {
    command: "toggle",
    description: "Control bot settings",
    category: "settings",
    owner: true,

    execute: async (sock, m, { args, settings, saveSettings, reply }) => {
        try {
            const feature = args[0]?.toLowerCase();
            let state = args[1]?.toLowerCase();

            const valid = ["autoread", "typing", "react", "antidelete", "ignoreadmins"];

            const map = {
                autoread: "autoread",
                typing: "typing",
                react: "autoreact",
                antidelete: "antidelete",
                ignoreadmins: "ignore_admins"
            };

            // ❌ No feature
            if (!feature) {
                return reply(
`⚙️ Usage:
.toggle autoread
.toggle typing
.toggle react on/off
.toggle antidelete
.toggle antidelete chat/dm/both
.toggle ignoreadmins`
                );
            }

            // ❌ Invalid
            if (!valid.includes(feature)) {
                return reply(`❌ Invalid feature\n\nAvailable: ${valid.join(", ")}`);
            }

            const key = map[feature];

            // 🔥 ANTIDELETE MODE
            if (feature === "antidelete" && ["chat", "dm", "both"].includes(state)) {
                settings.antidelete = true;
                settings.antidelete_mode = state;
                saveSettings(settings);
                return reply(`🛡️ Antidelete → ${state.toUpperCase()}`);
            }

            // 🔁 SWITCH (no state)
            if (!state) {
                settings[key] = !settings[key];

                if (feature === "antidelete" && settings[key] && !settings.antidelete_mode) {
                    settings.antidelete_mode = "chat";
                }

                saveSettings(settings);
                return reply(`✅ ${feature.toUpperCase()} → ${settings[key] ? "ON ✅" : "OFF ❌"}`);
            }

            // 🔥 FORCE ON/OFF
            if (["on", "off"].includes(state)) {
                settings[key] = state === "on";

                if (feature === "antidelete" && state === "on" && !settings.antidelete_mode) {
                    settings.antidelete_mode = "chat";
                }

                saveSettings(settings);
                return reply(`✅ ${feature.toUpperCase()} → ${state.toUpperCase()}`);
            }

            return reply("❌ Use on/off or antidelete chat/dm/both");

        } catch (err) {
            console.log("Toggle error:", err);
            reply("❌ Toggle failed");
        }
    }
};