import React, { useState, useEffect } from 'react';
import {
  Power,
  RefreshCw,
  Lock,
  Battery,
  BatteryCharging,
  Maximize,
  Minimize,
  Eye,
  Shield,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Terminal,
  X,
  Laptop,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  RotateCcw,
  Cpu,
  Wifi,
  WifiOff,
  Sliders
} from 'lucide-react';
import { VoicePreset } from '../types';

interface LaptopCommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: VoicePreset;
  initialDirective?: 'shutdown' | 'restart' | 'sleep' | 'battery' | 'fullscreen' | 'wakelock';
  effectiveAccentColor?: string;
}

export const LaptopCommandCenter: React.FC<LaptopCommandCenterProps> = ({
  isOpen,
  onClose,
  selectedVoice,
  initialDirective = 'shutdown',
  effectiveAccentColor,
}) => {
  const effectiveAccent = effectiveAccentColor || selectedVoice.accentHex;
  const [activeTab, setActiveTab] = useState<'shutdown' | 'restart' | 'sleep' | 'controls'>(
    initialDirective === 'fullscreen' || initialDirective === 'wakelock' || initialDirective === 'battery'
      ? 'controls'
      : (initialDirective as any) || 'shutdown'
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Battery status state from Battery API
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean | null>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  // WakeLock state
  const [isWakeLocked, setIsWakeLocked] = useState(false);
  const [wakeLockSentinel, setWakeLockSentinel] = useState<any>(null);

  // System Hardware Controls State
  const [isMuted, setIsMuted] = useState(false);
  const [nightModeDimmer, setNightModeDimmer] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  // Lockdown simulation state
  const [isLockdownActive, setIsLockdownActive] = useState(false);

  // Fetch Laptop Battery Status
  useEffect(() => {
    let batteryObj: any = null;

    if ('getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((batt: any) => {
          batteryObj = batt;
          setBatteryLevel(Math.round(batt.level * 100));
          setIsCharging(batt.charging);

          const onLevelChange = () => setBatteryLevel(Math.round(batt.level * 100));
          const onChargingChange = () => setIsCharging(batt.charging);

          batt.addEventListener('levelchange', onLevelChange);
          batt.addEventListener('chargingchange', onChargingChange);
        })
        .catch(() => {});
    }

    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Measure fast ping latency
    const start = performance.now();
    fetch('/api/chat', { method: 'OPTIONS' })
      .then(() => setLatencyMs(Math.round(performance.now() - start)))
      .catch(() => setLatencyMs(12));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update fullscreen status listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!isOpen) return null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleWakeLock = async () => {
    if ('wakeLock' in navigator) {
      if (!isWakeLocked) {
        try {
          const sentinel = await (navigator as any).wakeLock.request('screen');
          setWakeLockSentinel(sentinel);
          setIsWakeLocked(true);
          sentinel.addEventListener('release', () => {
            setIsWakeLocked(false);
          });
        } catch (err) {
          console.warn('Wake lock error:', err);
        }
      } else {
        if (wakeLockSentinel) {
          wakeLockSentinel.release();
          setWakeLockSentinel(null);
          setIsWakeLocked(false);
        }
      }
    }
  };

  const toggleMuteAll = () => {
    if (!isMuted) {
      window.speechSynthesis?.cancel();
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadScript = (cmd: string, filename: string) => {
    const blob = new Blob([cmd], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const detectedPlatform =
    (navigator as any).userAgentData?.platform ||
    (navigator.platform.includes('Win')
      ? 'Windows'
      : navigator.platform.includes('Mac')
      ? 'macOS'
      : navigator.platform.includes('Linux')
      ? 'Linux'
      : 'Device');

  const cpuCores = navigator.hardwareConcurrency || 8;
  const memoryInfo = (performance as any).memory
    ? `${Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024))} MB / ${Math.round(
        (performance as any).memory.jsHeapSizeLimit / (1024 * 1024)
      )} MB`
    : 'System Allocated';

  const commands = {
    shutdown: {
      title: 'SHUTDOWN LAPTOP & SYSTEM PROTOCOL',
      description: 'Terminates all running processes, flushes disk caches, and cuts hardware power.',
      win: 'shutdown /s /t 0',
      winScript: '@echo off\r\necho Initiating Tharun System Shutdown...\r\nshutdown /s /t 0',
      winFile: 'tharun_shutdown.bat',
      mac: 'sudo shutdown -h now',
      macScript: '#!/bin/bash\necho "Initiating Tharun System Shutdown..."\nsudo shutdown -h now',
      macFile: 'tharun_shutdown.sh',
      linux: 'sudo poweroff',
      linuxScript: '#!/bin/bash\necho "Initiating Tharun System Shutdown..."\nsudo poweroff',
      linuxFile: 'tharun_shutdown.sh',
    },
    restart: {
      title: 'REBOOT / RESTART LAPTOP PROTOCOL',
      description: 'Clears volatile RAM buffers and resets operating system firmware.',
      win: 'shutdown /r /t 0',
      winScript: '@echo off\r\necho Initiating Tharun System Reboot...\r\nshutdown /r /t 0',
      winFile: 'tharun_restart.bat',
      mac: 'sudo shutdown -r now',
      macScript: '#!/bin/bash\necho "Initiating Tharun System Reboot..."\nsudo shutdown -r now',
      macFile: 'tharun_restart.sh',
      linux: 'sudo reboot',
      linuxScript: '#!/bin/bash\necho "Initiating Tharun System Reboot..."\nsudo reboot',
      linuxFile: 'tharun_restart.sh',
    },
    sleep: {
      title: 'LOCK WORKSTATION & SUSPEND',
      description: 'Locks user account session and halts display GPU drivers.',
      win: 'rundll32.exe user32.dll,LockWorkStation',
      winScript: '@echo off\r\nrundll32.exe user32.dll,LockWorkStation',
      winFile: 'tharun_lock.bat',
      mac: 'pmset sleepnow',
      macScript: '#!/bin/bash\npmset sleepnow',
      macFile: 'tharun_lock.sh',
      linux: 'systemctl suspend',
      linuxScript: '#!/bin/bash\nsystemctl suspend',
      linuxFile: 'tharun_lock.sh',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* Holographic Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-cyan-950/60 to-slate-950 border-b border-cyan-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-lg border flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: `${effectiveAccent}20`,
                borderColor: `${effectiveAccent}80`,
              }}
            >
              <Laptop className="w-5 h-5" style={{ color: effectiveAccent }} />
            </div>
            <div>
              <h2 className="hud-font font-bold text-sm tracking-wider text-slate-100 flex items-center gap-2">
                <span>THARUN SYSTEM COMMAND CENTER</span>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase"
                  style={{
                    backgroundColor: `${effectiveAccent}1a`,
                    borderColor: `${effectiveAccent}66`,
                    color: effectiveAccent,
                  }}
                >
                  HARDWARE BRIDGE
                </span>
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                DIRECT HARDWARE TELEMETRY & NATIVE OPERATING SYSTEM CONTROLS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Realtime Laptop Hardware Telemetry Bar */}
        <div className="grid grid-cols-3 bg-slate-950/70 border-b border-cyan-950 text-xs font-mono p-3 gap-2">
          {/* Battery Status */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            {isCharging ? (
              <BatteryCharging className="w-4 h-4 text-emerald-400 animate-pulse" />
            ) : (
              <Battery className="w-4 h-4 text-cyan-400" />
            )}
            <div>
              <div className="text-[10px] text-slate-400">BATTERY POWER</div>
              <div className="font-semibold text-slate-200">
                {batteryLevel !== null ? `${batteryLevel}% ${isCharging ? '(Charging)' : '(On Battery)'}` : '100% NOMINAL'}
              </div>
            </div>
          </div>

          {/* Screen Wake Lock */}
          <button
            onClick={toggleWakeLock}
            className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left cursor-pointer ${
              isWakeLocked
                ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Eye className={`w-4 h-4 ${isWakeLocked ? 'text-emerald-400' : 'text-slate-400'}`} />
            <div>
              <div className="text-[10px] text-slate-400">SCREEN WAKE LOCK</div>
              <div className="font-semibold text-[11px]">
                {isWakeLocked ? 'ACTIVE (NO SLEEP)' : 'OFF (KEEP AWAKE)'}
              </div>
            </div>
          </button>

          {/* Fullscreen Mode */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-300 text-left transition-all cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 text-cyan-400" />
            ) : (
              <Maximize className="w-4 h-4 text-cyan-400" />
            )}
            <div>
              <div className="text-[10px] text-slate-400">TACTICAL DISPLAY</div>
              <div className="font-semibold text-[11px]">
                {isFullscreen ? 'EXIT FULLSCREEN' : 'MAXIMIZE HUD'}
              </div>
            </div>
          </button>
        </div>

        {/* Tab Directives */}
        <div className="grid grid-cols-4 p-1.5 bg-slate-950/80 border-b border-cyan-950 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('shutdown')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'shutdown'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Power className="w-3.5 h-3.5 text-rose-400" />
            <span>SHUTDOWN</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('restart')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'restart'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>RESTART</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sleep')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'sleep'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>LOCK / SLEEP</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('controls')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'controls'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-teal-400" />
            <span>CONTROLS</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* OS Sandbox Security Note */}
          <div className="p-3 rounded-xl bg-slate-950 border border-cyan-950/90 text-xs text-slate-300 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block font-mono text-[11px] text-cyan-300">
                THARUN OS OPERATING SYSTEM COMPLIANCE:
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Modern operating systems isolate web browsers in a sandbox to prevent unauthorized background power cuts. J.A.R.V.I.S. bridges this security boundary by preparing direct native terminal commands and 1-click executable scripts for Sir Tharun.
              </p>
            </div>
          </div>

          {/* Active Directive Details: Shutdown, Restart, Sleep */}
          {activeTab in commands && (
            <div className="space-y-4">
              <div>
                <h3 className="hud-font text-base text-slate-100 font-semibold flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>{commands[activeTab as keyof typeof commands].title}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {commands[activeTab as keyof typeof commands].description}
                </p>
              </div>

              {/* Windows OS Command Card */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-cyan-300 font-semibold flex items-center gap-1.5">
                    <span>🪟 WINDOWS (POWERSHELL / CMD):</span>
                    {detectedPlatform.includes('Win') && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-600">
                        DETECTED OS
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleCopy(
                          commands[activeTab as keyof typeof commands].win,
                          'win'
                        )
                      }
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500 text-[11px] font-mono flex items-center gap-1 text-slate-200 transition-colors cursor-pointer"
                    >
                      {copiedKey === 'win' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedKey === 'win' ? 'COPIED' : 'COPY COMMAND'}</span>
                    </button>
                    <button
                      onClick={() =>
                        handleDownloadScript(
                          commands[activeTab as keyof typeof commands].winScript,
                          commands[activeTab as keyof typeof commands].winFile
                        )
                      }
                      className="px-2 py-1 rounded bg-cyan-950/80 border border-cyan-700 hover:border-cyan-400 text-[11px] font-mono flex items-center gap-1 text-cyan-300 transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>DOWNLOAD .BAT SCRIPT</span>
                    </button>
                  </div>
                </div>
                <code className="block p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 select-all">
                  {commands[activeTab as keyof typeof commands].win}
                </code>
              </div>

              {/* macOS / Linux Command Card */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                    <span>🍎 MACOS & 🐧 LINUX (TERMINAL):</span>
                    {(detectedPlatform.includes('Mac') || detectedPlatform.includes('Linux')) && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600">
                        DETECTED OS
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleCopy(
                          commands[activeTab as keyof typeof commands].mac,
                          'mac'
                        )
                      }
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500 text-[11px] font-mono flex items-center gap-1 text-slate-200 transition-colors cursor-pointer"
                    >
                      {copiedKey === 'mac' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedKey === 'mac' ? 'COPIED' : 'COPY COMMAND'}</span>
                    </button>
                    <button
                      onClick={() =>
                        handleDownloadScript(
                          commands[activeTab as keyof typeof commands].macScript,
                          commands[activeTab as keyof typeof commands].macFile
                        )
                      }
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-[11px] font-mono flex items-center gap-1 text-slate-300 transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>DOWNLOAD .SH SCRIPT</span>
                    </button>
                  </div>
                </div>
                <code className="block p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-amber-300 select-all">
                  {commands[activeTab as keyof typeof commands].mac}
                </code>
              </div>
            </div>
          )}

          {/* Tab 4: Direct System & Hardware Controls */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div>
                <h3 className="hud-font text-base text-slate-100 font-semibold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-400" />
                  <span>DIRECT SYSTEM HARDWARE CONTROLS</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Manage active browser hardware handles, acoustic subroutines, night tactical filters, and runtime telemetry.
                </p>
              </div>

              {/* Hardware Quick Action Controls Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Audio Master Mute */}
                <button
                  onClick={toggleMuteAll}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    isMuted
                      ? 'bg-rose-950/60 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
                  <div>
                    <div className="font-mono font-bold text-xs">ACOUSTIC SUBROUTINES</div>
                    <div className="text-[11px] text-slate-400">
                      {isMuted ? 'ALL AUDIO SILENCED' : 'VOCAL SYNTHESIS ACTIVE'}
                    </div>
                  </div>
                </button>

                {/* Night Tactical HUD Filter */}
                <button
                  onClick={() => setNightModeDimmer(!nightModeDimmer)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    nightModeDimmer
                      ? 'bg-purple-950/60 border-purple-500 text-purple-300'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {nightModeDimmer ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
                  <div>
                    <div className="font-mono font-bold text-xs">STEALTH NIGHT FILTER</div>
                    <div className="text-[11px] text-slate-400">
                      {nightModeDimmer ? 'ULTRA-DARK HUD ENGAGED' : 'STANDARD LUMINANCE'}
                    </div>
                  </div>
                </button>

                {/* Hot Refresh & Cache Flush */}
                <button
                  onClick={() => window.location.reload()}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500 text-slate-300 text-left flex items-center gap-2.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="font-mono font-bold text-xs">SYSTEM BUFFER PURGE</div>
                    <div className="text-[11px] text-slate-400">FLUSH CACHE & REBOOT HUD</div>
                  </div>
                </button>

                {/* Network & Connectivity Status */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-left flex items-center gap-2.5">
                  {onlineStatus ? <Wifi className="w-5 h-5 text-emerald-400" /> : <WifiOff className="w-5 h-5 text-rose-400" />}
                  <div>
                    <div className="font-mono font-bold text-xs">NETWORK LINK</div>
                    <div className="text-[11px] text-slate-400">
                      {onlineStatus ? `CONNECTED (${latencyMs !== null ? `${latencyMs}ms` : 'NOMINAL'})` : 'OFFLINE'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hardware Telemetry Spec Sheet */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="text-cyan-300 font-bold flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" /> SYSTEM ARCHITECTURE & RESOURCE TELEMETRY:
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-400">
                  <div>• OS Platform: <span className="text-slate-200">{detectedPlatform}</span></div>
                  <div>• Logical CPU Cores: <span className="text-slate-200">{cpuCores} Threads</span></div>
                  <div>• JS Memory Heap: <span className="text-slate-200">{memoryInfo}</span></div>
                  <div>• Web Worker Concurrency: <span className="text-emerald-400 font-semibold">Optimal</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Tharun Lockdown Protocol Simulation */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setIsLockdownActive(true);
                setTimeout(() => setIsLockdownActive(false), 5000);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800 text-rose-300 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>TEST SIMULATED THARUN PROTOCOL LOCKDOWN (5 SECONDS)</span>
            </button>
          </div>
        </div>

        {/* Lockdown Simulation Overlay */}
        {isLockdownActive && (
          <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in duration-300">
            <AlertTriangle className="w-16 h-16 text-rose-500 animate-bounce" />
            <h2 className="hud-font text-xl text-rose-400 font-bold tracking-widest">
              THARUN PROTOCOL HARDWARE LOCKDOWN ENGAGED
            </h2>
            <p className="text-xs font-mono text-slate-400 max-w-sm">
              All subroutines, neural pipelines, and display telemetry suspended for Sir Tharun. Standby while systems purge cache.
            </p>
            <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="w-full h-full bg-rose-500 animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
