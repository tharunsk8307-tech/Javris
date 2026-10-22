import React from 'react';
import { Target, Compass, Activity, Zap } from 'lucide-react';
import { FaceTrackingMetrics } from '../utils/faceTracker';

interface FaceLockReticleProps {
  metrics: FaceTrackingMetrics;
  compact?: boolean;
  className?: string;
  accentColor?: string;
}

export const FaceLockReticle: React.FC<FaceLockReticleProps> = ({
  metrics,
  compact = false,
  className = '',
  accentColor = '#06b6d4',
}) => {
  const isHighConfidence = metrics.confidence >= 0.85;
  const tiltSign = metrics.tiltAngle > 0 ? '+' : '';

  // Calculate dynamic pixel displacement offset from center (0.5, 0.5)
  // Clamp displacement to keep reticle safely inside viewport
  const offsetXPercent = (metrics.x - 0.5) * 45; // Max +/- 22.5%
  const offsetYPercent = (metrics.y - 0.5) * 35; // Max +/- 17.5%

  if (compact) {
    return (
      <div
        className={`absolute inset-0 pointer-events-none flex items-center justify-center transition-transform duration-100 ease-out ${className}`}
        style={{
          transform: `translate(${offsetXPercent}%, ${offsetYPercent}%)`,
        }}
      >
        <div
          className="relative w-32 h-44 sm:w-36 sm:h-48 border-2 border-dashed rounded-[50%] flex flex-col items-center justify-between p-2 shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all duration-150"
          style={{
            borderColor: isHighConfidence ? 'rgba(6, 182, 212, 0.8)' : 'rgba(245, 158, 11, 0.8)',
            transform: `rotate(${metrics.tiltAngle}deg)`,
          }}
        >
          {/* Top Lock Badge */}
          <div className="text-[8px] font-mono font-bold text-cyan-300 bg-slate-950/90 px-1.5 py-0.5 rounded border border-cyan-500/60 flex items-center gap-1 shadow-sm">
            <span className={`w-1.5 h-1.5 rounded-full ${metrics.detected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span>FACE LOCK</span>
          </div>

          {/* Central reticle crosshair */}
          <div className="relative flex items-center justify-center">
            <div className="w-5 h-5 border border-cyan-400/40 rounded-full flex items-center justify-center animate-spin">
              <div className="w-1 h-1 bg-cyan-300 rounded-full" />
            </div>
          </div>

          {/* Real-time Tracking Metrics Readout (Compact) */}
          <div className="w-full flex flex-col items-center gap-0.5 text-[8px] font-mono text-cyan-300 bg-slate-950/95 px-1.5 py-1 rounded-md border border-cyan-800/80 shadow-md">
            <div className="flex justify-between w-full font-bold">
              <span>X:{metrics.x.toFixed(2)} Y:{metrics.y.toFixed(2)}</span>
              <span className="text-amber-300">{tiltSign}{metrics.tiltAngle.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between w-full text-[7.5px] text-slate-400 border-t border-slate-800 pt-0.5">
              <span>CONF:</span>
              <span className="text-emerald-400 font-bold">{(metrics.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`absolute inset-0 pointer-events-none flex items-center justify-center z-10 transition-transform duration-100 ease-out ${className}`}
      style={{
        transform: `translate(${offsetXPercent}%, ${offsetYPercent}%)`,
      }}
    >
      {/* Central Rotating & Tracking Biometric Reticle */}
      <div
        className="relative w-44 h-56 sm:w-52 sm:h-64 border-2 border-dashed rounded-[50%] flex flex-col items-center justify-between p-3 transition-all duration-150"
        style={{
          borderColor: isHighConfidence ? 'rgba(6, 182, 212, 0.85)' : 'rgba(245, 158, 11, 0.85)',
          boxShadow: isHighConfidence
            ? '0 0 30px rgba(6, 182, 212, 0.35), inset 0 0 15px rgba(6, 182, 212, 0.15)'
            : '0 0 25px rgba(245, 158, 11, 0.35)',
          transform: `rotate(${metrics.tiltAngle}deg)`,
        }}
      >
        {/* 4 Cybernetic Corner Brackets */}
        <div className="w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-300 absolute -top-1 -left-1" />
        <div className="w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-300 absolute -top-1 -right-1" />
        <div className="w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-300 absolute -bottom-1 -left-1" />
        <div className="w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-300 absolute -bottom-1 -right-1" />

        {/* Top Header Badge */}
        <div className="text-[9px] font-mono font-bold tracking-wider text-cyan-200 bg-slate-950/95 px-2.5 py-0.5 rounded-full border border-cyan-500/70 flex items-center gap-1.5 shadow-lg -translate-y-2">
          <Target className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>[ FACE LOCK // BIOMETRIC MATRIX ]</span>
        </div>

        {/* Dynamic Center Crosshair Core */}
        <div className="relative flex items-center justify-center">
          <div className="w-8 h-8 border border-cyan-400/50 rounded-full flex items-center justify-center animate-spin">
            <div className="w-1.5 h-1.5 bg-cyan-300 rounded-full shadow-[0_0_8px_#06b6d4]" />
          </div>
          {/* Subtle crosshair lines */}
          <div className="w-12 h-[1px] bg-cyan-400/30 absolute" />
          <div className="h-12 w-[1px] bg-cyan-400/30 absolute" />
        </div>

        {/* Real-Time Telemetry Wings (Counter-rotate text slightly to keep legible) */}
        <div
          className="w-full bg-slate-950/95 rounded-lg border border-cyan-500/60 p-2 shadow-xl flex flex-col gap-1 translate-y-2"
          style={{ transform: `rotate(${-metrics.tiltAngle * 0.35}deg)` }}
        >
          {/* Row 1: X / Y Coordinates & Tilt Angle */}
          <div className="flex items-center justify-between text-[9px] font-mono text-cyan-300">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">POS:</span>
              <span className="font-bold bg-cyan-950 px-1 py-0.2 rounded border border-cyan-800/60">
                X:{metrics.x.toFixed(3)} Y:{metrics.y.toFixed(3)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-amber-400" />
              <span className="text-slate-400">TILT:</span>
              <span className="font-bold text-amber-300 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-800/60">
                {tiltSign}{metrics.tiltAngle.toFixed(1)}°
              </span>
            </div>
          </div>

          {/* Row 2: Confidence Score & Lock Status */}
          <div className="flex items-center justify-between text-[9px] font-mono border-t border-slate-800 pt-1">
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span className="text-slate-400">CONFIDENCE:</span>
              <span className="font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/60">
                {(metrics.confidence * 100).toFixed(0)}%
              </span>
            </div>

            <div className="flex items-center gap-1 text-[8.5px] text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold tracking-wider">
                {metrics.detected ? 'TARGET LOCKED' : 'SEARCHING'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
