import { InventoryEventType } from '../enums/inventory-event-type.enum';

export interface InventoryEvent {
  id: string;
  productId: string;
  merchantId: string;
  eventType: InventoryEventType;
  quantity: number;
  referenceId?: string;
  notes?: string;
  createdAt: Date;
}

export interface CurrentStock {
  productId: string;
  merchantId: string;
  stock: number;
}

export interface UpdateStockDto {
  quantity: number;
  notes?: string;
}
