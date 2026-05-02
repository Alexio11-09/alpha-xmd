// © 2026 Alpha - EXIF BUILDER (TERMUX SAFE, NO node-webpmux)
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const tmpDir = os.tmpdir();
const makeTmp = (ext) => path.join(tmpDir, `${crypto.randomBytes(6).toString('hex')}.${ext}`);

async function bufferToWebp(mediaBuffer, isVideo) {
    const input = makeTmp(isVideo ? 'mp4' : 'jpg');
    const output = makeTmp('webp');
    fs.writeFileSync(input, mediaBuffer);

    await new Promise((resolve, reject) => {
        const ff = ffmpeg(input);
        if (isVideo) {
            ff.addOutputOptions([
                "-vcodec", "libwebp",
                "-vf", "scale='min(320,iw)':'min(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0",
                "-loop", "0", "-ss", "00:00:00", "-t", "00:00:05", "-an"
            ]);
        } else {
            ff.addOutputOptions([
                "-vcodec", "libwebp",
                "-vf", "scale='min(320,iw)':'min(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0"
            ]);
        }
        ff.toFormat("webp").on("error", reject).on("end", resolve).save(output);
    });

    const webpBuf = fs.readFileSync(output);
    try { fs.unlinkSync(input); } catch {}
    try { fs.unlinkSync(output); } catch {}
    return webpBuf;
}

async function writeExif(media, metadata) {
    const isVideo = /video/.test(media.mimetype);
    return await bufferToWebp(media.data, isVideo);
}

module.exports = { writeExif };