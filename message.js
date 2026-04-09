// © 2026 Alpha - FINAL MESSAGE HANDLER (PUBLIC + BRANDING 💯)

const fs = require("fs");
const path = require("path");
const config = require("./settings/config");

// 🔥 LOAD COMMANDS
const commands = [];

const loadCommands = (dir) => {
    if (!fs.existsSync(dir)) {
        console.log(`❌ Directory not found: ${dir}`);
        return;
    }
    const files = fs.readdirSync(dir);

    for (let file of files) {
        const fullPath = path.join(dir, file);

        if (fs.lstatSync(fullPath).isDirectory()) {
            loadCommands(fullPath);
        } else if (file.endsWith(".js")) {
            try {
                delete require.cache[require.resolve(fullPath)];
                const cmd = require(fullPath);

                if (Array.isArray(cmd)) {
                    commands.push(...cmd);
                    console.log(`   ✅ Loaded ${cmd.length} commands from ${file}`);
                } else if (cmd.command) {
                    commands.push(cmd);
                    console.log(`   ✅ Loaded command: ${cmd.command}`);
                }

            } catch (err) {
                console.log(`   ❌ Failed to load ${file}:`, err.message);
            }
        }
    }
};

loadCommands(path.join(__dirname, "plugins"));
console.log(`📦 Total commands loaded: ${commands.length}`);
console.log(`📋 Commands: ${commands.map(c => c.command).join(', ')}`);

// 🔥 CLEAN NUMBER
const clean = (jid) => {
    if (!jid) return "";
    try {
        return jid.toString().replace(/[^0-9]/g, "");
    } catch {
        return "";
    }
};

// 🔥 CHECK IF USER IS BANNED
const isUserBanned = (sender) => {
    try {
        const banPath = './database/banned.json';
        if (!fs.existsSync(banPath)) return false;
        const banned = JSON.parse(fs.readFileSync(banPath));
        const senderNum = clean(sender);
        return banned[senderNum] ? true : false;
    } catch {
        return false;
    }
};

// 🔥 CHECK IF USER IS TEMP OWNER
const isTempOwner = (sender) => {
    try {
        const ownerPath = './database/owners.json';
        if (!fs.existsSync(ownerPath)) return false;
        const owners = JSON.parse(fs.readFileSync(ownerPath));
        const senderNum = clean(sender);
        return owners.tempOwners && owners.tempOwners.includes(senderNum);
    } catch {
        return false;
    }
};

