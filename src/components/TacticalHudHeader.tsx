import React from 'react';
import {
  Shield,
  Activity,
  CheckCircle2,
  User,
  LogOut,
  KeyRound,
  UserPlus,
  Laptop,
  Mic,
  AlertTriangle,
  AlertOctagon,
  Camera,
  Cpu,
  Sliders,
  Palette,
  Clock,
  MapPin,
  Compass,
  Mail,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { VoicePreset } from '../types';
import { useAuth } from '../context/AuthContext';
import { TacticalTimeData, TacticalLocationData } from '../utils/tacticalTimeLocation';

export interface TacticalHudHeaderProps {
  reactorPower: number;
  coreTemp: number;
  selectedVoice: VoicePreset;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onOpenLaptopControl?: () => void;
  onOpenVisionScanner?: () => void;
  onOpenAutomationHub?: (tab?: 'gmail' | 'whatsapp' | 'broadcast') => void;
  showDiagnostics?: boolean;
  onToggleDiagnostics?: () => void;
  onCycleReactorPower?: (power: number) => void;
  effectiveAccentColor?: string;
  customAccentColor?: string | null;
  timeData?: TacticalTimeData;
  locationData?: TacticalLocationData;
  onOpenTimeModal?: () => void;
  onOpenLocationModal?: () => void;
  onOpenSystemGuide?: () => void;
}

export const TacticalHudHeader: React.FC<TacticalHudHeaderProps> = ({
  reactorPower,
  coreTemp,
  selectedVoice,
  onOpenAuthModal,
  onOpenLaptopControl,
  onOpenVisionScanner,
  onOpenAutomationHub,
  showDiagnostics,
  onToggleDiagnostics,
  onCycleReactorPower,
  effectiveAccentColor,
  customAccentColor,
  timeData,
  locationData,
  onOpenTimeModal,
  onOpenLocationModal,
  onOpenSystemGuide,
}) => {
  const { currentUser, userProfile, signOut } = useAuth();
  const effectiveAccent = effectiveAccentColor || selectedVoice.accentHex;

  // Determine reactor alert status:
  // Critical: < 90% -> Red alert
  // Warning: < 95% -> Amber alert
  // Nominal: >= 95% -> Green / normal theme
  const isCritical = reactorPower < 90;
  const isWarning = reactorPower >= 90 && reactorPower < 95;
  const isNominal = reactorPower >= 95;

  return (
    <div
      className={`border-b transition-colors duration-500 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 w-full ${
        isCritical
          ? 'bg-rose-950/90 border-rose-500 shadow-[0_4px_25px_rgba(244,63,94,0.4)]'
          : isWarning
          ? 'bg-amber-950/85 border-amber-500 shadow-[0_4px_25px_rgba(245,158,11,0.35)]'
          : 'bg-slate-950/90 border-cyan-950/80 shadow-sm'
      }`}
    >
      {/* Reactor Critical/Warning Visual Alert Banner */}
      {(isCritical || isWarning) && (
        <div
          className={`mb-2 py-1 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-between animate-pulse transition-all ${
            isCritical
              ? 'bg-rose-600/30 border border-rose-500 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.5)]'
              : 'bg-amber-500/25 border border-amber-500 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
          }`}
        >
          <div className="flex items-center gap-2">
            {isCritical ? (
              <AlertOctagon className="w-4 h-4 text-rose-400 animate-spin" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
            )}
            <span className="tracking-wider">
              {isCritical
                ? `CRITICAL ALERT: NEURAL CORE POWER AT ${reactorPower.toFixed(1)}% (SUB-90% DEFICIT) - EMERGENCY RESERVE ENGAGED`
                : `WARNING ALERT: NEURAL CORE OUTPUT AT ${reactorPower.toFixed(1)}% (BELOW 95% NOMINAL THRESHOLD)`}
            </span>
          </div>
          {onCycleReactorPower && (
            <button
              type="button"
              onClick={() => onCycleReactorPower(99.2)}
              className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold border transition-colors cursor-pointer ${
                isCritical
                  ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 border-rose-300'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300'
              }`}
              title="Restore neural core to 99.2% nominal output"
            >
              RESTORE CORE POWER
            </button>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-2 sm:gap-3">
        
        {/* Left: OS Brand & Tactical System Identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shadow-lg transition-colors shrink-0"
              style={{
                backgroundColor: `${effectiveAccent}20`,
                borderColor: `${effectiveAccent}80`,
                borderWidth: '1px',
              }}
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: effectiveAccent }} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="hud-font font-bold text-sm sm:text-base tracking-wider text-slate-100 whitespace-nowrap">
                  THARUN OS
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono text-cyan-400 font-semibold px-1 sm:px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 shrink-0">
                  MARK VII
                </span>
                <span className="hidden xs:flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-emerald-400 font-medium shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ONLINE</span>
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono tracking-tight hidden md:block">
                NEURAL TELEMETRY MATRIX • REAL-TIME OPERATIONAL HUD
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Quick Action Strip (< md only) */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:hidden">
          {timeData && onOpenTimeModal && (
            <button
              type="button"
              onClick={onOpenTimeModal}
              className="px-1.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-200 flex items-center gap-1 cursor-pointer"
              title="Open Tactical Clock"
            >
              <Clock className="w-3 h-3" style={{ color: effectiveAccent }} />
              <span className="hidden xs:inline">{timeData.time24}</span>
            </button>
          )}

          {locationData && onOpenLocationModal && (
            <button
              type="button"
              onClick={onOpenLocationModal}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 text-rose-400 cursor-pointer"
              title={locationData.city || 'Tactical Location'}
            >
              <MapPin className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenAutomationHub && (
            <button
              type="button"
              onClick={() => onOpenAutomationHub('gmail')}
              className="p-1.5 rounded bg-slate-900 border border-cyan-800/80 text-cyan-300 cursor-pointer"
              title="Tactical Communications Hub: Gmail & WhatsApp"
            >
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          )}

          {onOpenLaptopControl && (
            <button
              type="button"
              onClick={onOpenLaptopControl}
              className="p-1.5 rounded bg-slate-900 border border-rose-800/70 text-rose-300 cursor-pointer"
              title="Open Laptop Hardware Controls"
            >
              <Laptop className="w-3.5 h-3.5 text-rose-400" />
            </button>
          )}

          {onToggleDiagnostics && (
            <button
              type="button"
              onClick={onToggleDiagnostics}
              className={`p-1.5 rounded border transition-colors cursor-pointer ${
                showDiagnostics
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
              title="Open Settings & Diagnostics"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenSystemGuide && (
            <button
              type="button"
              onClick={onOpenSystemGuide}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 cursor-pointer"
              title="Open J.A.R.V.I.S. System Guide"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          )}

          {currentUser ? (
            <button
              type="button"
              onClick={() => signOut()}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-300 cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuthModal('login')}
              className="p-1.5 rounded-lg border border-cyan-500/50 bg-cyan-950 text-xs text-cyan-300 font-mono cursor-pointer"
              title="Operative Login"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Center: System Telemetry Readouts (ARC CORE, Temp, Subroutines) */}
        <div
          className={`hidden md:flex items-center gap-2.5 lg:gap-5 text-xs font-mono border px-2.5 lg:px-4 py-1 sm:py-1.5 rounded-lg transition-all shrink-0 ${
            isCritical
              ? 'border-rose-500 bg-rose-950/70 text-rose-200 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]'
              : isWarning
              ? 'border-amber-500 bg-amber-950/60 text-amber-200 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.35)]'
              : 'border-slate-800 bg-slate-900/60 text-slate-400'
          }`}
        >
          {/* Arc Core Power Gauge */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isCritical ? (
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400 animate-spin" />
            ) : isWarning ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            ) : (
              <Activity className="w-3.5 h-3.5" style={{ color: effectiveAccent }} />
            )}
            <span className={isCritical ? 'text-rose-300 font-bold' : isWarning ? 'text-amber-300 font-bold' : 'text-slate-400'}>
              ARC:
            </span>
            <span
              className={`font-semibold tracking-wider ${
                isCritical
                  ? 'text-rose-100 font-extrabold animate-pulse'
                  : isWarning
                  ? 'text-amber-100 font-extrabold animate-pulse'
                  : 'text-slate-200'
              }`}
            >
              {reactorPower.toFixed(1)}%
            </span>

            {/* Quick Testing Triggers for Reactor Simulation (xl screens only) */}
            {onCycleReactorPower && (
              <div className="hidden xl:flex items-center gap-1 ml-1">
                <button
                  type="button"
                  onClick={() => onCycleReactorPower(93.4)}
                  className={`text-[9px] px-1.5 py-0.5 rounded border font-mono transition-colors cursor-pointer ${
                    isWarning
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-300'
                      : 'border-amber-500/40 text-amber-300 hover:bg-amber-950/50'
                  }`}
                  title="Simulate Power <95% (Amber Warning)"
                >
                  93%
                </button>
                <button
                  type="button"
                  onClick={() => onCycleReactorPower(88.2)}
                  className={`text-[9px] px-1.5 py-0.5 rounded border font-mono transition-colors cursor-pointer ${
                    isCritical
                      ? 'bg-rose-500 text-slate-950 font-bold border-rose-300'
                      : 'border-rose-500/40 text-rose-300 hover:bg-rose-950/50'
                  }`}
                  title="Simulate Power <90% (Red Alert)"
                >
                  88%
                </button>
                <button
                  type="button"
                  onClick={() => onCycleReactorPower(99.4)}
                  className={`text-[9px] px-1.5 py-0.5 rounded border font-mono transition-colors cursor-pointer ${
                    isNominal
                      ? 'border-emerald-500/60 text-emerald-300 hover:bg-emerald-950/40'
                      : 'bg-emerald-500 text-slate-950 font-bold border-emerald-300'
                  }`}
                  title="Restore Power >=95% (Nominal)"
                >
                  99%
                </button>
              </div>
            )}
          </div>

          <div className="h-3 w-px bg-slate-800" />

          {/* Core Temperature */}
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">TEMP:</span>
            <span className="text-amber-300 font-semibold">{coreTemp}°C</span>
          </div>

          <div className="hidden lg:block h-3 w-px bg-slate-800" />

          {/* Subroutine Status */}
          <div
            className={`hidden lg:flex items-center gap-1 text-[11px] font-bold ${
              isCritical
                ? 'text-rose-400'
                : isWarning
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {isCritical ? (
              <span>CRITICAL DEFICIT</span>
            ) : isWarning ? (
              <span>WARNING STATE</span>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>NOMINAL</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Tactical Tools & Operative Profile (Desktop & Tablet only, mobile uses top mobile strip) */}
        <div className="hidden md:flex items-center gap-1.5 lg:gap-2 w-auto justify-end shrink-0">
          
          {/* Tactical Real-Time Chronometer */}
          {timeData && onOpenTimeModal && (
            <button
              type="button"
              onClick={onOpenTimeModal}
              className="flex items-center gap-1.5 text-xs px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-800 text-slate-200 font-mono transition-all cursor-pointer group shadow-sm"
              title="Open Tactical Chronometer, Mission Stopwatch, and World Clocks"
            >
              <Clock className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" style={{ color: effectiveAccent }} />
              <span className="font-bold tracking-wider">{timeData.time24}</span>
              <span className="hidden xl:inline text-[10px] text-slate-400">({timeData.dateShort})</span>
            </button>
          )}

          {/* Tactical Geolocation & Orbital Radar */}
          {locationData && onOpenLocationModal && (
            <button
              type="button"
              onClick={onOpenLocationModal}
              className="flex items-center gap-1.5 text-xs px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-800 text-slate-200 font-mono transition-all cursor-pointer group shadow-sm"
              title="Open Tactical Geolocation, GPS Radar, and Orbital Coordinates"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold tracking-wider max-w-[70px] sm:max-w-[85px] lg:max-w-[120px] truncate">
                {locationData.city || 'GEO LOCK'}
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse hidden sm:inline-block"
                style={{
                  backgroundColor: locationData.status === 'LOCKED' ? '#10b981' : effectiveAccent,
                }}
              />
            </button>
          )}

          {/* Live Camera Scanner Button */}
          {onOpenVisionScanner && (
            <button
              type="button"
              onClick={onOpenVisionScanner}
              className="flex items-center gap-1.5 text-xs px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-cyan-500/70 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-200 font-mono transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)] cursor-pointer"
              title="Open Live Optical Scanner, Face Tracking, and 3D Hologram Synthesizer"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden xl:inline">LIVE CAMERA</span>
              <span className="hidden lg:inline xl:hidden">CAMERA</span>
            </button>
          )}

          {/* Communications Hub & Automation (Gmail + WhatsApp) */}
          {onOpenAutomationHub && (
            <button
              type="button"
              onClick={() => onOpenAutomationHub('gmail')}
              className="flex items-center gap-1.5 text-xs px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-cyan-500/70 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-200 font-mono transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)] cursor-pointer group"
              title="Open Tactical Communications Hub: Gmail & WhatsApp Automation"
            >
              <div className="flex items-center -space-x-1">
                <Mail className="w-3.5 h-3.5 text-rose-400" />
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="hidden xl:inline font-bold">COMMS & AUTOMATION</span>
              <span className="hidden lg:inline xl:hidden font-bold">COMMS</span>
            </button>
          )}

          {/* Laptop Hardware Directives Button */}
          {onOpenLaptopControl && (
            <button
              type="button"
              onClick={onOpenLaptopControl}
              className="flex items-center gap-1.5 text-xs px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-rose-800/80 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-mono transition-all cursor-pointer"
              title="Open Laptop Hardware Terminal & Directives"
            >
              <Laptop className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden xl:inline">LAPTOP CONTROLS</span>
              <span className="hidden lg:inline xl:hidden">LAPTOP</span>
            </button>
          )}

          {/* Real-World User & System Guide Button */}
          {onOpenSystemGuide && (
            <button
              type="button"
              onClick={onOpenSystemGuide}
              className="flex items-center gap-1.5 text-xs px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-cyan-500/50 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 font-mono transition-all cursor-pointer shadow-sm hover:border-cyan-400"
              title="Open J.A.R.V.I.S. Real-World Architecture & User Guide"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline font-bold">GUIDE</span>
            </button>
          )}

          {/* Voice Shortcuts & Settings Matrix Toggle */}
          {onToggleDiagnostics && (
            <button
              type="button"
              onClick={onToggleDiagnostics}
              className={`flex items-center gap-1.5 text-xs px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border font-mono transition-all cursor-pointer ${
                showDiagnostics
                  ? 'text-slate-950 font-bold'
                  : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 text-slate-300 hover:text-white'
              }`}
              style={
                showDiagnostics
                  ? {
                      backgroundColor: effectiveAccent,
                      borderColor: effectiveAccent,
                      boxShadow: `0 0 14px ${effectiveAccent}66`,
                    }
                  : {}
              }
              title="Open HUD Settings, Custom Accent Color Picker, Voice Shortcuts & Diagnostics"
            >
              <Sliders
                className="w-3.5 h-3.5"
                style={{ color: showDiagnostics ? '#020617' : effectiveAccent }}
              />
              <span className="hidden lg:inline">SETTINGS</span>
              {customAccentColor && !showDiagnostics && (
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: effectiveAccent, boxShadow: `0 0 6px ${effectiveAccent}` }}
                  title="Custom accent override active"
                />
              )}
            </button>
          )}

          {/* Operative Authentication Gateway */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName}
                    className="w-5 h-5 rounded-full border border-cyan-400 object-cover"
                  />
                ) : (
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span className="hud-font text-slate-200 font-semibold max-w-[85px] truncate text-[11px]">
                  {userProfile?.preferredCallsign || userProfile?.displayName?.split(' ')[0] || 'OPERATIVE'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                className="p-1.5 rounded-lg border border-slate-800 hover:border-rose-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                title="Sign out & Switch Account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <button
                type="button"
                onClick={() => onOpenAuthModal('login')}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono transition-colors cursor-pointer"
                title="Log in to sync your personal Voice Page"
              >
                <KeyRound className="w-3 h-3 text-cyan-400" />
                <span>LOGIN</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuthModal('register')}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-bold hud-font transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] cursor-pointer"
                title="Register and bind your personal AI Voice Page"
              >
                <UserPlus className="w-3 h-3" />
                <span>REGISTER</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
