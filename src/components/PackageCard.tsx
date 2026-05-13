import type { DeliveryPackage } from '../types';
import { fulfillmentOptionLabel, packageAllDelivering, packageAllReady, placeLabel } from '../utils';

export function PackageCard({
  pkg,
  onClick,
}: {
  pkg: DeliveryPackage;
  onClick: () => void;
}) {
  const allReady = packageAllReady(pkg.items);
  const allDelivering = packageAllDelivering(pkg.items);

  let actionLabel = '진행 중';
  let badgeClass = 'badge badge-neutral';
  if (allReady) {
    actionLabel = '출고 대기';
    badgeClass = 'badge badge-info';
  } else if (allDelivering) {
    actionLabel = '인도 대기';
    badgeClass = 'badge badge-attention';
  }

  const place = placeLabel(pkg.pickupDeliveryPlaceCode, pkg.pickupDeliveryPlaceText);
  const option = fulfillmentOptionLabel(pkg.fulfillmentOptionCode);

  return (
    <button className="request-card" type="button" onClick={onClick}>
      <div className="request-card-header">
        <p className="request-card-address">{pkg.address ?? '주소 미입력'}</p>
        <div className="request-card-badges">
          <span className={badgeClass}>{actionLabel}</span>
        </div>
      </div>

      <div className="request-card-meta">
        {pkg.phoneNumber ? (
          <span className="meta-item">
            📞 <strong>{pkg.phoneNumber}</strong>
          </span>
        ) : null}
        <span className="meta-item">
          📦 <strong>{pkg.items.length}개</strong>
        </span>
        {option ? <span className="meta-item">🚚 {option}</span> : null}
      </div>

      {place ? <div className="request-card-place">{place}</div> : null}
    </button>
  );
}
