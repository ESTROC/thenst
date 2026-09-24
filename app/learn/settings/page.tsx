"use client";

import { useState } from "react";
import { User, UserCog, Shield, Palette, CreditCard } from "lucide-react";
import { Header } from "@/components/learn/layout/Header";
import { Sidebar } from "@/components/learn/layout/Sidebar";
import { ProfileSection } from "@/components/learn/settings/ProfileSection";
import { AccountSection } from "@/components/learn/settings/AccountSection";
import { SecuritySection } from "@/components/learn/settings/SecuritySection";
import { AppearanceSection } from "@/components/learn/settings/AppearanceSection";
import { BillingSection } from "@/components/learn/settings/BillingSection";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: UserCog },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "billing", label: "Billing", icon: CreditCard },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function SettingsPage() {
  const [active, setActive] = useState<TabId>("profile");

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Settings</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Manage your profile, account and preferences.</p>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActive(t.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-sky text-white"
                      : "border border-[var(--border)] text-[var(--ink-soft)] hover:border-sky hover:text-[var(--ink)]"
                  }`}
                >
                  <Icon size={16} /> {t.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {active === "profile" && <ProfileSection />}
            {active === "account" && <AccountSection />}
            {active === "security" && <SecuritySection />}
            {active === "appearance" && <AppearanceSection />}
            {active === "billing" && <BillingSection />}
          </div>
        </main>
      </div>
    </div>
  );
}
