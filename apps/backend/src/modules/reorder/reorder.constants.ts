export const REORDER_WINDOW_DAYS: Record<string, number> = {
  electronics: 45,
  fashion: 30,
  "health & beauty": 21,
  "home & kitchen": 14,
  "auto parts": 60,
  agriculture: 14,
  "food & groceries": 7,
  "building materials": 30,
  default: 21,
};

export function getReorderWindowDays(categoryTag: string): number {
  return (
    REORDER_WINDOW_DAYS[categoryTag.toLowerCase()] ||
    REORDER_WINDOW_DAYS.default
  );
}
