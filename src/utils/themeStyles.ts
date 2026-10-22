import { HudThemeType } from '../types';

export interface ThemeColors {
  theme: HudThemeType;
  name: string;
  primaryHex: string;
  glowClass: string;
  borderClass: string;
  borderSubtleClass: string;
  bgSubtleClass: string;
  textPrimaryClass: string;
  textSecondaryClass: string;
  badgeBgClass: string;
  buttonGradClass: string;
  reactorGlowRgba: string;
}

export interface TacticalColorSwatch {
  id: string;
  name: string;
  hex: string;
  codeName: string;
  description: string;
}

export const TACTICAL_COLOR_SWATCHES: TacticalColorSwatch[] = [
  {
    id: 'stark-cyan',
    name: 'Cyber Cyan OS',
    hex: '#06b6d4',
    codeName: 'EXECUTIVE PRO',
    description: 'High-clarity executive cyan luminescence and primary interface accent',
  },
  {
    id: 'synthetic-emerald',
    name: 'Synthetic Emerald',
    hex: '#10b981',
    codeName: 'F.R.I.D.A.Y. CORE',
    description: 'High-frequency bio-synthetic operative emerald',
  },
  {
    id: 'command-amber',
    name: 'Command Amber Gold',
    hex: '#f59e0b',
    codeName: 'C.H.A.R.O.N. GOLD',
    description: 'Autonomous protocol command telemetry gold',
  },
  {
    id: 'reactor-crimson',
    name: 'Vanguard Crimson',
    hex: '#f43f5e',
    codeName: 'V.A.N.G.U.A.R.D.',
    description: 'Emergency combat protocol overdrive crimson',
  },
  {
    id: 'quantum-violet',
    name: 'Quantum Violet',
    hex: '#a855f7',
    codeName: 'Z.E.P.H.Y.R. WARP',
    description: 'Deep neural quantum wave harmonics',
  },
  {
    id: 'electric-cobalt',
    name: 'Electric Cobalt',
    hex: '#3b82f6',
    codeName: 'HIGH VOLTAGE',
    description: 'Ionized electric plasma high-speed telemetry',
  },
  {
    id: 'cyber-lime',
    name: 'Cyber Matrix Lime',
    hex: '#22c55e',
    codeName: 'HYPER-OPTICS',
    description: 'High-visibility tactical optical scan wave',
  },
  {
    id: 'plasma-magenta',
    name: 'Overdrive Magenta',
    hex: '#ec4899',
    codeName: 'PHOTON BURST',
    description: 'Sub-atomic particle resonance magenta',
  },
  {
    id: 'thermo-orange',
    name: 'Solar Flare Orange',
    hex: '#f97316',
    codeName: 'FUSION FLARE',
    description: 'Thermonuclear atmospheric propulsion glow',
  },
  {
    id: 'monolith-white',
    name: 'Titanium Platinum',
    hex: '#f8fafc',
    codeName: 'STEALTH MONOLITH',
    description: 'Clean ultra-sharp high-contrast stealth platinum',
  },
];

