# Comprador web

The web app owns the dashboard, Google identity login, separate Gmail consent,
authenticated Gmail callbacks, and the optional Pub/Sub push endpoint.

Run it from the repository root:

```bash
corepack pnpm dev:web
```

The root [README](../../README.md) contains the required environment variables,
Google Cloud redirect URIs, database setup, and combined web/worker command.

## Route boundaries

- `/login` requests identity scopes only.
- `/api/gmail/connect` starts the separate read-only Gmail grant.
- `/api/gmail/callback` encrypts tokens and queues the initial sync.
- `/api/gmail/push` accepts verified Pub/Sub notifications when configured.
- `/today`, `/deals`, and `/settings/integrations` require a session.

Gmail bodies are never rendered or stored by this app. The worker fetches,
filters, and evaluates one message at a time.
