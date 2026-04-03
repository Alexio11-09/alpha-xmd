// © 2026 Alpha. All Rights Reserved.

const FormData = require("form-data");
const fetch = require("node-fetch");

// 🔥 TMPFILES UPLOADER
async function uploadTmpFiles(buffer, filename = "file") {
    try {
        const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

        const form = new FormData();
        form.append("file", buf, { filename });

        const res = await fetch("https://tmpfiles.org/api/v1/upload", {
            method: "POST",
            body: form,
            headers: form.getHeaders()
        });

        const json = await res.json();

        if (!json?.data?.url) throw new Error("Upload failed");

        const match = json.data.url.match(/\/(\d+)\//);
        if (!match) throw new Error("Invalid response");

        const id = match[1];
        return `https://tmpfiles.org/dl/${id}/${filename}`;

    } catch (err) {
        console.log("❌ TmpFiles upload error:", err.message);
        return null;
    }
}

// 🔥 CATBOX FALLBACK (VERY IMPORTANT 🔥)
async function uploadCatbox(buffer, filename = "file") {
    try {
        const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("fileToUpload", buf, filename);

        const res = await fetch("https://catbox.moe/user/api.php", {
            method: "POST",
            body: form
        });

        const text = await res.text();

        if (!text.startsWith("https://")) throw new Error("Catbox failed");

        return text.trim();

    } catch (err) {
        console.log("❌ Catbox upload error:", err.message);
        return null;
    }
}

// 🔥 MAIN EXPORT (AUTO FALLBACK)
async function tempfiles(buffer, filename = "file") {
    let url = await uploadTmpFiles(buffer, filename);

    if (!url) {
        console.log("⚠️ Switching to Catbox...");
        url = await uploadCatbox(buffer, filename);
    }

    return url;
}

module.exports = { tempfiles, uploadTmpFiles, uploadCatbox };