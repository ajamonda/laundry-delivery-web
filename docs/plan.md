# plan.md

Operator-facing web client for delivery staff. The unit you operate on is the **package** (`ItemPackage`), never an individual item. If you find yourself manipulating individual items, you're off-path — the backend has no per-item action.

## AppStep state machine (`src/App.tsx`)

```
login
  ↓ (login success + GET /delivery/runs/me/active)
run-setup ─────────► work-list
                       ├── work-detail   (outbound scan)
                       └── handoff       (photo + handoff)
                       ↓ (RunCloseDialog → POST .../close)
                     run-setup
```

Initial-step decision lives in `App.tsx`:
1. No session → `login`.
2. Session + `getActiveRun` returns a run → `work-list`.
3. Session + null → `run-setup`.

The persisted `run` in zustand is best-effort cache for instant UI on refresh; the server response always overrides.

## File map (only the non-obvious ones)

| File | Role |
|---|---|
| `src/App.tsx` | Only place that owns `AppStep`. Other components receive callbacks. |
| `src/api.ts` | Every backend call. Throws `ApiError` with `status` + `details`. |
| `src/store.ts` | Zustand. Holds only `session` + `run`. **No photo cache, no work cache.** |
| `src/components/WorkListScreen.tsx` | The two-tab hub. Owns 5s polling. |
| `src/components/HandoffScreen.tsx` | Reads `pkg.handoffPhoto` from server response, not store. |
| `src/styles.css` | Copy of pickup-web styles + a delivery tail (`modal-*`, `toast*`, `package-card-*`). Don't reorder — diff against pickup-web stays readable. |

## State source-of-truth rules

- **Server data** (packages, runs, photos) → TanStack Query only. Never copy into zustand.
- **Local UX state** (selected package, modal open, photo input draft) → component `useState`.
- **Cross-screen identity** (session, run) → zustand `persist`.

Photo presence is `pkg.handoffPhoto !== null`. There was a previous bug where photo state lived in zustand and drifted from the DB; the canonical answer is now always the package detail response.

## TanStack Query keys

| Key | Polling | Invalidate on |
|---|---|---|
| `['delivery', 'vehicles']` | — | (never) |
| `['delivery', 'active-run']` | — | login, createRun success, closeRun success |
| `['delivery', 'work']` | 5s | scanOutbound, handoff |
| `['delivery', 'loaded-packages']` | 5s | scanOutbound, handoff |
| `['delivery', 'package', :id]` | — | scanOutbound, handoff, recordHandoffPhoto |

A mutation that affects status MUST invalidate **both** `work` and `loaded-packages`. They're separate endpoints (see `delivery-api.md` for why).

## Error → UI mapping

| Error class | HTTP | What to do |
|---|---|---|
| `BillingNotPaidError` | 409 | Inline message on `WorkDetailScreen`. Retry after billing settles. |
| `PackageNotDeliverableError` | 409 | Refetch the list — package state drifted. |
| `PackageNotHandoffableError` | 409 | Refetch the detail. |
| `ActiveRunNotFoundError` | 404 | Force step to `run-setup`. |
| `PackageNotFoundError` | 404 | Back to `work-list`. |
| `DeliveryVehicleNotFoundError` | 404 | Refetch vehicles. |
| (any) | 401 | `setSession(null) + qc.clear()`, step → `login`. |

Mapping happens via `ErrorNotice` reading `ApiError.message` (backend `NestException.message` already carries the right text). The HTTP status is the steering signal.

## Things that look like bugs but aren't

- **`/delivery/work` never shows DELIVERING packages.** Use `/delivery/runs/me/loaded-packages` for that tab. Don't try to client-side filter `/work`.
- **`recordHandoffPhoto` does not create a new row on second call.** It's a server-side upsert by `packageId`. The "수정" button just re-submits.
- **Run can be closed with packages still on the truck.** Backend allows; the dialog only warns. Tests asserting 409 here will fail.
- **`POST /delivery/runs` is idempotent for same staff+vehicle.** A page refresh after run creation does not 409.
- **`fulfillmentType=STORAGE` flows through the same screens.** No branch; the operator sees a card like any other delivery.

## Cross-domain dependencies

- Auth: pickup-web pattern; staff dev-login. Token in zustand + injected by `api.ts`.
- Wash: creates `ItemPackage` via `POST /wash/packages`. That's the upstream that fills `/delivery/work`. If `/work` is empty in dev, seed/run wash flow first.
- Billing: blocks outbound scan when any `billing_request` (BASE or SUPPLEMENT) on the order is `WAITING`. There's no proactive billing-status query in this app — we learn via 409.

## Backend file anchors

When the work spans both sides:

| Concern | File |
|---|---|
| Routes | `laundry-api/src/modules/delivery/interfaces/http/delivery.controller.ts` |
| Module wiring | `…/delivery/delivery.module.ts` |
| Use cases | `…/delivery/application/use-cases/*.use-case.ts` |
| Repo port | `…/delivery/domain/delivery.repository.ts` |
| Prisma impl | `…/delivery/infrastructure/prisma-delivery.repository.ts` |
| Errors | `…/delivery/domain/delivery.errors.ts` |
| Types | `…/delivery/domain/delivery.types.ts` |

`DeliveryModule` imports `ProcessingRouteModule` for `AuditLogger`. Every status-changing action writes per-item audit logs inside the Prisma transaction via `auditLogger.logInTransaction(tx, ...)`. New write actions must follow this pattern.

## Dev workflow

- Backend: `npm run start:dev` in `laundry-api` (port 3000).
- Frontend: `npm run dev` in `laundry-delivery-web` (Vite dev server, proxies `/api/*` to `:3000`).
- Typecheck-only: `npm run typecheck` in each.
- Schema change: edit `laundry-api/prisma/schema.prisma` → create migration under `prisma/migrations/<timestamp>_<name>/migration.sql` → `npx prisma migrate dev` + `npx prisma generate`. On Windows, the dev server must be stopped to release `query_engine-windows.dll.node` before `prisma generate` succeeds.
