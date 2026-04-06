// © 2026 Alpha - FINAL MESSAGE HANDLER (STABLE 💯)

const fs = require("fs");
const path = require("path");
const config = require("./settings/config");

// 🔥 LOAD COMMANDS
const commands = [];

const loadCommands = (dir) => {
const files = fs.readdirSync(dir);

for (let file of files) {  
    const fullPath = path.join(dir, file);  

    if (fs.lstatSync(fullPath).isDirectory()) {  
        loadCommands(fullPath);  
    } else if (file.endsWith(".js")) {  
        try {  
            delete require.cache[require.resolve(fullPath)];  
            const cmd = require(fullPath);  

            if (cmd.command) {  
                commands.push(cmd);  
            }  

        } catch (e) {  
            console.log("❌ Command load error:", file);  
        }  
    }  
}

};

loadCommands(path.join(__dirname, "plugins"));

// 🔥 FINAL CLEAN FUNCTION (NO ERRORS EVER)
const clean = (jid) => {
try {
if (!jid) return "";

// force string  
    jid = jid.toString();  

    // normal jid  
    if (jid.includes("@")) {  
        return jid.split("@")[0];  
    }  

    // fallback (numbers etc)  
    return jid;  

} catch {  
    return "";  
}

};

module.exports = async (sock, m) => {
try {
if (!m.text) return;

const prefix = ".";  
    if (!m.text.startsWith(prefix)) return;  

    const args = m.text.slice(prefix.length).trim().split(/ +/);  
    const commandName = args.shift().toLowerCase();  

    const command = commands.find(cmd => cmd.command === commandName);  
    if (!command) return;  

    // 🔥 OWNER FIX (NO MORE LOCK)  
    const isOwner = clean(m.sender) === clean(config.owner);  

    // 🔥 HELPERS  
    const reply = (text) =>  
        sock.sendMessage(m.chat, { text }, { quoted: m });  

    const send = (data) =>  
        sock.sendMessage(m.chat, data, { quoted: m });  

    // 🔥 CONTEXT  
    const context = {  
        args,  
        reply,  
        send,  
        isOwner  
    };  

    // 🔥 OWNER PROTECTION  
    if (command.category === "owner" && !isOwner) {  
        return reply("❌ Owner only command");  
    }  

    // 🚀 EXECUTE  
    await command.execute(sock, m, context);  

} catch (err) {  
    console.log("🔥 MESSAGE ERROR:", err);  
    await sock.sendMessage(  
        m.chat,  
        { text: "❌ Error occurred" },  
        { quoted: m }  
    );  
}

};