export const THEME_CONFIGS: Record<HudThemeType, ThemeColors> = {
  cyan: {
    theme: 'cyan',
    name: 'Tharun Cyan (J.A.R.V.I.S.)',
    primaryHex: '#06b6d4',
    glowClass: 'shadow-[0_0_25px_rgba(6,182,212,0.3)]',
    borderClass: 'border-cyan-500/50',
    borderSubtleClass: 'border-cyan-950/80',
    bgSubtleClass: 'bg-cyan-950/40',
    textPrimaryClass: 'text-cyan-300',
    textSecondaryClass: 'text-cyan-400/80',
    badgeBgClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60',
    buttonGradClass: 'from-cyan-600 via-cyan-500 to-teal-400 hover:from-cyan-500 hover:to-teal-300 text-slate-950',
    reactorGlowRgba: 'rgba(6, 182, 212, 0.45)',
  },
  emerald: {
    theme: 'emerald',
    name: 'Synthetic Emerald (F.R.I.D.A.Y.)',
    primaryHex: '#10b981',
    glowClass: 'shadow-[0_0_25px_rgba(16,185,129,0.3)]',
    borderClass: 'border-emerald-500/50',
    borderSubtleClass: 'border-emerald-950/80',
    bgSubtleClass: 'bg-emerald-950/40',
    textPrimaryClass: 'text-emerald-300',
    textSecondaryClass: 'text-emerald-400/80',
    badgeBgClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    buttonGradClass: 'from-emerald-600 via-emerald-500 to-teal-400 hover:from-emerald-500 hover:to-teal-300 text-slate-950',
    reactorGlowRgba: 'rgba(16, 185, 129, 0.45)',
  },
  amber: {
    theme: 'amber',
    name: 'Command Gold (C.H.A.R.O.N.)',
    primaryHex: '#f59e0b',
    glowClass: 'shadow-[0_0_25px_rgba(245,158,11,0.3)]',
    borderClass: 'border-amber-500/50',
    borderSubtleClass: 'border-amber-950/80',
    bgSubtleClass: 'bg-amber-950/40',
    textPrimaryClass: 'text-amber-300',
    textSecondaryClass: 'text-amber-400/80',
    badgeBgClass: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
    buttonGradClass: 'from-amber-600 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-300 text-slate-950',
    reactorGlowRgba: 'rgba(245, 158, 11, 0.45)',
  },
  rose: {
    theme: 'rose',
    name: 'Vanguard Crimson (V.A.N.G.U.A.R.D.)',
    primaryHex: '#f43f5e',
    glowClass: 'shadow-[0_0_25px_rgba(244,63,94,0.3)]',
    borderClass: 'border-rose-500/50',
    borderSubtleClass: 'border-rose-950/80',
    bgSubtleClass: 'bg-rose-950/40',
    textPrimaryClass: 'text-rose-300',
    textSecondaryClass: 'text-rose-400/80',
    badgeBgClass: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
    buttonGradClass: 'from-rose-600 via-rose-500 to-pink-400 hover:from-rose-500 hover:to-pink-300 text-slate-950',
    reactorGlowRgba: 'rgba(244, 63, 94, 0.45)',
  },
  purple: {
    theme: 'purple',
    name: 'Quantum Violet (Z.E.P.H.Y.R.)',
    primaryHex: '#a855f7',
    glowClass: 'shadow-[0_0_25px_rgba(168,85,247,0.3)]',
    borderClass: 'border-purple-500/50',
    borderSubtleClass: 'border-purple-950/80',
    bgSubtleClass: 'bg-purple-950/40',
    textPrimaryClass: 'text-purple-300',
    textSecondaryClass: 'text-purple-400/80',
    badgeBgClass: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
    buttonGradClass: 'from-purple-600 via-purple-500 to-indigo-400 hover:from-purple-500 hover:to-indigo-300 text-slate-950',
    reactorGlowRgba: 'rgba(168, 85, 247, 0.45)',
  },
};

/**
 * Converts a 3 or 6 digit hex string to RGB numbers
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

/**
 * Validates whether a string is a valid CSS hex code (#rgb or #rrggbb)
 */
export function isValidHexColor(hex: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex.trim());
}

/**
 * Generates an RGBA string with opacity
 */
export function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(6, 182, 212, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Dynamically updates document root CSS variables with the given HUD accent color
 */
export function applyHudCssVariables(hex: string): void {
  if (typeof document === 'undefined') return;
  const rgb = hexToRgb(hex) || { r: 6, g: 182, b: 212 };
  const root = document.documentElement;

  root.style.setProperty('--hud-accent', hex);
  root.style.setProperty('--hud-accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  root.style.setProperty('--hud-accent-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`);
  root.style.setProperty('--hud-accent-subtle', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`);
  root.style.setProperty('--hud-accent-border', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`);
  root.style.setProperty('--hud-accent-shadow', `0 0 25px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`);
}

/**
 * Constructs a custom ThemeColors config for a dynamic accent hex
 */
export function createCustomThemeConfig(hex: string, customName: string = 'Custom HUD Accent'): ThemeColors {
  const rgb = hexToRgb(hex) || { r: 6, g: 182, b: 212 };
  return {
    theme: 'cyan', // fallback key
    name: customName,
    primaryHex: hex,
    glowClass: `shadow-[0_0_25px_rgba(${rgb.r},${rgb.g},${rgb.b},0.35)]`,
    borderClass: 'border-[var(--hud-accent)]',
    borderSubtleClass: 'border-[rgba(var(--hud-accent-rgb),0.3)]',
    bgSubtleClass: 'bg-[rgba(var(--hud-accent-rgb),0.12)]',
    textPrimaryClass: 'text-[var(--hud-accent)]',
    textSecondaryClass: 'text-[rgba(var(--hud-accent-rgb),0.85)]',
    badgeBgClass: 'bg-[rgba(var(--hud-accent-rgb),0.18)] text-[var(--hud-accent)] border-[rgba(var(--hud-accent-rgb),0.5)]',
    buttonGradClass: 'bg-[var(--hud-accent)] text-slate-950 font-bold',
    reactorGlowRgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.45)`,
  };
}
