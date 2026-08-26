"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "./theme-provider";
import { themesCatalog as themes } from "./theme-registry";
import { cn } from "@/lib/utils";

function Swatch({ color }: { color: string | null }) {
  if (!color)
    return <span className="inline-block" style={{ width: 13, height: 13 }} />;
  return (
    <span
      className="inline-block shrink-0 rounded-full border border-border"
      style={{ width: 13, height: 13, background: color }}
    />
  );
}

export interface ThemeSwitcherProps {
  size?: "small" | "large";
}

export function ThemeSwitcher({ size = "small" }: ThemeSwitcherProps = {}) {
  const { theme: activeTheme, themeMode, setTheme, setThemeMode } = useTheme();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = themes.filter((t) =>
    t.label.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (name: string) => {
    setTheme(name);
    setOpen(false);
    setSearch("");
  };

  const shuffle = () => {
    const pick = themes[Math.floor(Math.random() * themes.length)];
    setTheme(pick.name);
  };

  const cycleColorMode = () => {
    const modes = ["light", "system", "dark"] as const;
    const next = modes[(modes.indexOf(themeMode) + 1) % modes.length];
    setThemeMode(next);
  };

  const modeIcon = {
    light: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
    system: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <rect
          x="2"
          y="3"
          width="20"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M8 21h8M12 17v4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
    dark: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <path
          d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };

  return (
    <div
      ref={dropdownRef}
      className="relative"
      style={{ width: size === "small" ? "fit-content" : 280 }}
    >
      {size === "small" ? (
        <button
          suppressHydrationWarning
          id="theme-switcher-trigger"
          onClick={() => setOpen((o) => !o)}
          title={`Active Theme: ${activeTheme.label}`}
          className={cn(
            "flex items-center justify-center w-9 h-9",
            "border border-border rounded-lg",
            "cursor-pointer text-foreground transition-colors duration-150",
            open ? "bg-muted" : "bg-card",
            "hover:bg-muted",
          )}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-90"
          >
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.34458 19.486 5.38575 20.2528 4.95759 20.7879C4.54284 21.3063 3.8647 22 3 22" />
            <circle cx="7.5" cy="10.5" r="1.5" fill="currentColor" />
            <circle cx="11.5" cy="7.5" r="1.5" fill="currentColor" />
            <circle cx="16.5" cy="9.5" r="1.5" fill="currentColor" />
            <circle cx="15.5" cy="14.5" r="1.5" fill="currentColor" />
          </svg>
        </button>
      ) : (
        <button
          id="theme-switcher-trigger"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "w-full flex items-center gap-2.5",
            "border border-border rounded-xl",
            "px-3 py-[9px]",
            "cursor-pointer text-foreground transition-colors duration-150",
            open ? "bg-muted" : "bg-card",
            "hover:bg-muted",
          )}
        >
          <span className="flex gap-1 items-center">
            {activeTheme.swatches.map((c, i) => (
              <Swatch key={i} color={c} />
            ))}
          </span>
          <span className="flex-1 text-left text-sm font-semibold truncate">
            {activeTheme.label}
          </span>
          <span
            className="text-muted-foreground flex"
            onClick={(e) => {
              e.stopPropagation();
              cycleColorMode();
            }}
            title={`Mode: ${themeMode}`}
          >
            {modeIcon[themeMode]}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            className="text-muted-foreground"
          >
            <path
              d={open ? "M3 10l5-5 5 5" : "M3 6l5 5 5-5"}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {open && (
        <div
          className={cn(
            "absolute z-50",
            "bg-popover rounded-xl border border-border",
            "shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden",
            size === "small" ? "right-0" : "inset-x-0",
          )}
          style={{ top: "calc(100% + 6px)" }}
        >
          <div className="px-3 pt-3">
            <div className="flex items-center gap-2 bg-input rounded-lg border border-border px-3 py-1.5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                className="text-muted-foreground shrink-0"
              >
                <circle
                  cx="7"
                  cy="7"
                  r="5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M11 11l3 3"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search themes\u2026"
                className="flex-1 bg-transparent border-none outline-none text-foreground text-sm caret-foreground"
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-3.5 pt-2 pb-1">
            <span className="text-xs text-muted-foreground">
              {filtered.length} theme{filtered.length !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-1">
              <button
                onClick={cycleColorMode}
                title={`Mode: ${themeMode} \u2014 click to cycle`}
                className="bg-transparent border-none cursor-pointer p-1 rounded-md text-muted-foreground flex"
              >
                {modeIcon[themeMode]}
              </button>
              <button
                onClick={shuffle}
                title="Random theme"
                className="bg-transparent border-none cursor-pointer p-1 rounded-md text-muted-foreground flex"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="px-3.5 py-1 border-b border-border">
            <span className="text-[10px] font-bold text-muted-foreground tracking-wide uppercase">
              Built-in Themes
            </span>
          </div>

          <div
            className="max-h-80 overflow-y-auto p-1 pb-1.5"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "var(--color-muted) transparent",
            }}
          >
            {filtered.length === 0 && (
              <div className="py-4 text-center text-muted-foreground text-sm">
                No themes found
              </div>
            )}
            {filtered.map((t) => {
              const isSelected = activeTheme.name === t.name;
              return (
                <button
                  key={t.name}
                  onClick={() => handleSelect(t.name)}
                  className={cn(
                    "w-full flex items-center gap-2.5",
                    "px-2 py-2 rounded-md border-none",
                    "cursor-pointer text-foreground transition-colors duration-100",
                    isSelected
                      ? "bg-accent hover:bg-accent"
                      : "bg-transparent hover:bg-muted",
                  )}
                >
                  <span className="flex gap-1 items-center min-w-[60px]">
                    {t.swatches.map((c, i) => (
                      <Swatch key={i} color={c} />
                    ))}
                  </span>
                  <span
                    className={cn(
                      "flex-1 text-left text-sm",
                      isSelected
                        ? "font-semibold text-foreground"
                        : "font-normal text-muted-foreground",
                    )}
                  >
                    {t.label}
                  </span>
                  {isSelected && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="text-muted-foreground"
                    >
                      <path
                        d="M3 8l4 4 6-6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
