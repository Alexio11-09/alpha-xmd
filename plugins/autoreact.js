// ❤️ Auto React Toggle (DIRECT COMMAND)

const fs = require("fs");
const path = "./database/settings.json";

module.exports = {
    command: "autoreact",
    category: "settings",

    execute: async (sock, m, { args, reply }) => {
        let settings = JSON.parse(fs.readFileSync(path));

        if (!args[0]) {
            return reply(`❤️ AutoReact: ${settings.autoreact ? "ON" : "OFF"}`);
        }

        if (args[0] === "on") {
            settings.autoreact = true;
        } else if (args[0] === "off") {
            settings.autoreact = false;
        }

        fs.writeFileSync(path, JSON.stringify(settings, null, 2));

        reply(`❤️ AutoReact turned ${settings.autoreact ? "ON" : "OFF"}`);
    }
};