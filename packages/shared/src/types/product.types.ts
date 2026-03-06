import { MerchantProfile } from "./merchant.types";

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  unit: string;
  categoryTag: string;
  imageUrl?: string;
  minOrderQuantity: number;
  isActive: boolean;
  pricePerUnitKobo?: string;
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
  imageUrl?: string;
  minOrderQuantity?: number;
  warehouseLocation?: string;
  pricePerUnitKobo?: string;
}

export type UpdateProductDto = Partial<CreateProductDto> & {
  isActive?: boolean;
};
