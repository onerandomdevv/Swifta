import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginatedResponse, Product } from '@hardware-os/shared';
import { paginate } from '../../common/utils/pagination';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(merchantId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        merchantId,
        ...dto,
      },
    });
  }

  async listByMerchant(merchantId: string, page: number, limit: number): Promise<PaginatedResponse<Product>> {
    const response = await paginate(this.prisma.product, { page, limit }, {
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    });

    // Mark soft-deleted products with a flag (for frontend convenience if needed)
    response.data = response.data.map((product: any) => ({
      ...product,
      isDeleted: product.deletedAt !== null,
    }));

    return response;
  }

  async catalogue(search: string = '', page: number, limit: number): Promise<PaginatedResponse<Product>> {
    const where: any = {
      isActive: true,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { categoryTag: { contains: search, mode: 'insensitive' } },
      ];
    }

    return paginate(this.prisma.product, { page, limit }, {
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });
  }

  async getById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
            verification: true,
          },
        },
      },
    });
    if (!product || product.deletedAt) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(merchantId: string, productId: string, dto: UpdateProductDto) {
    await this.verifyProductOwnership(merchantId, productId);
    return this.prisma.product.update({
      where: { id: productId },
      data: dto,
    });
  }

  async softDelete(merchantId: string, productId: string) {
    await this.verifyProductOwnership(merchantId, productId);
    return this.prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date() },
    });
  }

  async restore(merchantId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.merchantId !== merchantId) {
      throw new ForbiddenException('Access denied');
    }
    return this.prisma.product.update({
      where: { id: productId },
      data: { deletedAt: null },
    });
  }

  async validateProductAvailability(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestException('Product is not currently active');
    }

    return product;
  }

  private async verifyProductOwnership(
    merchantId: string,
    productId: string,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, merchantId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.deletedAt) {
      throw new NotFoundException('Product has been deleted');
    }
  }
}
