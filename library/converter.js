// © 2026 Alpha. All Rights Reserved.
// respect the work, don’t just copy-paste.

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const tmpDir = path.join(__dirname, '../tmp');

// 🔥 ensure tmp folder exists
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
}

// ⏱️ timeout protection
const runWithTimeout = (proc, timeout = 20000) => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            proc.kill();
            reject(new Error("FFmpeg timeout"));
        }, timeout);

        proc.on('close', (code) => {
            clearTimeout(timer);
            resolve(code);
        });

        proc.on('error', (err) => {
            clearTimeout(timer);
            reject(err);
        });
    });
};

async function ffmpeg(buffer, args = [], ext = '', outExt = '') {
    let input = null;
    let output = null;

    try {
        const id = Date.now() + "_" + Math.floor(Math.random() * 1000);

        input = path.join(tmpDir, `${id}.${ext}`);
        output = path.join(tmpDir, `${id}.${outExt}`);

        await fs.promises.writeFile(input, buffer);

        const proc = spawn("ffmpeg", [
            '-y',
            '-i', input,
            ...args,
            output
        ]);

        const code = await runWithTimeout(proc);

        if (code !== 0) {
            throw new Error("FFmpeg conversion failed");
        }

        const result = await fs.promises.readFile(output);
        return result;

    } catch (err) {
        console.log("❌ Converter error:", err.message);
        throw err;

    } finally {
        // 🧹 cleanup
        if (input && fs.existsSync(input)) fs.unlinkSync(input);
        if (output && fs.existsSync(output)) fs.unlinkSync(output);
    }
}

// 🎧 convert to mp3
function toAudio(buffer, ext) {
    return ffmpeg(buffer, [
        '-vn',
        '-ac', '2',
        '-b:a', '128k',
        '-ar', '44100',
        '-f', 'mp3'
    ], ext, 'mp3');
}

// 🎤 convert to voice note (PTT)
function toPTT(buffer, ext) {
    return ffmpeg(buffer, [
        '-vn',
        '-c:a', 'libopus',
        '-b:a', '128k',
        '-vbr', 'on',
        '-compression_level', '10'
    ], ext, 'opus');
}

// 🎥 convert to mp4 video
function toVideo(buffer, ext) {
    return ffmpeg(buffer, [
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ar', '44100',
        '-crf', '32',
        '-preset', 'slow'
    ], ext, 'mp4');
}

module.exports = {
    ffmpeg,
    toAudio,
    toPTT,
    toVideo
};