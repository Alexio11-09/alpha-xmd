// © 2026 Alpha - CPANEL MANAGEMENT (OWNER + PREMIUM) – FIXED OWNER CHECK
const fs = require('fs');
const path = require('path');

// ---------- DATABASES ----------
const tenant = require('../library/tenant');
const premiumPath = path.join(process.cwd(), 'database', 'cpanel_premium.json');
if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true });
if (!fs.existsSync(premiumPath)) fs.writeFileSync(premiumPath, '[]');
const serverPathFor = (sock) => tenant.fileOf(sock, 'cpanel_servers.json');
const loadServers = (sock) => { try { return JSON.parse(fs.readFileSync(serverPathFor(sock), 'utf8')); } catch { return []; } };
const saveServers = (sock, data) => fs.writeFileSync(serverPathFor(sock), JSON.stringify(data, null, 2));
const nextServerId = (sock) => { const servers = loadServers(sock); const ids = servers.map(s => Number(s.id) || 0); return ids.length ? Math.max(...ids) + 1 : 1; };
const loadPremium = () => { try { return JSON.parse(fs.readFileSync(premiumPath, 'utf8')); } catch { return []; } };
const savePremium = (data) => fs.writeFileSync(premiumPath, JSON.stringify(data, null, 2));
const cleanNumber = (num) => String(num || '').replace(/[^0-9]/g, '');
const isMainOwner = (sender) => cleanNumber(sender) === tenant.MAIN_OWNER;
const isAccountOwner = (sender, sock) => tenant.isAccountOwner(sender, sock);
const isPremium = (sender) => loadPremium().includes(cleanNumber(sender));
const canManagePanels = (sender, sock) => isMainOwner(sender) || isAccountOwner(sender, sock) || isPremium(sender);

