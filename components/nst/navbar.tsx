"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronDown, User, ArrowRight, LogOut, LayoutDashboard, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const NAV_LINKS = [
  { label: "Ecosystem", href: "/ecosystem" },
  { label: "Learn", href: "/learn" },
  { label: "Research", href: "/research" },
  { label: "Network", href: "/network" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "About", href: "/about" },
];

const ROLES = [
  { label: "Security Professional", href: "/security-professional" },
  { label: "Drone Pilot", href: "/drone-pilot" },
  { label: "Educator", href: "/educator" },
  { label: "Organisation", href: "/organisation" },
  { label: "Researcher", href: "/researcher" },
  { label: "Learner", href: "/learner" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Successfully signed out");
      router.push("/");
    } catch (err: any) {
      toast.error("Error signing out: " + (err?.message || "Please try again"));
    }
  };

  return (
    <header className="sticky top-0 left-0 w-full z-50 h-[72px] border-b border-[#e5e3db] bg-[#f7f6f2]/95 backdrop-blur-md">
      <div className="w-min(1240px,calc(100%-48px)) max-w-[1240px] mx-auto h-full flex items-center justify-between gap-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-baseline gap-0 text-[22px] font-medium tracking-[-1.1px] text-[#171b22] hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <span className="font-sans font-bold">The</span>
          <span className="font-serif italic font-normal text-[26px] tracking-[-0.5px]">NST</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 ml-auto">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[13px] font-medium transition-colors ${
                  isActive ? "text-[#d95325] font-semibold" : "text-[#4f555d] hover:text-[#d95325]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Role Hub Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              onBlur={() => setTimeout(() => setRoleDropdownOpen(false), 250)}
              className="flex items-center gap-1.5 text-[13px] text-[#4f555d] hover:text-[#d95325] transition-colors py-1.5 px-2 font-medium"
            >
              <span>Roles</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#e5e3db] shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-[#737a83] border-b border-[#e5e3db]/60 mb-1">
                  Role Pathways
                </div>
                {ROLES.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    className="block px-3 py-2 text-xs text-[#171b22] hover:bg-[#f7f6f2] hover:text-[#d95325] font-medium transition-colors"
                  >
                    {r.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Desktop Action Buttons / Authenticated User Menu */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          {!loading && user && profile ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                onBlur={() => setTimeout(() => setUserDropdownOpen(false), 250)}
                className="flex items-center gap-2.5 px-3 py-1.5 bg-[#171b22] text-white text-xs font-semibold hover:bg-[#111419] transition-all shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-[#d95325] text-white flex items-center justify-center font-mono text-[10px]">
                  {profile.fullName?.charAt(0) || profile.email?.charAt(0) || "U"}
                </div>
                <span className="max-w-[130px] truncate">{profile.fullName || profile.email}</span>
                <ChevronDown className="w-3 h-3 text-[#9299a2]" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#e5e3db] shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-[#e5e3db] mb-1">
                    <p className="text-xs font-bold text-[#171b22] truncate">{profile.fullName || "User"}</p>
                    <p className="text-[10px] text-[#737a83] truncate">{profile.email}</p>
                  </div>
                  <Link
                    href="/platform"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-[#171b22] hover:bg-[#f7f6f2] hover:text-[#d95325]"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#737a83]" />
                    <span>Personalized Platform</span>
                  </Link>
                  {(profile.role === "admin" || profile.role === "superadmin") && (
                    <Link
                      href="/dashboard/superadmin"
                      className="flex items-center gap-2 px-4 py-2 text-xs text-[#d95325] hover:bg-[#fff3ee] font-semibold"
                    >
                      <Lock className="w-3.5 h-3.5 text-[#d95325]" />
                      <span>Admin Console</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/sign-in"
                className="text-[13px] font-medium text-[#171b22] hover:text-[#d95325] px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/platform"
                className="inline-flex items-center justify-center min-h-[38px] px-4 text-xs font-semibold tracking-wider text-white bg-[#171b22] hover:bg-[#d95325] transition-all uppercase"
              >
                Enter Platform
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center gap-2">
          <Link
            href="/platform"
            className="text-xs font-semibold px-3 py-1.5 bg-[#171b22] text-white uppercase tracking-wider"
          >
            Platform
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-[#171b22] hover:text-[#d95325] focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[72px] bottom-0 bg-[#f7f6f2] border-b border-[#e5e3db] z-40 overflow-y-auto px-6 py-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#737a83]">
                Navigation
              </div>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-xl font-medium text-[#171b22] hover:text-[#d95325] transition-colors py-1"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="pt-4 border-t border-[#e5e3db] space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#737a83]">
                Role Pathways
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    onClick={() => setMobileOpen(false)}
                    className="block text-sm text-[#4f555d] hover:text-[#d95325] py-1 font-medium"
                  >
                    {r.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#e5e3db] space-y-3">
            <Link
              href="/platform"
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center justify-center min-h-[44px] text-xs font-semibold uppercase tracking-wider text-white bg-[#171b22] hover:bg-[#d95325] transition-colors"
            >
              Enter Platform
            </Link>
            <Link
              href="/sign-in"
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center justify-center min-h-[44px] text-xs font-semibold uppercase tracking-wider text-[#171b22] border border-[#e5e3db] bg-white hover:bg-[#f7f6f2] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
