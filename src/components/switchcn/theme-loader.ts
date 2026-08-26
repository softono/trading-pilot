import { THEME_REGISTRY } from "./theme-registry";

export interface ThemeTokens {
  [key: string]: string | undefined;

  // Core colors
  background: string;
  foreground: string;
  card: string;
  "card-foreground": string;
  popover: string;
  "popover-foreground": string;
  primary: string;
  "primary-foreground": string;
  secondary: string;
  "secondary-foreground": string;
  muted: string;
  "muted-foreground": string;
  accent: string;
  "accent-foreground": string;
  destructive: string;
  "destructive-foreground"?: string;
  border: string;
  input: string;
  ring: string;
  radius: string;

  // Chart colors (optional)
  "chart-1"?: string;
  "chart-2"?: string;
  "chart-3"?: string;
  "chart-4"?: string;
  "chart-5"?: string;

  // Sidebar tokens (optional)
  sidebar?: string;
  "sidebar-foreground"?: string;
  "sidebar-primary"?: string;
  "sidebar-primary-foreground"?: string;
  "sidebar-accent"?: string;
  "sidebar-accent-foreground"?: string;
  "sidebar-border"?: string;
  "sidebar-ring"?: string;

  // Typography (optional)
  "font-sans"?: string;
  "font-serif"?: string;
  "font-mono"?: string;
  "tracking-normal"?: string;
  "tracking-tighter"?: string;
  "tracking-tight"?: string;
  "tracking-wide"?: string;
  "tracking-wider"?: string;
  "tracking-widest"?: string;
  "letter-spacing"?: string;
  spacing?: string;

  // Shadow tokens (optional)
  "shadow-offset-x"?: string;
  "shadow-offset-y"?: string;
  "shadow-blur"?: string;
  "shadow-spread"?: string;
  "shadow-opacity"?: string;
  "shadow-color"?: string;
  "shadow-2xs"?: string;
  "shadow-xs"?: string;
  "shadow-sm"?: string;
  shadow?: string;
  "shadow-md"?: string;
  "shadow-lg"?: string;
  "shadow-xl"?: string;
  "shadow-2xl"?: string;
}

export interface ThemeMeta {
  name: string;
  label: string;
  swatches: string[];
}

export interface Theme {
  $schema?: string;
  name: string;
  type: string;
  css?: Record<
    string,
    Record<string, string | Record<string, string> | undefined>
  >;
  cssVars: {
    theme: Record<string, string | undefined>;
    light: ThemeTokens;
    dark: ThemeTokens;
  };
}

/**
 * Dynamically resolves full theme configuration at runtime.
 */
export async function loadTheme(name: string): Promise<Theme> {
  const entry = THEME_REGISTRY[name] || THEME_REGISTRY.default;
  const mod = await entry.load();
  return mod.default as unknown as Theme;
}
