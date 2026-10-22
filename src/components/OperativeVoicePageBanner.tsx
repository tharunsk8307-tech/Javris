import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { VoicePreset, JARVIS_VOICE_PRESETS, HudThemeType, ModelSpeedChoice } from '../types';
import { THEME_CONFIGS } from '../utils/themeStyles';
import { WORLD_LANGUAGES, findLanguageByCode } from '../utils/languages';
import {
  Radio,
  Sparkles,
  Volume2,
  VolumeX,
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  Gauge,
  Minus,
  Plus,
  RotateCcw,
  Activity,
  Sliders,
  Play,
  UserCheck,
  Zap,
} from 'lucide-react';

export interface OperativeVoicePageBannerProps {
  currentVoice: VoicePreset;
  onSelectVoice: (voice: VoicePreset) => void;
  onTestVoice: (langCode?: string) => void;
  isSpeaking: boolean;
  selectedLanguage?: string;
  onLanguageChange?: (langCode: string) => void;
  speechRate?: number;
  onSpeechRateChange?: (rate: number) => void;
  autoSpeak?: boolean;
  onToggleAutoSpeak?: () => void;
  modelChoice?: ModelSpeedChoice;
  onModelChange?: (model: ModelSpeedChoice) => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
  effectiveAccentColor?: string;
  customAccentColor?: string | null;
  onOpenSettings?: () => void;
}

