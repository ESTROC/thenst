"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, GraduationCap, LogOut, Settings } from "lucide-react";
import { Course } from "@/lib/learn/types";
import { getCourses } from "@/lib/learn/courses";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // debounce typing ~150ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  // close search dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // close user menu on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q || !courses) return [];
    return courses
      .filter((c) =>
        [c.title, c.category, c.description].some((s) => s.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [debouncedQuery, courses]);

  useEffect(() => setHighlighted(0), [results]);

  const showDropdown = open && query.trim().length > 0;

  function ensureCourses() {
    if (courses === null) getCourses().then(setCourses).catch(() => setCourses([]));
  }

  function goTo(slug: string) {
    setQuery("");
    setOpen(false);
    router.push(`/learn/courses/${slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      const r = results[highlighted];
      if (r) {
        e.preventDefault();
        goTo(r.slug);
      }
    }
  }

  async function handleLogout() {
    setShowUserMenu(false);
    await logout();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/learn" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-500 text-white">
            <GraduationCap size={18} />
          </span>
          <span className="font-display text-lg font-bold text-[var(--ink)]">
            NST<span className="text-sky"> Learn</span>
          </span>
        </Link>

        <div ref={boxRef} className="relative ml-4 hidden flex-1 md:block">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
            <Search size={16} className="text-[var(--ink-soft)]" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => {
                ensureCourses();
                setOpen(true);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search courses, skills, instructors…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--ink-soft)]"
              role="combobox"
              aria-expanded={showDropdown}
              aria-controls="header-search-results"
              aria-autocomplete="list"
            />
          </div>

          {showDropdown && (
            <div
              id="header-search-results"
              role="listbox"
              className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-hover"
            >
              {courses === null ? (
                <p className="px-4 py-3 text-sm text-[var(--ink-soft)]">Searching…</p>
              ) : results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-[var(--ink-soft)]">No courses found</p>
              ) : (
                results.map((c, i) => (
                  <button
                    key={c.id}
                    role="option"
                    aria-selected={i === highlighted}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goTo(c.slug)}
                    onMouseEnter={() => setHighlighted(i)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === highlighted ? "bg-[var(--bg)]" : ""
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Search size={14} className="shrink-0 text-[var(--ink-soft)]" />
                      <span className="truncate text-sm font-medium text-[var(--ink)]">{c.title}</span>
                    </span>
                    <span className="shrink-0 rounded-md bg-sky-soft px-2 py-0.5 text-xs font-semibold text-sky">
                      {c.category}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <nav className="ml-auto flex items-center gap-3">
          <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[var(--ink)] hover:bg-[var(--bg)]">
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber" />
          </button>

          {/* User Profile Menu — only shown when authenticated */}
          {user && !loading && (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 text-navy-500 font-semibold hover:bg-navy-200 transition-colors"
              >
                {user.full_name.charAt(0).toUpperCase()}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 min-w-48 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-card">
                  <div className="border-b border-[var(--border)] px-4 py-3">
                    <p className="text-sm font-semibold text-[var(--ink)]">{user.full_name}</p>
                    <p className="text-xs text-[var(--ink-soft)]">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push("/learn/settings");
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[var(--ink)] hover:bg-[var(--bg)] transition-colors"
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
