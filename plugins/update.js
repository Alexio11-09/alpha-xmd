const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');

module.exports = {
    command: "update",
    category: "owner",
    owner: true,

    execute: async (sock, m, { reply }) => {
        try {
            reply("🔄 Updating bot...");

            const url = "https://github.com/Alexio11-09/alpha-xmd/archive/refs/heads/main.zip";
            const zipPath = path.join(__dirname, "../../update.zip");
            const extractPath = path.join(__dirname, "../../update");

            const res = await axios.get(url, { responseType: "arraybuffer" });
            fs.writeFileSync(zipPath, res.data);

            const zip = new AdmZip(zipPath);
            zip.extractAllTo(extractPath, true);

            const folder = fs.readdirSync(extractPath)[0];
            const newFiles = path.join(extractPath, folder);

            const copy = (src, dest) => {
                if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

                for (let file of fs.readdirSync(src)) {
                    const s = path.join(src, file);
                    const d = path.join(dest, file);

                    if (fs.lstatSync(s).isDirectory()) copy(s, d);
                    else fs.copyFileSync(s, d);
                }
            };

            copy(newFiles, path.join(__dirname, "../../"));

            fs.rmSync(zipPath, { force: true });
            fs.rmSync(extractPath, { recursive: true, force: true });

            reply("✅ Updated! Restarting...");
            process.exit(0);

        } catch (err) {
            reply("❌ Update failed: " + err.message);
        }
    }
};