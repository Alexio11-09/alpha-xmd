// © 2026 Alpha

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
            const basePath = path.join(__dirname, "../../");

            // download zip
            const res = await axios.get(url, { responseType: "arraybuffer" });
            fs.writeFileSync(zipPath, res.data);

            // extract
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(extractPath, true);

            const folder = fs.readdirSync(extractPath)[0];
            const newFiles = path.join(extractPath, folder);

            // 🔥 SAFE COPY (won't break sessions/node_modules)
            const copy = (src, dest) => {
                if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

                for (let file of fs.readdirSync(src)) {
                    // ❌ skip dangerous folders
                    if (["node_modules", "sessions", "session", ".git"].includes(file)) continue;

                    const s = path.join(src, file);
                    const d = path.join(dest, file);

                    if (fs.lstatSync(s).isDirectory()) {
                        copy(s, d);
                    } else {
                        fs.copyFileSync(s, d);
                    }
                }
            };

            copy(newFiles, basePath);

            // cleanup
            fs.rmSync(zipPath, { force: true });
            fs.rmSync(extractPath, { recursive: true, force: true });

            reply("✅ Update complete!\n♻️ Restarting...");

            // restart (pterodactyl safe)
            setTimeout(() => {
                process.exit(0);
            }, 1500);

        } catch (err) {
            console.log("Update error:", err);
            reply("❌ Update failed:\n" + err.message);
        }
    }
};