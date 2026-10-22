import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  Mic,
  Mail,
  MessageSquare,
  Camera,
  Laptop,
  Clock,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Globe,
  Radio,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { VoicePreset } from '../types';

interface CustomerSystemGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: VoicePreset;
  effectiveAccentColor?: string;
  onLaunchModule?: (module: 'gmail' | 'whatsapp' | 'vision' | 'hardware' | 'time' | 'voice') => void;
}

export const CustomerSystemGuideModal: React.FC<CustomerSystemGuideModalProps> = ({
  isOpen,
  onClose,
  selectedVoice,
  effectiveAccentColor = '#06b6d4',
  onLaunchModule,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'capabilities' | 'commands' | 'faq'>('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative bg-slate-950 border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        style={{
          borderColor: `${effectiveAccentColor}60`,
          boxShadow: `0 0 50px ${effectiveAccentColor}25`,
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl border flex items-center justify-center"
              style={{
                backgroundColor: `${effectiveAccentColor}15`,
                borderColor: `${effectiveAccentColor}50`,
                color: effectiveAccentColor,
              }}
            >
              <HelpCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="hud-font font-bold text-base sm:text-lg tracking-wider text-slate-100">
                  J.A.R.V.I.S. SYSTEM ARCHITECTURE & USER GUIDE
                </h2>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold border"
                  style={{
                    backgroundColor: `${effectiveAccentColor}15`,
                    borderColor: `${effectiveAccentColor}40`,
                    color: effectiveAccentColor,
                  }}
                >
                  REAL-WORLD AI OS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Next-Gen Executive Voice AI Assistant & Autonomous Workspace Telemetry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 py-2 bg-slate-900/50 border-b border-slate-800/80 overflow-x-auto text-xs font-mono shrink-0">
          {[
            { id: 'overview', label: '1. What is J.A.R.V.I.S.?' },
            { id: 'capabilities', label: '2. Core Workspace Modules' },
            { id: 'commands', label: '3. Voice Commands & Directives' },
            { id: 'faq', label: '4. Everyday Customer Benefits' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              style={
                activeTab === tab.id
                  ? {
                      backgroundColor: `${effectiveAccentColor}20`,
                      borderColor: `${effectiveAccentColor}60`,
                      borderWidth: '1px',
                      color: effectiveAccentColor,
                    }
                  : undefined
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Executive Summary Card */}
              <div
                className="p-5 rounded-2xl border bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-950"
                style={{ borderColor: `${effectiveAccentColor}40` }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-2xl border shrink-0 mt-1"
                    style={{
                      backgroundColor: `${effectiveAccentColor}20`,
                      borderColor: `${effectiveAccentColor}60`,
                    }}
                  >
                    <Sparkles className="w-6 h-6" style={{ color: effectiveAccentColor }} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="hud-font font-bold text-lg text-slate-100">
                      Understanding J.A.R.V.I.S. in the Real World
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed font-sans">
                      <strong className="text-white">J.A.R.V.I.S.</strong> stands for{' '}
                      <span className="font-semibold text-cyan-300">
                        &quot;Just A Rather Very Intelligent System&quot;
                      </span>
                      . Unlike fictional comic gadgets, this is a{' '}
                      <strong>complete, real-world voice artificial intelligence and operational cockpit</strong>{' '}
                      engineered for executives, professionals, creators, and modern teams.
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      It operates continuously in real time: listening to natural voice instructions, inspecting
                      spatial camera feeds, syncing live global chronometers, automating Google Workspace Gmail
                      communications, and interfacing directly with your computer hardware.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Core Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                    <Mic className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-200 font-mono">1. Natural Voice Intelligence</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Speaks aloud in human-sounding executive voices with instant conversational responses, multi-turn reasoning, and customizable personality models.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-200 font-mono">2. Workspace Automation</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Full Google Workspace integration to search emails, read unread threads, compose executive briefs, and dispatch WhatsApp alerts to team members.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400">
                    <Camera className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-200 font-mono">3. Computer Vision & 3D Spatial</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Live camera facial landmark vectoring, hand gesture detection, and 3D spatial model inspection powered by Three.js WebGL graphics.
                  </p>
                </div>
              </div>

              {/* Quick Start Action Row */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-300 font-mono">
                  Ready to test? Click the central <span className="text-cyan-300 font-bold">Neural Voice Core</span> or use the microphone bar to start speaking.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLaunchModule?.('voice');
                  }}
                  className="px-4 py-2 rounded-xl font-mono text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Mic className="w-4 h-4" />
                  <span>START VOICE INTERACTION</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CORE WORKSPACE MODULES */}
          {activeTab === 'capabilities' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <p className="text-xs text-slate-400 font-mono">
                Explore the 6 integrated subsystems built into the J.A.R.V.I.S. workspace environment:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Gmail Automation */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/50 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-sm">
                      <Mail className="w-4 h-4" />
                      <span>Gmail Workspace Station</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLaunchModule?.('gmail');
                      }}
                      className="text-[11px] font-mono text-cyan-300 hover:text-cyan-100 flex items-center gap-1 cursor-pointer"
                    >
                      <span>LAUNCH</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-300">
                    Connect real Google Workspace credentials. Search your actual inbox, read recent incoming emails, and compose professional broadcasts or meeting summaries hands-free.
                  </p>
                </div>

                {/* 2. WhatsApp Dispatch */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/50 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-sm">
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp Direct Comms</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLaunchModule?.('whatsapp');
                      }}
                      className="text-[11px] font-mono text-emerald-300 hover:text-emerald-100 flex items-center gap-1 cursor-pointer"
                    >
                      <span>LAUNCH</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-300">
                    Maintain a synchronized contact directory (VIP clients, teammates, emergency contacts). Pre-format mission updates and trigger WhatsApp Web messaging with one click.
                  </p>
                </div>

                {/* 3. Computer Vision & 3D Holograms */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/50 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold text-sm">
                      <Camera className="w-4 h-4" />
                      <span>Computer Vision & 3D Spatial</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLaunchModule?.('vision');
                      }}
                      className="text-[11px] font-mono text-cyan-300 hover:text-cyan-100 flex items-center gap-1 cursor-pointer"
                    >
                      <span>LAUNCH</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-300">
                    Real-time webcam telemetry for face contours, gestures, and object identification. Convert scans into interactive 3D spatial models rendered in real-time WebGL.
                  </p>
                </div>

                {/* 4. Laptop Hardware Command */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-amber-500/50 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-sm">
                      <Laptop className="w-4 h-4" />
                      <span>Device Hardware Control</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLaunchModule?.('hardware');
                      }}
                      className="text-[11px] font-mono text-amber-300 hover:text-amber-100 flex items-center gap-1 cursor-pointer"
                    >
                      <span>LAUNCH</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-300">
                    Live battery percentage readout, screen wake-lock prevention, network latency ping test, night dimmer, and one-click copyable OS terminal commands (macOS, Windows, Linux).
                  </p>
                </div>

                {/* 5. Global Timezone Chronometer */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-purple-500/50 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-400 font-mono font-bold text-sm">
                      <Clock className="w-4 h-4" />
                      <span>World Time & Chronometer</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLaunchModule?.('time');
                      }}
                      className="text-[11px] font-mono text-purple-300 hover:text-purple-100 flex items-center gap-1 cursor-pointer"
                    >
                      <span>LAUNCH</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-300">
                    Atomic-precision 24-hour and 12-hour clock, millisecond precision stopwatch, and synchronized timezone clocks for major international business hubs (New York, London, Tokyo, Silicon Valley, Bengaluru).
                  </p>
                </div>

                {/* 6. Multi-Person Voice Personas */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-rose-500/50 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-sm">
                      <Radio className="w-4 h-4" />
                      <span>Multi-Voice Personas & Themes</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      5 SPECIALIZED ROLES
                    </div>
                  </div>
                  <p className="text-xs text-slate-300">
                    Switch seamlessly between 5 executive AI personas: Classic British J.A.R.V.I.S., Agile F.R.I.D.A.Y., Operations Director C.H.A.R.O.N., Rapid Strategic V.A.N.G.U.A.R.D., and Analytics Z.E.P.H.Y.R.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXAMPLE VOICE COMMANDS */}
          {activeTab === 'commands' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <p className="text-xs text-slate-400 font-mono">
                Speak naturally or type these example instructions to trigger automated actions:
              </p>

              <div className="space-y-3">
                {[
                  {
                    category: 'Workspace & Emails',
                    command: '"Jarvis, check my Gmail inbox for unread messages"',
                    effect: 'Opens the Gmail workspace station and queries latest Google Workspace emails.',
                  },
                  {
                    category: 'Communications',
                    command: '"Jarvis, open WhatsApp automation and send an operational brief"',
                    effect: 'Loads the contact matrix and pre-fills your custom status update for 1-click dispatch.',
                  },
                  {
                    category: 'Computer Vision',
                    command: '"Jarvis, activate live camera and inspect 3D spatial models"',
                    effect: 'Launches the optical scanner for face biometric analysis and Three.js 3D model viewer.',
                  },
                  {
                    category: 'Device Hardware',
                    command: '"Jarvis, what is my laptop battery level?"',
                    effect: 'Queries your browser Battery API and reports percentage and charging telemetry.',
                  },
                  {
                    category: 'Global Time',
                    command: '"Jarvis, what time is it in Tokyo and London?"',
                    effect: 'Opens the world clock matrix and provides instant timezone offsets.',
                  },
                  {
                    category: 'HUD Appearance',
                    command: '"Jarvis, switch interface theme to emerald (or amber / rose / cyan)"',
                    effect: 'Instantly changes the entire workspace aesthetic and lighting palette.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {item.category}
                        </span>
                        <span className="text-xs font-mono font-bold text-cyan-300">
                          {item.command}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{item.effect}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: FAQ & REAL-WORLD VALUE */}
          {activeTab === 'faq' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
                <h4 className="font-bold text-sm text-slate-200 font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Do I need any Marvel knowledge to use J.A.R.V.I.S.?
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Not at all.</strong> While the name is a famous technological acronym, every single capability—voice AI, email dispatch, computer vision, device telemetry, and global clock—is designed to function as a professional, real-world executive cockpit for daily productivity and team workflows.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
                <h4 className="font-bold text-sm text-slate-200 font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Is my data private and secure?
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Yes. Your authentication and profile preferences are backed by Google Cloud Firebase Firestore with strict per-user security rules. Gmail tokens stay safely on your local client session and are only used to fetch or send emails you specifically authorize.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
                <h4 className="font-bold text-sm text-slate-200 font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  What is the central pulsing circle?
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  That is the <strong>Neural Voice Core</strong>. It acts as an interactive acoustic visualizer. When speaking, listening, or thinking, it animates audio frequencies in real time. You can click it at any moment to start or stop voice input.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: effectiveAccentColor }} />
            <span>J.A.R.V.I.S. ENTERPRISE OS • REAL-WORLD PRODUCTIVITY ENGINE</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
          >
            DISMISS GUIDE
          </button>
        </div>
      </div>
    </div>
  );
};
