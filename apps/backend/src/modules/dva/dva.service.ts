import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PaystackClient } from "../payment/paystack.client";

@Injectable()
export class DvaService {
  private readonly logger = new Logger(DvaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackClient,
  ) {}

  /**
   * Assures a Paystack Customer exists for the buyer.
   * Creates one on Paystack if missing, then saves the ID/Code to DB.
   */
  async assureCustomer(
    buyerProfileId: string,
    userId: string,
  ): Promise<string> {
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { id: buyerProfileId },
      include: { user: true },
    });

    if (!profile || !profile.user) {
      throw new NotFoundException("Buyer profile or user not found");
    }

    if (profile.paystackCustomerCode) {
      return profile.paystackCustomerCode;
    }

    this.logger.log(`Creating Paystack customer for user ${userId}`);

    const newCustomer = await this.paystack.createCustomer({
      email: profile.user.email,
      firstName: profile.user.firstName,
      lastName: profile.user.lastName,
      phone: profile.user.phone,
    });

    if (!newCustomer?.status || !newCustomer?.data?.customer_code) {
      this.logger.error("Failed to create Paystack customer", newCustomer);
      throw new BadRequestException("Could not create Paystack customer");
    }

    const { customer_code, id } = newCustomer.data;

    await this.prisma.buyerProfile.update({
      where: { id: buyerProfileId },
      data: {
        paystackCustomerCode: customer_code,
        paystackCustomerId: String(id),
      },
    });

    return customer_code;
  }

  /**
   * Creates a Dedicated Virtual Account for the buyer.
   */
  async createDva(userId: string): Promise<any> {
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Buyer profile not found");
    }

    if (profile.dvaActive && profile.dvaAccountNumber) {
      throw new BadRequestException("Buyer already has an active DVA");
    }

    // Ensure customer exists on Paystack
    const customerCode = await this.assureCustomer(profile.id, userId);

    this.logger.log(`Creating DVA for customer ${customerCode}`);

    // Create DVA
    const dvaResponse =
      await this.paystack.createDedicatedVirtualAccount(customerCode);

    if (!dvaResponse?.status) {
      this.logger.error("Failed to create DVA", dvaResponse);
      throw new BadRequestException(
        "Could not create Dedicated Virtual Account",
      );
    }

    // Paystack processes DVAs asynchronously sometimes, but often returns details immediately
    // If it returns them, save them immediately. Otherwise, rely on webhooks.
    if (dvaResponse.data?.account_number) {
      const data = dvaResponse.data;
      await this.prisma.buyerProfile.update({
        where: { id: profile.id },
        data: {
          dvaAccountNumber: data.account_number,
          dvaAccountName: data.account_name,
          dvaBankName: data.bank?.name,
          dvaBankSlug: data.bank?.slug,
          dvaActive: true,
        },
      });
    }

    return {
      message: "DVA creation initiated successfully",
      status: "PENDING_OR_CREATED",
      dva: dvaResponse.data
        ? {
            accountNumber: dvaResponse.data.account_number,
            accountName: dvaResponse.data.account_name,
            bankName: dvaResponse.data.bank?.name,
          }
        : null,
    };
  }

  /**
   * Get the current user's DVA status/details
   */
  async getDva(userId: string): Promise<any> {
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
      select: {
        dvaActive: true,
        dvaAccountNumber: true,
        dvaAccountName: true,
        dvaBankName: true,
      },
    });

    if (!profile) {
      throw new NotFoundException("Buyer profile not found");
    }

    return {
      active: profile.dvaActive,
      accountNumber: profile.dvaAccountNumber,
      accountName: profile.dvaAccountName,
      bankName: profile.dvaBankName,
    };
  }

  /**
   * Called by the PaymentService webhook handler when a DVA is successfully assigned
   */
  async handleDvaAssignSuccess(payload: any): Promise<void> {
    const { customer, dedicated_account } = payload;

    if (!customer?.customer_code || !dedicated_account?.account_number) {
      this.logger.warn("Invalid DVA success webhook payload", payload);
      return;
    }

    const profile = await this.prisma.buyerProfile.findFirst({
      where: { paystackCustomerCode: customer.customer_code },
    });

    if (!profile) {
      this.logger.warn(
        `Received DVA webhook for unknown customer code ${customer.customer_code}`,
      );
      return;
    }

    await this.prisma.buyerProfile.update({
      where: { id: profile.id },
      data: {
        dvaAccountNumber: dedicated_account.account_number,
        dvaAccountName: dedicated_account.account_name,
        dvaBankName: dedicated_account.bank?.name,
        dvaBankSlug: dedicated_account.bank?.slug,
        dvaActive: true,
      },
    });

    this.logger.log(`Successfully activated DVA for buyer ${profile.id}`);
  }

  /**
   * Called by the PaymentService webhook handler when DVA assignment fails
   */
  async handleDvaAssignFailed(payload: any): Promise<void> {
    const { customer } = payload;

    if (!customer?.customer_code) {
      this.logger.warn("Invalid DVA failed webhook payload", payload);
      return;
    }

    const profile = await this.prisma.buyerProfile.findFirst({
      where: { paystackCustomerCode: customer.customer_code },
    });

    if (!profile) {
      return;
    }

    // Ideally, we might want a 'failed' state, but setting active=false is sufficient here
    await this.prisma.buyerProfile.update({
      where: { id: profile.id },
      data: {
        dvaActive: false,
      },
    });

    this.logger.error(`DVA assignment failed for buyer ${profile.id}`);
  }
}
