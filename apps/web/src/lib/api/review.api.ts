import { apiClient } from "../api-client";
import { CreateReviewDto, Review } from "@hardware-os/shared";

export const createReview = async (dto: CreateReviewDto): Promise<Review> => {
  return apiClient.post<Review>("/reviews", dto);
};

export const getMerchantReviews = async (
  merchantId: string,
  page = 1,
  limit = 10,
): Promise<Review[]> => {
  return apiClient.get<Review[]>(`/reviews/merchant/${merchantId}`, {
    params: { page: page.toString(), limit: limit.toString() },
  });
};

export const getOrderReview = async (
  orderId: string,
): Promise<Review | null> => {
  try {
    return await apiClient.get<Review>(`/reviews/order/${orderId}`);
  } catch (error) {
    return null;
  }
};
