# auth-api.md

`POST /auth/staff/delivery/dev-login` — no password, dev only.

```
request:  { staffId: string }
response: { accessToken, staff: { staffId, role, displayName, phoneNumber } }
```

## Wiring in this app

| Concern | Where |
|---|---|
| Call | `api.ts` → `api.staffDevLogin` |
| Storage | `store.ts` → `useAppStore.setSession`, persisted as `laundry-delivery-web-state` |
| Header injection | `api.ts` `request()` adds `Authorization: Bearer ${accessToken}` automatically |
| Logout / 401 | `App.tsx` `handleLogout` clears session + run, `qc.clear()`, step → `login` |

## Token semantics

JWT payload includes `subjectType: 'STAFF'`, `staffId`, `staffRole`. Backend `/delivery/*` guard is `StaffAuthGuard + @StaffRoles('DELIVERY')`. ADMIN tokens also pass the role check, but this app never requests one — it only calls the delivery dev-login endpoint.

## What auth does NOT do here

- No refresh token flow. Dev tokens are long-lived.
- No role-mismatch UI. Wash/pickup tokens injected manually would 403 — that path isn't covered.
- No per-tab session isolation. localStorage is shared.
