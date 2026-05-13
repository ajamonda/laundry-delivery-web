import { describe, expect, it } from 'vitest';
import {
  fulfillmentOptionLabel,
  orderStatusLabel,
  packageAllDelivering,
  packageAllReady,
  placeLabel,
} from '../utils';

describe('placeLabel', () => {
  it('returns empty string for null code', () => {
    expect(placeLabel(null, null)).toBe('');
  });
  it('maps known codes', () => {
    expect(placeLabel('front_door', null)).toBe('현관 앞');
    expect(placeLabel('security_office', null)).toBe('경비실');
    expect(placeLabel('mailbox', null)).toBe('우편함');
  });
  it('uses custom text for custom_place_text', () => {
    expect(placeLabel('custom_place_text', '문 앞 화분 옆')).toBe('문 앞 화분 옆');
    expect(placeLabel('custom_place_text', null)).toBe('기타');
  });
  it('falls back to raw code when unknown', () => {
    expect(placeLabel('garage', null)).toBe('garage');
  });
});

describe('fulfillmentOptionLabel', () => {
  it('returns empty for null', () => {
    expect(fulfillmentOptionLabel(null)).toBe('');
  });
  it('maps known options', () => {
    expect(fulfillmentOptionLabel('regular_delivery')).toBe('일반 배달');
    expect(fulfillmentOptionLabel('fast_delivery')).toBe('빠른 배달');
  });
  it('falls back to raw code', () => {
    expect(fulfillmentOptionLabel('unknown')).toBe('unknown');
  });
});

describe('orderStatusLabel', () => {
  it('maps terminal statuses', () => {
    expect(orderStatusLabel('FINISHED')).toBe('주문 완료');
    expect(orderStatusLabel('PARTIAL_FINISHED')).toBe('주문 일부 완료');
    expect(orderStatusLabel('PROCESSING')).toBe('진행 중');
  });
  it('falls back to raw status', () => {
    expect(orderStatusLabel('CANCELED')).toBe('CANCELED');
  });
});

describe('package state predicates', () => {
  it('empty array is neither ready nor delivering', () => {
    expect(packageAllReady([])).toBe(false);
    expect(packageAllDelivering([])).toBe(false);
  });
  it('all items READY_FOR_DELIVERY → packageAllReady', () => {
    expect(packageAllReady([{ status: 'READY_FOR_DELIVERY' }, { status: 'READY_FOR_DELIVERY' }])).toBe(true);
  });
  it('mixed states are not ready', () => {
    expect(packageAllReady([{ status: 'READY_FOR_DELIVERY' }, { status: 'DELIVERING' }])).toBe(false);
  });
  it('all items DELIVERING → packageAllDelivering', () => {
    expect(packageAllDelivering([{ status: 'DELIVERING' }])).toBe(true);
  });
  it('any non-DELIVERING item disqualifies', () => {
    expect(packageAllDelivering([{ status: 'DELIVERING' }, { status: 'FINISHED' }])).toBe(false);
  });
});