export const OperativeVoicePageBanner: React.FC<OperativeVoicePageBannerProps> = ({
  currentVoice,
  onSelectVoice,
  onTestVoice,
  isSpeaking,
  selectedLanguage = 'en-US',
  onLanguageChange,
  speechRate = 1.0,
  onSpeechRateChange,
  autoSpeak = true,
  onToggleAutoSpeak,
  modelChoice = 'fast',
  onModelChange,
  onOpenAuthModal,
  effectiveAccentColor,
  customAccentColor,
  onOpenSettings,
}) => {
  const { currentUser, userProfile, updateUserVoicePreferences } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const langObj = findLanguageByCode(selectedLanguage);
  const effectiveAccent = effectiveAccentColor || currentVoice.accentHex;
  const themeConfig = THEME_CONFIGS[currentVoice.theme] || THEME_CONFIGS.cyan;

  const handleSwitchVoice = async (preset: VoicePreset) => {
    onSelectVoice(preset);
    if (currentUser) {
      setIsSaving(true);
      try {
        await updateUserVoicePreferences(preset.id, preset.theme as HudThemeType);
      } catch (err) {
        console.warn('Voice preference save note:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAdjustRate = (delta: number) => {
    if (!onSpeechRateChange) return;
    const nextRate = Math.max(0.5, Math.min(2.0, Number((speechRate + delta).toFixed(2))));
    onSpeechRateChange(nextRate);
  };

  return (
    <section
      aria-label="Voice Page Command Deck"
      className={`border-b transition-all duration-300 ${themeConfig.borderSubtleClass} bg-slate-950/95 backdrop-blur-md shadow-md`}
    >
      {/* Upper Deck: Active Voice Persona Identity & Instant Persona Switcher */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-1.5 sm:py-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5 sm:gap-3">
          
          {/* Active Voice Persona Identity Hub */}
          <div className="flex items-center justify-between md:justify-start gap-2 sm:gap-3 min-w-0 w-full md:w-auto">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Animated Persona Radar / Glow Avatar */}
              <div
                className="relative w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs text-slate-950 shadow-lg shrink-0 transition-all"
                style={{
                  backgroundColor: effectiveAccent,
                  boxShadow: `0 0 14px ${effectiveAccent}40`,
                }}
              >
                <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 animate-pulse" />
                {isSpeaking && (
                  <span
                    className="absolute -inset-1 rounded-xl animate-ping opacity-75"
                    style={{ backgroundColor: effectiveAccent }}
                  />
                )}
              </div>

              {/* Persona Typography & Telemetry Details */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="hud-font font-bold text-sm sm:text-base tracking-wider text-slate-100 uppercase whitespace-nowrap">
                    {currentVoice.aiPersonaName}
                  </span>
                  <span
                    className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded font-semibold tracking-wider uppercase shrink-0"
                    style={{
                      backgroundColor: `${effectiveAccent}20`,
                      borderColor: `${effectiveAccent}60`,
                      borderWidth: '1px',
                      color: effectiveAccent,
                    }}
                  >
                    VOICE PAGE
                  </span>

                  {/* Accent Color Indicator Badge (Tablet & Desktop) */}
                  {onOpenSettings && (
                    <button
                      type="button"
                      onClick={onOpenSettings}
                      className="hidden sm:flex text-[10px] font-mono px-2 py-0.5 rounded border font-semibold items-center gap-1 cursor-pointer transition-all hover:opacity-90 shrink-0"
                      style={{
                        backgroundColor: `${effectiveAccent}15`,
                        borderColor: `${effectiveAccent}70`,
                        color: effectiveAccent,
                      }}
                      title="Click to customize HUD accent color in Settings"
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: effectiveAccent }} />
                      <span>{customAccentColor ? 'CUSTOM ACCENT' : currentVoice.theme.toUpperCase()}</span>
                    </button>
                  )}

                  {/* Bound Operative Status */}
                  <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-slate-400 shrink-0">
                    <span className="text-slate-600">·</span>
                    {currentUser ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-400" />
                        <span>{userProfile?.preferredCallsign || userProfile?.displayName || 'OPERATIVE'}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenAuthModal?.('login')}
                        className="text-cyan-400 hover:text-cyan-200 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>GUEST</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Tagline & Voice Architecture Specification */}
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono flex items-center gap-1.5 truncate">
                  <span className="text-slate-300 font-semibold">{currentVoice.name}</span>
                  <span className="text-slate-600 hidden sm:inline">·</span>
                  <span className="text-slate-400 italic hidden sm:inline">"{currentVoice.tagline}"</span>
                  <span className="text-slate-600 hidden md:inline">·</span>
                  <span className="text-[10px] text-cyan-500/90 font-mono hidden md:inline">
                    24kHz • {currentVoice.voiceCode}
                  </span>
                </p>
              </div>
            </div>

            {/* Toggle Detailed Voice Comparison Drawer on mobile */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="md:hidden flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-[10px] font-mono text-cyan-300 shrink-0 cursor-pointer"
              title="Expand Voice Matrix details and audio specs"
            >
              <Sliders className="w-3 h-3 text-cyan-400" />
              <span>SPECS</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Right Side: Quick Persona Selector Tabs + Expand Specifications */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-mono uppercase text-slate-500 mr-1 hidden xl:inline shrink-0">
              PERSONAS:
            </span>

            {/* Direct Instant Voice Switcher Tabs */}
            <div className="flex items-center gap-1 p-0.5 sm:p-1 bg-slate-900/90 border border-slate-800 rounded-lg overflow-x-auto no-scrollbar w-full md:w-auto shrink-0">
              {JARVIS_VOICE_PRESETS.map((preset) => {
                const isSelected = currentVoice.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSwitchVoice(preset)}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-mono transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-slate-800 text-slate-100 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                    style={
                      isSelected
                        ? {
                            borderWidth: '1px',
                            borderColor: `${preset.accentHex}80`,
                            boxShadow: `0 0 10px ${preset.accentHex}30`,
                          }
                        : {}
                    }
                    title={`Switch Voice Page to ${preset.aiPersonaName} (${preset.voiceCode})`}
                  >
                    <span
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: preset.accentHex,
                        boxShadow: isSelected ? `0 0 6px ${preset.accentHex}` : 'none',
                      }}
                    />
                    <span>{preset.aiPersonaName}</span>
                  </button>
                );
              })}
            </div>

            {/* Toggle Detailed Voice Comparison Drawer on Desktop */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-xs font-mono text-cyan-300 hover:text-cyan-100 transition-colors cursor-pointer shrink-0"
              title="Expand Voice Matrix details and audio specs"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">SPECS</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Lower Deck: Vocal Telemetry, Language Translation, Speech Rate & Model Deck */}
        <div className="mt-1.5 pt-1.5 sm:mt-2.5 sm:pt-2 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2.5 text-xs">
          
          {/* Left Controls: World Languages + Test Voice Audio */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Multi-Lingual Speech Engine Selector */}
            {onLanguageChange && (
              <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500/70 rounded-lg px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs transition-colors shrink-0">
                <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => {
                    onLanguageChange(e.target.value);
                  }}
                  className="bg-transparent text-slate-200 text-[11px] sm:text-xs focus:outline-none cursor-pointer font-mono max-w-[100px] xs:max-w-[130px] sm:max-w-[170px] truncate"
                  title="Select Voice Page Language"
                >
                  {WORLD_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-slate-950 text-slate-100">
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Test Voice Audio Button */}
            <button
              type="button"
              onClick={() => onTestVoice(selectedLanguage)}
              disabled={isSpeaking}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg border font-mono transition-all cursor-pointer shrink-0 ${
                isSpeaking
                  ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-cyan-950/40 border-cyan-800/70 hover:bg-cyan-900/50 text-cyan-200 hover:border-cyan-500/70'
              }`}
              title={`Test audio vocalization in ${langObj.name} (${langObj.nativeName})`}
            >
              {isSpeaking ? (
                <>
                  <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-300 animate-pulse" />
                  <span className="text-[10px] sm:text-[11px] font-bold">SPEAKING...</span>
                  <div className="flex items-center gap-0.5 ml-0.5 sm:ml-1">
                    <span className="w-1 h-2 bg-cyan-400 animate-pulse" />
                    <span className="w-1 h-3 bg-cyan-300 animate-pulse delay-75" />
                    <span className="w-1 h-2 bg-cyan-400 animate-pulse delay-150" />
                  </div>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: effectiveAccent }} />
                  <span className="text-[10px] sm:text-[11px] font-semibold">
                    <span className="hidden sm:inline">TEST AUDIO (</span>{langObj.flag} <span className="hidden sm:inline">{langObj.name.split(' ')[0]}</span><span className="hidden sm:inline">)</span>
                    <span className="sm:hidden">TEST</span>
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Center & Right Controls: Speech Rate, Auto-Speak Mode & Intelligence Tier */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
            
            {/* Speech Rate Velocity Stepper */}
            {onSpeechRateChange && (
              <div
                className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-mono shrink-0"
                title="Speech Synthesis Playback Rate (0.5x to 2.0x)"
              >
                <Gauge className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
                <span className="text-slate-400 text-[10px] sm:text-[11px] hidden sm:inline">SPEED:</span>
                <span className="text-cyan-200 font-bold min-w-[28px] sm:min-w-[34px] text-center text-[10px] sm:text-xs">
                  {speechRate.toFixed(2)}x
                </span>

                <div className="flex items-center gap-0.5 ml-0.5">
                  <button
                    type="button"
                    onClick={() => handleAdjustRate(-0.1)}
                    disabled={speechRate <= 0.5}
                    className="p-0.5 sm:p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Decrease speech rate by 0.1x"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustRate(0.1)}
                    disabled={speechRate >= 2.0}
                    className="p-0.5 sm:p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Increase speech rate by 0.1x"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                  {speechRate !== 1.0 && (
                    <button
                      type="button"
                      onClick={() => onSpeechRateChange(1.0)}
                      className="p-0.5 sm:p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-200 transition-colors ml-0.5 cursor-pointer"
                      title="Reset speech rate to 1.0x nominal"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Auto-Vocal Feedback Mode Toggle */}
            {onToggleAutoSpeak && (
              <button
                type="button"
                onClick={onToggleAutoSpeak}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border font-mono transition-all text-xs cursor-pointer shrink-0 ${
                  autoSpeak
                    ? 'border-cyan-500/60 bg-cyan-950/60 text-cyan-200'
                    : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200'
                }`}
                title={autoSpeak ? 'Auto speech output is enabled' : 'Auto speech output is muted'}
              >
                {autoSpeak ? <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" /> : <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />}
                <span className="font-semibold text-[10px] sm:text-[11px]">{autoSpeak ? 'VOICE ON' : 'MUTED'}</span>
              </button>
            )}

            {/* Intelligence Model Tier Segmented Switcher */}
            {onModelChange && (
              <div className="flex items-center p-0.5 bg-slate-900/90 border border-slate-800 rounded-lg text-[10px] sm:text-[11px] font-mono shrink-0">
                <button
                  type="button"
                  onClick={() => onModelChange('fast')}
                  className={`px-1.5 sm:px-2 py-0.5 rounded transition-all font-medium cursor-pointer ${
                    modelChoice === 'fast'
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Flash Lite: Ultra-fast low latency"
                >
                  Rapid
                </button>
                <button
                  type="button"
                  onClick={() => onModelChange('general')}
                  className={`px-1.5 sm:px-2 py-0.5 rounded transition-all font-medium cursor-pointer ${
                    modelChoice === 'general'
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Flash: Balanced general intelligence"
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => onModelChange('complex')}
                  className={`px-1.5 sm:px-2 py-0.5 rounded transition-all font-medium cursor-pointer ${
                    modelChoice === 'complex'
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Pro: Tactical deep analytical reasoning"
                >
                  Tactical
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Voice Page Profiles & Specifications Matrix */}
      {isExpanded && (
        <div className="border-t border-slate-800 bg-slate-950/98 px-4 py-4 animate-in fade-in duration-200">
          <div className="max-w-7xl mx-auto space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                AVAILABLE PERSONA VOICE PAGES (AUTO-SAVES TO USER PROFILE):
              </span>
              {isSaving && <span className="text-cyan-400 animate-pulse font-bold">SAVING PREFERENCE TO CLOUD...</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {JARVIS_VOICE_PRESETS.map((preset) => {
                const isSelected = currentVoice.id === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSwitchVoice(preset)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-600 hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="hud-font font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                          {preset.aiPersonaName}
                        </span>
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{
                            backgroundColor: preset.accentHex,
                            boxShadow: `0 0 8px ${preset.accentHex}`,
                          }}
                        />
                      </div>
                      <div className="text-[11px] text-cyan-400/90 font-mono mt-1 font-semibold">
                        {preset.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </div>
                      <div className="mt-2 p-2 rounded bg-slate-900/90 border border-slate-800/80 text-[10px] text-slate-300 italic font-mono">
                        "{preset.greeting}"
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
                      {isSelected ? (
                        <div className="flex items-center gap-1 text-cyan-300 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>ACTIVE PAGE</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 group-hover:text-slate-300">
                          CLICK TO ENGAGE →
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 uppercase">{preset.theme}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
