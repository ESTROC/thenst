"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAvatar } from "@/context/AvatarContext";
import { AvatarRenderer } from "@/components/learn/avatar/AvatarRenderer";
import { AvatarEditor } from "@/components/learn/avatar/AvatarEditor";
import { Pencil } from "lucide-react";

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">{children}</div>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">{label}</p>
      <p className="mt-1 text-sm text-[var(--ink)]">{value}</p>
    </div>
  );
}

export function ProfileSection() {
  const { user } = useAuth();
  const { avatar } = useAvatar();
  const [custOpen, setCustOpen] = useState(false);

  if (!user) return <p className="text-[var(--ink-soft)]">Sign in to view your profile.</p>;

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center gap-4">
          <button onClick={() => setCustOpen(true)} className="group relative rounded-full shadow-card">
            <AvatarRenderer config={avatar} size={72} />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-sky text-white ring-2 ring-[var(--surface)]">
              <Pencil size={12} />
            </span>
          </button>
          <div>
            <p className="font-display text-lg font-bold text-[var(--ink)]">{user.full_name}</p>
            <p className="text-sm text-[var(--ink-soft)]">{user.email}</p>
          </div>
          <button onClick={() => setCustOpen(true)} className="ml-auto rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-sky">
            Customize avatar
          </button>
        </div>
      </Card>

      <Card>
        <p className="font-display font-bold text-[var(--ink)]">Profile details</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" value={user.full_name} />
          <Field label="Email" value={user.email} />
          <Field label="Role" value={user.role} />
          <Field label="Member since" value={new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />
        </div>
      </Card>

      <AvatarEditor open={custOpen} onClose={() => setCustOpen(false)} />
    </div>
  );
}