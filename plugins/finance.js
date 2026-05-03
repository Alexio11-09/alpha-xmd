const axios = require('axios');

module.exports = [
  {
    command: "currencylist", aliases: ["currencies"], category: "finance",
    execute: async (s, m, { reply }) => {
      try {
        const res = await axios.get('https://open.er-api.com/v6/latest/USD');
        const rates = Object.keys(res.data.rates);
        reply(`💱 *Supported Currencies (top 30):*\n\n${rates.slice(0,30).join(', ')}`);
      } catch { reply("❌ Failed to fetch currencies."); }
    }
  },
  {
    command: "rates", category: "finance",
    execute: async (s, m, { args, reply }) => {
      const base = (args[0] || 'USD').toUpperCase();
      try {
        const res = await axios.get(`https://open.er-api.com/v6/latest/${base}`);
        const rates = res.data.rates;
        const top = ['EUR','GBP','JPY','CNY','INR','ZAR','NGN','KES'];
        let msg = `📊 *Exchange Rates for ${base}*\n\n`;
        for (const cur of top) if (rates[cur]) msg += `💱 ${cur}: ${rates[cur].toFixed(4)}\n`;
        reply(msg);
      } catch { reply("❌ Failed to fetch rates."); }
    }
  },
  {
    command: "exchange", aliases: ["convert"], category: "finance",
    execute: async (s, m, { args, reply }) => {
      if (args.length < 3) return reply("❌ .exchange <amount> <from> <to>\nExample: .exchange 100 USD ZWL");
      const amount = parseFloat(args[0]);
      const from = args[1].toUpperCase();
      const to = args[2].toUpperCase();
      if (isNaN(amount)) return reply("❌ Invalid amount.");
      try {
        const res = await axios.get(`https://open.er-api.com/v6/latest/${from}`);
        const rate = res.data.rates[to];
        if (!rate) return reply("❌ Currency not found.");
        const result = (amount * rate).toFixed(2);
        reply(`💱 ${amount} ${from} = ${result} ${to}\n\n📊 Rate: 1 ${from} = ${rate} ${to}`);
      } catch { reply("❌ Failed to fetch exchange rate."); }
    }
  },
  {
    command: "forex", category: "finance",
    execute: async (s, m, { reply }) => {
      reply("💹 Forex commands:\n\n.exchange <amount> <from> <to>\n.rates [base_currency]\n.currencylist");
    }
  }
];
