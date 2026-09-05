"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration layout mismatch before client mounts
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle Theme"
        className={`w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 bg-slate-900/60 text-slate-400 opacity-60 ${className}`}
      >
        <Moon className="w-4 h-4" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "Light" : "Dark"} theme`}
      className={`group relative flex items-center gap-2 p-2 rounded-xl border transition-all duration-300 cursor-pointer ${
        isDark
          ? "bg-slate-900/80 border-white/10 text-amber-300 hover:text-amber-200 hover:border-amber-400/40 hover:bg-slate-800"
          : "bg-white/90 border-slate-200 text-slate-700 hover:text-red-600 hover:border-red-300 hover:bg-slate-50 shadow-sm"
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <Sun
          className={`w-4 h-4 transition-all duration-300 absolute ${
            isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100 text-amber-500"
          }`}
        />
        <Moon
          className={`w-4 h-4 transition-all duration-300 absolute ${
            isDark
              ? "rotate-0 scale-100 opacity-100 text-amber-300"
              : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </div>

      {showLabel && (
        <span className="text-xs font-bold uppercase tracking-wider select-none">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