module.exports = async (sock, m) => {
    try {
        // 🔥 CHANNEL BRANDING (NEWSLETTER STYLE)
        const contextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.newsletter.id + "@newsletter",
                newsletterName: config.newsletter.name
            }
        };

        // 🔥 HELPER WITH BRANDING
        const reply = (text) => {
            try {
                return sock.sendMessage(m.chat, { text, contextInfo }, { quoted: m });
            } catch {
                return sock.sendMessage(m.chat, { text }, { quoted: m });
            }
        };

        const send = (data) => {
            try {
                return sock.sendMessage(m.chat, { ...data, contextInfo }, { quoted: m });
            } catch {
                return sock.sendMessage(m.chat, data, { quoted: m });
            }
        };

        // ========== GAME RESPONSE HANDLER ==========
        if (m.text && !m.text.startsWith(config.prefix || ".")) {
            
            // TicTacToe Move
            const tttGame = Object.values(games.tictactoe).find(g => 
                g.active && (g.turn === m.sender) && (g.chatId === m.chat)
            );
            
            if (tttGame && /^[1-9]$/.test(m.text)) {
                const pos = parseInt(m.text) - 1;
                
                if (tttGame.board[pos] !== "❌" && tttGame.board[pos] !== "⭕") {
                    const symbol = tttGame.turn === tttGame.challenger ? "❌" : "⭕";
                    tttGame.board[pos] = symbol;
                    tttGame.moves++;
                    
                    const winPatterns = [
                        [0,1,2], [3,4,5], [6,7,8],
                        [0,3,6], [1,4,7], [2,5,8],
                        [0,4,8], [2,4,6]
                    ];
                    
                    let winner = null;
                    for (let pattern of winPatterns) {
                        const [a,b,c] = pattern;
                        if (tttGame.board[a] !== `${a+1}️⃣` && 
                            tttGame.board[a] === tttGame.board[b] && 
                            tttGame.board[b] === tttGame.board[c]) {
                            winner = tttGame.turn;
                            break;
                        }
                    }
                    
                    if (winner) {
                        let text = `🎮 *TIC TAC TOE*\n\n`;
                        text += `❌ @${tttGame.challenger.split("@")[0]} vs ⭕ @${tttGame.opponent.split("@")[0]}\n\n`;
                        text += `${tttGame.board[0]} │ ${tttGame.board[1]} │ ${tttGame.board[2]}\n`;
                        text += `──┼───┼──\n`;
                        text += `${tttGame.board[3]} │ ${tttGame.board[4]} │ ${tttGame.board[5]}\n`;
                        text += `──┼───┼──\n`;
                        text += `${tttGame.board[6]} │ ${tttGame.board[7]} │ ${tttGame.board[8]}\n\n`;
                        text += `🏆 @${winner.split("@")[0]} WINS! 🎉`;
                        
                        await sock.sendMessage(m.chat, {
                            text: text,
                            mentions: [tttGame.challenger, tttGame.opponent, winner]
                        });
                        delete games.tictactoe[tttGame.gameId];
                        return;
                    }
                    
                    if (tttGame.moves === 9) {
                        let text = `🎮 *TIC TAC TOE*\n\n`;
                        text += `${tttGame.board[0]} │ ${tttGame.board[1]} │ ${tttGame.board[2]}\n`;
                        text += `──┼───┼──\n`;
                        text += `${tttGame.board[3]} │ ${tttGame.board[4]} │ ${tttGame.board[5]}\n`;
                        text += `──┼───┼──\n`;
                        text += `${tttGame.board[6]} │ ${tttGame.board[7]} │ ${tttGame.board[8]}\n\n`;
                        text += `🤝 IT'S A DRAW!`;
                        
                        await sock.sendMessage(m.chat, { text: text });
                        delete games.tictactoe[tttGame.gameId];
                        return;
                    }
                    
                    tttGame.turn = tttGame.turn === tttGame.challenger ? tttGame.opponent : tttGame.challenger;
                    
                    let text = `🎮 *TIC TAC TOE*\n\n`;
                    text += `❌ @${tttGame.challenger.split("@")[0]} vs ⭕ @${tttGame.opponent.split("@")[0]}\n\n`;
                    text += `${tttGame.board[0]} │ ${tttGame.board[1]} │ ${tttGame.board[2]}\n`;
                    text += `──┼───┼──\n`;
                    text += `${tttGame.board[3]} │ ${tttGame.board[4]} │ ${tttGame.board[5]}\n`;
                    text += `──┼───┼──\n`;
                    text += `${tttGame.board[6]} │ ${tttGame.board[7]} │ ${tttGame.board[8]}\n\n`;
                    text += `🎯 @${tttGame.turn.split("@")[0]}'s turn`;
                    
                    await sock.sendMessage(m.chat, {
                        text: text,
                        mentions: [tttGame.challenger, tttGame.opponent, tttGame.turn]
                    });
                }
                return;
            }
            
            // Guess Game
            if (games.guess[m.chat]?.active) {
                const guess = parseInt(m.text);
                const game = games.guess[m.chat];
                
                if (isNaN(guess)) return;
                
                if (guess === game.number) {
                    reply(`🎉 CORRECT! The number was ${game.number}!\n🏆 You win!`);
                    game.active = false;
                } else {
                    game.attempts++;
                    if (game.attempts >= game.maxAttempts) {
                        reply(`❌ Game Over! The number was ${game.number}.`);
                        game.active = false;
                    } else {
                        const hint = guess < game.number ? "HIGHER 📈" : "LOWER 📉";
                        reply(`${hint}\n📊 Attempts: ${game.attempts}/${game.maxAttempts}`);
                    }
                }
                return;
            }
            
            // Quiz Game
            if (games.quiz[m.chat]?.active) {
                const game = games.quiz[m.chat];
                if (m.text.toLowerCase() === game.answer.toLowerCase()) {
                    reply("✅ CORRECT! You win! 🎉");
                    game.active = false;
                } else {
                    reply("❌ Wrong answer, try again!");
                }
                return;
            }
            
            // Riddle Game
            if (games.riddle[m.chat]?.active) {
                const game = games.riddle[m.chat];
                if (m.text.toLowerCase().includes(game.answer.toLowerCase())) {
                    reply(`🎉 CORRECT! The answer is "${game.answer}"!\n🏆 You solved the riddle!`);
                    game.active = false;
                }
                return;
            }
        }

        // ========== COMMAND HANDLER ==========
        if (!m.text) return;

        const prefix = config.prefix || ".";
        if (!m.text.startsWith(prefix)) return;

        const args = m.text.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = commands.find(cmd => cmd.command === commandName || (cmd.aliases && cmd.aliases.includes(commandName)));
        if (!command) return;

        // 🔥 OWNER SYSTEM
        const botNumber = clean(sock.user.id);
        const senderNumber = clean(m.sender);

        const isMainOwner = config.owner.includes(senderNumber) || senderNumber === botNumber;
        const isTempOwner = isTempOwner(m.sender);
        const isOwner = isMainOwner || isTempOwner;

        // 🔥 BAN CHECK (Skip for unbanuser command)
        if (commandName !== 'unbanuser' && commandName !== 'unban' && isUserBanned(m.sender) && !isOwner) {
            return reply("🚫 *You are banned from using this bot!*\n\nContact the owner to appeal.");
        }

        // ✅ CONTEXT WITH BRANDING
        const context = {
            args,
            reply,
            send,
            isOwner,
            isMainOwner,
            isTempOwner,
            isGroup: m.isGroup,
            isAdmin: m.isAdmin,
            isBotAdmin: m.isBotAdmin,
            config,
            prefix,
            games
        };

        // 🔒 OWNER ONLY
        if (command.owner && !isOwner) {
            return reply(config.message.owner || "❌ Owner only!");
        }

        // 🔒 GROUP ONLY
        if (command.group && !m.isGroup) {
            return reply(config.message.group || "❌ Group only!");
        }

        // 🔒 ADMIN ONLY
        if (command.admin && !m.isAdmin) {
            return reply(config.message.admin || "❌ Admin only!");
        }

        // 🔒 BOT ADMIN REQUIRED
        if (command.botAdmin && !m.isBotAdmin) {
            return reply("❌ Bot needs admin rights.");
        }

        // 🚀 EXECUTE
        await command.execute(sock, m, context);

    } catch (err) {
        console.log("🔥 MESSAGE ERROR:", err);
        try {
            await sock.sendMessage(m.chat, { text: "❌ Error occurred" }, { quoted: m });
        } catch {}
    }
};

// 🔥 GAME STORAGE
const games = {
    tictactoe: {},
    guess: {},
    quiz: {},
    riddle: {}
};

module.exports.games = games;