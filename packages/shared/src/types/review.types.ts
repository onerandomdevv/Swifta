export interface Review {
  id: string;
  orderId: string;
  buyerId: string;
  merchantId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  buyerName?: string;
}

export interface CreateReviewDto {
  orderId: string;
  rating: number;
  comment?: string;
}
