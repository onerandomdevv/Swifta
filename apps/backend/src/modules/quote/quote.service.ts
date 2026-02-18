import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationTriggerService } from '../notification/notification-trigger.service';
import { OrderService } from '../order/order.service';
import { SubmitQuoteDto } from './dto/submit-quote.dto';
import { RFQStatus, QuoteStatus } from '@hardware-os/shared';

@Injectable()
export class QuoteService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationTriggerService,
    private orderService: OrderService
  ) {}

  async submit(merchantId: string, dto: SubmitQuoteDto) {
    const rfq = await this.prisma.rFQ.findUnique({ where: { id: dto.rfqId } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    if (rfq.status !== RFQStatus.OPEN && rfq.status !== RFQStatus.QUOTED) {
        throw new BadRequestException('RFQ is not open for quotes');
    }
    if (rfq.merchantId !== merchantId) {
        throw new ForbiddenException('You can only quote for your own RFQs');
    }

    const quote = await this.prisma.quote.create({
      data: {
        rfqId: dto.rfqId,
        merchantId,
        unitPriceKobo: dto.unitPriceKobo,
        totalPriceKobo: dto.totalPriceKobo,
        deliveryFeeKobo: dto.deliveryFeeKobo,
        validUntil: new Date(dto.validUntil),
        notes: dto.notes,
        status: QuoteStatus.PENDING
      },
    });

    await this.prisma.rFQ.update({
        where: { id: dto.rfqId },
        data: { status: RFQStatus.QUOTED }
    });

    await this.notifications.triggerQuoteReceived(rfq.buyerId, quote.id);

    return quote;
  }

  async accept(buyerId: string, quoteId: string) {
    const quote = await this.prisma.quote.findUnique({
        where: { id: quoteId },
        include: { rfq: true }
    });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.rfq.buyerId !== buyerId) throw new ForbiddenException('Access denied');
    if (quote.status !== QuoteStatus.PENDING) throw new BadRequestException('Quote is not pending');

    // Update quote status
    await this.prisma.quote.update({
        where: { id: quoteId },
        data: { status: QuoteStatus.ACCEPTED }
    });

    // Update RFQ status
    await this.prisma.rFQ.update({
        where: { id: quote.rfqId },
        data: { status: RFQStatus.ACCEPTED }
    });

    // Decline other quotes for same RFQ
    await this.prisma.quote.updateMany({
        where: { rfqId: quote.rfqId, id: { not: quoteId } },
        data: { status: QuoteStatus.DECLINED }
    });

    // Create Order
    await this.orderService.createFromQuote(quoteId, buyerId);

    await this.notifications.triggerQuoteAccepted(quote.merchantId, quoteId);

    return { message: 'Quote accepted and order created' };
  }

  async decline(buyerId: string, quoteId: string) {
     const quote = await this.prisma.quote.findUnique({
        where: { id: quoteId },
        include: { rfq: true }
    });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.rfq.buyerId !== buyerId) throw new ForbiddenException('Access denied');

    await this.prisma.quote.update({
        where: { id: quoteId },
        data: { status: QuoteStatus.DECLINED }
    });

    await this.notifications.triggerQuoteDeclined(quote.merchantId, quoteId);
    
    return { message: 'Quote declined' };
  }

  async getByRFQ(rfqId: string) {
    return this.prisma.quote.findMany({
        where: { rfqId },
        orderBy: { createdAt: 'desc' },
        include: { merchant: { select: { businessName: true } } }
    });
  }
}
