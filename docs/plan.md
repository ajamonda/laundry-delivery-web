# Delivery Web — Plan

Web client for delivery operators picking up wash-completed packages and handing them off to customers. Delivery unit is the **package** (`ItemPackage`).

## Stack
React 19 + Vite + TS + TanStack Query + Zustand (persist). Matches `laundry-pickup-web` for design and structure.

## AppStep machine

```
login
  ↓ (branch on getActiveRun)
run-setup ⇄ work-list
              ├ work-detail  (outbound scan)
              └ handoff      (photo + handoff)
```

[`App.tsx`](../src/App.tsx) owns the state machine. `selectedPackageId` identifies the detail/handoff target.

## Screens

| Step | Component | Core action |
|---|---|---|
| login | `LoginScreen` | `POST /auth/staff/delivery/dev-login` |
| run-setup | `RunSetupScreen` | `GET /delivery/vehicles` → `POST /delivery/runs` |
| work-list | `WorkListScreen` | Two tabs: `GET /delivery/work` (factory-wide) / `GET /delivery/runs/me/loaded-packages` (my truck). 5s polling. |
| work-detail | `WorkDetailScreen` | `GET /delivery/packages/:id` → `POST .../scan-outbound` |
| handoff | `HandoffScreen` | Record photo (`handoff-photo`, upsert) → `POST .../handoff` |

`RunCloseDialog`: warns about packages still on the truck before `POST /delivery/runs/:runId/close`.

## State principles

- **Zustand**: `session`, `run`. Persisted to localStorage for instant step decision on reload.
- **Photos are not cached in zustand.** `pkg.handoffPhoto` (server response) is the source of truth.
- Every mutation invalidates the affected query keys.

## TanStack Query keys

| Key | Invalidated on |
|---|---|
| `['delivery', 'vehicles']` | (static) |
| `['delivery', 'active-run']` | login, createRun, closeRun |
| `['delivery', 'work']` (5s) | scanOutbound, handoff |
| `['delivery', 'loaded-packages']` (5s) | scanOutbound, handoff |
| `['delivery', 'package', :id]` | scanOutbound, handoff, recordHandoffPhoto |

## Error handling

| Error | Action |
|---|---|
| 401 | clear session, return to login |
| 404 `ActiveRunNotFoundError` | redirect to run-setup |
| 409 `BillingNotPaidError` | show message, allow retry |
| 409 `Package*Error` | refetch list, reselect |

## Status flow

```
factory  READY_FOR_DELIVERY / IN_HOUSE
   ↓     scan-outbound  (requires billing PAID + active run)
truck    DELIVERING / DELIVERING_TRUCK
   ↓     handoff-photo (prereq) + handoff
customer FINISHED / CUSTOMER_DEST
```

Order status is recomputed at handoff time across all items → `FINISHED` / `PARTIAL_FINISHED`.

## Golden path

1. Log in → pick vehicle → start run
2. Outbound-pending tab → card → scan outbound
3. Delivery-pending tab → card → record photo → complete handoff
4. Close run when both tabs are empty
