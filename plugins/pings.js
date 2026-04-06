module.exports = {
    command: "ping",

    execute: async (sock, m, { reply }) => {
        reply("🏓 Pong!");
    }
};