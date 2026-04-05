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

            // 🔥 ANTIDELETE MODE (NEW FEATURE)
            if (feature === "antidelete" && ["chat", "dm", "both"].includes(state)) {
                settings.antidelete = true;
                settings.antidelete_mode = state;

                saveSettings(settings);

                return reply(`🛡️ AntiDelete mode set to *${state.toUpperCase()}*`);
            }

            // ❌ Missing input
            if (!feature || !state) {
                return reply(
`⚙️ Usage:
.toggle autoread on/off
.toggle typing on/off
.toggle react on/off
.toggle antidelete on/off
.toggle antidelete chat/dm/both`
                );
            }

            // 🔥 VALID FEATURES
            const valid = ["autoread", "typing", "react", "antidelete"];

            if (!valid.includes(feature)) {
                return reply(`❌ Invalid feature\n\nAvailable: ${valid.join(", ")}`);
            }

            // 🔥 ALLOW MODES + ON/OFF
            if (!["on", "off", "chat", "dm", "both"].includes(state)) {
                return reply("❌ Use on/off or chat/dm/both");
            }

            const map = {
                autoread: "autoread",
                typing: "typing",
                react: "autoreact",
                antidelete: "antidelete"
            };

            const key = map[feature];

            // 🔁 PREVENT SAME STATE
            if (["on", "off"].includes(state)) {
                if (settings[key] === (state === "on")) {
                    return reply(`⚠️ ${feature} is already ${state}`);
                }

                settings[key] = state === "on";
            }

            // 💾 SAVE
            saveSettings(settings);

            reply(`✅ ${feature.toUpperCase()} updated`);

        } catch (err) {
            console.log("Toggle error:", err);
            reply("❌ Failed to toggle setting");
        }
    }
};