# Catalog / Order Data

This app does not call catalog/pricing APIs directly. Product, address, and option data arrive as **snapshots inside `/delivery/*` responses** (see [`delivery-api.md`](./delivery-api.md) for the payload).

## Display rules

Mapping functions live in [`utils.ts`](../src/utils.ts).

### fulfillmentOptionCode → label

| code | label |
|---|---|
| `economy_delivery` | Economy delivery |
| `regular_delivery` | Regular delivery |
| `fast_delivery` | Fast delivery |
| `storage_3_month` | 3-month storage |
| `storage_6_month` | 6-month storage |

### pickupDeliveryPlaceCode → label

| code | label |
|---|---|
| `front_door` | Front door |
| `security_office` | Security office |
| `mailbox` | Mailbox |
| `custom_place_text` | use `pickupDeliveryPlaceText` verbatim |

### Item labels
- Card: count only (`📦 N items`)
- Detail/handoff: `displayNameSnapshot` + tag barcode

## Rules

- `displayNameSnapshot` is captured at order time — display as-is.
- No price display or recalculation. Payment gating is handled by the backend (`BillingNotPaidError`).
- Option snapshots and item photos are not included in current responses.
