import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Sliders,
  Volume2,
  Mic,
  Globe,
  Radio,
  Plus,
  Trash2,
  ExternalLink,
  Play,
  Laptop,
  Check,
  Power,
  RotateCcw,
  Sparkles,
  Command,
  Eye,
  Gauge,
  FastForward,
  Palette,
  Pipette,
  CheckCircle2,
  Shield,
  Zap,
  Target,
  Clock,
  MapPin,
  Navigation,
} from 'lucide-react';
import { ModelSpeedChoice, VoicePreset, JARVIS_VOICE_PRESETS, VoiceShortcut } from '../types';
import { WORLD_LANGUAGES, findLanguageByCode, getLanguageTestPhrase } from '../utils/languages';
import {
  TACTICAL_COLOR_SWATCHES,
  TacticalColorSwatch,
  hexToRgb,
  isValidHexColor,
  hexToRgba
} from '../utils/themeStyles';
import { TacticalTimeData, TacticalLocationData } from '../utils/tacticalTimeLocation';

interface DiagnosticsPanelProps {
  modelChoice: ModelSpeedChoice;
  onModelChange: (model: ModelSpeedChoice) => void;
  selectedVoice: VoicePreset;
  onVoiceChange: (voice: VoicePreset) => void;
  speechRate?: number;
  onSpeechRateChange?: (rate: number) => void;
  selectedLanguage?: string;
  onLanguageChange?: (lang: string) => void;
  reactorPower: number;
  coreTemp: number;
  customInstruction: string;
  onCustomInstructionChange: (val: string) => void;
  onTestVocalPhrase: () => void;
  voiceShortcuts: VoiceShortcut[];
  onAddShortcut: (shortcut: Omit<VoiceShortcut, 'id' | 'createdAt'>) => void;
  onToggleShortcut: (id: string) => void;
  onDeleteShortcut: (id: string) => void;
  onResetShortcuts: () => void;
  onTriggerShortcut: (shortcut: VoiceShortcut) => void;
  // Custom HUD Accent Color Override
  customAccentColor?: string | null;
  effectiveAccentColor?: string;
  onSetCustomAccentColor?: (color: string | null) => void;
  initialTab?: 'appearance' | 'shortcuts' | 'telemetry';
  timeData?: TacticalTimeData;
  locationData?: TacticalLocationData;
  onOpenTimeModal?: () => void;
  onOpenLocationModal?: () => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  modelChoice,
  onModelChange,
  selectedVoice,
  onVoiceChange,
  speechRate = 1.0,
  onSpeechRateChange,
  selectedLanguage = 'en-US',
  onLanguageChange,
  reactorPower,
  coreTemp,
  customInstruction,
  onCustomInstructionChange,
  onTestVocalPhrase,
  voiceShortcuts,
  onAddShortcut,
  onToggleShortcut,
  onDeleteShortcut,
  onResetShortcuts,
  onTriggerShortcut,
  customAccentColor = null,
  effectiveAccentColor = '#06b6d4',
  onSetCustomAccentColor,
  initialTab = 'appearance',
  timeData,
  locationData,
  onOpenTimeModal,
  onOpenLocationModal,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'shortcuts' | 'telemetry'>(initialTab);

  // Local state for color picker input field
  const [typedHex, setTypedHex] = useState(effectiveAccentColor);
  const [hexInputError, setHexInputError] = useState<string | null>(null);
  const [previewConfirmed, setPreviewConfirmed] = useState(false);

  useEffect(() => {
    setTypedHex(effectiveAccentColor);
  }, [effectiveAccentColor]);

