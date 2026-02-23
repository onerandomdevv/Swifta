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
  createdAt: Date;
  updatedAt: Date;
  merchant?: any;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  unit: string;
  categoryTag: string;
  imageUrl?: string;
  minOrderQuantity?: number;
}

export type UpdateProductDto = Partial<CreateProductDto>;
