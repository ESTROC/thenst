"use client";

import { CreditCard, Check, Download } from "lucide-react";

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">{children}</div>;
}

export function BillingSection() {
  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display font-bold text-[var(--ink)]">Current plan</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">You&apos;re on the Free plan.</p>
          </div>
          <span className="rounded-full bg-emerald-soft px-3 py-1 text-xs font-semibold text-emerald">Free</span>
        </div>
        <button className="mt-4 rounded-xl bg-sky px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1f7fe0]">
          Upgrade plan
        </button>
      </Card>

      <Card>
        <p className="font-display font-bold text-[var(--ink)]">Payment methods</p>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">No payment method added yet.</p>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-[var(--border)] p-4 text-[var(--ink-soft)]">
          <CreditCard size={20} />
          <span className="text-sm">Add UPI, card, or netbanking</span>
          <button className="ml-auto rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition-colors hover:border-sky">Add method</button>
        </div>
      </Card>

      <Card>
        <p className="font-display font-bold text-[var(--ink)]">Billing history</p>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">No invoices yet. Your purchases will appear here.</p>
        <div className="mt-4 space-y-2 opacity-50">
          {["—", "—"].map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3 text-sm">
              <span className="text-[var(--ink-soft)]">No invoice</span>
              <Download size={15} className="text-[var(--ink-soft)]" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}