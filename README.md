# Flaship Courier — Backend API

NestJS 10 API for flaship.pk. Admin panel and the Flutter rider app live in separate repos; they consume this service.

## Step 1 (current)

Scaffold, TypeORM + PostGIS connection (`synchronize: false`), validated env, health routes.

Later steps (auth, hubs, wallet, orders, …) wait for explicit review before starting.

## Stack

- Node 20 LTS, TypeScript strict
- NestJS 10, TypeORM 0.3, PostgreSQL 15 + PostGIS
- Redis (ioredis)
- Zod-validated env, pino logs, helmet, throttling, Swagger

## Local setup

```bash
docker compose up -d
copy .env.example .env   # PowerShell: Copy-Item .env.example .env
npm install
npm run migration:run
npm run start:dev
```

- API prefix: `http://localhost:3000/api/v1`
- Live: `GET /api/v1/health`
- Readiness (Postgres + Redis + PostGIS): `GET /api/v1/health/ready`
- OpenAPI: `http://localhost:3000/api/docs`

This machine currently has Node 24; the brief asks for Node 20 LTS. Use `nvm use` (see `.nvmrc`) if you want to match production.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run start:dev` | Watch mode |
| `npm run migration:run` | Apply TypeORM migrations |
| `npm run migration:generate -- src/database/migrations/Name` | Generate a migration from entity diffs |
| `npm test` | Unit tests |
| `npm run test:e2e` | Health e2e (mocked dependencies) |

`synchronize` is **never** enabled. Do not turn it on locally.

## Response envelope

```json
{ "success": true, "data": {} }
```

Errors:

```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }
```
