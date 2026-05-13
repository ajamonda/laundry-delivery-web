# Delivery API

- Base URL: `http://localhost:3000` · Swagger: `/docs`
- All endpoints: `StaffAuthGuard` + `@StaffRoles('DELIVERY')`
- Delivery unit is the **package** (`ItemPackage`). No per-item scan API.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/delivery/vehicles` | Active vehicle master |
| GET | `/delivery/runs/me/active` | My ACTIVE run (`null` if none) |
| POST | `/delivery/runs` | Start run |
| POST | `/delivery/runs/:runId/close` | Close run |
| GET | `/delivery/work` | Packages ready to ship (factory-wide, all items `READY_FOR_DELIVERY`) |
| GET | `/delivery/runs/me/loaded-packages` | Packages on my truck (`DELIVERING`) |
| GET | `/delivery/packages/:packageId` | Package detail |
| POST | `/delivery/packages/:packageId/scan-outbound` | Outbound scan |
| POST | `/delivery/packages/:packageId/handoff` | Handoff |
| POST | `/delivery/packages/:packageId/handoff-photo` | Handoff photo (upsert, one per package) |

---

## DeliveryPackage payload

Returned by `/delivery/work`, `/delivery/runs/me/loaded-packages`, and `/delivery/packages/:id`.

```json
{
  "packageId": "package-uuid",
  "orderId": "order-uuid",
  "address": "Seoul Gangnam-gu Teheran-ro 1",
  "phoneNumber": "010-1234-5678",
  "fulfillmentType": "DELIVERY",
  "fulfillmentOptionCode": "regular_delivery",
  "pickupDeliveryPlaceCode": "front_door",
  "pickupDeliveryPlaceText": null,
  "items": [
    {
      "itemId": "order-item-uuid",
      "tagBarcode": "TAG-0001",
      "catalogItemCode": "shirt",
      "displayNameSnapshot": "Shirt",
      "status": "READY_FOR_DELIVERY"
    }
  ],
  "handoffPhoto": null
}
```

`items` filtering:
- `/work`: only `READY_FOR_DELIVERY`
- `/loaded-packages`: only `DELIVERING` on my run
- `/packages/:id`: all items in the package

`handoffPhoto`: `null` or `{ id, packageId, url, createdAt, updatedAt }`.

---

## DeliveryRun payload

```json
{
  "id": "run-uuid",
  "staffId": "delivery-staff-1",
  "vehicleCode": "DELIVERY_VAN_01",
  "vehicleDisplayName": "Delivery Van 1",
  "status": "ACTIVE",
  "createdAt": "2026-05-13T09:00:00.000Z",
  "closedAt": null
}
```

---

## POST /delivery/runs

Request: `{ "vehicleCode": "DELIVERY_VAN_01" }`

- Idempotent when same staff + same vehicle already has an ACTIVE run (returns existing).
- 409: staff already has another ACTIVE run / vehicle already in use.
- 404: vehicle inactive or missing.

## POST /delivery/packages/:packageId/scan-outbound

No body.

- 404 `PackageNotFoundError`
- 404 `ActiveRunNotFoundError`
- 409 `PackageNotDeliverableError` — at least one item is not `READY_FOR_DELIVERY`
- 409 `BillingNotPaidError` — `billing_request.type='BASE'` is not `PAID` (SUPPLEMENT is not gated)

Response: `{ packageId, orderId, items: [{ itemId, status: 'DELIVERING', location: 'DELIVERING_TRUCK' }] }`

## POST /delivery/packages/:packageId/handoff

No body.

- 404 `PackageNotFoundError`
- 409 `PackageNotHandoffableError` — at least one item is not `DELIVERING`

Response: above + `orderStatus`. `FINISHED` when all items finished, `PARTIAL_FINISHED` when some, fallback `PROCESSING`.

Backend does not validate photo presence — the frontend guards this.

## POST /delivery/packages/:packageId/handoff-photo

Request: `{ "url": "any string" }` (`IsString + IsNotEmpty`, no URL format enforced).

**Upsert** — calling again for the same packageId updates `url` and bumps `updatedAt` only.

Schema: UNIQUE on `delivery_handoff_photos.package_id`.

Response: `{ id, packageId, url, createdAt, updatedAt }`

## POST /delivery/runs/:runId/close

No body. Sets `status: CLOSED`, `closedAt`. Does not block when packages are still on the truck.
