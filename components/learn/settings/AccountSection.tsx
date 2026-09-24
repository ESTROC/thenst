"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { Check } from "lucide-react";

export function AccountSection() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user) return <p className="text-[var(--ink-soft)]">Sign in to manage your account.</p>;

  async function save() {
    if (!auth.currentUser || !name.trim()) return;
    setSaving(true); setSaved(false);
    await updateProfile(auth.currentUser, { displayName: name });
    await updateDoc(doc(db, "users", user!.id), { full_name: name });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
      <p className="font-display font-bold text-[var(--ink)]">Account information</p>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">Update your personal details.</p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-sky"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Email</label>
          <input
            value={user.email}
            disabled
            className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink-soft)] outline-none"
          />
          <p className="mt-1 text-xs text-[var(--ink-soft)]">Email is linked to your login and can&apos;t be changed here.</p>
        </div>

        <button
          onClick={save}
          disabled={saving || name === user.full_name}
          className="flex items-center gap-2 rounded-xl bg-sky px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1f7fe0] disabled:opacity-50"
        >
          {saved ? <><Check size={16} /> Saved</> : saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}