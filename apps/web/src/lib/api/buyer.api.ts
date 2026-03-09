import { apiClient } from "../api-client";

export interface BuyerDashboardStats {
  activeOrdersCount: number;
  pendingQuotesCount: number;
  totalOrdersCount: number;
  totalSpendingKobo: string;
}

export const buyerApi = {
  getDashboardStats: () =>
    apiClient.get<BuyerDashboardStats>("/buyer/dashboard/stats"),
};
