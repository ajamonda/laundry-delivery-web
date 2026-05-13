export function placeLabel(code: string | null, text: string | null): string {
  if (!code) return '';
  const labels: Record<string, string> = {
    front_door: '현관 앞',
    security_office: '경비실',
    mailbox: '우편함',
    custom_place_text: text ?? '기타',
  };
  return labels[code] ?? code;
}

export function fulfillmentOptionLabel(code: string | null): string {
  if (!code) return '';
  const labels: Record<string, string> = {
    economy_delivery: '이코노미 배달',
    regular_delivery: '일반 배달',
    fast_delivery: '빠른 배달',
    storage_3_month: '3개월 보관',
    storage_6_month: '6개월 보관',
  };
  return labels[code] ?? code;
}

export function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    FINISHED: '주문 완료',
    PARTIAL_FINISHED: '주문 일부 완료',
    PROCESSING: '진행 중',
  };
  return labels[status] ?? status;
}

export function packageAllReady(items: { status: string }[]): boolean {
  return items.length > 0 && items.every((i) => i.status === 'READY_FOR_DELIVERY');
}

export function packageAllDelivering(items: { status: string }[]): boolean {
  return items.length > 0 && items.every((i) => i.status === 'DELIVERING');
}
