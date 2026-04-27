// © 2026 Alpha - CPANEL MANAGEMENT (OWNER + PREMIUM)
// Commands: .addserver, .delserver, .listservers, .[type] [name] [number], .addprem, .delprem, .premiumlist

const fs = require('fs');
const path = require('path');

// ---------- DATABASES ----------
const serverPath = './database/cpanel_servers.json';
const premiumPath = './database/cpanel_premium.json';

if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true });
if (!fs.existsSync(serverPath)) fs.writeFileSync(serverPath, '[]');
if (!fs.existsSync(premiumPath)) fs.writeFileSync(premiumPath, '[]');

// ---------- HELPERS ----------
const loadServers = () => { try { return JSON.parse(fs.readFileSync(serverPath)); } catch { return []; } };
const saveServers = (data) => fs.writeFileSync(serverPath, JSON.stringify(data, null, 2));
const nextServerId = () => {
    const servers = loadServers();
    const ids = servers.map(s => s.id);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
};

const loadPremium = () => { try { return JSON.parse(fs.readFileSync(premiumPath)); } catch { return []; } };
const savePremium = (data) => fs.writeFileSync(premiumPath, JSON.stringify(data, null, 2));
const cleanNumber = (num) => num.replace(/[^0-9]/g, '');

// Premium check
const isPremium = (sender) => {
    const premium = loadPremium();
    return premium.includes(cleanNumber(sender));
};

// Main‑owner check
const isMainOwner = (sender, config) => {
    const ownerNumbers = (config.owner || []).map(cleanNumber);
    const botNumber = cleanNumber(sender.split('@')[0]);
    return ownerNumbers.includes(botNumber);
};

// Permission check for panel commands
const canManagePanels = (sender, config) => {
    return isMainOwner(sender, config) || isPremium(sender);
};

// Send server details to a user
const sendServerToUser = async (sock, server, targetName, targetNumber) => {
    const jid = targetNumber.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    const msg = `╭───〔 📦 ${server.type.toUpperCase()} CPANEL 〕───⬣\n│\n│  👤 *For:* ${targetName}\n│  🌐 *Link:* ${server.link}\n│  👤 *User:* ${server.username}\n│  🔑 *Pass:* ${server.password}\n│  🆔 *ID:* ${server.id}\n│\n╰────────────⬣`;
    await sock.sendMessage(jid, { text: msg });
};

