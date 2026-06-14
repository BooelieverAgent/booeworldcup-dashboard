# Oracle of BOOE - World Cup 2026 Dashboard

AI-powered World Cup predictions sealed on Base blockchain.

## Features

- 🔮 All predictions with on-chain proof links
- 📊 Live accuracy stats
- 📅 Today's matches + upcoming fixtures
- ✅/❌ Results tracker
- ⛓️ Blockchain verification

## Development

```bash
# Export data from bot
npm run export

# Run local server
npm run dev
```

## Deployment

The dashboard is deployed to Netlify. Data is auto-exported when the bot makes predictions.

```bash
# Deploy to Netlify
netlify deploy --prod
```

## Data Flow

1. Oracle bot generates predictions → records on-chain
2. Bot auto-exports to `data.json`
3. Dashboard fetches `data.json` on load
4. Results checked every 2 hours → data updated

## Tech

- Pure HTML/CSS/JS (no framework)
- Netlify hosting (static)
- Base blockchain for proofs

## Links

- [Book of Ethereum](https://bookofethereum.com)
- [Contract on Basescan](https://basescan.org/address/0x1E2B2360164249B9E45D3D0676294FB81DCBD5aF)
- [$BOOE Token](https://dexscreener.com/base/booe)
