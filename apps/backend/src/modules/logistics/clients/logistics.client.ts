import { Injectable } from "@nestjs/common";
import { DeliveryStatus } from "@prisma/client";

export interface LogisticsClient {
  getQuote(
    pickup: string,
    delivery: string,
    weightKg?: number,
  ): Promise<{ costKobo: bigint; estimatedMinutes: number }>;

  bookPickup(
    orderId: string,
    pickup: string,
    delivery: string,
    contactPhone: string,
  ): Promise<{ bookingRef: string; trackingUrl: string }>;

  getStatus(
    bookingRef: string,
  ): Promise<{ status: DeliveryStatus; location?: string; eta?: Date }>;
}

@Injectable()
export class MockLogisticsClient implements LogisticsClient {
  async getQuote(
    pickup: string,
    delivery: string,
    weightKg?: number,
  ): Promise<{ costKobo: bigint; estimatedMinutes: number }> {
    // Generate a realistic but fake distance-based cost
    const baseCost = 200000n; // 2000 NGN
    const weightFactor = weightKg ? BigInt(weightKg * 5000) : 0n; // 50 NGN per kg
    const randomDistance = Math.floor(Math.random() * 20) + 5; // 5 to 25 km

    return {
      costKobo: baseCost + weightFactor + BigInt(randomDistance * 10000), // NGN 100 per km
      estimatedMinutes: randomDistance * 3 + 15,
    };
  }

  async bookPickup(
    _orderId: string,
    _pickup: string,
    _delivery: string,
    _contactPhone: string,
  ): Promise<{ bookingRef: string; trackingUrl: string }> {
    const bookingRef = `MOCK-LOG-${Date.now().toString().slice(-6)}-${_orderId.slice(0, 4)}`;
    return {
      bookingRef,
      trackingUrl: `https://track.mocklogistics.com/${bookingRef}`,
    };
  }

  async getStatus(
    _bookingRef: string,
  ): Promise<{ status: DeliveryStatus; location?: string; eta?: Date }> {
    // In a real app we'd fetch this from the partner API.
    // For the mock, we simulate it advancing or default to PICKUP_SCHEDULED.
    return {
      status: "PICKUP_SCHEDULED",
      location: "Logistics Hub A",
      eta: new Date(Date.now() + 60 * 60 * 1000), // ETA in 1 hr
    };
  }
}
