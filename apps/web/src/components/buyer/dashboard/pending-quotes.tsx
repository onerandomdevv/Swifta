import React from "react";
import { QuoteCard } from "./quote-card";

interface Props {
  quotes: any[];
}

export function PendingQuotes({ quotes }: Props) {
  if (!quotes || quotes.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
        <span className="material-symbols-outlined text-amber-500">
          priority_high
        </span>
        Pending Quotes (Action Required)
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {quotes.map((quote) => (
          <QuoteCard key={quote.id} rfq={quote} />
        ))}
      </div>
    </section>
  );
}
