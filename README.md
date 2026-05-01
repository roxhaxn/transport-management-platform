# TransPort Platform

A full-stack **P2P Truck Transport Management System** built for managing a transport business end-to-end — fleet, drivers, trips, clients, billing, and driver photo verification.

---

## Features

### Owner / Admin Dashboard
- **Fleet Management** — Add and track trucks (registration, model, capacity, status)
- **Driver Management** — Maintain driver profiles with license numbers and contact info
- **Client Management** — Full CRUD for business clients with GST numbers
- **Trip Management** — Create and track trips across all statuses (Scheduled → Loaded → In Transit → Completed)
- **Live Driver Activity Monitor** — Real-time view of which driver is on which truck and route
- **Billing & Invoicing** — Generate bills per trip, record payments (Cash / UPI / Bank Transfer / Cheque), download PDF invoices
- **Dashboard Summary** — Monthly revenue (₹), active trips, pending bills, completed trips at a glance

### Driver Portal
- Select active trip and upload photos (arrival + sealed/loaded)
- Camera-friendly mobile interface
- Sealed cargo photos require owner OTP verification

### Role-Based Access
- **Owner** — Full access to all dashboard pages
- **Driver** — Access limited to the driver portal
- Session persists across page refreshes via localStorage

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Routing | Wouter |
| State / Data | TanStack Query (React Query) |
| Backend | Node.js, Express |
| Database | PostgreSQL (Drizzle ORM) |
| API Contract | OpenAPI 3.0 + Orval codegen |
| PDF Generation | jsPDF |
| Monorepo | pnpm workspaces |

---

## Project Structure

```
transport-management-platform/
├── artifacts/
│   ├── transport-app/          # React frontend (Vite)
│   │   └── src/
│   │       ├── pages/          # Dashboard, Billing, Trips, Drivers, Trucks, Clients, Driver Portal
│   │       ├── components/     # Layout, shadcn/ui components
│   │       └── context/        # Auth context (demo role-based auth)
│   └── api-server/             # Express backend
│       └── src/
│           ├── routes/         # REST API routes (trips, drivers, trucks, billing, clients, dashboard)
│           └── middlewares/    # Auth middleware
├── lib/
│   ├── db/                     # Drizzle ORM schema + migrations
│   ├── api-spec/               # OpenAPI 3.0 spec
│   └── api-client-react/       # Auto-generated React Query hooks (via Orval)
└── scripts/                    # Utility scripts
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 9+
- PostgreSQL database (set `DATABASE_URL` env variable)

### Installation

```bash
# Clone the repo
git clone https://github.com/roxhaxn/transport-management-platform.git
cd transport-management-platform

# Install dependencies
pnpm install

# Set up environment variables
# Create .env in artifacts/api-server/ with:
# DATABASE_URL=your_postgres_connection_string
# SESSION_SECRET=any_random_secret

# Run database migrations
pnpm --filter @workspace/db run migrate

# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the frontend (in a separate terminal)
pnpm --filter @workspace/transport-app run dev
```

### Access the App
- Frontend: http://localhost:5173
- API: http://localhost:8080/api

---

## Demo Login

The platform uses a demo authentication system for easy evaluation:

1. Open the app — you'll see a **role selector screen**
2. Choose **Owner / Admin** to access the full management dashboard
3. Choose **Driver** to access the driver portal (photo uploads)

No sign-up or external auth service required.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | KPI summary (revenue, active trips, etc.) |
| GET | `/api/dashboard/recent-trips` | Last 10 trips |
| GET | `/api/dashboard/driver-activity` | Live driver status |
| GET/POST | `/api/trucks` | List / create trucks |
| GET/PATCH | `/api/trucks/:id` | Get / update truck |
| GET/POST | `/api/drivers` | List / create drivers |
| GET/POST | `/api/trips` | List / create trips |
| GET/PATCH | `/api/trips/:id` | Get / update trip |
| POST | `/api/trips/:id/photos` | Upload trip photo |
| GET/POST | `/api/clients` | List / create clients |
| PATCH/DELETE | `/api/clients/:id` | Update / delete client |
| GET/POST | `/api/billing` | List / create bills |
| PATCH | `/api/billing/:id` | Update bill |
| POST | `/api/billing/:id/payment` | Record payment |
| GET | `/api/billing/:id/invoice-data` | Invoice data for PDF |
| GET | `/api/billing/export/csv` | Export bills as CSV |

---

## Key Design Decisions

- **Contract-first API** — OpenAPI spec defined first, React Query hooks and Zod validators auto-generated via Orval. Frontend and backend stay in sync automatically.
- **Monorepo with pnpm workspaces** — Shared types, DB schema, and API client are separate packages consumed by both frontend and backend.
- **INR currency throughout** — All monetary values displayed in ₹ (Indian Rupees).
- **Photo verification flow** — Drivers upload sealed cargo photos; owners verify via OTP before trip completion is confirmed.

---

## Screenshots

| Login | Dashboard | Billing |
|---|---|---|
| Role picker — no external auth needed | Live fleet summary with ₹ revenue | Bills with payment recording & PDF export |

---

## License

MIT
