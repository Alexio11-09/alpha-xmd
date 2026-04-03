// © 2026 Alpha

module.exports = {
    command: "update",
    owner: true,

    execute: async (sock, m, { reply }) => {
        reply("⚠️ Bot auto-updates from GitHub. No manual update needed.");
    }
};