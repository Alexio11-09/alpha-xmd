// © 2026 Alpha. All Rights Reserved.

const fs = require('fs');
const { tmpdir } = require("os");
const Crypto = require("crypto");
const path = require("path");

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ff = require('fluent-ffmpeg');
const webp = require("node-webpmux");

ff.setFfmpegPath(ffmpegPath);

// 🔥 generate random file
const tmpFile = (ext) => path.join(tmpdir(), `${Crypto.randomBytes(6).toString('hex')}.${ext}`);

// 🔥 CORE EXIF BUILDER (no repetition)
function buildExif(packname, author, categories = [""]) {
    const json = {
        "sticker-pack-id": Crypto.randomBytes(16).toString("hex"),
        "sticker-pack-name": packname,
        "sticker-pack-publisher": author,
        "emojis": categories
    };

    const exifAttr = Buffer.from([
        0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,
        0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,
        0x00,0x00,0x16,0x00,0x00,0x00
    ]);

    const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
    const exif = Buffer.concat([exifAttr, jsonBuff]);

    exif.writeUIntLE(jsonBuff.length, 14, 4);

    return exif;
}

// 🖼️ IMAGE → WEBP
async function imageToWebp(media) {
    const input = tmpFile("jpg");
    const output = tmpFile("webp");

    try {
        fs.writeFileSync(input, media);

        await new Promise((resolve, reject) => {
            ff(input)
                .on("error", reject)
                .on("end", resolve)
                .addOutputOptions([
                    "-vcodec","libwebp",
                    "-vf","scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0"
                ])
                .toFormat("webp")
                .save(output);
        });

        return fs.readFileSync(output);

    } catch (err) {
        console.log("❌ imageToWebp error:", err.message);
        throw err;

    } finally {
        if (fs.existsSync(input)) fs.unlinkSync(input);
        if (fs.existsSync(output)) fs.unlinkSync(output);
    }
}

// 🎥 VIDEO → WEBP
async function videoToWebp(media) {
    const input = tmpFile("mp4");
    const output = tmpFile("webp");

    try {
        fs.writeFileSync(input, media);

        await new Promise((resolve, reject) => {
            ff(input)
                .on("error", reject)
                .on("end", resolve)
                .addOutputOptions([
                    "-vcodec","libwebp",
                    "-vf","scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0",
                    "-loop","0","-ss","00:00:00","-t","00:00:05","-an"
                ])
                .toFormat("webp")
                .save(output);
        });

        return fs.readFileSync(output);

    } catch (err) {
        console.log("❌ videoToWebp error:", err.message);
        throw err;

    } finally {
        if (fs.existsSync(input)) fs.unlinkSync(input);
        if (fs.existsSync(output)) fs.unlinkSync(output);
    }
}

// 🏷️ APPLY EXIF
async function addExif(webpBuffer, packname, author, categories = [""]) {
    try {
        const img = new webp.Image();
        const exif = buildExif(packname, author, categories);

        await img.load(webpBuffer);
        img.exif = exif;

        return await img.save(null);

    } catch (err) {
        console.log("❌ addExif error:", err.message);
        throw err;
    }
}

// 🔥 AUTO HANDLER (image/video/webp)
async function writeExif(media, metadata) {
    try {
        let webpData;

        if (/webp/.test(media.mimetype)) {
            webpData = media.data;
        } else if (/image/.test(media.mimetype)) {
            webpData = await imageToWebp(media.data);
        } else if (/video/.test(media.mimetype)) {
            webpData = await videoToWebp(media.data);
        } else {
            throw new Error("Unsupported media type");
        }

        return await addExif(
            webpData,
            metadata.packname,
            metadata.author,
            metadata.categories
        );

    } catch (err) {
        console.log("❌ writeExif error:", err.message);
        throw err;
    }
}

module.exports = {
    imageToWebp,
    videoToWebp,
    writeExif,
    addExif
};