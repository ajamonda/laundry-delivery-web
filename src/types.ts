export type AppStep =
  | 'login'
  | 'run-setup'
  | 'work-list'
  | 'work-detail'
  | 'handoff';

export type StaffSession = {
  accessToken: string;
  staff: {
    staffId: string;
    role: string;
    displayName: string | null;
    phoneNumber: string | null;
  };
};

export type DeliveryVehicle = {
  code: string;
  displayName: string;
};

export type DeliveryRun = {
  id: string;
  staffId: string;
  vehicleCode: string;
  vehicleDisplayName: string;
  status: 'ACTIVE' | 'CLOSED' | string;
  createdAt: string;
  closedAt: string | null;
};

export type DeliveryPackageItem = {
  itemId: string;
  tagBarcode: string | null;
  catalogItemCode: string;
  displayNameSnapshot: string;
  status: string;
};

export type DeliveryPackage = {
  packageId: string;
  orderId: string;
  address: string | null;
  phoneNumber: string | null;
  fulfillmentType: string | null;
  fulfillmentOptionCode: string | null;
  pickupDeliveryPlaceCode: string | null;
  pickupDeliveryPlaceText: string | null;
  items: DeliveryPackageItem[];
  handoffPhoto: HandoffPhoto | null;
};

export type ScanOutboundResult = {
  packageId: string;
  orderId: string;
  items: { itemId: string; status: string; location: string }[];
};

export type HandoffResult = {
  packageId: string;
  orderId: string;
  items: { itemId: string; status: string; location: string }[];
  orderStatus: string;
};

export type HandoffPhoto = {
  id: string;
  packageId: string;
  url: string;
  createdAt: string;
  updatedAt: string;
};
