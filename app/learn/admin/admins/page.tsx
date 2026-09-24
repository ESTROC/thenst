"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, RefreshCw, ShieldCheck, ShieldOff, UserPlus } from "lucide-react";
import { ConfirmDialog } from "@/components/learn/admin/ConfirmDialog";
import { EmptyState } from "@/components/learn/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { AdminUser, demoteAdmin, getAdmins, promoteToAdmin } from "@/lib/learn/admin";
import { isMasterAdmin } from "@/lib/learn/master-admin";

export default function AdminAdminsPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const [toRemove, setToRemove] = useState<AdminUser | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const load = useCallback(() => {
    setAdmins(null);
    setLoadError(null);
    getAdmins()
      .then((list) => setAdmins([...list].sort((a, b) => a.full_name.localeCompare(b.full_name))))
      .catch(() => setLoadError("Could not load admins."));
  }, []);

  useEffect(() => load(), [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);
    setAdding(true);
    try {
      await promoteToAdmin(email);
      setAddSuccess(`${email.trim()} is now an admin.`);
      setEmail("");
      load();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Could not add admin.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove() {
    if (!toRemove) return;
    setRemoving(true);
    setRemoveError(null);
    try {
      await demoteAdmin(toRemove.id);
      setToRemove(null);
      load();
    } catch {
      setRemoveError("Could not remove admin access. Try again.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Admins</h1>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Admins can manage courses and grant admin access to others.
      </p>

      <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
        <p className="font-display font-bold text-[var(--ink)]">Add an admin</p>
        <p className="mt-0.5 text-xs text-[var(--ink-soft)]">
          The person must already have an account — enter the email they signed up with.
        </p>
        <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3">
            <Mail size={16} className="text-[var(--ink-soft)]" />
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setAddError(null); setAddSuccess(null); }}
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-[var(--ink-soft)]"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="flex items-center justify-center gap-2 rounded-xl bg-sky px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1f7fe0] disabled:opacity-60"
          >
            {adding ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            Add admin
          </button>
        </form>
        {addError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{addError}</p>}
        {addSuccess && (
          <p className="mt-3 rounded-lg bg-emerald-soft px-3 py-2 text-sm font-medium text-emerald">{addSuccess}</p>
        )}
      </section>

      <div className="mt-6">
        {loadError ? (
          <div className="flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center shadow-card">
            <p className="text-sm text-[var(--ink-soft)]">{loadError}</p>
            <button
              onClick={load}
              className="mt-4 flex items-center gap-2 rounded-xl bg-sky px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1f7fe0]"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : admins === null ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="skeleton h-16 rounded-2xl" />))}
          </div>
        ) : admins.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No admins found"
            message="Add the first admin using the form above."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-card">
            {admins.map((a, i) => {
              const isSelf = a.id === user?.id;
              const isMaster = isMasterAdmin(a.email);
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-[var(--border)]" : ""}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-soft text-violet">
                    <ShieldCheck size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[var(--ink)]">
                      {a.full_name || a.email}
                      {isSelf && <span className="ml-2 rounded-md bg-sky-soft px-1.5 py-0.5 text-xs font-semibold text-sky">You</span>}
                    </p>
                    <p className="truncate text-xs text-[var(--ink-soft)]">{a.email}</p>
                  </div>
                  <button
                    onClick={() => { setRemoveError(null); setToRemove(a); }}
                    disabled={isSelf || isMaster}
                    title={
                      isMaster
                        ? "Master admin cannot be removed"
                        : isSelf
                          ? "You cannot remove your own admin access"
                          : "Remove admin access"
                    }
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ShieldOff size={13} /> Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {removeError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{removeError}</p>}
      </div>

      <ConfirmDialog
        open={toRemove !== null}
        title="Remove admin access?"
        message={`${toRemove?.full_name || toRemove?.email || "This user"} will become a regular student and lose access to the admin panel.`}
        confirmLabel="Remove access"
        busy={removing}
        onConfirm={handleRemove}
        onCancel={() => { if (!removing) setToRemove(null); }}
      />
    </main>
  );
}
