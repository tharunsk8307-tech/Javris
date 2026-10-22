import React from 'react';
import { motion } from 'motion/react';

interface ArcReactorCoreProps {
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  audioLevel?: number; // 0 to 1
  onClick?: () => void;
  accentHex?: string;
  aiPersonaName?: string;
}

export const ArcReactorCore: React.FC<ArcReactorCoreProps> = ({
  isSpeaking,
  isListening,
  isThinking,
  audioLevel = 0,
  onClick,
  accentHex = '#06b6d4',
  aiPersonaName = 'JARVIS',
}) => {
  // Determine dominant glow color
  let ringColor = accentHex;
  let glowColor = `${accentHex}66`;
  let statusText = 'ONLINE // READY';

  if (isListening) {
    ringColor = '#10b981';
    glowColor = 'rgba(16, 185, 129, 0.5)';
    statusText = 'LISTENING // AUDIO INPUT';
  } else if (isThinking) {
    ringColor = '#f59e0b';
    glowColor = 'rgba(245, 158, 11, 0.5)';
    statusText = 'PROCESSING // NEURAL MATRIX';
  } else if (isSpeaking) {
    ringColor = accentHex;
    glowColor = `${accentHex}aa`;
    statusText = 'TRANSMITTING // VOCAL SYNTH';
  }

  const scalePulse = 1 + (audioLevel * 0.25 || (isSpeaking ? 0.08 : 0));

  return (
    <div className="relative flex flex-col items-center justify-center p-2 sm:p-4 md:p-3 lg:p-4 select-none max-w-full overflow-hidden">
      {/* Outer Glow Halo */}
      <div
        className="absolute w-52 h-52 sm:w-64 sm:h-64 md:w-60 md:h-60 lg:w-72 lg:h-72 xl:w-80 xl:h-80 rounded-full transition-all duration-700 pointer-events-none blur-3xl opacity-40"
        style={{
          backgroundColor: glowColor,
          transform: `scale(${scalePulse})`,
        }}
      />

      {/* Main Interactive Reactor Base */}
      <div
        onClick={onClick}
        className="relative w-48 h-48 sm:w-60 sm:h-60 md:w-52 md:h-52 lg:w-64 lg:h-64 xl:w-72 xl:h-72 rounded-full flex items-center justify-center cursor-pointer group transition-transform duration-300 active:scale-95"
        title="Click to toggle voice interaction"
      >
        {/* Outer Tech Ring 1 (Clockwise) */}
        <div
          className="absolute inset-0 rounded-full border border-dashed animate-spin-slow transition-colors duration-500"
          style={{ borderColor: ringColor, opacity: 0.45 }}
        />

        {/* Outer Tech Ring 2 (Counter-Clockwise) */}
        <div
          className="absolute inset-1.5 sm:inset-2 md:inset-2 rounded-full border animate-spin-reverse"
          style={{ borderTopColor: ringColor, borderBottomColor: ringColor, opacity: 0.55 }}
        />

        {/* Segmented Markings SVG Ring - Scales proportionally at any resolution */}
        <svg className="absolute inset-3 sm:inset-4 md:inset-3 rounded-full pointer-events-none w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] md:w-[calc(100%-1.5rem)] h-[calc(100%-1.5rem)] sm:h-[calc(100%-2rem)] md:h-[calc(100%-1.5rem)]" viewBox="0 0 200 200">
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="100"
              y1="6"
              x2="100"
              y2="16"
              stroke={isThinking ? '#f59e0b' : isListening ? '#10b981' : ringColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.85"
              transform={`rotate(${deg} 100 100)`}
            />
          ))}
          <circle cx="100" cy="100" r="92" fill="none" stroke={ringColor} strokeWidth="0.8" opacity="0.35" strokeDasharray="3 4" />
        </svg>

        {/* Middle Triangular Arc Grid */}
        <div
          className="absolute inset-8 sm:inset-10 md:inset-9 lg:inset-11 rounded-full border-2 bg-slate-950/80 backdrop-blur-md flex items-center justify-center overflow-hidden transition-colors duration-500"
          style={{
            borderColor: `${ringColor}66`,
            boxShadow: `0 0 25px ${glowColor}`,
          }}
        >
          {/* Internal Radiating Spokes */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[0, 45, 90, 135].map((deg) => (
              <div
                key={deg}
                className="absolute w-full h-[1px]"
                style={{
                  background: `linear-gradient(to right, transparent, ${ringColor}44, transparent)`,
                  transform: `rotate(${deg}deg)`,
                }}
              />
            ))}
          </div>

          {/* Central Reactor Core Pupil */}
          <motion.div
            animate={{
              scale: isSpeaking ? [1, 1.15, 0.98, 1.12, 1] : isListening ? [1, 1.08, 1] : [1, 1.03, 1],
              opacity: isSpeaking ? [0.9, 1, 0.85, 1] : 0.9,
            }}
            transition={{
              duration: isSpeaking ? 1.2 : isListening ? 1.5 : 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-22 md:h-22 lg:w-28 lg:h-28 rounded-full flex flex-col items-center justify-center text-center shadow-inner"
            style={{
              background: `radial-gradient(circle, ${ringColor} 0%, rgba(3,7,18,0.95) 80%)`,
              boxShadow: `0 0 30px ${glowColor}, inset 0 0 16px ${ringColor}`,
            }}
          >
            {/* Heartbeat Center Point */}
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow-[0_0_18px_#ffffff] mb-0.5 sm:mb-1 animate-pulse" />
            <span className="hud-font font-bold text-[10px] sm:text-[11px] md:text-xs tracking-widest text-slate-100 uppercase">
              {aiPersonaName.replace(/\./g, '')}
            </span>
            <span className="mono-font text-[7px] sm:text-[8px] md:text-[9px] text-slate-300 tracking-tighter">
              VOICE CORE
            </span>
          </motion.div>
        </div>
      </div>

      {/* Realtime Core Audio Spectrum Bars */}
      <div className="flex items-center gap-1 sm:gap-1.5 h-6 sm:h-8 mt-3 sm:mt-4">
        {[40, 70, 95, 60, 85, 100, 75, 45, 80, 50, 90, 65].map((baseH, idx) => {
          const dynamicHeight = isSpeaking
            ? Math.min(100, Math.max(15, baseH * (0.4 + audioLevel * 1.2)))
            : isListening
            ? Math.min(100, Math.max(10, (idx % 3 === 0 ? 55 : 25) + audioLevel * 60))
            : 8;

          return (
            <div
              key={idx}
              className="w-1 md:w-1.5 rounded-full transition-all duration-75"
              style={{
                height: `${dynamicHeight}%`,
                backgroundColor: isThinking ? '#f59e0b' : isListening ? '#10b981' : ringColor,
                opacity: isSpeaking || isListening ? 0.9 : 0.3,
                boxShadow: isSpeaking ? `0 0 8px ${ringColor}` : undefined,
              }}
            />
          );
        })}
      </div>

      {/* Status Readout Bar */}
      <div className="mt-3 flex items-center gap-2 text-xs hud-font tracking-widest text-slate-300">
        <span
          className="inline-block w-2 h-2 rounded-full animate-ping"
          style={{ backgroundColor: ringColor }}
        />
        <span>{statusText}</span>
      </div>
    </div>
  );
};
