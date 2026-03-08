export const PRODUCT_CATEGORIES = [
  "Electronics & Gadgets",
  "Fashion & Apparel",
  "Home & Kitchen",
  "Groceries & Supermarket",
  "Health & Beauty",
  "Building Materials",
  "Industrial Equipment",
  "Auto Parts",
  "Agricultural Products",
  "Sports & Outdoors",
  "Toys & Games",
  "Books & Stationery",
  "Furniture",
  "Hardware & Tools",

  "Other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
