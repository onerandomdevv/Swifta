import { getCategories } from "@/lib/api/category.api";
import { getRecommendedCatalogue } from "@/lib/api/supplier.api";

export const categoryApi = {
  getCategories,
};

export const supplierApi = {
  getRecommendedCatalogue,
};
