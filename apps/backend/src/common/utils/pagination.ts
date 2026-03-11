import { PaginatedResponse } from "@hardware-os/shared";

export interface PaginationParams {
  page: number;
  limit: number;
}

export async function paginate<T>(
  model: any,
  params: PaginationParams,
  options: any = {},
): Promise<PaginatedResponse<T>> {
  const { page, limit } = params;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.findMany({
      ...options,
      skip,
      take: limit,
    }),
    model.count({ where: options.where }),
  ]);

  return {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
    },
  };
}
