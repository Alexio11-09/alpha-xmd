// © 2026 Alpha

module.exports = {
    command: "toggle",
    description: "Enable or disable bot features",
    category: "settings",
    owner: true,

    execute: async (sock, m, { args, settings, saveSettings, reply }) => {
        try {

            const feature = args[0]?.toLowerCase();
            const state = args[1]?.toLowerCase();

            // ❌ Missing input
            if (!feature || !state) {
                return reply(
`⚙️ Usage:
.toggle autoread on/off
.toggle typing on/off
.toggle react on/off
.toggle antidelete on/off`
                );
            }

            // 🔥 VALID FEATURES
            const valid = ["autoread", "typing", "react", "antidelete"];

            if (!valid.includes(feature)) {
                return reply(`❌ Invalid feature\n\nAvailable: ${valid.join(", ")}`);
            }

            if (!["on", "off"].includes(state)) {
                return reply("❌ Use on or off only");
            }

            // 🔥 MAP FEATURE → SETTINGS KEY
            const map = {
                autoread: "autoread",
                typing: "typing",
                react: "autoreact",
                antidelete: "antidelete"
            };

            const key = map[feature];

            // 🔁 CHECK IF SAME STATE
            if (settings[key] === (state === "on")) {
                return reply(`⚠️ ${feature} is already ${state}`);
            }

            // ✅ UPDATE
            settings[key] = state === "on";

            // 💾 SAVE
            saveSettings(settings);

            reply(`✅ ${feature.toUpperCase()} is now ${state.toUpperCase()}`);

        } catch (err) {
            console.log("Toggle error:", err);
            reply("❌ Failed to toggle setting");
        }
    }
};