import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { HandoffResult, StaffSession } from '../types';
import { fulfillmentOptionLabel, placeLabel } from '../utils';
import { ErrorNotice } from './ErrorNotice';
import { PackageItemList } from './PackageItemList';

export function HandoffScreen({
  session,
  packageId,
  onBack,
  onHandedOff,
}: {
  session: StaffSession;
  packageId: string;
  onBack: () => void;
  onHandedOff: (result: HandoffResult) => void;
}) {
  const qc = useQueryClient();

  const pkgQuery = useQuery({
    queryKey: ['delivery', 'package', packageId],
    queryFn: () => api.getPackage(session.accessToken, packageId),
  });

  const pkg = pkgQuery.data;
  const recordedPhoto = pkg?.handoffPhoto ?? null;

  const [editing, setEditing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');

  const recordPhotoMutation = useMutation({
    mutationFn: (url: string) =>
      api.recordHandoffPhoto(session.accessToken, packageId, url),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery', 'package', packageId] });
      setEditing(false);
      setPhotoUrl('');
    },
  });

  const handoffMutation = useMutation({
    mutationFn: () => api.handoff(session.accessToken, packageId),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['delivery', 'work'] });
      qc.invalidateQueries({ queryKey: ['delivery', 'loaded-packages'] });
      qc.invalidateQueries({ queryKey: ['delivery', 'package', packageId] });
      onHandedOff(result);
    },
  });

  function handlePhotoSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = photoUrl.trim();
    if (trimmed) recordPhotoMutation.mutate(trimmed);
  }

  const canHandoff = !!pkg && !!recordedPhoto;
  const showForm = editing || !recordedPhoto;

  return (
    <>
      <div className="page-header">
        <button className="back-button" type="button" onClick={onBack}>
          ← 배달 목록
        </button>
        <h1>인도 처리</h1>
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

          <div className="work-section">
            <h2>인도 사진</h2>
            {recordedPhoto && !editing ? (
              <>
                <div className="photo-registered">
                  <span>✔ 등록됨</span>
                  <span style={{ color: 'var(--steel)', fontWeight: 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {recordedPhoto.url}
                  </span>
                  <button
                    type="button"
                    className="ghost-button"
                    style={{ minHeight: 34, padding: '6px 14px' }}
                    onClick={() => {
                      setPhotoUrl(recordedPhoto.url);
                      setEditing(true);
                    }}
                  >
                    수정
                  </button>
                </div>
              </>
            ) : null}
            {showForm ? (
              <form className="photo-input-row" onSubmit={handlePhotoSubmit}>
                <input
                  type="text"
                  placeholder="사진 URL 또는 메모"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
                <button
                  className="secondary-button"
                  type="submit"
                  disabled={recordPhotoMutation.isPending || !photoUrl.trim()}
                >
                  {recordedPhoto ? '갱신' : '등록'}
                </button>
                {recordedPhoto ? (
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setPhotoUrl('');
                    }}
                  >
                    취소
                  </button>
                ) : null}
              </form>
            ) : null}
            {recordPhotoMutation.error ? <ErrorNotice error={recordPhotoMutation.error} /> : null}
          </div>

          <div className="detail-section">
            <h2>아이템 ({pkg.items.length}개)</h2>
            <PackageItemList items={pkg.items} />
          </div>

          {handoffMutation.error ? <ErrorNotice error={handoffMutation.error} /> : null}

          <div className="bottom-bar">
            <button className="secondary-button" type="button" onClick={onBack}>
              취소
            </button>
            <button
              className="primary-button"
              type="button"
              disabled={!canHandoff || handoffMutation.isPending}
              onClick={() => handoffMutation.mutate()}
            >
              {handoffMutation.isPending
                ? '인도 처리 중…'
                : !recordedPhoto
                  ? '사진을 먼저 등록하세요'
                  : '인도 완료'}
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}
