import type { PracticeConfig } from "../../../shared/session";
export type Range = { start: number; end: number };
export const MIN_RANGE = 4;
export const MAX_RANGE = 16;
export function normalize(
  config: PracticeConfig,
  beats: number,
): PracticeConfig {
  const start = Math.max(
    0,
    Math.min(beats - 4, Math.round(config.start / 4) * 4),
  );
  return {
    enabled: config.enabled,
    speed: Math.max(0.5, Math.min(1.25, config.speed)),
    start,
    end: Math.max(start + 4, Math.min(beats, Math.round(config.end / 4) * 4)),
  };
}
export function clampEdge(
  edge: "start" | "end",
  beat: number,
  other: number,
  beats: number,
): number {
  const snapped = Math.max(0, Math.min(beats, Math.round(beat / 4) * 4));
  if (edge === "start")
    return Math.max(other - MAX_RANGE, Math.min(other - MIN_RANGE, snapped));
  return Math.min(other + MAX_RANGE, Math.max(other + MIN_RANGE, snapped));
}
export function rangeLabel(start: number, end: number) {
  return `${Math.floor(start / 4) + 1} — ${Math.ceil(end / 4)} 小节`;
}
