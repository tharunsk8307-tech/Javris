import React, { useEffect, useRef, useState } from 'react';
import { Activity, Cpu, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';

export type SystemStatusMode = 'normal' | 'high_load' | 'transmitting' | 'critical';

interface DynamicHudBackgroundProps {
  isThinking: boolean;
  isSpeaking?: boolean;
  reactorPower?: number;
  coreTemp?: number;
  accentColor?: string;
  simulatedHighLoad?: boolean;
  onToggleSimulatedLoad?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  pulsePhase: number;
  pulseSpeed: number;
}

interface PulseWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
  width: number;
}

export const DynamicHudBackground: React.FC<DynamicHudBackgroundProps> = ({
  isThinking,
  isSpeaking = false,
  reactorPower = 99.4,
  coreTemp = 38,
  accentColor = '#06b6d4',
  simulatedHighLoad = false,
  onToggleSimulatedLoad,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Determine current active system state
  const isHighLoad = isThinking || simulatedHighLoad || coreTemp > 65;
  const isCritical = reactorPower < 90;
  const isWarning = reactorPower < 95 && !isCritical;

  let currentMode: SystemStatusMode = 'normal';
  if (isCritical) {
    currentMode = 'critical';
  } else if (isHighLoad || isWarning) {
    currentMode = 'high_load';
  } else if (isSpeaking) {
    currentMode = 'transmitting';
  }

  // Palette definitions with smooth lerping
  const targetColors = {
    normal: {
      primary: { r: 6, g: 182, b: 212 }, // Cool Cyan / Blue (#06b6d4)
      secondary: { r: 14, g: 165, b: 233 }, // Sky Blue (#0ea5e9)
      accent: { r: 59, g: 130, b: 246 }, // Indigo / Blue (#3b82f6)
      glowAlpha: 0.12,
      pulseRate: 0.0018,
      speedMultiplier: 1.0,
      label: 'NOMINAL · COOL BLUE',
      desc: 'Standard tactical standby and low system load',
    },
    high_load: {
      primary: { r: 245, g: 158, b: 11 }, // Warm Amber (#f59e0b)
      secondary: { r: 251, g: 191, b: 36 }, // Glowing Gold (#fbbf24)
      accent: { r: 217, g: 119, b: 6 }, // Deep Orange-Amber (#d97706)
      glowAlpha: 0.22,
      pulseRate: 0.0055, // Fast dynamic pulse
      speedMultiplier: 2.2, // Accelerated particle throughput
      label: 'HIGH LOAD · PULSING AMBER',
      desc: 'Active neural inference processing & tensor computation',
    },
    transmitting: {
      primary: { r: 168, g: 85, b: 247 }, // Electric Purple / Violet (#a855f7)
      secondary: { r: 6, g: 182, b: 212 }, // Cyan (#06b6d4)
      accent: { r: 99, g: 102, b: 241 }, // Indigo (#6366f1)
      glowAlpha: 0.18,
      pulseRate: 0.0035,
      speedMultiplier: 1.5,
      label: 'TRANSMITTING · HARMONIC VIOLET',
      desc: 'Vocal acoustic synthesizer dispatching audio packets',
    },
    critical: {
      primary: { r: 239, g: 68, b: 68 }, // Critical Red (#ef4444)
      secondary: { r: 244, g: 63, b: 94 }, // Rose (#f43f5e)
      accent: { r: 185, g: 28, b: 28 }, // Crimson (#b91c1c)
      glowAlpha: 0.25,
      pulseRate: 0.007,
      speedMultiplier: 2.8,
      label: 'CRITICAL ALERT · PULSING CRIMSON',
      desc: 'Reactor power sub-90% deficit detected',
    },
  };

  const currentTheme = targetColors[currentMode];

  // Ref to hold currently interpolated RGB colors for buttery smooth transitions
  const currentColorRef = useRef({
    primary: { ...targetColors.normal.primary },
    secondary: { ...targetColors.normal.secondary },
    accent: { ...targetColors.normal.accent },
    glowAlpha: targetColors.normal.glowAlpha,
    speedMultiplier: targetColors.normal.speedMultiplier,
    pulseRate: targetColors.normal.pulseRate,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Initialize floating cybernetic particles
    const particleCount = Math.min(48, Math.floor((width * height) / 30000));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.2,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.02,
      });
    }

    // Pulse waves that emanate outwards periodically
    const pulseWaves: PulseWave[] = [];
    let lastWaveTime = 0;

    let time = 0;

    const render = (now: number) => {
      time = now;
      const target = targetColors[currentMode];
      const cur = currentColorRef.current;

      // Smooth color interpolation (LERP) factor
      const lerpSpeed = 0.04;
      cur.primary.r += (target.primary.r - cur.primary.r) * lerpSpeed;
      cur.primary.g += (target.primary.g - cur.primary.g) * lerpSpeed;
      cur.primary.b += (target.primary.b - cur.primary.b) * lerpSpeed;

      cur.secondary.r += (target.secondary.r - cur.secondary.r) * lerpSpeed;
      cur.secondary.g += (target.secondary.g - cur.secondary.g) * lerpSpeed;
      cur.secondary.b += (target.secondary.b - cur.secondary.b) * lerpSpeed;

      cur.accent.r += (target.accent.r - cur.accent.r) * lerpSpeed;
      cur.accent.g += (target.accent.g - cur.accent.g) * lerpSpeed;
      cur.accent.b += (target.accent.b - cur.accent.b) * lerpSpeed;

      cur.glowAlpha += (target.glowAlpha - cur.glowAlpha) * lerpSpeed;
      cur.speedMultiplier += (target.speedMultiplier - cur.speedMultiplier) * lerpSpeed;
      cur.pulseRate += (target.pulseRate - cur.pulseRate) * lerpSpeed;

      // Clear frame
      ctx.clearRect(0, 0, width, height);

      // 1. Dynamic Radial Ambient Energy Blooms
      const pR = Math.round(cur.primary.r);
      const pG = Math.round(cur.primary.g);
      const pB = Math.round(cur.primary.b);

      const sR = Math.round(cur.secondary.r);
      const sG = Math.round(cur.secondary.g);
      const sB = Math.round(cur.secondary.b);

      // Breathing pulse oscillation factor
      const pulsePhase = Math.sin(now * cur.pulseRate);
      const breathingAlpha = cur.glowAlpha * (1 + 0.35 * pulsePhase);

      // Center-left bloom (near Arc Reactor / Left column)
      const gradLeft = ctx.createRadialGradient(
        width * 0.25,
        height * 0.45,
        0,
        width * 0.25,
        height * 0.45,
        width * 0.6
      );
      gradLeft.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${breathingAlpha})`);
      gradLeft.addColorStop(0.5, `rgba(${sR}, ${sG}, ${sB}, ${breathingAlpha * 0.45})`);
      gradLeft.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = gradLeft;
      ctx.fillRect(0, 0, width, height);

      // Top-right tactical bloom (Header/Diagnostics corner)
      const gradRight = ctx.createRadialGradient(
        width * 0.82,
        height * 0.2,
        0,
        width * 0.82,
        height * 0.2,
        width * 0.5
      );
      gradRight.addColorStop(0, `rgba(${sR}, ${sG}, ${sB}, ${breathingAlpha * 0.7})`);
      gradRight.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = gradRight;
      ctx.fillRect(0, 0, width, height);

      // 2. Subtle Coordinate Grid Lines & Crosshair Vertices
      const gridSize = 72;
      ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${0.035 + 0.02 * pulsePhase})`;
      ctx.lineWidth = 1;

      ctx.beginPath();
      // Draw faint vertical grid lines
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      // Draw faint horizontal grid lines
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Draw subtle crosshair markers (+) at select grid intersections
      ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${0.09 + 0.05 * pulsePhase})`;
      const markInterval = gridSize * 3;
      for (let x = markInterval / 2; x < width; x += markInterval) {
        for (let y = markInterval / 2; y < height; y += markInterval) {
          ctx.fillRect(x - 3, y, 7, 1);
          ctx.fillRect(x, y - 3, 1, 7);
        }
      }

      // 3. Periodic Tactical Concentric Radar / Neural Pulse Waves
      const waveInterval = currentMode === 'high_load' ? 1200 : currentMode === 'critical' ? 900 : 3200;
      if (now - lastWaveTime > waveInterval) {
        lastWaveTime = now;
        pulseWaves.push({
          x: width * 0.25, // Arc reactor anchor
          y: height * 0.45,
          radius: 10,
          maxRadius: Math.max(width, height) * 0.85,
          alpha: currentMode === 'high_load' ? 0.35 : 0.18,
          speed: (currentMode === 'high_load' ? 3.5 : 1.5) * cur.speedMultiplier,
          width: currentMode === 'high_load' ? 2 : 1.5,
        });
      }

      // Update and draw pulse waves
      for (let i = pulseWaves.length - 1; i >= 0; i--) {
        const wave = pulseWaves[i];
        wave.radius += wave.speed;
        const progress = wave.radius / wave.maxRadius;
        const currentAlpha = wave.alpha * (1 - progress);

        if (progress >= 1 || currentAlpha <= 0.005) {
          pulseWaves.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${currentAlpha})`;
        ctx.lineWidth = wave.width;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.stroke();

        // High load: dual secondary ripple
        if (currentMode === 'high_load' && wave.radius > 40) {
          ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${currentAlpha * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(wave.x, wave.y, wave.radius - 20, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 4. Cybernetic Synaptic Node Particles & Interconnect Lines
      const speed = cur.speedMultiplier;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * speed;
        p.y += p.vy * speed;

        // Wrap around boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.pulsePhase += p.pulseSpeed * speed;
        const pAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulsePhase));

        // Draw particle node
        ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${pAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby nodes with faint neural synapse vectors
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distSq = dx * dx + dy * dy;
          const maxDist = 120;

          if (distSq < maxDist * maxDist) {
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / maxDist) * 0.12 * (currentMode === 'high_load' ? 1.6 : 0.8);
            ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${lineAlpha})`;
            ctx.lineWidth = currentMode === 'high_load' ? 1.2 : 0.75;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // 5. High Processing Load: Golden-amber holographic scan sweep beam
      if (currentMode === 'high_load') {
        const beamY = ((now * 0.15) % (height + 200)) - 100;
        const beamGrad = ctx.createLinearGradient(0, beamY - 40, 0, beamY + 40);
        beamGrad.addColorStop(0, 'rgba(245, 158, 11, 0)');
        beamGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.08)');
        beamGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(0, beamY - 40, width, 80);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentMode]);

  return (
    <>
      {/* 2D Canvas Layer - GPU hardware accelerated */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
        style={{ opacity: 0.95 }}
      />

      {/* Cybernetic Radial Vignette & Edge Shadow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(2, 6, 23, 0.75) 100%)',
        }}
      />

      {/* Subtle CRT Scanline Texture Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.18) 1px, transparent 1px, transparent 2px)',
        }}
      />

      {/* Floating HUD Telemetry Badge & Dynamic Mode Indicator */}
      <div className="fixed bottom-3 right-3 z-30 pointer-events-auto">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all duration-500 shadow-lg text-[10px] font-mono ${
            currentMode === 'high_load'
              ? 'bg-amber-950/80 border-amber-500/70 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.35)] animate-pulse'
              : currentMode === 'critical'
              ? 'bg-rose-950/80 border-rose-500/70 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse'
              : currentMode === 'transmitting'
              ? 'bg-purple-950/80 border-purple-500/70 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              : 'bg-slate-900/80 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {currentMode === 'high_load' ? (
              <Cpu className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            ) : currentMode === 'critical' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
            ) : currentMode === 'transmitting' ? (
              <Zap className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            ) : (
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            )}
            <span className="font-bold tracking-wider">{currentTheme.label}</span>
          </div>

          <div className="h-3 w-[1px] bg-slate-700 mx-0.5" />

          {/* 1-Click Interactive Test Button for User */}
          <button
            type="button"
            onClick={onToggleSimulatedLoad}
            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer text-[9px] font-bold uppercase tracking-wider ${
              isHighLoad
                ? 'bg-amber-500 text-slate-950 border-amber-300 hover:bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                : 'bg-slate-800 hover:bg-cyan-950 border-slate-700 text-slate-300 hover:text-cyan-200'
            }`}
            title="Click to toggle high processing load animation state"
          >
            {isHighLoad ? 'PULSING LOAD ON' : 'SIMULATE LOAD'}
          </button>
        </div>
      </div>
    </>
  );
};
