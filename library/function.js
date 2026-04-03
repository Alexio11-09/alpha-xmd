// © 2026 Alpha. All Rights Reserved.

const axios = require('axios');
const moment = require('moment-timezone');
const { sizeFormatter } = require('human-readable');
const util = require('util');
const Jimp = require('jimp');

const unixTimestampSeconds = (date = new Date()) => Math.floor(date.getTime() / 1000);

// 🖼️ Resize Image
const resize = async (image, width, height) => {
    const img = await Jimp.read(image);
    return await img.resize(width, height).getBufferAsync(Jimp.MIME_JPEG);
};

// ⏱ Runtime
const runtime = (seconds) => {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
};

// 🕒 Time (Zimbabwe 🇿🇼)
const getTime = (format, date) => {
    return date
        ? moment(date).tz('Africa/Harare').format(format)
        : moment().tz('Africa/Harare').format(format);
};

// 📅 Date Format
const formatDate = (date) => {
    return moment(date).tz('Africa/Harare').format("dddd, DD MMMM YYYY HH:mm:ss");
};

// 🎲 Random
const getRandom = (ext) => `${Math.floor(Math.random() * 10000)}${ext}`;

// 🌍 Get Buffer
const getBuffer = async (url, options = {}) => {
    try {
        const res = await axios({
            method: "GET",
            url,
            responseType: "arraybuffer",
            timeout: 15000,
            ...options
        });
        return res.data;
    } catch (err) {
        console.log("❌ getBuffer error:", err.message);
        return null;
    }
};

// 🌐 Fetch JSON
const fetchJson = async (url, options = {}) => {
    try {
        const res = await axios({
            method: "GET",
            url,
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0'
            },
            ...options
        });
        return res.data;
    } catch (err) {
        console.log("❌ fetchJson error:", err.message);
        return null;
    }
};

// 📦 Size Format
const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatp = sizeFormatter({
    std: 'JEDEC',
    decimalPlaces: 2,
    keepTrailingZeroes: false,
    render: (literal, symbol) => `${literal} ${symbol}B`,
});

// 😴 Sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 🔗 URL checker
const isUrl = (url) => {
    return /^https?:\/\/.+/i.test(url);
};

// 🧾 JSON format
const jsonformat = (string) => JSON.stringify(string, null, 2);

// 🧠 Format text
const format = (...args) => util.format(...args);

// 👥 Mentions
const parseMention = (text = '') => {
    return [...text.matchAll(/@(\d{5,16})/g)].map(v => v[1] + '@s.whatsapp.net');
};

// 👑 Group Admins
const getGroupAdmins = (participants) => {
    return participants
        .filter(p => p.admin)
        .map(p => p.id);
};

// 🖼️ Profile Picture Generator
const generateProfilePicture = async (buffer) => {
    const image = await Jimp.read(buffer);
    const cropped = image.crop(0, 0, image.getWidth(), image.getHeight());

    return {
        img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
        preview: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG)
    };
};

// ⏱ Fetch with timeout
const fetchWithTimeout = async (url, ms = 15000) => {
    try {
        const res = await axios.get(url, { timeout: ms });
        return res;
    } catch (err) {
        console.log("❌ fetch timeout:", err.message);
        throw err;
    }
};

module.exports = {
    unixTimestampSeconds,
    resize,
    runtime,
    getTime,
    formatDate,
    getRandom,
    getBuffer,
    fetchJson,
    formatSize,
    formatp,
    sleep,
    isUrl,
    jsonformat,
    format,
    parseMention,
    getGroupAdmins,
    generateProfilePicture,
    fetchWithTimeout
};