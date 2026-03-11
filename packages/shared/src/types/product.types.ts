import { MerchantProfile } from "./merchant.types";

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  attributes?: any; // Added in V5: List of attribute definitions
  children?: Category[];
  productCount?: number;
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  unit: string;
  categoryTag: string;
  categoryId: string;
  category?: Category;
  imageUrl?: string;
  minOrderQuantity: number;
  minOrderQuantityConsumer: number; // Added in V5 for consumer expansion
  isActive: boolean;
  pricePerUnitKobo?: string;
  retailPriceKobo?: string; // Added in V5 for consumer expansion
  wholesalePriceKobo?: string; // Added in V5 for per-item wholesale pricing
  wholesaleDiscountPercent?: number | null; // Added in V5 — discount % off retail for wholesale
  attributes?: any; // Added in V5: Category-specific key-value pairs

  warehouseLocation?: string;
  createdAt: Date;
  updatedAt: Date;
  merchantProfile?: Partial<MerchantProfile>;
  merchant?: any;
  stockCache?: { stock: number };
}

export interface CreateProductDto {
  name: string;
  description?: string;
  unit: string;
  categoryTag: string;
  categoryId: string;
  imageUrl?: string;
  minOrderQuantity?: number;
  minOrderQuantityConsumer?: number;
  warehouseLocation?: string;
  pricePerUnitKobo?: string;
  retailPriceKobo?: string;
  wholesaleDiscountPercent?: number;
}

export type UpdateProductDto = Partial<CreateProductDto> & {
  isActive?: boolean;
  categoryId?: string;
  retailPriceKobo?: string;
  wholesaleEnabled?: boolean;
};

export interface SupplierProduct {
  id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  wholesalePriceKobo: number;
  minOrderQty: number;
  isActive: boolean;
  isRecommended?: boolean;
  createdAt: Date;
  updatedAt: Date;
  supplier: {
    companyName: string;
    isVerified: boolean;
  };
}
