// © 2026 Alpha

const { exec } = require("child_process");

function updateBot() {
    return new Promise((resolve, reject) => {
        exec("git pull origin main", (err, stdout, stderr) => {
            if (err) return reject(stderr || err.message);
            resolve(stdout);
        });
    });
}

module.exports = { updateBot };