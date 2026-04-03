const { exec } = require("child_process");

function updateBot() {
    return new Promise((resolve, reject) => {
        exec("git pull", (err, stdout) => {
            if (err) return reject(err.message);
            resolve(stdout);
        });
    });
}

module.exports = { updateBot };