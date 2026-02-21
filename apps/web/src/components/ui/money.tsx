import * as React from "react";
import { cn } from "@/lib/utils";
import { formatKobo } from "@hardware-os/shared";

interface MoneyProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: bigint | number;
  className?: string;
}

/**
 * A standard component for rendering currency amounts consistently.
 * Uses the shared `formatKobo` utility for NGN localization.
 */
export function Money({ amount, className, ...props }: MoneyProps) {
  // Ensure we have a bigint for the shared utility
  const kobo = typeof amount === "number" ? BigInt(Math.round(amount)) : amount;

  return (
    <span className={cn("font-semibold tabular-nums", className)} {...props}>
      {formatKobo(kobo)}
    </span>
  );
}
