// © 2026 Alpha

module.exports = {
    command: "toggle",
    description: "Enable or disable bot features",
    category: "settings",
    owner: true,

    execute: async (sock, m, context) => {
        try {
            const { args, settings, saveSettings, reply, isCreator } = context;

            // 🔥 FIXED OWNER CHECK
            if (!isCreator) {
                return reply("❌ Owner only command");
            }

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

            settings[map[feature]] = state === "on";

            // 💾 SAVE
            saveSettings(settings);

            reply(`✅ ${feature} is now ${state}`);

        } catch (err) {
            console.log("Toggle error:", err);
            reply("❌ Failed to toggle setting");
        }
    }
};