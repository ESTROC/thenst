import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center shadow-card">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-soft text-sky">
        <Icon size={26} />
      </span>
      <p className="mt-4 font-display text-lg font-bold text-[var(--ink)]">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-[var(--ink-soft)]">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 rounded-xl bg-sky px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1f7fe0]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