  // Form state for creating a new voice shortcut
  const [isAdding, setIsAdding] = useState(false);
  const [newPhrase, setNewPhrase] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newActionType, setNewActionType] = useState<'url' | 'system' | 'directive'>('url');
  const [newUrlTarget, setNewUrlTarget] = useState('');
  const [newSystemTarget, setNewSystemTarget] = useState<string>('shutdown');
  const [newDirectiveTarget, setNewDirectiveTarget] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleApplyHex = (hexToApply: string) => {
    let clean = hexToApply.trim();
    if (!clean.startsWith('#')) {
      clean = '#' + clean;
    }
    if (isValidHexColor(clean)) {
      setHexInputError(null);
      onSetCustomAccentColor?.(clean.toLowerCase());
      setPreviewConfirmed(true);
      setTimeout(() => setPreviewConfirmed(false), 2000);
    } else {
      setHexInputError('Please enter a valid 3 or 6 digit hex code (e.g. #06B6D4, #FF0055)');
    }
  };

  const handleSelectSwatch = (swatch: TacticalColorSwatch) => {
    setHexInputError(null);
    setTypedHex(swatch.hex);
    onSetCustomAccentColor?.(swatch.hex);
    setPreviewConfirmed(true);
    setTimeout(() => setPreviewConfirmed(false), 2000);
  };

  const handleResetToPreset = () => {
    setHexInputError(null);
    onSetCustomAccentColor?.(null);
    setTypedHex(selectedVoice.accentHex);
    setPreviewConfirmed(true);
    setTimeout(() => setPreviewConfirmed(false), 2000);
  };

  const handleCreateShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanPhrase = newPhrase.trim().toLowerCase();
    if (!cleanPhrase) {
      setFormError('Spoken phrase cannot be empty.');
      return;
    }

    let finalTarget = '';
    if (newActionType === 'url') {
      const cleanUrl = newUrlTarget.trim();
      if (!cleanUrl) {
        setFormError('Please provide a valid website URL.');
        return;
      }
      finalTarget = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
    } else if (newActionType === 'system') {
      finalTarget = newSystemTarget;
    } else {
      const cleanPrompt = newDirectiveTarget.trim();
      if (!cleanPrompt) {
        setFormError('Please enter the directive prompt.');
        return;
      }
      finalTarget = cleanPrompt;
    }

    onAddShortcut({
      phrase: cleanPhrase,
      title: newTitle.trim() || cleanPhrase,
      actionType: newActionType,
      target: finalTarget,
      isEnabled: true,
    });

    // Reset Form
    setNewPhrase('');
    setNewTitle('');
    setNewUrlTarget('');
    setNewDirectiveTarget('');
    setIsAdding(false);
  };

  const currentRgb = hexToRgb(effectiveAccentColor) || { r: 6, g: 182, b: 212 };
  const isCustomActive = Boolean(customAccentColor);

  return (
    <div className="bg-slate-950/80 border-l border-cyan-950/60 flex flex-col h-full overflow-hidden">
      {/* 3-Tab Tactical Navigation Header */}
      <div className="grid grid-cols-3 bg-slate-950 border-b border-cyan-950/80 p-1.5 text-xs font-mono gap-1">
        <button
          onClick={() => setActiveTab('appearance')}
          className="py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold"
          style={
            activeTab === 'appearance'
              ? {
                  backgroundColor: effectiveAccentColor,
                  color: '#020617',
                  boxShadow: `0 0 15px ${hexToRgba(effectiveAccentColor, 0.45)}`,
                }
              : {
                  color: '#94a3b8',
                }
          }
        >
          <Palette className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">HUD ACCENT</span>
          {isCustomActive && (
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                backgroundColor: activeTab === 'appearance' ? '#020617' : effectiveAccentColor,
              }}
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('shortcuts')}
          className="py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          style={
            activeTab === 'shortcuts'
              ? {
                  backgroundColor: effectiveAccentColor,
                  color: '#020617',
                  fontWeight: 'bold',
                  boxShadow: `0 0 15px ${hexToRgba(effectiveAccentColor, 0.45)}`,
                }
              : {
                  color: '#94a3b8',
                }
          }
        >
          <Mic className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">SHORTCUTS ({voiceShortcuts.filter((s) => s.isEnabled).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className="py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          style={
            activeTab === 'telemetry'
              ? {
                  backgroundColor: effectiveAccentColor,
                  color: '#020617',
                  fontWeight: 'bold',
                  boxShadow: `0 0 15px ${hexToRgba(effectiveAccentColor, 0.45)}`,
                }
              : {
                  color: '#94a3b8',
                }
          }
        >
          <Sliders className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">TELEMETRY</span>
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-6">
        {/* ================= TAB 1: HUD APPEARANCE & ACCENT COLOR PICKER ================= */}
        {activeTab === 'appearance' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Header / Directive Description */}
            <div className="border-b border-cyan-950/80 pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3
                  className="text-xs hud-font font-bold tracking-wider flex items-center gap-2"
                  style={{ color: effectiveAccentColor }}
                >
                  <Palette className="w-4 h-4" />
                  <span>TACTICAL HUD ACCENT COLOR MATRIX</span>
                </h3>

                {isCustomActive ? (
                  <span
                    className="text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 animate-pulse"
                    style={{
                      borderColor: `${effectiveAccentColor}90`,
                      backgroundColor: `${effectiveAccentColor}20`,
                      color: effectiveAccentColor,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: effectiveAccentColor }} />
                    OVERRIDING THEME PRESETS
                  </span>
                ) : (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-slate-700 bg-slate-900 text-slate-400">
                    SYNCED TO {selectedVoice.name.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Customize the system-wide tactical HUD accent color. Modifying this overrides the default cyan and persona presets across all reticles, Arc Reactor telemetry, status borders, and interactive command controls.
              </p>
            </div>

            {/* Active Accent Telemetry Status Card */}
            <div
              className="p-3.5 rounded-xl border bg-slate-900/80 shadow-md transition-all space-y-3"
              style={{
                borderColor: `${effectiveAccentColor}60`,
                boxShadow: `0 0 20px ${hexToRgba(effectiveAccentColor, 0.15)}`,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Large Glowing Color Swatch Capsule */}
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-300 shadow-lg"
                      style={{
                        backgroundColor: effectiveAccentColor,
                        borderColor: '#ffffff50',
                        boxShadow: `0 0 20px ${hexToRgba(effectiveAccentColor, 0.6)}`,
                      }}
                    >
                      <Zap className="w-5 h-5 text-slate-950" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-100 uppercase">
                        {isCustomActive ? 'CUSTOM ACCENT OVERRIDE' : 'ACTIVE PERSONA THEME'}
                      </span>
                      {previewConfirmed && (
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> APPLIED
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-300 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm tracking-wider" style={{ color: effectiveAccentColor }}>
                        {effectiveAccentColor.toUpperCase()}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400 text-[10px]">
                        RGB({currentRgb.r}, {currentRgb.g}, {currentRgb.b})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reset to Default Button */}
                {isCustomActive && (
                  <button
                    type="button"
                    onClick={handleResetToPreset}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 hover:border-slate-500 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    title={`Revert to ${selectedVoice.name} default preset color (${selectedVoice.accentHex})`}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">RESTORE PRESET</span>
                    <span className="sm:hidden">RESET</span>
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Color Controls: HTML5 Visual Color Picker & Direct Hex Input */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold hud-font text-slate-200 flex items-center gap-1.5">
                  <Pipette className="w-3.5 h-3.5" style={{ color: effectiveAccentColor }} />
                  CUSTOM COLOR SELECTION &amp; HEX INPUT
                </span>
                <span className="text-[10px] font-mono text-slate-500">REAL-TIME OVERRIDE</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* HTML5 Color Input Controller */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="relative group cursor-pointer shrink-0">
                    <input
                      type="color"
                      value={effectiveAccentColor}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase();
                        setTypedHex(val);
                        setHexInputError(null);
                        onSetCustomAccentColor?.(val);
                      }}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                      aria-label="Select custom HUD color"
                    />
                    <div
                      className="w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-transform group-hover:scale-105 shadow-md"
                      style={{
                        backgroundColor: effectiveAccentColor,
                        borderColor: '#ffffff60',
                        boxShadow: `0 0 15px ${hexToRgba(effectiveAccentColor, 0.4)}`,
                      }}
                    >
                      <Palette className="w-4 h-4 text-slate-950" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono font-semibold text-slate-200">
                      LIVE COLOR WHEEL
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Click swatch to open OS visual color picker &amp; palette.
                    </div>
                  </div>
                </div>

                {/* Direct Hex Code Input */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-mono text-slate-300 flex items-center justify-between">
                    <span>SPECIFY HEX CODE:</span>
                    <span className="text-[9px] text-slate-500">#RRGGBB</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={typedHex}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTypedHex(val);
                          let check = val.trim();
                          if (!check.startsWith('#')) check = '#' + check;
                          if (isValidHexColor(check)) {
                            setHexInputError(null);
                            onSetCustomAccentColor?.(check.toLowerCase());
                          }
                        }}
                        placeholder="#06B6D4"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono tracking-wider focus:outline-none focus:border-cyan-400"
                        maxLength={9}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyHex(typedHex)}
                      className="px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer shrink-0"
                      style={{
                        backgroundColor: effectiveAccentColor,
                        color: '#020617',
                        boxShadow: `0 0 10px ${hexToRgba(effectiveAccentColor, 0.3)}`,
                      }}
                    >
                      APPLY
                    </button>
                  </div>

                  {hexInputError && (
                    <div className="text-[10px] text-rose-400 font-mono pt-0.5">
                      {hexInputError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tactical Color Swatches (Quick-Select Palette) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="hud-font font-bold text-slate-200 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  TACTICAL ACCENT PRESET PALETTE
                </span>
                <span className="text-[10px] text-slate-500">10 SPEC-OPS FREQUENCIES</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {TACTICAL_COLOR_SWATCHES.map((swatch) => {
                  const isSelected = effectiveAccentColor.toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      onClick={() => handleSelectSwatch(swatch)}
                      className="p-2.5 rounded-xl border text-left transition-all duration-200 group cursor-pointer relative overflow-hidden"
                      style={{
                        backgroundColor: isSelected ? `${swatch.hex}18` : '#090d16',
                        borderColor: isSelected ? swatch.hex : '#1e293b',
                        boxShadow: isSelected ? `0 0 14px ${hexToRgba(swatch.hex, 0.35)}` : 'none',
                      }}
                    >
                      {/* Top color dot & check indicator */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div
                          className="w-4 h-4 rounded-full border border-white/40 shadow-sm transition-transform group-hover:scale-110"
                          style={{
                            backgroundColor: swatch.hex,
                            boxShadow: `0 0 8px ${swatch.hex}`,
                          }}
                        />
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 font-bold" style={{ color: swatch.hex }} />
                        )}
                      </div>

                      <div className="font-mono font-bold text-[11px] text-slate-100 truncate group-hover:text-white">
                        {swatch.name}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 tracking-wider">
                        {swatch.hex.toUpperCase()}
                      </div>
                      <div className="text-[8px] font-mono text-slate-500 mt-0.5 truncate">
                        {swatch.codeName}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Tactical HUD Component Mockup / Preview */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold hud-font text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" style={{ color: effectiveAccentColor }} />
                  LIVE SYSTEM-WIDE HUD SIMULATION
                </span>
                <span className="text-[10px] font-mono text-slate-500">ACTIVE TELEMETRY</span>
              </div>

              {/* Mockup Preview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* 1. Mini Reticle Lock Preview */}
                <div
                  className="p-3 rounded-lg border bg-slate-950 flex flex-col items-center justify-center text-center gap-1.5 relative overflow-hidden"
                  style={{ borderColor: `${effectiveAccentColor}50` }}
                >
                  <div
                    className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center animate-spin"
                    style={{
                      borderColor: effectiveAccentColor,
                      boxShadow: `0 0 10px ${hexToRgba(effectiveAccentColor, 0.4)}`,
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: effectiveAccentColor }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-wider" style={{ color: effectiveAccentColor }}>
                    TARGET LOCK: 98.4%
                  </span>
                  <span className="text-[8px] font-mono text-slate-500">BIOMETRIC TRACKING</span>
                </div>

                {/* 2. Tactical Button & Badge Preview */}
                <div
                  className="p-3 rounded-lg border bg-slate-950 flex flex-col justify-between gap-2"
                  style={{ borderColor: `${effectiveAccentColor}50` }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold"
                      style={{
                        backgroundColor: `${effectiveAccentColor}20`,
                        borderColor: `${effectiveAccentColor}80`,
                        color: effectiveAccentColor,
                      }}
                    >
                      STATUS: ONLINE
                    </span>
                    <Zap className="w-3.5 h-3.5" style={{ color: effectiveAccentColor }} />
                  </div>

                  <button
                    type="button"
                    className="w-full py-1.5 px-2 rounded-md font-mono text-[10px] font-bold transition-all shadow-sm flex items-center justify-center gap-1"
                    style={{
                      backgroundColor: effectiveAccentColor,
                      color: '#020617',
                      boxShadow: `0 0 10px ${hexToRgba(effectiveAccentColor, 0.3)}`,
                    }}
                  >
                    <span>EXECUTE DIRECTIVE</span>
                  </button>
                </div>

                {/* 3. Arc Reactor Telemetry Preview */}
                <div
                  className="p-3 rounded-lg border bg-slate-950 flex flex-col justify-between gap-1 text-xs font-mono"
                  style={{ borderColor: `${effectiveAccentColor}50` }}
                >
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span>ARC CORE OUTPUT</span>
                    <span className="font-bold" style={{ color: effectiveAccentColor }}>
                      {reactorPower.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${reactorPower}%`,
                        backgroundColor: effectiveAccentColor,
                        boxShadow: `0 0 10px ${effectiveAccentColor}`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1">
                    <span>CORE TEMP: {coreTemp}°C</span>
                    <span style={{ color: effectiveAccentColor }}>NOMINAL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: VOICE SHORTCUTS ================= */}
        {activeTab === 'shortcuts' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header & Add Button */}
            <div className="flex items-start justify-between gap-3 border-b border-cyan-950 pb-3">
              <div>
                <h3
                  className="text-xs hud-font font-bold tracking-wider flex items-center gap-1.5"
                  style={{ color: effectiveAccentColor }}
                >
                  <Command className="w-3.5 h-3.5" style={{ color: effectiveAccentColor }} />
                  <span>VOICE DIRECTIVE SHORTCUT MATRIX</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Map custom spoken trigger phrases to auto-open website URLs, trigger laptop hardware commands, or launch tactical routines.
                </p>
              </div>

              <button
                onClick={() => setIsAdding(!isAdding)}
                className="px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                style={{
                  backgroundColor: `${effectiveAccentColor}20`,
                  borderColor: `${effectiveAccentColor}70`,
                  color: effectiveAccentColor,
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAdding ? 'CANCEL' : 'ADD SHORTCUT'}</span>
              </button>
            </div>

            {/* Inline Shortcut Creator Form */}
            {isAdding && (
              <form
                onSubmit={handleCreateShortcut}
                className="p-4 rounded-xl bg-slate-900 border space-y-3 animate-in fade-in duration-200"
                style={{
                  borderColor: `${effectiveAccentColor}60`,
                  boxShadow: `0 0 20px ${hexToRgba(effectiveAccentColor, 0.2)}`,
                }}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span
                    className="text-xs font-bold hud-font flex items-center gap-1.5"
                    style={{ color: effectiveAccentColor }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    CREATE CUSTOM VOICE SHORTCUT
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">VOICE AUTOMATION PROTOCOL</span>
                </div>

                {formError && (
                  <div className="p-2 rounded bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
                    {formError}
                  </div>
                )}

                {/* Phrase input */}
                <div>
                  <label
                    className="block text-[11px] font-mono mb-1"
                    style={{ color: effectiveAccentColor }}
                  >
                    SPOKEN TRIGGER PHRASE (WHAT YOU SAY):
                  </label>
                  <div className="relative">
                    <Mic className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      value={newPhrase}
                      onChange={(e) => setNewPhrase(e.target.value)}
                      placeholder="e.g. open flight simulator, deploy defense, my portfolio"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    You can say "Jarvis, [phrase]" or simply speak the phrase directly.
                  </span>
                </div>

                {/* Title */}
                <div>
                  <label
                    className="block text-[11px] font-mono mb-1"
                    style={{ color: effectiveAccentColor }}
                  >
                    SHORTCUT LABEL / TITLE:
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Flight Simulator Portal"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>

                {/* Action Type */}
                <div>
                  <label
                    className="block text-[11px] font-mono mb-1"
                    style={{ color: effectiveAccentColor }}
                  >
                    ACTION EXECUTION TYPE:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewActionType('url')}
                      className={`p-2 rounded-lg border text-xs font-mono flex flex-col items-center gap-1 transition-all ${
                        newActionType === 'url'
                          ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Globe className="w-4 h-4 text-cyan-400" />
                      <span>WEBSITE URL</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewActionType('system')}
                      className={`p-2 rounded-lg border text-xs font-mono flex flex-col items-center gap-1 transition-all ${
                        newActionType === 'system'
                          ? 'border-rose-400 bg-rose-950/60 text-rose-200'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Laptop className="w-4 h-4 text-rose-400" />
                      <span>HARDWARE CMD</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewActionType('directive')}
                      className={`p-2 rounded-lg border text-xs font-mono flex flex-col items-center gap-1 transition-all ${
                        newActionType === 'directive'
                          ? 'border-amber-400 bg-amber-950/60 text-amber-200'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Command className="w-4 h-4 text-amber-400" />
                      <span>AI PROMPT</span>
                    </button>
                  </div>
                </div>

                {/* Target Inputs based on Action Type */}
                {newActionType === 'url' && (
                  <div>
                    <label className="block text-[11px] font-mono text-cyan-300 mb-1">
                      DESTINATION URL:
                    </label>
                    <input
                      type="text"
                      value={newUrlTarget}
                      onChange={(e) => setNewUrlTarget(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full bg-slate-950 border border-cyan-900/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                )}

                {newActionType === 'system' && (
                  <div>
                    <label className="block text-[11px] font-mono text-rose-300 mb-1">
                      SYSTEM COMMAND DIRECTIVE:
                    </label>
                    <select
                      value={newSystemTarget}
                      onChange={(e) => setNewSystemTarget(e.target.value)}
                      className="w-full bg-slate-950 border border-rose-900/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-rose-400 font-mono"
                    >
                      <option value="shutdown">Instant Laptop Shutdown</option>
                      <option value="restart">System Reboot / Restart</option>
                      <option value="sleep">Lock Screen & Sleep Mode</option>
                      <option value="battery">Battery Diagnostics</option>
                      <option value="fullscreen">Toggle Tactical Fullscreen</option>
                      <option value="wakelock">Combat WakeLock Keep-Alive</option>
                    </select>
                  </div>
                )}

                {newActionType === 'directive' && (
                  <div>
                    <label className="block text-[11px] font-mono text-amber-300 mb-1">
                      AI SYSTEM PROMPT TO TRIGGER:
                    </label>
                    <input
                      type="text"
                      value={newDirectiveTarget}
                      onChange={(e) => setNewDirectiveTarget(e.target.value)}
                      placeholder="e.g. Calculate orbital decay parameters for satellite X"
                      className="w-full bg-slate-950 border border-amber-900/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all"
                    style={{
                      backgroundColor: effectiveAccentColor,
                      color: '#020617',
                    }}
                  >
                    SAVE SHORTCUT
                  </button>
                </div>
              </form>
            )}

            {/* List of Shortcuts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>CONFIGURED VOICE SHORTCUTS ({voiceShortcuts.length})</span>
                <button
                  onClick={onResetShortcuts}
                  className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 underline text-[10px]"
                  title="Reset to default Tharun voice shortcuts"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restore Tharun Defaults</span>
                </button>
              </div>

              {voiceShortcuts.map((sc) => {
                const isEnabled = sc.isEnabled;
                return (
                  <div
                    key={sc.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isEnabled
                        ? 'bg-slate-900/90 border-slate-800 shadow-sm'
                        : 'bg-slate-950/60 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        {/* Spoken Phrase Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-mono font-semibold"
                            style={{
                              backgroundColor: `${effectiveAccentColor}20`,
                              borderColor: `${effectiveAccentColor}50`,
                              color: effectiveAccentColor,
                            }}
                          >
                            <Mic className="w-3 h-3" style={{ color: effectiveAccentColor }} />
                            <span>"{sc.phrase}"</span>
                          </span>

                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase border ${
                              sc.actionType === 'system'
                                ? 'bg-rose-950/60 border-rose-700/60 text-rose-300'
                                : sc.actionType === 'directive'
                                ? 'bg-amber-950/60 border-amber-700/60 text-amber-300'
                                : 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                            }`}
                          >
                            {sc.actionType.toUpperCase()}
                          </span>

                          <span className="hud-font font-bold text-xs text-slate-200 truncate">
                            {sc.title}
                          </span>
                        </div>

                        {/* Action Target Details */}
                        <div className="text-[11px] font-mono text-slate-400 truncate flex items-center gap-1.5 pt-0.5">
                          {sc.actionType === 'url' ? (
                            <>
                              <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
                              <a
                                href={sc.target}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:underline truncate"
                              >
                                {sc.target}
                              </a>
                            </>
                          ) : sc.actionType === 'system' ? (
                            <>
                              <Laptop className="w-3 h-3 text-rose-400 shrink-0" />
                              <span className="text-rose-300 uppercase">
                                System Command: {sc.target}
                              </span>
                            </>
                          ) : (
                            <>
                              <Command className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="text-slate-300 truncate">
                                Prompt: "{sc.target}"
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Test Button */}
                        <button
                          onClick={() => onTriggerShortcut(sc)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                          title="Test trigger this shortcut now"
                        >
                          <Play className="w-3 h-3" style={{ fill: effectiveAccentColor, color: effectiveAccentColor }} />
                          <span>TEST</span>
                        </button>

                        {/* Toggle On/Off */}
                        <button
                          onClick={() => onToggleShortcut(sc.id)}
                          className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                            isEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                          }`}
                          style={isEnabled ? { backgroundColor: effectiveAccentColor } : {}}
                          title={isEnabled ? 'Disable shortcut' : 'Enable shortcut'}
                        >
                          <div
                            className={`w-3 h-3 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${
                              isEnabled ? 'right-0.5' : 'left-0.5'
                            }`}
                          />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => onDeleteShortcut(sc.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete voice shortcut"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 3: TELEMETRY & NEURAL ================= */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Tactical Diagnostics Header */}
            <div>
              <div
                className="flex items-center gap-2 text-xs hud-font font-bold tracking-wider mb-1"
                style={{ color: effectiveAccentColor }}
              >
                <Sliders className="w-4 h-4" /> SYSTEM TELEMETRY &amp; MATRIX
              </div>
              <p className="text-[11px] text-slate-400">
                Fine-tune neural model pipelines, vocal timbre, and Tharun OS system instructions.
              </p>
            </div>

            {/* Model Selection Pipeline */}
            <div className="space-y-2">
              <label className="text-xs hud-font text-slate-300 font-semibold tracking-wide flex items-center justify-between">
                <span>COGNITIVE NEURAL MODEL</span>
              </label>
              <div className="space-y-2">
                <div
                  onClick={() => onModelChange('fast')}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    modelChoice === 'fast'
                      ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                  style={
                    modelChoice === 'fast'
                      ? {
                          borderColor: effectiveAccentColor,
                          backgroundColor: `${effectiveAccentColor}20`,
                          color: effectiveAccentColor,
                        }
                      : {}
                  }
                >
                  <div className="font-semibold flex items-center justify-between" style={modelChoice === 'fast' ? { color: effectiveAccentColor } : {}}>
                    <span>gemini-3.1-flash-lite</span>
                    <span className="mono-font text-[10px]">LOW LATENCY</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Rapid instantaneous responses for quick commands &amp; status queries.
                  </p>
                </div>

                <div
                  onClick={() => onModelChange('general')}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    modelChoice === 'general'
                      ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                  style={
                    modelChoice === 'general'
                      ? {
                          borderColor: effectiveAccentColor,
                          backgroundColor: `${effectiveAccentColor}20`,
                          color: effectiveAccentColor,
                        }
                      : {}
                  }
                >
                  <div className="font-semibold flex items-center justify-between" style={modelChoice === 'general' ? { color: effectiveAccentColor } : {}}>
                    <span>gemini-3.5-flash</span>
                    <span className="mono-font text-[10px]">DEFAULT</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Balanced multi-turn conversation and general task solving.
                  </p>
                </div>

                <div
                  onClick={() => onModelChange('complex')}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    modelChoice === 'complex'
                      ? 'border-amber-500 bg-amber-950/40 text-amber-200'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-amber-300 flex items-center justify-between">
                    <span>gemini-3.1-pro-preview</span>
                    <span className="mono-font text-[10px] text-amber-400">TACTICAL PRO</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Deep reasoning for engineering calculations, STEM, and tactical strategy.
                  </p>
                </div>
              </div>
            </div>

            {/* Voice Synthesis Matrix (Gemini 3.8 Flash Lite TTS) */}
            <div className="space-y-2">
              <label className="text-xs hud-font text-slate-300 font-semibold tracking-wide flex items-center justify-between">
                <span>SPEECH SYNTHESIS ENGINE</span>
                <span className="text-[10px] mono-font" style={{ color: effectiveAccentColor }}>
                  gemini-3.8-flash-lite-tts
                </span>
              </label>
              <div className="space-y-1.5">
                {JARVIS_VOICE_PRESETS.map((vp) => (
                  <div
                    key={vp.id}
                    onClick={() => onVoiceChange(vp)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      selectedVoice.id === vp.id
                        ? 'border-cyan-500/70 bg-cyan-950/40 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                        : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                    }`}
                    style={
                      selectedVoice.id === vp.id
                        ? {
                            borderColor: effectiveAccentColor,
                            backgroundColor: `${effectiveAccentColor}20`,
                            color: effectiveAccentColor,
                          }
                        : {}
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold" style={selectedVoice.id === vp.id ? { color: effectiveAccentColor } : { color: '#cbd5e1' }}>
                        {vp.name}
                      </span>
                      <span className="mono-font text-[10px] text-slate-400">{vp.voiceCode}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{vp.description}</p>
                  </div>
                ))}
              </div>

              {/* Speech Rate Control Slider */}
              <div className="mt-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 font-semibold" style={{ color: effectiveAccentColor }}>
                    <Gauge className="w-3.5 h-3.5" />
                    <span>SPEECH RATE / PLAYBACK SPEED</span>
                  </span>
                  <span
                    className="font-bold px-2 py-0.5 rounded border text-[11px]"
                    style={{
                      color: effectiveAccentColor,
                      backgroundColor: `${effectiveAccentColor}20`,
                      borderColor: `${effectiveAccentColor}50`,
                    }}
                  >
                    {speechRate.toFixed(2)}x
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500">0.5x</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={speechRate}
                    onChange={(e) => onSpeechRateChange && onSpeechRateChange(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer focus:outline-none"
                    style={{ accentColor: effectiveAccentColor }}
                    aria-label="Adjust AI Speech Rate"
                  />
                  <span className="text-[10px] font-mono text-slate-500">2.0x</span>
                </div>

                {/* Cadence descriptor & Quick Presets */}
                <div className="flex items-center justify-between pt-1 text-[10px] font-mono">
                  <span className="text-slate-400">
                    {speechRate < 0.95
                      ? 'MEASURED CADENCE'
                      : speechRate <= 1.05
                      ? 'NOMINAL VELOCITY'
                      : speechRate <= 1.45
                      ? 'ACCELERATED DISPATCH'
                      : 'HYPER VELOCITY'}
                  </span>
                  <div className="flex items-center gap-1">
                    {[0.75, 1.0, 1.25, 1.5].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => onSpeechRateChange && onSpeechRateChange(preset)}
                        className={`px-1.5 py-0.5 rounded text-[9px] border transition-colors cursor-pointer ${
                          Math.abs(speechRate - preset) < 0.02
                            ? 'font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                        style={
                          Math.abs(speechRate - preset) < 0.02
                            ? {
                                backgroundColor: effectiveAccentColor,
                                color: '#020617',
                                borderColor: effectiveAccentColor,
                              }
                            : {}
                        }
                      >
                        {preset.toFixed(2)}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={onTestVocalPhrase}
                className="w-full mt-2 py-2 px-3 rounded-lg border bg-slate-900/80 hover:bg-slate-800 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                style={{
                  borderColor: `${effectiveAccentColor}60`,
                  color: effectiveAccentColor,
                }}
              >
                <Volume2 className="w-3.5 h-3.5" style={{ color: effectiveAccentColor }} />
                <span>TEST VOICE SYNTHESIS ({speechRate.toFixed(2)}x)</span>
              </button>
            </div>

            {/* World Language Selection & Test Audio Matrix */}
            <div className="space-y-2 p-3 rounded-xl bg-slate-950/90 border border-slate-800 shadow-sm">
              <label
                className="text-xs hud-font font-semibold tracking-wide flex items-center justify-between"
                style={{ color: effectiveAccentColor }}
              >
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  WORLD LANGUAGE & SPEECH ENGINE
                </span>
                <span className="text-[10px] mono-font" style={{ color: effectiveAccentColor }}>
                  {findLanguageByCode(selectedLanguage).nativeName}
                </span>
              </label>
              <p className="text-[11px] text-slate-400">
                Select any language in the world. When you ask questions, J.A.R.V.I.S. will listen, understand, and speak in this exact language.
              </p>

              {onLanguageChange && (
                <div className="pt-1 space-y-2">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => {
                      onLanguageChange(e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 font-mono focus:outline-none cursor-pointer"
                  >
                    {WORLD_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="bg-slate-950 text-slate-200">
                        {l.flag} {l.name} — {l.nativeName} ({l.region})
                      </option>
                    ))}
                  </select>

                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] space-y-1">
                    <div className="text-[10px] font-mono flex items-center justify-between" style={{ color: effectiveAccentColor }}>
                      <span>VOCAL TEST PHRASE PREVIEW:</span>
                      <span>{findLanguageByCode(selectedLanguage).code}</span>
                    </div>
                    <p className="text-slate-300 italic font-sans text-xs">
                      "{getLanguageTestPhrase(selectedLanguage)}"
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onTestVocalPhrase}
                    className="w-full py-2 px-3 rounded-lg font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    style={{
                      backgroundColor: effectiveAccentColor,
                      color: '#020617',
                      boxShadow: `0 0 15px ${hexToRgba(effectiveAccentColor, 0.35)}`,
                    }}
                  >
                    <Volume2 className="w-4 h-4 text-slate-950" />
                    <span>TEST AUDIO IN {findLanguageByCode(selectedLanguage).name.toUpperCase()}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Custom Protocol Directives */}
            <div className="space-y-2">
              <label className="text-xs hud-font text-slate-300 font-semibold tracking-wide flex items-center justify-between">
                <span>CUSTOM SYSTEM DIRECTIVE</span>
              </label>
              <textarea
                value={customInstruction}
                onChange={(e) => onCustomInstructionChange(e.target.value)}
                placeholder="e.g. Always address me as Sir Tharun or Boss. Focus on concise flight telemetry..."
                rows={3}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none font-sans"
              />
            </div>

            {/* Tactical Chronometer & Geolocation Telemetry Module */}
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold hud-font text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" style={{ color: effectiveAccentColor }} />
                  TEMPORAL &amp; GEOLOCATION TELEMETRY
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                  SATELLITE &amp; ATOMIC SYNC
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                {/* Time Readout Box */}
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>MASTER TIME (24H):</span>
                    <span className="text-amber-300 font-bold">{timeData?.zuluTime || '00:00:00Z'}</span>
                  </div>
                  <div className="font-extrabold text-base text-slate-100 tracking-wider">
                    {timeData?.time24 || '12:00:00'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {timeData?.dateFormatted || 'Synchronized'} • {timeData?.timezone || 'Local'}
                  </div>
                  {onOpenTimeModal && (
                    <button
                      type="button"
                      onClick={onOpenTimeModal}
                      className="w-full mt-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      OPEN CHRONOMETER &amp; WORLD CLOCKS
                    </button>
                  )}
                </div>

                {/* Location Readout Box */}
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>GPS FIX:</span>
                    <span className={locationData?.status === 'LOCKED' ? 'text-emerald-400 font-bold' : 'text-cyan-400'}>
                      {locationData?.status || 'LOCKED'}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-slate-100 tracking-wide truncate">
                    {locationData?.city || 'Local Sector'}, {locationData?.country || ''}
                  </div>
                  <div className="text-[10px] text-cyan-300 truncate">
                    {locationData?.latitude ? `${locationData.latitude.toFixed(4)}°N, ${locationData.longitude?.toFixed(4)}°E` : 'Coordinates locked'}
                  </div>
                  {onOpenLocationModal && (
                    <button
                      type="button"
                      onClick={onOpenLocationModal}
                      className="w-full mt-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      OPEN ORBITAL RADAR &amp; MAPS
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Hardware Telemetry Specs */}
            <div className="border-t border-slate-800 pt-4 space-y-2">
              <div className="text-[11px] hud-font text-slate-400 tracking-wider">HARDWARE SPECIFICATIONS</div>
              <div className="grid grid-cols-2 gap-2 text-[11px] mono-font">
                <div className="p-2 rounded bg-slate-900/50 border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">SAMPLING RATE</span>
                  <span className="font-semibold" style={{ color: effectiveAccentColor }}>24,000 Hz PCM</span>
                </div>
                <div className="p-2 rounded bg-slate-900/50 border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">RESPONSE CODEC</span>
                  <span className="font-semibold" style={{ color: effectiveAccentColor }}>LINEAR 16-BIT</span>
                </div>
                <div className="p-2 rounded bg-slate-900/50 border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">REACTOR STATUS</span>
                  <span className="text-emerald-400 font-semibold">{reactorPower.toFixed(1)}% NOMINAL</span>
                </div>
                <div className="p-2 rounded bg-slate-900/50 border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">CORE TEMP</span>
                  <span className="text-amber-400 font-semibold">{coreTemp} °C STABLE</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
