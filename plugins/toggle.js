module.exports = {
    command: ["autoread", "typing", "autoreact"],
    owner: true,

    execute: async (sock, m, { command, args, settings, saveSettings, reply }) => {

        const state = args[0]; // on / off

        // ❌ if user didn’t type on/off
        if (!state) {
            return reply(`Usage:\n.${command} on\n.${command} off`);
        }

        if (state !== "on" && state !== "off") {
            return reply("❌ Use on or off only");
        }

        // 🔥 change setting
        settings[command] = state === "on";

        // 💾 save to file
        saveSettings(settings);

        reply(`✅ ${command} is now ${state}`);
    }
};