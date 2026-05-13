import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { DeliveryRun, StaffSession } from '../types';
import { ErrorNotice } from './ErrorNotice';

export function RunCloseDialog({
  session,
  run,
  hasOpenWork,
  onCancel,
  onClosed,
}: {
  session: StaffSession;
  run: DeliveryRun;
  hasOpenWork: boolean;
  onCancel: () => void;
  onClosed: () => void;
}) {
  const qc = useQueryClient();
  const closeMutation = useMutation({
    mutationFn: () => api.closeRun(session.accessToken, run.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery'] });
      onClosed();
    },
  });

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h2>배달 런을 종료할까요?</h2>
        <p>
          {hasOpenWork
            ? '아직 인도되지 않은 패키지가 있어요. 그래도 런을 종료하면 다시 시작해야 합니다.'
            : '오늘 운행을 마치고 차량을 반납합니다.'}
        </p>

        {closeMutation.error ? <ErrorNotice error={closeMutation.error} /> : null}

        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onCancel} disabled={closeMutation.isPending}>
            취소
          </button>
          <button
            className="primary-button"
            type="button"
            disabled={closeMutation.isPending}
            onClick={() => closeMutation.mutate()}
          >
            {closeMutation.isPending ? '종료 중…' : '종료'}
          </button>
        </div>
      </div>
    </div>
  );
}
