export const REORDER_WINDOW_DAYS: Record<string, number> = {
  cement: 14,
  blocks: 21,
  iron_rod: 30,
  sand: 14,
  granite: 21,
  roofing_sheets: 60,
  paint: 30,
  tiles: 45,
  wood: 30,
  default: 21,
};

export function getReorderWindowDays(categoryTag: string): number {
  return REORDER_WINDOW_DAYS[categoryTag.toLowerCase()] || REORDER_WINDOW_DAYS.default;
}
