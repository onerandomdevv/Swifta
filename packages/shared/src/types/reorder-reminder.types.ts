import { ReorderReminderStatus } from "../enums/reorder-reminder-status.enum";

export interface ReorderReminder {
  id: string;
  orderId: string;
  buyerId: string;
  merchantId: string;
  productCategory: string;
  productName: string;
  originalQuantity: number;
  remindAt: string | Date;
  status: ReorderReminderStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
}
