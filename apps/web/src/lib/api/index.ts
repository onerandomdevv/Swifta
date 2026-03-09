import { getCategories } from "@/lib/api/category.api";
import { getRecommendedCatalogue } from "@/lib/api/supplier.api";
import { buyerApi } from "./buyer.api";

export const categoryApi = {
  getCategories,
};

export const supplierApi = {
  getRecommendedCatalogue,
};

export { buyerApi };
