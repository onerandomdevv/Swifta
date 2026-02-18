import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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

  async listByMerchant(merchantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { merchantId, deletedAt: null },
        skip,
        take: +limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.product.count({ where: { merchantId, deletedAt: null } })
    ]);
    return { data, meta: { page, limit, total } };
  }

  async catalogue(search: string = '', page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = {
        isActive: true,
        deletedAt: null,
        ...(search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as any } },
                { description: { contains: search, mode: 'insensitive' as any } },
            ]
        } : {})
    };
    
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: +limit,
        orderBy: { createdAt: 'desc' },
        include: { merchant: { select: { businessName: true } } }
      }),
      this.prisma.product.count({ where })
    ]);
    return { data, meta: { page, limit, total } };
  }

  async getById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { merchant: { select: { businessName: true, verification: true } } }
    });
    if (!product || product.deletedAt) throw new NotFoundException('Product not found');
    return product;
  }

  async update(merchantId: string, productId: string, dto: UpdateProductDto) {
    await this.verifyProductOwnership(merchantId, productId);
    return this.prisma.product.update({
      where: { id: productId },
      data: dto
    });
  }

  async softDelete(merchantId: string, productId: string) {
    await this.verifyProductOwnership(merchantId, productId);
    return this.prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date() }
    });
  }

  async restore(merchantId: string, productId: string) {
    await this.verifyProductOwnership(merchantId, productId);
    return this.prisma.product.update({
      where: { id: productId },
      data: { deletedAt: null }
    });
  }

  private async verifyProductOwnership(merchantId: string, productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.merchantId !== merchantId) throw new ForbiddenException('Access denied');
  }
}
