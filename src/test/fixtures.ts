import type {
  DeliveryPackage,
  DeliveryPackageItem,
  DeliveryRun,
  HandoffPhoto,
  StaffSession,
} from '../types';

export const baseUrl = 'http://localhost:3000/api';

export const session: StaffSession = {
  accessToken: 'test-token',
  staff: {
    staffId: 'delivery-staff-1',
    role: 'delivery',
    displayName: '테스트 기사',
    phoneNumber: null,
  },
};

export const run: DeliveryRun = {
  id: 'run-1',
  staffId: 'delivery-staff-1',
  vehicleCode: 'truck-a',
  vehicleDisplayName: 'A호차',
  status: 'ACTIVE',
  createdAt: '2026-05-13T08:00:00.000Z',
  closedAt: null,
};

export function item(overrides: Partial<DeliveryPackageItem> = {}): DeliveryPackageItem {
  return {
    itemId: 'item-1',
    tagBarcode: 'TAG-001',
    catalogItemCode: 'shirt',
    displayNameSnapshot: '셔츠',
    status: 'READY_FOR_DELIVERY',
    ...overrides,
  };
}

export function pkg(overrides: Partial<DeliveryPackage> = {}): DeliveryPackage {
  return {
    packageId: 'pkg-1',
    orderId: 'order-1',
    address: '서울시 강남구',
    phoneNumber: '010-0000-0000',
    fulfillmentType: 'delivery',
    fulfillmentOptionCode: 'regular_delivery',
    pickupDeliveryPlaceCode: 'front_door',
    pickupDeliveryPlaceText: null,
    items: [item()],
    handoffPhoto: null,
    ...overrides,
  };
}

export function photo(overrides: Partial<HandoffPhoto> = {}): HandoffPhoto {
  return {
    id: 'photo-1',
    packageId: 'pkg-1',
    url: 'https://example.com/p.jpg',
    createdAt: '2026-05-13T09:00:00.000Z',
    updatedAt: '2026-05-13T09:00:00.000Z',
    ...overrides,
  };
}
