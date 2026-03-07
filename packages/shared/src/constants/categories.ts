export const PRODUCT_CATEGORIES = [
  "Cement",
  "Iron Rods & Steel",
  "Blocks",
  "Roofing Sheets",
  "Tiles (Floor & Wall)",
  "Paints & Coatings",
  "Plumbing",
  "Electrical",
  "Sand, Gravel & Granite",
  "Doors & Windows",
  "Nails, Wire & Fasteners",
  "Wood & Timber",
  "Waterproofing",
  "Tools & Equipment",
  "Hardware",
  "Other",
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];
