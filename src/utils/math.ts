// src/utils/math.ts

export const TIME_SCALE = 100;
export const MAX_PROCESSES = 20;
export const MAX_TIME_VALUE = 10000;

export const PROCESS_PALETTE: readonly string[] = [
  '#38BDF8',
  '#10B981',
  '#F59E0B',
  '#A855F7',
  '#F43F5E',
  '#06B6D4',
  '#84CC16',
  '#EC4899',
  '#6366F1',
  '#14B8A6',
  '#F97316',
  '#8B5CF6',
];

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getProcessColor(index: number, existingColor?: string): string {
  if (existingColor && existingColor.trim().length > 0) {
    return existingColor;
  }
  return PROCESS_PALETTE[index % PROCESS_PALETTE.length];
}

export function toTicks(time: number): number {
  return Math.round(time * TIME_SCALE);
}

export function fromTicks(ticks: number): number {
  return Number((ticks / TIME_SCALE).toFixed(4));
}

export function roundMetric(value: number, decimals = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function formatClock(time: number): string {
  const safe = Number.isFinite(time) ? Math.max(0, time) : 0;
  return safe.toFixed(2);
}

export function formatTimeValue(time: number): string {
  if (!Number.isFinite(time)) return '0';
  const ticks = toTicks(time);
  if (ticks % TIME_SCALE === 0) {
    return String(Math.round(ticks / TIME_SCALE));
  }
  if (ticks % 10 === 0) {
    return (ticks / TIME_SCALE).toFixed(1);
  }
  return (ticks / TIME_SCALE).toFixed(2);
}

export function formatAverage(value: number, decimals = 4): string {
  if (!Number.isFinite(value)) return '0.0000';
  return value.toFixed(decimals);
}