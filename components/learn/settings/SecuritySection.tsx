"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Check, AlertTriangle } from "lucide-react";

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">{children}</div>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-sky" />;
}

export function SecuritySection() {
  const { user } = useAuth();
  const router = useRouter();
  const isGoogle = user?.auth_provider === "google";

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const [delPass, setDelPass] = useState("");
  const [delMsg, setDelMsg] = useState<string | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  async function changePassword() {
    setMsg(null); setOk(false);
    if (next.length < 8) { setMsg("New password must be at least 8 characters."); return; }
    const u = auth.currentUser;
    if (!u || !u.email) return;
    setBusy(true);
    try {
      await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, current));
      await updatePassword(u, next);
      setOk(true); setCurrent(""); setNext("");
    } catch {
      setMsg("Current password is incorrect.");
    } finally { setBusy(false); }
  }

  async function deleteAccount() {
    setDelMsg(null);
    const u = auth.currentUser;
    if (!u || !u.email) return;
    setDelBusy(true);
    try {
      await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, delPass));
      await deleteDoc(doc(db, "users", u.uid));
      await deleteUser(u);
      router.push("/learn/login");
    } catch {
      setDelMsg("Password incorrect or re-login required.");
    } finally { setDelBusy(false); }
  }

  if (!user) return <p className="text-[var(--ink-soft)]">Sign in to manage security.</p>;

  return (
    <div className="space-y-5">
      <Card>
        <p className="font-display font-bold text-[var(--ink)]">Password</p>
        {isGoogle ? (
          <p className="mt-2 text-sm text-[var(--ink-soft)]">You signed in with Google. Password is managed through your Google account.</p>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Current password</label>
              <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">New password</label>
              <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
            </div>
            {msg && <p className="text-sm text-red-500">{msg}</p>}
            <button onClick={changePassword} disabled={busy || !current || !next} className="flex items-center gap-2 rounded-xl bg-sky px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1f7fe0] disabled:opacity-50">
              {ok ? <><Check size={16} /> Updated</> : busy ? "Updating..." : "Update password"}
            </button>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-2 text-red-500">
          <AlertTriangle size={18} />
          <p className="font-display font-bold">Danger zone</p>
        </div>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">Permanently delete your account and all associated data. This cannot be undone.</p>
        {!isGoogle && (
          <div className="mt-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Confirm password</label>
            <Input type="password" value={delPass} onChange={(e) => setDelPass(e.target.value)} />
          </div>
        )}
        {delMsg && <p className="mt-2 text-sm text-red-500">{delMsg}</p>}
        <button onClick={deleteAccount} disabled={delBusy || (!isGoogle && !delPass)} className="mt-4 rounded-xl border border-red-500 px-4 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50">
          {delBusy ? "Deleting..." : "Delete account"}
        </button>
        {isGoogle && <p className="mt-2 text-xs text-[var(--ink-soft)]">Google account deletion may require recent re-login.</p>}
      </Card>
    </div>
  );
}