export const PRODUCT_CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Kitchen",
  "Health & Beauty",
  "Food & Groceries",
  "Phones & Gadgets",
  "Sports & Fitness",
  "Baby & Kids",
  "Other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
