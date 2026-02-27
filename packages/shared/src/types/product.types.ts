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
  warehouseLocation?: string;
  createdAt: Date;
  updatedAt: Date;
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
}

export type UpdateProductDto = Partial<CreateProductDto> & {
  isActive?: boolean;
};
