import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { slugify } from "../../common/utils/slugify";

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug || slugify(dto.name);

    // Check if slug exists
    const existing = await this.prisma.category.findFirst({ where: { slug } });
    if (existing) {
      throw new BadRequestException(
        `Category with slug "${slug}" already exists`,
      );
    }

    return this.prisma.category.create({
      data: {
        ...dto,
        slug,
      },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  }

  async findTree() {
    // Only get top-level categories and include their children
    const categories = await this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    // Manually fetch counts for each category to ensure hierarchical accuracy
    const treeWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await this.prisma.product.count({
          where: {
            OR: [{ categoryId: cat.id }, { category: { parentId: cat.id } }],
            isActive: true,
            deletedAt: null,
          },
        });

        const childrenWithCounts = await Promise.all(
          cat.children.map(async (child) => {
            const childCount = await this.prisma.product.count({
              where: {
                categoryId: child.id,
                isActive: true,
                deletedAt: null,
              },
            });
            return { ...child, productCount: childCount };
          }),
        );

        return { ...cat, productCount, children: childrenWithCounts };
      }),
    );

    return treeWithCounts;
  }

  async findMerchantActiveCategories(merchantId: string) {
    const products = await this.prisma.product.findMany({
      where: { merchantId, isActive: true, deletedAt: null },
      select: { categoryId: true },
      distinct: ["categoryId"],
    });

    const categoryIds = products.map((p) => p.categoryId);

    return this.prisma.category.findMany({
      where: {
        id: { in: categoryIds },
        isActive: true,
      },
      orderBy: { name: "asc" },
    });
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    // Include product count
    const productCount = await this.prisma.product.count({
      where: {
        OR: [
          { categoryId: category.id },
          { category: { parentId: category.id } },
        ],
        isActive: true,
        deletedAt: null,
      },
    });

    return { ...category, productCount };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    const data: any = { ...dto };
    let slug = dto.slug;

    if (dto.name && !slug) {
      slug = slugify(dto.name);
    }

    if (slug) {
      // Check if slug is already taken by another category (not this one)
      const existing = await this.prisma.category.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Category with slug "${slug}" already exists`,
        );
      }
      data.slug = slug;
    }

    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
