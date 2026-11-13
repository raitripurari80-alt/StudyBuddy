import { BookOpen, Handshake, Search, Sparkles, User } from "lucide-react";
import type { ScreenId } from "../types";

interface NavbarProps {
  hasOnboarded: boolean;
  currentScreen: ScreenId;
  incomingCount: number;
  onNavigate: (screen: ScreenId) => void;
  onResetDemo: () => void;
}

export function Navbar({
  hasOnboarded,
  currentScreen,
  incomingCount,
  onNavigate,
  onResetDemo,
}: NavbarProps) {
  const navItems: Array<{
    id: ScreenId;
    label: string;
    icon: typeof Search;
    count?: number;
  }> = hasOnboarded
    ? [
        { id: "discover", label: "Find Partners", icon: Search },
        {
          id: "connections",
          label: "Connections",
          icon: Handshake,
          count: incomingCount,
        },
        { id: "copilot", label: "AI Copilot", icon: Sparkles },
        { id: "profile", label: "My Profile", icon: User },
      ]
    : [
        { id: "welcome", label: "Welcome", icon: BookOpen },
        { id: "profile", label: "Create Profile", icon: User },
      ];

  const isItemActive = (id: ScreenId) =>
    currentScreen === id ||
    (id === "discover" && currentScreen === "partner-details");

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-5 py-4">
          {/* Zone 1: Single-element brand wordmark */}
          <button
            type="button"
            onClick={() => onNavigate(hasOnboarded ? "discover" : "welcome")}
            className="font-display text-2xl font-extrabold tracking-tight text-zinc-50 whitespace-nowrap shrink-0 hover:text-orange-400 transition-colors"
          >
            StudyBuddy
          </button>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7"
          >
            {navItems.map((item) => {
              const active = isItemActive(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`relative py-1 text-base font-medium whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? "text-orange-400 font-semibold"
                      : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  <span>{item.label}</span>
                  {typeof item.count === "number" && item.count > 0 && (
                    <span className="ml-1.5 font-mono text-sm tabular-nums text-orange-400">
                      ({item.count})
                    </span>
                  )}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-orange-500"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single utility action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onResetDemo}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-200 whitespace-nowrap shrink-0 hover:bg-zinc-800 hover:border-orange-500/60 transition-colors"
            >
              Reset Demo
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm px-2 py-1.5"
      >
        {navItems.map((item) => {
          const active = isItemActive(item.id);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 min-h-[44px] text-xs font-medium whitespace-nowrap transition-colors ${
                active ? "text-orange-400 font-semibold" : "text-zinc-400"
              }`}
            >
              <div className="relative">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {typeof item.count === "number" && item.count > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 font-mono text-[11px] font-semibold tabular-nums text-orange-400">
                    {item.count}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
