import type { DeliveryPackageItem } from '../types';

export function PackageItemList({ items }: { items: DeliveryPackageItem[] }) {
  return (
    <div className="item-list">
      {items.map((item) => (
        <div key={item.itemId} className="item-row">
          <div className="item-row-header">
            <span className="item-name">{item.displayNameSnapshot}</span>
            <span className="badge badge-neutral">{item.status}</span>
          </div>
          {item.tagBarcode ? (
            <div className="item-input">
              <strong>태그</strong> <span className="package-card-tag">{item.tagBarcode}</span>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
