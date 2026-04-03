// © 2026 Alpha. All Rights Reserved.
// respect the work, don’t just copy-paste.

const config = require('../settings/config');
const fetch = require('node-fetch');

// ⏱️ timeout helper
const fetchWithTimeout = async (url, options = {}, timeout = 15000) => {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), timeout)
        )
    ]);
};

const Api = {

    // 🔥 GET REQUEST
    get: async (endpoint, params = {}) => {
        try {
            // 🔑 auto inject API key
            params.apikey = config.api.apikey;

            const query = new URLSearchParams(params).toString();
            const url = `${config.api.baseurl}${endpoint}?${query}`;

            const res = await fetchWithTimeout(url);

            if (!res.ok) {
                console.log(`❌ API GET Error: ${res.status} ${res.statusText}`);
                return null;
            }

            const data = await res.json();

            if (!data) {
                console.log("⚠️ Empty API response");
                return null;
            }

            return data;

        } catch (err) {
            console.log("❌ API GET Failed:", err.message);
            return null;
        }
    },

    // 🔥 POST REQUEST
    post: async (endpoint, body = {}) => {
        try {
            // 🔑 auto inject API key
            body.apikey = config.api.apikey;

            const url = `${config.api.baseurl}${endpoint}`;

            const res = await fetchWithTimeout(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                console.log(`❌ API POST Error: ${res.status} ${res.statusText}`);
                return null;
            }

            const data = await res.json();

            if (!data) {
                console.log("⚠️ Empty API response");
                return null;
            }

            return data;

        } catch (err) {
            console.log("❌ API POST Failed:", err.message);
            return null;
        }
    }
};

module.exports = Api;