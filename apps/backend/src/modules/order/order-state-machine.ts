import { OrderStatus, ORDER_TRANSITIONS } from "@swifta/shared";

export function validateTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  const allowed = ORDER_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function getNextStates(from: OrderStatus): OrderStatus[] {
  return ORDER_TRANSITIONS[from] || [];
}
