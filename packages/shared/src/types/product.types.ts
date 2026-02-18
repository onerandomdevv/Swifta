export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  unit: string;
  categoryTag: string;
  minOrderQuantity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  unit: string;
  categoryTag: string;
  minOrderQuantity?: number;
}

export type UpdateProductDto = Partial<CreateProductDto>;
