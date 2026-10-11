// Real output of `npm run agent -- --auto` against the local demo (see README.md).
window.AGENT = {
 "lines": [
  {
   "t": 0.0,
   "text": "x402 agent buyer · 9qfbTdjmhm3mecXx55W8D88hGvYkz7iRgkmzJTousWp3"
  },
  {
   "t": 0.0,
   "text": ""
  },
  {
   "t": 0.01,
   "text": "🤖 agent  I'm localizing a travel app for Nepal and need a human-quality Nepali translation."
  },
  {
   "t": 0.01,
   "text": "🤖 agent  Topping up my demo wallet from the faucet…"
  },
  {
   "t": 0.63,
   "text": "🤖 agent  POST http://127.0.0.1:3000/api/x402/tasks (no payment)"
  },
  {
   "t": 0.64,
   "text": "🐒 wukong 402 Payment Required: Escrow 25 USDC for \"Nepali welcome note for homestay app\" on Wukong"
  },
  {
   "t": 0.64,
   "text": "           scheme=exact network=solana-localnet amount=25000000 asset=7i8oJ4bW… payTo=EzTmidKR…"
  },
  {
   "t": 0.66,
   "text": "🤖 agent  Signed a 25 USDC transfer. Retrying with X-PAYMENT…"
  },
  {
   "t": 1.53,
   "text": "🐒 wukong 201 Created · payment settled 5txx3esVZfAJruZo…"
  },
  {
   "t": 1.53,
   "text": "🐒 wukong Escrow locked on-chain 24NDR9ydcF8hJy6a…"
  },
  {
   "t": 1.53,
   "text": "🐒 wukong Task is live: http://localhost:3000/tasks/AijCBZbFLrqZ9ubpN5PdVbKEwRLVsqSYXjvioMKJhZBo"
  }
 ],
 "result": [
  {
   "t": 40.48,
   "text": "🤖 agent  Got my result. Winner scored 86.7 and was paid 22.5 USDC:"
  },
  {
   "t": 40.49,
   "text": "🤖 agent  Judge: A faithful, warm Nepali rendering of the welcome note that preserves every sentence, time and the allergy request, with only minor decorative additions."
  }
 ]
};
