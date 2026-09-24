"use client";

import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, Check } from "lucide-react";

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const options = [
    { id: "light", label: "Light", icon: Sun, desc: "Bright, clean interface" },
    { id: "dark", label: "Dark", icon: Moon, desc: "Easy on the eyes at night" },
  ] as const;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
      <p className="font-display font-bold text-[var(--ink)]">Theme</p>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">Choose how NST Learn looks to you.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {options.map((o) => {
          const Icon = o.icon;
          const active = theme === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setTheme(o.id)}
              className={`relative flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                active ? "border-sky bg-sky/10" : "border-[var(--border)] hover:border-sky"
              }`}
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-sky text-white" : "bg-[var(--bg)] text-[var(--ink-soft)]"}`}>
                <Icon size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">{o.label}</p>
                <p className="text-xs text-[var(--ink-soft)]">{o.desc}</p>
              </div>
              {active && <Check size={18} className="absolute right-4 text-sky" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}