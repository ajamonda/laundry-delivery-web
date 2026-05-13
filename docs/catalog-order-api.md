# catalog-order-api.md

This app **never calls catalog or pricing endpoints**. Everything it shows about products, addresses, and order options arrives as snapshots inside `/delivery/*` responses. Treat catalog/order as a one-way feed: edits there don't ripple into already-snapshotted package data.

## What lands in DeliveryPackage

```
DeliveryPackage:
  packageId, orderId
  address, phoneNumber
  fulfillmentType                 'DELIVERY' | 'STORAGE'
  fulfillmentOptionCode           (see label map below)
  pickupDeliveryPlaceCode         (see label map below)
  pickupDeliveryPlaceText         only meaningful with code='custom_place_text'
  items[]:
    itemId, tagBarcode
    catalogItemCode               machine code; never display directly
    displayNameSnapshot           always display this
    status
  handoffPhoto                    null | { id, packageId, url, createdAt, updatedAt }
```

## What's NOT in the payload (and where to find it if needed)

| Field | Source schema | How to expose |
|---|---|---|
| Item options (size, color, service) | `OrderItemOption` | Include in `findPackageById` and add to `DeliveryPackageItem` |
| Item photos | `OrderItemPhoto` | Same — extend repo `include` |
| Final price / billing total | `LaundryOrder.finalAmount`, `BillingRequest.totalAmount` | Don't surface here — billing has its own UI |
| Customer profile | `Customer` | Out of scope; address + phone are denormalized onto the order |

If a screen needs one of these, extend `…/delivery/infrastructure/prisma-delivery.repository.ts` (the three `findX` methods + `toPackageView`) and `…/delivery/domain/delivery.types.ts`. The frontend types in `src/types.ts` follow.

## Label maps (`src/utils.ts`)

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

Unknown codes fall through to the raw code string — surface that to the user so missing labels are visible.

## Rendering rules

- Card view shows item count only (`📦 N items`). Don't iterate items here.
- Detail/handoff views show `displayNameSnapshot` + `tagBarcode` as a mono chip when present.
- Never recompute prices. Payment eligibility is a server decision surfaced via `BillingNotPaidError`.
- `STORAGE` fulfillment uses the same screens — no special-casing.
