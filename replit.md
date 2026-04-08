# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Transport Management Platform for a truck/goods transport business.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite (artifacts/transport-app)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Application Features

### Owner/Admin Dashboard (`/`)
- Summary stats: total trucks, active trucks, drivers, active trips, monthly revenue, pending bills
- Recent trips list with status badges
- Pending photo verifications panel

### Trucks (`/trucks`)
- List all trucks with registration number, model, capacity, status
- Add new trucks, update status (active/maintenance/inactive)

### Drivers (`/drivers`)
- List all drivers with name, phone, license number
- Add new drivers

### Trips (`/trips` and `/trips/:id`)
- List and create trips between companies
- Trip detail shows linked photos and OTP verification panel

### Billing (`/billing`)
- List bills with amounts, status (draft/issued/paid/overdue)
- Create bills linked to trips (base amount + fuel/toll/other surcharges)
- Export to Excel/CSV download

### Driver Portal (`/driver-portal`)
- Mobile-friendly interface for drivers
- Select active trip, upload arrival photo and sealed load photo
- Photos stored as base64 data URLs

### OTP Verification (`/verify/:photoId`)
- Owner authenticates sealed load photos via 6-digit OTP
- OTP is logged to server console (demo mode — in production, integrate SMS/email service)

## Database Schema

- `trucks` — fleet vehicles
- `drivers` — driver records
- `trips` — trip records (P2P transport jobs)
- `trip_photos` — arrival and sealed photos with OTP codes
- `bills` — billing records linked to trips

## Architecture

- `artifacts/api-server` — Express 5 REST API (port from env)
- `artifacts/transport-app` — React + Vite frontend (port from env)
- `lib/api-spec/openapi.yaml` — OpenAPI 3.1 spec (single source of truth)
- `lib/api-client-react` — Generated React Query hooks
- `lib/api-zod` — Generated Zod validation schemas
- `lib/db` — Drizzle ORM schema and database client

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
