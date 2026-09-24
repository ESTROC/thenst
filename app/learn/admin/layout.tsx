"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, ShieldCheck, ArrowLeft, LogOut, Menu, X, Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/learn/admin", exact: true },
  { label: "Courses", icon: BookOpen, href: "/learn/admin/courses", exact: false },
  { label: "Admins", icon: ShieldCheck, href: "/learn/admin/admins", exact: false },
];

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <Link href="/learn/admin" onClick={onNavigate} className="flex h-16 items-center gap-2 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky text-white">
          <ShieldCheck size={18} />
        </span>
        <span className="font-display text-lg font-bold text-white">
          NST<span className="text-sky"> Admin</span>
        </span>
      </Link>

      <nav className="mt-4 flex-1 space-y-1 px-3">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-navy-200">Manage</p>
        {nav.map((item) => {
          const Icon = item.icon;
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <button
              key={item.label}
              onClick={() => { router.push(item.href); onNavigate?.(); }}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-white/10 text-white" : "text-navy-100 hover:bg-white/5 hover:text-white"}`}
            >
              <Icon size={18} className={active ? "text-sky" : "text-navy-200"} />
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky" />}
            </button>
          );
        })}
      </nav>

      <div className="space-y-1 px-3 pb-4">
        <div className="my-3 h-px bg-white/10" />
        <button
          onClick={() => { router.push("/learn"); onNavigate?.(); }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-navy-100 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft size={18} className="text-navy-200" /> Back to site
        </button>
        {user && (
          <div className="mt-3 rounded-xl bg-white/5 p-3">
            <p className="truncate text-sm font-semibold text-white">{user.full_name}</p>
            <p className="truncate text-xs text-navy-200">{user.email}</p>
            <button
              onClick={() => { logout(); onNavigate?.(); }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-xs font-semibold text-navy-100 transition-colors hover:bg-white/20 hover:text-white"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const isLoginPage = pathname === "/learn/admin/login";

  useEffect(() => {
    if (isLoginPage || loading) return;
    if (!user || user.role !== "admin") router.replace("/learn/admin/login");
  }, [isLoginPage, loading, user, router]);

  if (isLoginPage) return <>{children}</>;

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <Loader2 size={24} className="animate-spin text-sky" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-navy-500 lg:block">
        <AdminNav />
      </aside>

      <button
        onClick={() => setOpen(true)}
        aria-label="Open admin menu"
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl bg-navy-500 text-white shadow-card lg:hidden"
      >
        <Menu size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-navy-900/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-navy-500 lg:hidden"
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Close admin menu"
                className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-navy-100 hover:bg-white/10"
              >
                <X size={18} />
              </button>
              <AdminNav onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">{children}</div>
    </div>
  );
}
