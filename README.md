# Receipt Detective

Receipt Detective is an Apps in Toss mini app that lets users answer a short spending quiz, receive a detective-style spending result, watch rewarded ads, earn detective coins, and request Toss Point rewards when eligible.

## Main Features

- 3-question spending quiz
- Deterministic spending case result
- Free and rewarded clue cards
- Rewarded ad placements for detective coins, check-in rewards, and daily mission rewards
- Banner ad slot using the Apps in Toss web framework TossAds SDK
- Server-side callback scaffold for Toss disconnect events
- Reward ledger scaffold for duplicate reward prevention

## Local Development

```powershell
npm install
npm run dev
```

Open the local web preview at:

```text
http://localhost:5173
```

## Verification

```powershell
npm test
npm run typecheck
npm run build
```

## Toss Console Notes

After deploying a backend, use this disconnect callback URL:

```text
https://YOUR_DOMAIN/api/toss/disconnect
```

Recommended console values:

```text
HTTP method: POST
Basic Auth header: Authorization: Basic <your-base64-username-password>
```

See `docs/receipt-detective-toss-callback.md` for setup details.

## Environment

Copy `.env.example` to `.env` when using real console values.

Do not commit `.env`.
