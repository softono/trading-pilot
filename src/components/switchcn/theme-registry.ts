import { ThemeMeta, Theme } from "./theme-loader";

export interface RegistryEntry extends ThemeMeta {
  load: () => Promise<{ default: Theme }>;
}

/**
 * Swatches color array mapping keys:
 * 1. cssVars.light.primary - Primary brand/accent color
 * 2. cssVars.light.background - Light mode background color
 * 3. cssVars.light.accent (or cssVars.light.secondary) - Light mode accent/hover highlight
 * 4. cssVars.dark.background (or cssVars.dark.card / cssVars.light.border) - Dark mode/border contrast indicator
 */
export const THEME_REGISTRY: Record<string, RegistryEntry> = {
  default: {
    name: "default",
    label: "Default",
    swatches: [
      "oklch(0.922 0 0)",
      "oklch(0.371 0 0)",
      "oklch(0.269 0 0)",
      "oklch(0.275 0 0)",
    ],
    load: () => import("./themes/default.json"),
  },

  "amber-minimal": {
    name: "amber-minimal",
    label: "Amber Minimal",
    swatches: [
      "rgb(245, 158, 11)",
      "rgb(146, 64, 14)",
      "rgb(38, 38, 38)",
      "rgb(64, 64, 64)",
    ],
    load: () => import("./themes/amber-minimal.json"),
  },

  "amethyst-haze": {
    name: "amethyst-haze",
    label: "Amethyst Haze",
    swatches: [
      "rgb(169, 149, 201)",
      "rgb(55, 46, 63)",
      "rgb(90, 83, 112)",
      "rgb(48, 44, 64)",
    ],
    load: () => import("./themes/amethyst-haze.json"),
  },

  "bold-tech": {
    name: "bold-tech",
    label: "Bold Tech",
    swatches: [
      "rgb(139, 92, 246)",
      "rgb(67, 56, 202)",
      "rgb(30, 27, 75)",
      "rgb(46, 16, 101)",
    ],
    load: () => import("./themes/bold-tech.json"),
  },

  bubblegum: {
    name: "bubblegum",
    label: "Bubblegum",
    swatches: [
      "rgb(251, 226, 167)",
      "rgb(198, 123, 150)",
      "rgb(228, 162, 177)",
      "rgb(50, 72, 89)",
    ],
    load: () => import("./themes/bubblegum.json"),
  },

  caffeine: {
    name: "caffeine",
    label: "Caffeine",
    swatches: [
      "rgb(255, 224, 194)",
      "rgb(42, 42, 42)",
      "rgb(57, 48, 40)",
      "rgb(32, 30, 24)",
    ],
    load: () => import("./themes/caffeine.json"),
  },

  candyland: {
    name: "candyland",
    label: "Candyland",
    swatches: [
      "rgb(255, 153, 204)",
      "rgb(135, 206, 235)",
      "rgb(51, 204, 51)",
      "rgb(68, 68, 68)",
    ],
    load: () => import("./themes/candyland.json"),
  },

  catppuccin: {
    name: "catppuccin",
    label: "Catppuccin",
    swatches: [
      "rgb(203, 166, 247)",
      "rgb(137, 220, 235)",
      "rgb(88, 91, 112)",
      "rgb(49, 50, 68)",
    ],
    load: () => import("./themes/catppuccin.json"),
  },

  claude: {
    name: "claude",
    label: "Claude",
    swatches: [
      "rgb(217, 119, 87)",
      "rgb(26, 25, 21)",
      "rgb(250, 249, 245)",
      "rgb(62, 62, 56)",
    ],
    load: () => import("./themes/claude.json"),
  },

  claymorphism: {
    name: "claymorphism",
    label: "Claymorphism",
    swatches: [
      "rgb(129, 140, 248)",
      "rgb(72, 68, 65)",
      "rgb(58, 54, 51)",
      "rgb(58, 54, 51)",
    ],
    load: () => import("./themes/claymorphism.json"),
  },

  "clean-slate": {
    name: "clean-slate",
    label: "Clean Slate",
    swatches: [
      "rgb(129, 140, 248)",
      "rgb(55, 65, 81)",
      "rgb(45, 55, 72)",
      "rgb(75, 85, 99)",
    ],
    load: () => import("./themes/clean-slate.json"),
  },

  "cosmic-night": {
    name: "cosmic-night",
    label: "Cosmic Night",
    swatches: [
      "rgb(164, 143, 255)",
      "rgb(48, 48, 96)",
      "rgb(45, 43, 85)",
      "rgb(48, 48, 82)",
    ],
    load: () => import("./themes/cosmic-night.json"),
  },

  cyberpunk: {
    name: "cyberpunk",
    label: "Cyberpunk",
    swatches: [
      "rgb(255, 0, 200)",
      "rgb(0, 255, 204)",
      "rgb(30, 30, 63)",
      "rgb(46, 46, 94)",
    ],
    load: () => import("./themes/cyberpunk.json"),
  },

  darkmatter: {
    name: "darkmatter",
    label: "Darkmatter",
    swatches: [
      "rgb(231, 138, 83)",
      "rgb(51, 51, 51)",
      "rgb(95, 135, 135)",
      "rgb(34, 34, 34)",
    ],
    load: () => import("./themes/darkmatter.json"),
  },

  "doom-64": {
    name: "doom-64",
    label: "Doom 64",
    swatches: [
      "rgb(229, 57, 53)",
      "rgb(100, 181, 246)",
      "rgb(104, 159, 56)",
      "rgb(74, 74, 74)",
    ],
    load: () => import("./themes/doom-64.json"),
  },

  "elegant-luxury": {
    name: "elegant-luxury",
    label: "Elegant Luxury",
    swatches: [
      "rgb(185, 28, 28)",
      "rgb(180, 83, 9)",
      "rgb(146, 64, 14)",
      "rgb(68, 64, 60)",
    ],
    load: () => import("./themes/elegant-luxury.json"),
  },

  graphite: {
    name: "graphite",
    label: "Graphite",
    swatches: [
      "rgb(160, 160, 160)",
      "rgb(64, 64, 64)",
      "rgb(48, 48, 48)",
      "rgb(53, 53, 53)",
    ],
    load: () => import("./themes/graphite.json"),
  },

  "kodama-grove": {
    name: "kodama-grove",
    label: "Kodama Grove",
    swatches: [
      "rgb(138, 159, 123)",
      "rgb(161, 143, 92)",
      "rgb(90, 83, 69)",
      "rgb(90, 83, 69)",
    ],
    load: () => import("./themes/kodama-grove.json"),
  },

  "midnight-bloom": {
    name: "midnight-bloom",
    label: "Midnight Bloom",
    swatches: [
      "rgb(108, 92, 231)",
      "rgb(100, 149, 237)",
      "rgb(75, 0, 130)",
      "rgb(68, 68, 68)",
    ],
    load: () => import("./themes/midnight-bloom.json"),
  },

  "mocha-mousse": {
    name: "mocha-mousse",
    label: "Mocha Mousse",
    swatches: [
      "rgb(195, 158, 136)",
      "rgb(186, 171, 146)",
      "rgb(138, 101, 90)",
      "rgb(86, 69, 63)",
    ],
    load: () => import("./themes/mocha-mousse.json"),
  },

  "modern-minimal": {
    name: "modern-minimal",
    label: "Modern Minimal",
    swatches: [
      "rgb(59, 130, 246)",
      "rgb(30, 58, 138)",
      "rgb(38, 38, 38)",
      "rgb(64, 64, 64)",
    ],
    load: () => import("./themes/modern-minimal.json"),
  },

  mono: {
    name: "mono",
    label: "Mono",
    swatches: [
      "rgb(115, 115, 115)",
      "rgb(64, 64, 64)",
      "rgb(38, 38, 38)",
      "rgb(56, 56, 56)",
    ],
    load: () => import("./themes/mono.json"),
  },

  nature: {
    name: "nature",
    label: "Nature",
    swatches: [
      "rgb(76, 175, 80)",
      "rgb(56, 142, 60)",
      "rgb(62, 74, 61)",
      "rgb(62, 74, 61)",
    ],
    load: () => import("./themes/nature.json"),
  },

  "neo-brutalism": {
    name: "neo-brutalism",
    label: "Neo Brutalism",
    swatches: [
      "rgb(255, 102, 102)",
      "rgb(51, 153, 255)",
      "rgb(255, 255, 51)",
      "rgb(255, 255, 255)",
    ],
    load: () => import("./themes/neo-brutalism.json"),
  },

  "northern-lights": {
    name: "northern-lights",
    label: "Northern Lights",
    swatches: [
      "rgb(52, 168, 90)",
      "rgb(100, 149, 237)",
      "rgb(70, 130, 180)",
      "rgb(68, 68, 68)",
    ],
    load: () => import("./themes/northern-lights.json"),
  },

  notebook: {
    name: "notebook",
    label: "Notebook",
    swatches: [
      "rgb(176, 176, 176)",
      "rgb(224, 224, 224)",
      "rgb(90, 90, 90)",
      "rgb(79, 79, 79)",
    ],
    load: () => import("./themes/notebook.json"),
  },

  "ocean-breeze": {
    name: "ocean-breeze",
    label: "Ocean Breeze",
    swatches: [
      "rgb(52, 211, 153)",
      "rgb(55, 65, 81)",
      "rgb(45, 55, 72)",
      "rgb(75, 85, 99)",
    ],
    load: () => import("./themes/ocean-breeze.json"),
  },

  "pastel-dreams": {
    name: "pastel-dreams",
    label: "Pastel Dreams",
    swatches: [
      "rgb(192, 170, 253)",
      "rgb(74, 61, 90)",
      "rgb(63, 50, 74)",
      "rgb(63, 50, 74)",
    ],
    load: () => import("./themes/pastel-dreams.json"),
  },

  perpetuity: {
    name: "perpetuity",
    label: "Perpetuity",
    swatches: [
      "rgb(77, 232, 232)",
      "rgb(22, 73, 85)",
      "rgb(22, 73, 85)",
      "rgb(22, 73, 85)",
    ],
    load: () => import("./themes/perpetuity.json"),
  },

  "quantum-rose": {
    name: "quantum-rose",
    label: "Quantum Rose",
    swatches: [
      "rgb(255, 107, 239)",
      "rgb(90, 31, 93)",
      "rgb(70, 32, 79)",
      "rgb(74, 27, 95)",
    ],
    load: () => import("./themes/quantum-rose.json"),
  },

  "retro-arcade": {
    name: "retro-arcade",
    label: "Retro Arcade",
    swatches: [
      "rgb(211, 54, 130)",
      "rgb(203, 75, 22)",
      "rgb(42, 161, 152)",
      "rgb(88, 110, 117)",
    ],
    load: () => import("./themes/retro-arcade.json"),
  },

  "sage-garden": {
    name: "sage-garden",
    label: "Sage Garden",
    swatches: [
      "rgb(124, 144, 130)",
      "rgb(54, 68, 58)",
      "rgb(26, 26, 26)",
      "rgb(42, 42, 42)",
    ],
    load: () => import("./themes/sage-garden.json"),
  },

  "soft-pop": {
    name: "soft-pop",
    label: "Soft Pop",
    swatches: [
      "rgb(129, 140, 248)",
      "rgb(252, 211, 77)",
      "rgb(45, 212, 191)",
      "rgb(84, 84, 84)",
    ],
    load: () => import("./themes/soft-pop.json"),
  },

  "solar-dusk": {
    name: "solar-dusk",
    label: "Solar Dusk",
    swatches: [
      "rgb(249, 115, 22)",
      "rgb(30, 66, 82)",
      "rgb(87, 83, 78)",
      "rgb(68, 64, 60)",
    ],
    load: () => import("./themes/solar-dusk.json"),
  },

  "starry-night": {
    name: "starry-night",
    label: "Starry Night",
    swatches: [
      "rgb(58, 91, 160)",
      "rgb(188, 205, 240)",
      "rgb(255, 224, 102)",
      "rgb(45, 46, 62)",
    ],
    load: () => import("./themes/starry-night.json"),
  },

  "sunset-horizon": {
    name: "sunset-horizon",
    label: "Sunset Horizon",
    swatches: [
      "rgb(255, 126, 95)",
      "rgb(254, 180, 123)",
      "rgb(70, 58, 65)",
      "rgb(70, 58, 65)",
    ],
    load: () => import("./themes/sunset-horizon.json"),
  },

  supabase: {
    name: "supabase",
    label: "Supabase",
    swatches: [
      "rgb(0, 98, 57)",
      "rgb(49, 49, 49)",
      "rgb(36, 36, 36)",
      "rgb(41, 41, 41)",
    ],
    load: () => import("./themes/supabase.json"),
  },

  "t3-chat": {
    name: "t3-chat",
    label: "T3 Chat",
    swatches: [
      "rgb(163, 0, 76)",
      "rgb(70, 55, 83)",
      "rgb(54, 45, 61)",
      "rgb(59, 50, 55)",
    ],
    load: () => import("./themes/t3-chat.json"),
  },

  tangerine: {
    name: "tangerine",
    label: "Tangerine",
    swatches: [
      "rgb(224, 93, 56)",
      "rgb(42, 54, 86)",
      "rgb(42, 48, 62)",
      "rgb(61, 67, 84)",
    ],
    load: () => import("./themes/tangerine.json"),
  },

  twitter: {
    name: "twitter",
    label: "Twitter",
    swatches: [
      "rgb(28, 156, 240)",
      "rgb(6, 22, 34)",
      "rgb(240, 243, 244)",
      "rgb(36, 38, 40)",
    ],
    load: () => import("./themes/twitter.json"),
  },

  vercel: {
    name: "vercel",
    label: "Vercel",
    swatches: [
      "oklch(1 0 0)",
      "oklch(0.32 0 0)",
      "oklch(0.25 0 0)",
      "oklch(0.26 0 0)",
    ],
    load: () => import("./themes/vercel.json"),
  },

  "vintage-paper": {
    name: "vintage-paper",
    label: "Vintage Paper",
    swatches: [
      "rgb(192, 160, 128)",
      "rgb(89, 73, 62)",
      "rgb(74, 64, 57)",
      "rgb(74, 64, 57)",
    ],
    load: () => import("./themes/vintage-paper.json"),
  },

  "violet-bloom": {
    name: "violet-bloom",
    label: "Violet Bloom",
    swatches: [
      "rgb(140, 92, 255)",
      "rgb(30, 41, 59)",
      "rgb(42, 44, 51)",
      "rgb(51, 53, 58)",
    ],
    load: () => import("./themes/violet-bloom.json"),
  },
};

/**
 * Derived lightweight catalog array for the theme switcher UI.
 */
export const themesCatalog = Object.values(THEME_REGISTRY).map(
  ({ name, label, swatches }) => ({
    name,
    label,
    swatches,
  }),
);
