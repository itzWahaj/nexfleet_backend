# Flaship Courier — Backend API

NestJS 10 API for flaship.pk. Admin panel and the Flutter rider app live in separate repos; they consume this service.

## Step 4 (current)

`wallet` module — transactional balance changes via `WalletService` only, with pessimistic row locks and a concurrency integration test.

## Steps 1–3 (done)

Scaffold, health, auth + users, hubs/zones/riders with hub-scoped queries.

## Stack

- Node 20 LTS, TypeScript strict
- NestJS 10, TypeORM 0.3, PostgreSQL 15 + PostGIS
- Redis (ioredis)
- Zod-validated env, pino logs, helmet, throttling, Swagger

## Local setup

```bash
docker compose up -d
copy .env.example .env
npm install
npm run migration:run
npm run seed
npm run start:dev
```

Docker Postgres is on **5433** to avoid clashing with a local PostgreSQL on 5432.

**Dev accounts** (after `npm run seed`):

| Role | Phone | Password |
|---|---|---|
| Super admin | `+923001234567` | `Admin123!` |
| Hub admin | `+923009876543` | `HubAdmin123!` |

Hub admin owns **Karachi Franchise Hub** (`hubs.owner_user_id`).

## API (step 4)

| Module | Routes |
|---|---|
| Wallets | `GET /wallets/owner/:ownerType/:ownerId`, `GET /wallets/:id`, `GET /wallets/:id/transactions`, `POST /wallets/:id/top-up` |

**Top-up rules**

- `super_admin` → credits a **hub** wallet (external top-up)
- `hub_admin` → transfers from their hub wallet to a **rider** wallet (`hubId` required when rider has multiple assignments in scope)

Balance is always read from `wallets.current_balance` (never computed client-side). All writes go through `WalletService.credit/debit/hold/release/transfer`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run start:dev` | Watch mode |
| `npm run migration:run` | Apply migrations |
| `npm run seed` | Seed dev admin users + sample hub |
| `npm test` | Unit + integration tests (Docker DB required for concurrency test) |
| `SKIP_INTEGRATION_TESTS=true npm test` | Unit tests only |
| `npm run test:e2e` | E2e tests (requires Docker DB) |

## Build order

1. Scaffold + health ✓
2. Auth + users ✓
3. Hubs, zones, riders ✓
4. Wallet *(current)*
5. Merchants + orders
6. Payouts + EOD
7. Tracking + inter-hub shipments
8. Notifications
