// © 2026 Alpha

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');

async function updateBot() {
    try {
        const url = "https://github.com/Alexio11-09/alpha-xmd/archive/refs/heads/main.zip";

        const zipPath = path.join(__dirname, "../update.zip");
        const extractPath = path.join(__dirname, "../update");

        console.log("📥 Downloading update...");

        // 📥 DOWNLOAD ZIP
        const res = await axios.get(url, { 
            responseType: "arraybuffer",
            timeout: 20000
        });

        fs.writeFileSync(zipPath, res.data);

        console.log("📦 Extracting update...");

        // 📦 EXTRACT
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        const folder = fs.readdirSync(extractPath)[0];
        const newFiles = path.join(extractPath, folder);

        console.log("🔁 Updating files...");

        // 🔁 COPY FILES
        const