// ---------- SEND SERVER DETAILS TO A USER ----------
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
            if (!canManagePanels(m.sender, sock)) return reply("❌ Only the main owner or premium users can manage servers.");

            if (args.length < 4) return reply("❌ Usage: .addserver <type> <link> <username> <password>\n\n📌 Example: .addserver 3gb 1.prexzyvilla.site Axiom 12345");

            const type = args[0].toLowerCase().trim();
            const link = args[1].trim();
            const username = args[2].trim();
            const password = args[3].trim();

            if (!['1gb','2gb','3gb','4gb','5gb','6gb','7gb','8gb','9gb','unli','admin'].includes(type)) {
                return reply("❌ Invalid type. Allowed: 1gb, 2gb, 3gb, 4gb, 5gb, 6gb, 7gb, 8gb, 9gb, unli, admin");
            }

            const servers = loadServers(sock);
            const server = {
                id: nextServerId(sock),
                type,
                link,
                username,
                password
            };
            servers.push(server);
            saveServers(sock, servers);

            reply(`✅ Server added to this account’s private stock!\n🆔 ID: ${server.id}\n📦 Type: ${type.toUpperCase()}\n🔐 Credentials are stored for this bot account.`);
        }
    },

    // ==================== DELETE SERVER ====================
    {
        command: "delserver",
        aliases: ["delpanel", "removeserver"],
        category: "cpanel",
        execute: async (sock, m, { args, reply, config }) => {
            if (!canManagePanels(m.sender, sock)) return reply("❌ Only the main owner or premium users can manage servers.");

            if (!args[0]) return reply("❌ Usage: .delserver <id>\n\n📌 Example: .delserver 3");

            const id = parseInt(args[0]);
            if (isNaN(id)) return reply("❌ Invalid ID.");

            const servers = loadServers(sock);
            const index = servers.findIndex(s => s.id === id);
            if (index === -1) return reply(`❌ No server with ID ${id}.`);

            const removed = servers.splice(index, 1)[0];
            saveServers(sock, servers);
            reply(`🗑️ Server #${id} (${removed.type.toUpperCase()}) deleted.`);
        }
    },

    // ==================== LIST SERVERS ====================
    {
        command: "listservers",
        aliases: ["servers", "cpanels", "panelist"],
        category: "cpanel",
        execute: async (sock, m, { reply, config }) => {
            if (!canManagePanels(m.sender, sock)) return reply("❌ Only the main owner or premium users can view servers.");

            const servers = loadServers(sock);
            if (servers.length === 0) return reply("📋 No servers stored.");

            let text = `📋 *STORED SERVERS (${servers.length})*\n\n`;
            for (const s of servers) {
                text += `🆔 ${s.id}  |  📦 ${s.type.toUpperCase()}  |  🌐 ${s.link}  |  👤 ${s.username}\n`;
            }
            reply(text);
        }
    },

    // ==================== SEND PANEL COMMANDS (3gb, unli, etc.) ====================
    ...(() => {
        const types = ['1gb','2gb','3gb','4gb','5gb','6gb','7gb','8gb','9gb','unli','admin'];
        return types.map(type => ({
            command: type,
            category: "cpanel",
            execute: async (sock, m, { args, reply, config }) => {
                if (!canManagePanels(m.sender, sock)) return reply("❌ Only the main owner or premium users can send panels.");

                if (args.length < 2) return reply(`❌ Usage: .${type} <name> <number>\n\n📌 Example: .${type} Alpha 263786641436`);

                const receiverName = args[0];
                const targetNumber = args[1];

                const servers = loadServers(sock);
                const server = servers.find(s => s.type === type);
                if (!server) return reply(`❌ No ${type.toUpperCase()} panel available. Add one with .addserver ${type} ...`);

                await sendServerToUser(sock, server, receiverName, targetNumber);

                const updated = servers.filter(s => s.id !== server.id);
                saveServers(sock, updated);

                reply(`✅ ${type.toUpperCase()} panel sent to ${targetNumber} for ${receiverName}. Server #${server.id} removed from stock.`);
            }
        }));
    })(),

    // ==================== PREMIUM MANAGEMENT ====================
    {
        command: "addprem",
        aliases: ["addpremium", "setprem"],
        category: "cpanel",
        execute: async (sock, m, { args, reply, config }) => {
            if (!isMainOwner(m.sender)) return reply("❌ Only the main bot owner can manage premium users.");

            if (!args[0]) return reply("❌ Usage: .addprem <phone_number>");

            const number = cleanNumber(args[0]);
            if (number.length < 7) return reply("❌ Invalid number.");

            const premium = loadPremium();
            if (premium.includes(number)) return reply("❌ Already premium.");

            premium.push(number);
            savePremium(premium);
            reply(`👑 Premium granted to +${number}.`);
        }
    },
    {
        command: "delprem",
        aliases: ["delpremium", "unprem"],
        category: "cpanel",
        execute: async (sock, m, { args, reply, config }) => {
            if (!isMainOwner(m.sender)) return reply("❌ Only the main bot owner can manage premium users.");

            if (!args[0]) return reply("❌ Usage: .delprem <phone_number>");

            const number = cleanNumber(args[0]);
            const premium = loadPremium();
            const index = premium.indexOf(number);
            if (index === -1) return reply("❌ Not premium.");

            premium.splice(index, 1);
            savePremium(premium);
            reply(`✅ Premium removed from +${number}.`);
        }
    },
    {
        command: "premiumlist",
        aliases: ["premlist", "listprem"],
        category: "cpanel",
        execute: async (sock, m, { reply, config }) => {
            if (!isMainOwner(m.sender) && !isPremium(m.sender)) return reply("❌ Only owner or premium can view the list.");

            const premium = loadPremium();
            if (premium.length === 0) return reply("📋 No premium users.");

            let text = `👑 *PREMIUM USERS (${premium.length})*\n\n`;
            premium.forEach(num => text += `• +${num}\n`);
            reply(text);
        }
    }
];