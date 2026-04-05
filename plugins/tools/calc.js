// © 2026 Alpha - CALCULATOR 🧮

module.exports = {
    command: "calc",
    description: "Calculate math expressions",
    category: "tools",

    execute: async (sock, m, { args, reply }) => {
        try {
            if (!args.length) {
                return reply("🧮 Usage: .calc 2+2");
            }

            const expression = args.join("");

            // 🔒 SAFE CHECK (only allow numbers & math symbols)
            if (!/^[0-9+\-*/().% ]+$/.test(expression)) {
                return reply("❌ Invalid expression");
            }

            // 🧠 CALCULATE
            let result;
            try {
                result = eval(expression);
            } catch {
                return reply("❌ Error calculating expression");
            }

            // ❌ INVALID RESULT
            if (result === undefined || result === null) {
                return reply("❌ Invalid result");
            }

            // ✅ SEND RESULT
            reply(`🧮 ${expression} = ${result}`);

        } catch (err) {
            console.log("Calc error:", err);
            reply("❌ Failed to calculate");
        }
    }
};