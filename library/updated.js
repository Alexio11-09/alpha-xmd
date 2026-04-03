const axios = require("axios");

let currentVersion = null;

async function checkUpdate() {
    try {
        const res = await axios.get("https://api.github.com/repos/Alexio11-09/alpha-xmd/commits/main");
        const latest = res.data.sha;

        if (!currentVersion) {
            currentVersion = latest;
            return;
        }

        if (latest !== currentVersion) {
            console.log("🔥 New update detected! Restarting...");
            process.exit(0);
        }

    } catch (e) {
        console.log("Update check failed");
    }
}

module.exports = { checkUpdate };