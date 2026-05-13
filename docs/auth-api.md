# Auth API

`POST /auth/staff/delivery/dev-login`

Request: `{ "staffId": "delivery-staff-1" }`

Response:

```json
{
  "accessToken": "jwt-token",
  "staff": {
    "staffId": "delivery-staff-1",
    "role": "DELIVERY",
    "displayName": null,
    "phoneNumber": null
  }
}
```

No password (dev-only).

## Usage

- Store the response in [`useAppStore.setSession`](../src/store.ts) — persisted to localStorage.
- [`api.ts`](../src/api.ts) attaches `Authorization: Bearer {accessToken}` automatically.
- On 401: clear session + run, run `qc.clear()`, return to login.

Token payload: `subjectType: 'STAFF'`, `staffId`, `staffRole`. Backend `/delivery/*` is guarded by `StaffAuthGuard + @StaffRoles('DELIVERY')` (ADMIN also passes the guard).
