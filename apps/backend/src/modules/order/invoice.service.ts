import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import PDFDocument from "pdfkit";
import { Response } from "express";
import { JwtPayload } from "@swifta/shared";

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  async generateInvoice(orderId: string, res: Response, user: JwtPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            buyerProfile: true,
          },
        },
        merchantProfile: {
          select: {
            businessName: true,
            businessAddress: true,
          },
        },
      },
    });

    if (!order) throw new NotFoundException("Order not found");

    if (order.buyerId !== user.sub && order.merchantId !== user?.merchantId) {
      throw new ForbiddenException(
        "You do not have permission to view this invoice",
      );
    }

    const doc = new PDFDocument({ margin: 50, size: "A4" });

    // Set headers for download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Invoice-${order.id.slice(0, 8)}.pdf`,
    );

    doc.pipe(res);

    // --- Header ---
    this.generateHeader(doc);
    this.generateCustomerInformation(doc, order);
    this.generateInvoiceTable(doc, order);
    this.generateFooter(doc);

    doc.end();
  }

  private generateHeader(doc: PDFKit.PDFDocument) {
    doc
      .fillColor("#444444")
      .fontSize(20)
      .text("Swifta", 50, 45, { align: "left" })
      .fontSize(10)
      .text("Hardware & Industrial Procurement", 50, 70, { align: "left" })
      .fillColor("#000000")
      .fontSize(10)
      .text("Invoice", 200, 50, { align: "right" })
      .text(`Date: ${new Date().toLocaleDateString()}`, 200, 65, {
        align: "right",
      })
      .moveDown();
  }

  private generateCustomerInformation(doc: PDFKit.PDFDocument, order: any) {
    const shipping = order.deliveryAddress || "Pick-up";
    doc
      .fillColor("#444444")
      .fontSize(12)
      .text("Bill To:", 50, 140)
      .fontSize(10)
      .fillColor("#000000")
      .text(`${order.user.firstName} ${order.user.lastName}`, 50, 155)
      .text(order.user.email, 50, 170)
      .text(order.user.phone, 50, 185)
      .moveDown();

    doc
      .fontSize(12)
      .fillColor("#444444")
      .text("Merchant:", 300, 140)
      .fontSize(10)
      .fillColor("#000000")
      .text(order.merchantProfile?.businessName || "N/A", 300, 155)
      .text(order.merchantProfile?.businessAddress || "N/A", 300, 170)
      .moveDown();

    this.generateHr(doc, 215);
  }

  private generateInvoiceTable(doc: PDFKit.PDFDocument, order: any) {
    const invoiceTableTop = 230;

    doc.font("Helvetica-Bold");
    this.generateTableRow(
      doc,
      invoiceTableTop,
      "Item",
      "Description",
      "Unit Cost",
      "Quantity",
      "Line Total",
    );
    this.generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");

    const items = (order.items as any[]) || [];
    let position = invoiceTableTop + 30;

    items.forEach((item) => {
      const lineTotal = (Number(item.unitPriceKobo) * item.quantity) / 100;
      this.generateTableRow(
        doc,
        position,
        item.name,
        item.priceType || "Standard",
        (Number(item.unitPriceKobo) / 100).toLocaleString("en-NG", {
          style: "currency",
          currency: "NGN",
        }),
        item.quantity.toString(),
        lineTotal.toLocaleString("en-NG", {
          style: "currency",
          currency: "NGN",
        }),
      );

      position += 20;
    });

    const subtotal =
      Number(order.totalAmountKobo) - Number(order.deliveryFeeKobo);
    const subtotalPosition = position + 30;
    this.generateTableRow(
      doc,
      subtotalPosition,
      "",
      "",
      "Subtotal",
      "",
      (subtotal / 100).toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
      }),
    );

    const deliveryPosition = subtotalPosition + 20;
    this.generateTableRow(
      doc,
      deliveryPosition,
      "",
      "",
      "Delivery Fee",
      "",
      (Number(order.deliveryFeeKobo) / 100).toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
      }),
    );

    const duePosition = deliveryPosition + 25;
    doc.font("Helvetica-Bold");
    this.generateTableRow(
      doc,
      duePosition,
      "",
      "",
      "Total Paid",
      "",
      (Number(order.totalAmountKobo) / 100).toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
      }),
    );
    doc.font("Helvetica");
  }

  private generateFooter(doc: PDFKit.PDFDocument) {
    doc
      .fontSize(10)
      .text(
        "Thank you for your business. Payment was successfully processed via Paystack Escrow.",
        50,
        700,
        { align: "center", width: 500 },
      );
  }

  private generateTableRow(
    doc: PDFKit.PDFDocument,
    y: number,
    item: string,
    description: string,
    unitCost: string,
    quantity: string,
    lineTotal: string,
  ) {
    doc
      .fontSize(10)
      .text(item, 50, y)
      .text(description, 150, y)
      .text(unitCost, 280, y, { width: 90, align: "right" })
      .text(quantity, 370, y, { width: 90, align: "right" })
      .text(lineTotal, 0, y, { align: "right" });
  }

  private generateHr(doc: PDFKit.PDFDocument, y: number) {
    doc
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();
  }
}