module.exports = [
    // ==================== ADD SERVER ====================
    {
        command: "addserver",
        aliases: ["newserver", "addpanel"],
        category: "cpanel",
        execute: async (sock, m, { args, reply, config }) => {
            if (!canManagePanels(m.sender, config)) return reply("❌ Only the main owner or premium users can manage servers.");

            if (args.length < 4) return reply("❌ Usage: .addserver <type> <link> <username> <password>\n\n📌 Example: .addserver 3gb 1.prexzyvilla.site Axiom 12345");

            const type = args[0].toLowerCase().trim();
            const link = args[1].trim();
            const username = args[2].trim();
            const password = args[3].trim();

            // Basic validation
            if (!['1gb','2gb','3gb','4gb','5gb','6gb','7gb','8gb','9gb','unli','admin'].includes(type)) {
                return reply("❌ Invalid type. Allowed: 1gb, 2gb, 3gb, 4gb, 5gb, 6gb, 7gb, 8gb, 9gb, unli, admin");
            }

            const servers = loadServers();
            const newServer = {
                id: nextServerId(),
                type,
                link,
                username,
                password
            };
            servers.push(newServer);
            saveServers(servers);

            reply(`✅ Server added!\n\n🆔 ID: ${newServer.id}\n📦 Type: ${type.toUpperCase()}\n🌐 Link: ${link}\n👤 Login: ${username}\n🔑 Pass: ${password}`);
        }
    },

    // ==================== DELETE SERVER BY ID ====================
    {
        command: "delserver",
        aliases: ["delpanel", "removeserver"],
        category: "cpanel",
        execute: async (sock, m, { args, reply, config }) => {
            if (!canManagePanels(m.sender, config)) return reply("❌ Only the main owner or premium users can manage servers.");

            if (!args[0]) return reply("❌ Usage: .delserver <id>\n\n📌 Example: .delserver 3");

            const id = parseInt(args[0]);
            if (isNaN(id)) return reply("❌ Invalid ID. Use a number.");

            const servers = loadServers();
            const index = servers.findIndex(s => s.id === id);
            if (index === -1) return reply(`❌ No server found with ID ${id}.`);

            const removed = servers.splice(index, 1)[0];
            saveServers(servers);
            reply(`🗑️ Server #${id} (${removed.type.toUpperCase()}) deleted.`);
        }
    },

    // ==================== LIST SERVERS ====================
    {
        command: "listservers",
        aliases: ["servers", "cpanels", "panelist"],
        category: "cpanel",
        execute: async (sock, m, { reply, config }) => {
            if (!canManagePanels(m.sender, config)) return reply("❌ Only the main owner or premium users can view servers.");

            const servers = loadServers();
            if (servers.length === 0) return reply("📋 No servers stored yet.");

            let text = `📋 *STORED SERVERS (${servers.length})*\n\n`;
            for (const s of servers) {
                text += `🆔 ${s.id}  |  📦 ${s.type.toUpperCase()}  |  🌐 ${s.link}  |  👤 ${s.username}\n`;
            }
            reply(text);
        }
    },

    // ==================== SEND PANEL COMMANDS (3gb, unli, etc.) ====================
    // We'll generate them dynamically to avoid repetition
    ...(() => {
        const types = ['1gb','2gb','3gb','4gb','5gb','6gb','7gb','8gb','9gb','unli','admin'];
        return types.map(type => ({
            command: type,
            category: "cpanel",
            execute: async (sock, m, { args, reply, config }) => {
                if (!canManagePanels(m.sender, config)) return reply("❌ Only the main owner or premium users can send panels.");

                if (args.length < 2) return reply(`❌ Usage: .${type} <receiver_name> <phone_number>\n\n📌 Example: .${type} Alpha 263786641436`);

                const receiverName = args[0];
                const targetNumber = args[1];

                const servers = loadServers();
                const server = servers.find(s => s.type === type);
                if (!server) return reply(`❌ No ${type.toUpperCase()} panel available. Add one with .addserver ${type} ...`);

                // Send the server details
                await sendServerToUser(sock, server, receiverName, targetNumber);

                // Remove from stock
                const updated = servers.filter(s => s.id !== server.id);
                saveServers(updated);

                reply(`✅ ${type.toUpperCase()} panel sent to ${targetNumber} for ${receiverName}. Server #${server.id} has been removed from stock.`);
            }
        }));
    })(),

    // ==================== ADD PREMIUM USER ====================
    {
        command: "addprem",
        aliases: ["addpremium", "setprem"],
        category: "cpanel",
        execute: async (sock, m, { args, reply, config }) => {
            if (!isMainOwner(m.sender, config)) return reply("❌ Only the main bot owner can manage premium users.");

            if (!args[0]) return reply("❌ Usage: .addprem <phone_number>\n\n📌 Example: .addprem 263786641436");

            const number = cleanNumber(args[0]);
            if (number.length < 7) return reply("❌ Invalid phone number.");

            const premium = loadPremium();
            if (premium.includes(number)) return reply("❌ This number is already premium.");

            premium.push(number);
            savePremium(premium);
            reply(`👑 Premium access granted to +${number}. They can now manage Cpanel servers.`);
        }
    },

    // ==================== DELETE PREMIUM USER ====================
    {
        command: "delprem",
        aliases: ["delpremium", "unprem"],
        category: "cpanel",
        execute: async (sock, m, { args, reply, config }) => {
            if (!isMainOwner(m.sender, config)) return reply("❌ Only the main bot owner can manage premium users.");

            if (!args[0]) return reply("❌ Usage: .delprem <phone_number>\n\n📌 Example: .delprem 263786641436");

            const number = cleanNumber(args[0]);
            if (number.length < 7) return reply("❌ Invalid phone number.");

            const premium = loadPremium();
            const index = premium.indexOf(number);
            if (index === -1) return reply("❌ This number is not in the premium list.");

            premium.splice(index, 1);
            savePremium(premium);
            reply(`✅ Premium access removed from +${number}.`);
        }
    },

    // ==================== LIST PREMIUM USERS ====================
    {
        command: "premiumlist",
        aliases: ["premlist", "listprem"],
        category: "cpanel",
        execute: async (sock, m, { reply, config }) => {
            if (!isMainOwner(m.sender, config) && !isPremium(m.sender)) return reply("❌ Only the main owner or premium users can view the premium list.");

            const premium = loadPremium();
            if (premium.length === 0) return reply("📋 No premium users yet.");

            let text = `👑 *PREMIUM USERS (${premium.length})*\n\n`;
            for (const num of premium) {
                text += `• +${num}\n`;
            }
            reply(text);
        }
    }
];