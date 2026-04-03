// © 2026 Alpha. All Rights Reserved.

const chalk = require("chalk");
const config = require("../../settings/config");

module.exports = {
    konek: async ({ sock, update, clientstart, DisconnectReason, Boom }) => {
        try {
            const { connection, lastDisconnect } = update;

            // 🔄 CONNECTING
            if (connection === "connecting") {
                console.log(chalk.yellow("🔄 Connecting to WhatsApp..."));
            }

            // ✅ CONNECTED
            if (connection === "open") {
                console.log(chalk.green("✅ Successfully connected to bot"));

                const ownerJid = config.owner + "@s.whatsapp.net";

                await sock.sendMessage(ownerJid, {
                    text:
                        `👑 *${config.settings.title}*\n\n` +
                        `✅ Bot is now ONLINE!\n\n` +
                        `⚙️ Mode: ${sock.public ? "Public" : "Self"}\n` +
                        `📢 Channel: https://whatsapp.com/channel/${config.newsletter.id}\n\n` +
                        `> ${config.settings.footer}`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.newsletter.id + "@newsletter",
                            newsletterName: config.newsletter.name
                        },
                        externalAdReply: {
                            title: config.settings.title,
                            body: config.settings.description,
                            thumbnailUrl: config.thumbUrl,
                            sourceUrl: "https://whatsapp.com/channel/" + config.newsletter.id,
                            mediaType: 1
                        }
                    }
                }).catch(() => {});
            }

            // ❌ DISCONNECTED
            if (connection === "close") {
                let reason = new Boom(lastDisconnect?.error)?.output.statusCode;

                console.log(chalk.red(`❌ Disconnected: ${reason}`));

                switch (reason) {

                    case DisconnectReason.badSession:
                        console.log(chalk.red("🚫 Bad session. Delete session & scan again."));
                        process.exit();
                        break;

                    case DisconnectReason.connectionClosed:
                    case DisconnectReason.connectionLost:
                    case DisconnectReason.timedOut:
                        console.log(chalk.yellow("🔄 Reconnecting..."));
                        clientstart();
                        break;

                    case DisconnectReason.connectionReplaced:
                        console.log(chalk.red("⚠️ Session replaced. Restart bot."));
                        process.exit();
                        break;

                    case DisconnectReason.loggedOut:
                        console.log(chalk.red("🚫 Logged out. Delete session & scan again."));
                        process.exit();
                        break;

                    case DisconnectReason.restartRequired:
                        console.log(chalk.blue("♻️ Restart required..."));
                        clientstart();
                        break;

                    default:
                        console.log(chalk.red(`❓ Unknown reason: ${reason}`));
                        clientstart();
                        break;
                }
            }

        } catch (err) {
            console.log("❌ Connection Error:", err);
        }
    }
};