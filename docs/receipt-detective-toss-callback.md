# Receipt Detective Toss Callback Setup

## Disconnect Callback URL

Enter this URL in the Apps in Toss console after deploying the backend:

```text
https://YOUR_DOMAIN/api/toss/disconnect
```

Examples:

```text
https://receipt-detective.example.com/api/toss/disconnect
https://your-vercel-project.vercel.app/api/toss/disconnect
```

Do not enter a localhost URL. Toss must be able to call the URL from the public internet over HTTPS.

## What The Callback Does

When a user disconnects Receipt Detective, Toss can send a POST request to the callback URL. The handler accepts one of these identifiers, in this priority order:

1. `ci`
2. `userKey`
3. `appUserId`
4. `connectionId`

The handler marks that identifier as disconnected so future rewards can be blocked for that user.

## Duplicate Reward Protection

The server reward ledger records rewards by this key:

```text
userId + rewardType + rewardDate
```

This prevents the same user from receiving the same daily reward twice. Different reward types on the same day are still allowed.

## Production Note

The current implementation uses an in-memory ledger so the tests and endpoint shape are ready. Before launch, replace the in-memory ledger with a durable database table such as PostgreSQL, Supabase, Firebase, or Redis.

Required production tables or collections:

- `disconnected_users`: `user_id`, `disconnected_at`
- `reward_records`: `user_id`, `reward_type`, `reward_date`, `attempt_id`, `created_at`

Add a unique constraint on:

```text
user_id, reward_type, reward_date
```

That database constraint is the real protection against duplicate Toss Point or coin rewards.
