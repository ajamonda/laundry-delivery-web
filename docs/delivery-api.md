# delivery-api.md

Backend contract for what this frontend consumes. Authoritative shapes live in Swagger (`http://localhost:3000/docs`). This file is for **what Swagger can't tell you**: which use-case file backs each route, invariants enforced inside the use case, and known gotchas.

All endpoints under `StaffAuthGuard + @StaffRoles('DELIVERY')`. ADMIN tokens also pass the guard; the frontend only ever issues DELIVERY tokens.

## Endpoint → use-case map

All under `laundry-api/src/modules/delivery/application/use-cases/`.

| Method | Path | Use case |
|---|---|---|
| GET | `/delivery/vehicles` | `get-delivery-vehicles` |
| GET | `/delivery/runs/me/active` | `get-active-run` |
| POST | `/delivery/runs` | `create-delivery-run` |
| POST | `/delivery/runs/:runId/close` | `close-delivery-run` |
| GET | `/delivery/work` | `get-delivery-work` |
| GET | `/delivery/runs/me/loaded-packages` | `get-loaded-packages` |
| GET | `/delivery/packages/:packageId` | `get-delivery-package` |
| POST | `/delivery/packages/:packageId/scan-outbound` | `scan-outbound` |
| POST | `/delivery/packages/:packageId/handoff` | `handoff-item` (legacy name; operates on packages) |
| POST | `/delivery/packages/:packageId/handoff-photo` | `record-handoff-photo` |

## DeliveryPackage payload

`/delivery/work`, `/delivery/runs/me/loaded-packages`, and `/delivery/packages/:id` all return the same `DeliveryPackageView`. **The only difference is which items are included** — the package-level `where` and the items-level `where` are filtered in lockstep, so the response is internally consistent.

| Endpoint | Package-level filter | Items filter |
|---|---|---|
| `/work` | has ≥1 item `READY_FOR_DELIVERY` | `status = READY_FOR_DELIVERY` |
| `/loaded-packages` | has ≥1 item `DELIVERING` + `deliveryRunItem.runId = caller's active run` | same filter |
| `/packages/:id` | by id | all items in package |

`handoffPhoto`: `null` or `{ id, packageId, url, createdAt, updatedAt }`.

## DeliveryRun payload

```
{ id, staffId, vehicleCode, vehicleDisplayName, status: 'ACTIVE'|'CLOSED', createdAt, closedAt }
```

`vehicleDisplayName` is denormalized from `delivery_vehicles.display_name` in the repo's `toRunView` — the frontend should not look it up separately.

## Non-obvious invariants

### `/delivery/work` excludes in-transit packages by design
Filter is `where: { items: { some: { status: 'READY_FOR_DELIVERY' } } }` with the items-level filter narrowed to the same status. Once outbound-scanned, items become `DELIVERING` and the package drops off `/work`. **This is why `/loaded-packages` exists.** Earlier attempts to client-filter `/work` for the "in-transit" tab produced an always-empty tab — don't repeat.

### Outbound requires zero `WAITING` billing rows on the order
`scan-outbound.use-case.ts` calls `repo.countWaitingBillings(orderId)`. Any `billing_request` with `status='WAITING'` — BASE or SUPPLEMENT — blocks the scan with 409 `BillingNotPaidError`. An older implementation gated only BASE and silently let unpaid SUPPLEMENT through; that was fixed. The repository port docstring on `countWaitingBillings` calls this out.

### Outbound infers the run from the caller
The frontend does not pass `runId` to `scan-outbound`. The use case resolves it via `repo.findActiveRun(actor.actorId)`. If none, 404 `ActiveRunNotFoundError`. Treat that as a redirect signal, not a recoverable error.

### Handoff has no billing or photo check on the backend
`handoff-item.use-case.ts` only validates that every item in the package is `DELIVERING`. Photo presence is enforced **only** by the frontend (`HandoffScreen` disables the button when `pkg.handoffPhoto === null`). If a future test calls handoff directly without a photo, it will succeed.

### Handoff photo is upsert by packageId
`recordHandoffPhoto` does `prisma.deliveryHandoffPhoto.upsert({ where: { packageId } })`. Schema has UNIQUE on `package_id`. Repeat calls replace `url`, bump `updatedAt`, keep `createdAt`. URL format is not enforced — `IsString + IsNotEmpty` only. This was a deliberate switch from order-scoped (1:N) to package-scoped (1:1) in migration `20260513120000_handoff_photo_per_package`.

### Run creation is idempotent on (staff, vehicle)
Same staff + same vehicle + existing ACTIVE → returns the existing run. Same staff + different vehicle while ACTIVE → 409. Different staff + same vehicle while ACTIVE → 409.

### Run close is unconditional
No "still has loaded packages" check on the backend. Frontend can warn but the user can always proceed. Audit log captures the close event.

### Order status is recomputed at handoff
After updating items to `FINISHED`, the use case scans all items on the same order:
- all `FINISHED` → order `FINISHED`
- some `FINISHED` → order `PARTIAL_FINISHED`
- neither (shouldn't be reachable) → response falls back to `'PROCESSING'`

### Every status change writes audit logs inside the same transaction
`scan-outbound` and `handoff` call `auditLogger.logInTransaction(tx, ...)` once per item with `actionType: 'ITEM_SCAN_OUTBOUND'` / `'ITEM_HANDED_OFF'`. New write actions on this module must inject `AuditLogger` (from `ProcessingRouteModule`) and follow the same pattern.

## Errors

Defined in `…/delivery/domain/delivery.errors.ts`.

| Class | HTTP | Trigger |
|---|---|---|
| `PackageNotFoundError` | 404 | packageId not found |
| `ActiveRunNotFoundError` | 404 | scan-outbound called without ACTIVE run for caller |
| `DeliveryVehicleNotFoundError` | 404 | createRun on inactive/missing vehicle |
| `PackageNotDeliverableError` | 409 | scan-outbound when not all items `READY_FOR_DELIVERY` |
| `PackageNotHandoffableError` | 409 | handoff when not all items `DELIVERING` |
| `BillingNotPaidError` | 409 | scan-outbound when `countWaitingBillings > 0` |
| (`ConflictException`) | 409 | createRun staff/vehicle collisions |

Backend message strings are user-facing — the frontend just displays `ApiError.message`.
