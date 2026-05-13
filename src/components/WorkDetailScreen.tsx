import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { ScanOutboundResult, StaffSession } from '../types';
import { fulfillmentOptionLabel, placeLabel } from '../utils';
import { ErrorNotice } from './ErrorNotice';
import { PackageItemList } from './PackageItemList';

export function WorkDetailScreen({
  session,
  packageId,
  onBack,
  onScanned,
}: {
  session: StaffSession;
  packageId: string;
  onBack: () => void;
  onScanned: (result: ScanOutboundResult) => void;
}) {
  const qc = useQueryClient();
  const pkgQuery = useQuery({
    queryKey: ['delivery', 'package', packageId],
    queryFn: () => api.getPackage(session.accessToken, packageId),
  });

  const scanMutation = useMutation({
    mutationFn: () => api.scanOutbound(session.accessToken, packageId),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['delivery', 'work'] });
      qc.invalidateQueries({ queryKey: ['delivery', 'loaded-packages'] });
      qc.invalidateQueries({ queryKey: ['delivery', 'package', packageId] });
      onScanned(result);
    },
  });

  const pkg = pkgQuery.data;

  return (
    <>
      <div className="page-header">
        <button className="back-button" type="button" onClick={onBack}>
          ← 배달 목록
        </button>
        <h1>출고 스캔</h1>
      </div>

      {pkgQuery.isLoading ? (
        <div className="skeleton" style={{ height: 200 }} />
      ) : pkgQuery.error ? (
        <ErrorNotice error={pkgQuery.error} />
      ) : pkg ? (
        <>
          <div className="detail-section">
            <h2>배달 정보</h2>
            <div className="detail-row">
              <span className="detail-label">주소</span>
              <span className="detail-value">{pkg.address ?? '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">연락처</span>
              <span className="detail-value">{pkg.phoneNumber ?? '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">배송 옵션</span>
              <span className="detail-value">{fulfillmentOptionLabel(pkg.fulfillmentOptionCode) || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">전달 장소</span>
              <span className="detail-value">
                {placeLabel(pkg.pickupDeliveryPlaceCode, pkg.pickupDeliveryPlaceText) || '-'}
              </span>
            </div>
          </div>

          <div className="detail-section">
            <h2>아이템 ({pkg.items.length}개)</h2>
            <PackageItemList items={pkg.items} />
          </div>

          {scanMutation.error ? <ErrorNotice error={scanMutation.error} /> : null}

          <div className="bottom-bar">
            <button className="secondary-button" type="button" onClick={onBack}>
              취소
            </button>
            <button
              className="primary-button"
              type="button"
              disabled={scanMutation.isPending}
              onClick={() => scanMutation.mutate()}
            >
              {scanMutation.isPending ? '출고 처리 중…' : '출고 스캔'}
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}
