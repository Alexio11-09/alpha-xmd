// © 2026 Alpha - SETTINGS SYSTEM (FULL FINAL 🔥)

const fs = require("fs");
const path = "./database/settings.json";

// 🔥 LOAD SETTINGS
const load = () => {
    if (!fs.existsSync(path)) {
        const def = {
            autoread: false,
            autotyping: false,
            autoreact: false,
            autorecording: false,
            antidelete: false
        };
        fs.writeFileSync(path, JSON.stringify(def, null, 2));
        return def;
    }
    return JSON.parse(fs.readFileSync(path));
};

// 💾 SAVE SETTINGS
const save = (data) => {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
};

// 🔄 TOGGLE FUNCTION
const toggle = (feature, value, reply) => {
    const s = load();

    if (!["on", "off"].includes(value)) {
        return reply("❌ Use on/off");
    }

    s[feature] = value === "on";
    save(s);

    reply(`✅ ${feature} is now ${value.toUpperCase()}`);
};

module.exports = [

/* ================= SETTINGS PANEL ================= */
{
command: "settings",
category: "settings",

execute: async (sock, m, { reply }) => {
    const s = load();

    reply(
`⚙️ *SETTINGS PANEL*

👁️ Autoread: ${s.autoread ? "ON ✅" : "OFF ❌"}
⌨️ Autotyping: ${s.autotyping ? "ON ✅" : "OFF ❌"}
❤️ Autoreact: ${s.autoreact ? "ON ✅" : "OFF ❌"}
🎙️ Autorecording: ${s.autorecording ? "ON ✅" : "OFF ❌"}
🛡️ Antidelete: ${s.antidelete ? "ON ✅" : "OFF ❌"}

Use:
.autoread on/off
.autotyping on/off
.autoreact on/off
.autorecording on/off
.antidelete on/off`
    );
}
},

/* ================= AUTOREAD ================= */
{
command: "autoread",
category: "settings",
execute: async (sock, m, { args, reply }) => {
    toggle("autoread", args[0], reply);
}
},

/* ================= AUTOTYPING ================= */
{
command: "autotyping",
category: "settings",
execute: async (sock, m, { args, reply }) => {
    toggle("autotyping", args[0], reply);
}
},

/* ================= AUTOREACT ================= */
{
command: "autoreact",
category: "settings",
execute: async (sock, m, { args, reply }) => {
    toggle("autoreact", args[0], reply);
}
},

/* ================= AUTORECORDING ================= */
{
command: "autorecording",
category: "settings",
execute: async (sock, m, { args, reply }) => {
    toggle("autorecording", args[0], reply);
}
},

/* ================= ANTIDELETE ================= */
{
command: "antidelete",
category: "settings",
execute: async (sock, m, { args, reply }) => {
    toggle("antidelete", args[0], reply);
}
}

];