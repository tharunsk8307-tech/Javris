import React, { useState, useEffect } from 'react';
import {
  Clock,
  Globe,
  Timer,
  Play,
  Square,
  RotateCcw,
  X,
  Compass,
  Calendar,
  Zap,
  Check,
  Copy,
  Sun,
  Moon,
} from 'lucide-react';
import { TacticalTimeData, getWorldClocks, WorldClockEntry } from '../utils/tacticalTimeLocation';

interface TacticalTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeData: TacticalTimeData;
  effectiveAccentColor?: string;
}

export const TacticalTimeModal: React.FC<TacticalTimeModalProps> = ({
  isOpen,
  onClose,
  timeData,
  effectiveAccentColor = '#06b6d4',
}) => {
  const [use12Hour, setUse12Hour] = useState(false);
  const [worldClocks, setWorldClocks] = useState<WorldClockEntry[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Mission Stopwatch state
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchTimeMs, setStopwatchTimeMs] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setWorldClocks(getWorldClocks(new Date()));
    const interval = setInterval(() => {
      setWorldClocks(getWorldClocks(new Date()));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Stopwatch timer loop
  useEffect(() => {
    let interval: any = null;
    if (stopwatchRunning) {
      const startTime = Date.now() - stopwatchTimeMs;
      interval = setInterval(() => {
        setStopwatchTimeMs(Date.now() - startTime);
      }, 50);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [stopwatchRunning]);

  if (!isOpen) return null;

  const formatStopwatch = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const centis = Math.floor((ms % 1000) / 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl rounded-2xl bg-slate-950/95 border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative"
        style={{
          borderColor: `${effectiveAccentColor}60`,
          boxShadow: `0 0 40px ${effectiveAccentColor}25`,
        }}
      >
        {/* Header Bar */}
        <div
          className="p-4 border-b flex items-center justify-between bg-slate-900/60"
          style={{ borderColor: `${effectiveAccentColor}30` }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-inner"
              style={{
                backgroundColor: `${effectiveAccentColor}20`,
                borderColor: `${effectiveAccentColor}60`,
              }}
            >
              <Clock className="w-5 h-5 animate-pulse" style={{ color: effectiveAccentColor }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="hud-font font-bold text-sm tracking-wider text-slate-100">
                  TACTICAL CHRONOMETER &amp; TEMPORAL MATRIX
                </span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded border font-semibold"
                  style={{
                    backgroundColor: `${effectiveAccentColor}20`,
                    borderColor: `${effectiveAccentColor}50`,
                    color: effectiveAccentColor,
                  }}
                >
                  ATOMIC SYNC
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Universal time synchronization • Mission elapsed counter • Global timezone nodes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-800 hover:border-rose-700/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-200 transition-colors cursor-pointer"
            title="Close Chronometer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Main Hero Clock Display */}
          <div
            className="p-5 sm:p-6 rounded-2xl border text-center relative overflow-hidden bg-slate-900/50"
            style={{
              borderColor: `${effectiveAccentColor}40`,
              boxShadow: `inset 0 0 30px ${effectiveAccentColor}10`,
            }}
          >
            {/* Top Tactical Status */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: effectiveAccentColor }} />
                <span className="tracking-widest">LIVE MASTER SYSTEM CLOCK</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setUse12Hour(false)}
                  className={`text-[10px] px-2 py-0.5 rounded border font-mono transition-colors cursor-pointer ${
                    !use12Hour
                      ? 'bg-slate-100 text-slate-950 font-bold border-white'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  24H MILITARY
                </button>
                <button
                  type="button"
                  onClick={() => setUse12Hour(true)}
                  className={`text-[10px] px-2 py-0.5 rounded border font-mono transition-colors cursor-pointer ${
                    use12Hour
                      ? 'bg-slate-100 text-slate-950 font-bold border-white'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  12H STANDARD
                </button>
              </div>
            </div>

            {/* Giant Digits */}
            <div
              className="text-4xl sm:text-6xl font-mono font-extrabold tracking-widest text-slate-100 my-2 select-all drop-shadow-md"
              style={{
                textShadow: `0 0 20px ${effectiveAccentColor}80`,
              }}
            >
              {use12Hour ? timeData.time12 : timeData.time24}
            </div>

            {/* Sub-label: Date, Zulu & Stardate */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-mono text-slate-300 mt-3 pt-3 border-t border-slate-800/80">
              <span className="flex items-center gap-1.5 text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold">{timeData.dateFormatted}</span>
              </span>

              <span className="text-slate-600 hidden sm:inline">•</span>

              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">ZULU (UTC):</span>
                <span className="text-amber-300 font-bold">{timeData.zuluTime}</span>
              </span>

              <span className="text-slate-600 hidden sm:inline">•</span>

              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">TIMEZONE:</span>
                <span className="text-cyan-300">{timeData.timezone} ({timeData.utcOffset})</span>
              </span>

              <span className="text-slate-600 hidden sm:inline">•</span>

              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">STARDATE:</span>
                <span className="text-emerald-400 font-bold">{timeData.stardate}</span>
              </span>
            </div>
          </div>

          {/* Dual Column: Mission Timer / Stopwatch & Telemetry Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mission Elapsed Timer / Stopwatch */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold hud-font text-slate-200 flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-rose-400" />
                  TACTICAL MISSION ELAPSED TIMER
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    stopwatchRunning ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300 animate-pulse' : 'bg-slate-950 border border-slate-800 text-slate-400'
                  }`}
                >
                  {stopwatchRunning ? 'CHRONO RUNNING' : 'STANDBY'}
                </span>
              </div>

              <div className="text-center py-2">
                <div className="font-mono text-3xl font-extrabold text-slate-100 tracking-wider">
                  {formatStopwatch(stopwatchTimeMs)}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  MINUTES : SECONDS . CENTISECONDS
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                {stopwatchRunning ? (
                  <button
                    type="button"
                    onClick={() => setStopwatchRunning(false)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-slate-950" />
                    <span>PAUSE TIMER</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStopwatchRunning(true)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>{stopwatchTimeMs > 0 ? 'RESUME TIMER' : 'START TIMER'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setStopwatchRunning(false);
                    setStopwatchTimeMs(0);
                  }}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Reset Stopwatch"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET</span>
                </button>
              </div>
            </div>

            {/* Quick Temporal Readouts & Copy */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold hud-font text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  TEMPORAL TELEMETRY READOUTS
                </span>
                <span className="text-[10px] font-mono text-slate-500">CLICK TO COPY</span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                {/* Epoch Timestamp */}
                <div
                  onClick={() => copyToClipboard(timeData.epoch.toString(), 'epoch')}
                  className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between cursor-pointer group transition-colors"
                >
                  <div>
                    <span className="text-[10px] text-slate-400 block">UNIX EPOCH TIMESTAMP:</span>
                    <span className="text-cyan-300 font-bold">{timeData.epoch}</span>
                  </div>
                  <div className="text-slate-500 group-hover:text-cyan-300">
                    {copiedKey === 'epoch' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* ISO 8601 String */}
                <div
                  onClick={() => copyToClipboard(new Date(timeData.epoch).toISOString(), 'iso')}
                  className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between cursor-pointer group transition-colors"
                >
                  <div>
                    <span className="text-[10px] text-slate-400 block">ISO 8601 UTC SPEC:</span>
                    <span className="text-amber-300 font-bold truncate max-w-[220px] block">
                      {new Date(timeData.epoch).toISOString()}
                    </span>
                  </div>
                  <div className="text-slate-500 group-hover:text-cyan-300">
                    {copiedKey === 'iso' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* World Clocks Matrix */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="hud-font font-bold text-slate-200 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-cyan-400" />
                GLOBAL TIMEZONE MATRIX (8 TACTICAL HUBS)
              </span>
              <span className="text-[10px] text-slate-500">LIVE ATOMIC SYNC</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {worldClocks.map((wc) => (
                <div
                  key={wc.city}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-xs text-slate-200 truncate">
                      {wc.city}
                    </span>
                    {wc.isDay ? (
                      <span title="Daylight" className="flex items-center">
                        <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      </span>
                    ) : (
                      <span title="Night" className="flex items-center">
                        <Moon className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                      </span>
                    )}
                  </div>

                  <div className="font-mono text-base font-extrabold text-slate-100 tracking-wider">
                    {wc.timeString}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                    <span>{wc.country}</span>
                    <span className="text-slate-500">{wc.diffHours}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>THARUN OS • CHRONOMETER NODE ONLINE</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer transition-colors"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
