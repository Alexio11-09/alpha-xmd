// © 2026 Alpha. All Rights Reserved.

const config = require('../settings/config');

// 🔥 MAIN CHANNEL QUOTE
const channelQuote = {
    key: {
        fromMe: false,
        participant: "0@s.whatsapp.net",
        remoteJid: config.botNumber + "@s.whatsapp.net"
    },
    message: {
        newsletterAdminInviteMessage: {
            newsletterJid: config.newsletter.id + "@newsletter",
            newsletterName: config.newsletter.name,
            caption: config.settings.title,
            inviteExpiration: "0"
        }
    }
};

// 🔥 FUNCTION (dynamic use)
const getChannelQuote = () => {
    return {
        key: {
            fromMe: false,
            participant: "0@s.whatsapp.net",
            remoteJid: config.botNumber + "@s.whatsapp.net"
        },
        message: {
            newsletterAdminInviteMessage: {
                newsletterJid: config.newsletter.id + "@newsletter",
                newsletterName: config.newsletter.name,
                caption: config.settings.title,
                inviteExpiration: "0"
            }
        }
    };
};

module.exports = {
    fquoted: {
        channel: channelQuote
    },
    getChannelQuote
};

// 🔁 AUTO RELOAD
let file = require.resolve(__filename);
require('fs').watchFile(file, () => {
    require('fs').unwatchFile(file);
    console.log('\x1b[0;32m' + __filename + ' updated!\x1b[0m');
    delete require.cache[file];
    require(file);
});