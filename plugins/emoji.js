const animations = {
  happy: ["😊","😄","😁","😆","😂","🤣"],
  heart: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️"],
  angry: ["😠","😡","🤬","😤","💢","🔥"],
  sad: ["😢","😭","😞","😔","😟","🥺"],
  shy: ["😊","😳","👉👈","🫣","🙈"],
  moon: ["🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘"],
  confused: ["🤔","😕","❓","❔","🫤"],
  hot: ["🥵","🔥","🌡️","😰","💦"],
  nikal: ["🚶‍♂️","🏃‍♂️","💨","⬅️","👋"]
};

module.exports = Object.keys(animations).map(name => ({
  command: name,
  category: "anim",
  execute: async (s, m, { reply }) => {
    for (let i = 0; i < animations[name].length; i++) {
      await s.sendMessage(m.chat, { text: animations[name][i] }, { quoted: i === 0 ? m : undefined });
      await new Promise(r => setTimeout(r, 500));
    }
  }
}));
