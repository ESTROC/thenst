"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, Compass, Bookmark, Award,
  BarChart3, Settings, LifeBuoy, GraduationCap, Menu, X, LogOut,
} from "lucide-react";
import { AvatarRenderer } from "@/components/learn/avatar/AvatarRenderer";
import { AvatarEditor } from "@/components/learn/avatar/AvatarEditor";
import { useAvatar } from "@/context/AvatarContext";
import { useAuth } from "@/context/AuthContext";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, accent: "text-sky", href: "/learn" },
  { label: "My Courses", icon: BookOpen, accent: "text-emerald", href: "/learn/my-courses" },
  { label: "Explore", icon: Compass, accent: "text-violet", href: "/learn/explore" },
  { label: "Bookmarks", icon: Bookmark, accent: "text-amber", href: "/learn/bookmarks" },
  { label: "Certificates", icon: Award, accent: "text-emerald", href: "/learn/certificates" },
  { label: "Analytics", icon: BarChart3, accent: "text-sky", href: "/learn/analytics" },
];

function NavContent({ onNavigate, onCustomize }: { onNavigate?: () => void; onCustomize: () => void }) {
  const { avatar } = useAvatar();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <Link href="/learn" onClick={onNavigate} className="flex h-16 items-center gap-2 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky text-white">
          <GraduationCap size={18} />
        </span>
        <span className="font-display text-lg font-bold text-white">
          NST<span className="text-sky"> Learn</span>
        </span>
      </Link>

      <nav className="mt-4 flex-1 space-y-1 px-3">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-navy-200">Menu</p>
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <button key={item.label} onClick={() => { router.push(item.href); onNavigate?.(); }}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-white/10 text-white" : "text-navy-100 hover:bg-white/5 hover:text-white"}`}>
              <Icon size={18} className={active ? item.accent : "text-navy-200"} />
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky" />}
            </button>
          );
        })}
      </nav>

      <div className="space-y-1 px-3 pb-4">
        <div className="my-3 h-px bg-white/10" />
       <button onClick={() => { router.push("/learn/settings"); onNavigate?.(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-navy-100 transition-colors hover:bg-white/5 hover:text-white">
          <Settings size={18} className="text-navy-200" /> Settings
        </button>
        <button onClick={onNavigate} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-navy-100 transition-colors hover:bg-white/5 hover:text-white">
          <LifeBuoy size={18} className="text-navy-200" /> Help &amp; Support
        </button>

        {/* User always authenticated (RouteGuard protects /learn routes) */}
        <div className="mt-3 rounded-xl bg-white/5 p-3">
          <button onClick={onCustomize} className="flex w-full items-center gap-3 text-left">
            <AvatarRenderer config={avatar} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user?.full_name}</p>
              <p className="truncate text-xs text-navy-200">{user?.email}</p>
            </div>
          </button>
          <button
            onClick={() => { logout(); onNavigate?.(); }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-xs font-semibold text-navy-100 transition-colors hover:bg-white/20 hover:text-white"
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const [custOpen, setCustOpen] = useState(false);
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-navy-500 lg:block">
        <NavContent onCustomize={() => setCustOpen(true)} />
      </aside>
      <button onClick={() => setOpen(true)} aria-label="Open menu" className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl bg-navy-500 text-white shadow-card lg:hidden">
        <Menu size={18} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-navy-900/50 backdrop-blur-sm lg:hidden" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed inset-y-0 left-0 z-50 w-64 bg-navy-500 lg:hidden">
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-navy-100 hover:bg-white/10"><X size={18} /></button>
              <NavContent onNavigate={() => setOpen(false)} onCustomize={() => { setOpen(false); setCustOpen(true); }} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <AvatarEditor open={custOpen} onClose={() => setCustOpen(false)} />
    </>
  );
}
