import React, { useRef, useEffect, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  User,
  Bot,
  Trash2,
  ExternalLink,
  Play,
  Music,
  Video,
  Globe,
  Search,
  Laptop,
  Power,
  Terminal,
  Settings,
  Mic,
  X,
  Camera,
  Box,
  Copy,
  Check,
  RotateCcw,
  MoreVertical,
  Timer,
  Clock,
  MapPin,
  Navigation,
  Compass,
  Mail,
  MessageSquare,
  Send,
} from 'lucide-react';
import { ChatMessage } from '../types';

interface MessageFeedProps {
  messages: ChatMessage[];
  isThinking: boolean;
  playingMessageId: string | null;
  onPlaySpeech: (message: ChatMessage) => void;
  onStopSpeech: () => void;
  onClearHistory: () => void;
  onRemoveMessage?: (messageId: string) => void;
  onDirectNavigate?: (url: string) => void;
  onOpenLaptopControl?: (directive?: any) => void;
  onOpenShortcuts?: () => void;
  onOpenVisionScanner?: () => void;
  onOpenTimeModal?: () => void;
  onOpenLocationModal?: () => void;
  onOpenAutomationHub?: (
    tab?: 'gmail' | 'whatsapp' | 'broadcast',
    options?: {
      emailTo?: string;
      emailSubject?: string;
      emailBody?: string;
      waPhone?: string;
      waText?: string;
    }
  ) => void;
  effectiveAccentColor?: string;
}

interface ContextMenuPosition {
  x: number;
  y: number;
  message: ChatMessage;
}

export const MessageFeed: React.FC<MessageFeedProps> = ({
  messages,
  isThinking,
  playingMessageId,
  onPlaySpeech,
  onStopSpeech,
  onClearHistory,
  onRemoveMessage,
  onDirectNavigate,
  onOpenLaptopControl,
  onOpenShortcuts,
  onOpenVisionScanner,
  onOpenTimeModal,
  onOpenLocationModal,
  onOpenAutomationHub,
  effectiveAccentColor = '#06b6d4',
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [elapsedThinkingSeconds, setElapsedThinkingSeconds] = useState(0);

  // Real-time elapsed stopwatch counter during cognitive processing
  useEffect(() => {
    let interval: any = null;
    if (isThinking) {
      const start = performance.now();
      setElapsedThinkingSeconds(0);
      interval = setInterval(() => {
        setElapsedThinkingSeconds(Number(((performance.now() - start) / 1000).toFixed(1)));
      }, 100);
    } else {
      setElapsedThinkingSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isThinking]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Handle closing context menu on external click, scroll or Escape key
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };

    const handleScroll = () => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent, msg: ChatMessage) => {
    e.preventDefault();
    e.stopPropagation();

    // Position menu safely inside the viewport
    const menuWidth = 220;
    const menuHeight = 160;
    const clientX = e.clientX;
    const clientY = e.clientY;

    const x = clientX + menuWidth > window.innerWidth
      ? Math.max(10, clientX - menuWidth)
      : clientX;
    const y = clientY + menuHeight > window.innerHeight
      ? Math.max(10, clientY - menuHeight)
      : clientY;

    setContextMenu({
      x,
      y,
      message: msg,
    });
  };

  const handleCopyText = async (msg: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2200);
    } catch (err) {
      console.error('Failed to copy message text:', err);
    }
    setContextMenu(null);
  };

  const handleSpeakAgain = (msg: ChatMessage) => {
    onStopSpeech();
    setTimeout(() => {
      onPlaySpeech(msg);
    }, 60);
    setContextMenu(null);
  };

  const handleDeleteMessage = (msg: ChatMessage) => {
    if (onRemoveMessage) {
      onRemoveMessage(msg.id);
    }
    setContextMenu(null);
  };

  // Helper to render markdown links as real clickable links in new tabs
  const renderFormattedText = (text: string) => {
    const parts = [];
    const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = markdownLinkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const label = match[1];
      const url = match[2];
      parts.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (onDirectNavigate) {
              e.preventDefault();
              onDirectNavigate(url);
            }
          }}
          className="text-cyan-400 hover:text-cyan-300 font-semibold underline inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/40"
        >
          <span>{label}</span>
          <ExternalLink className="w-3 h-3 inline" />
        </a>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  const getActionIcon = (category: string) => {
    switch (category) {
      case 'video':
        return <Video className="w-4 h-4 text-cyan-400" />;
      case 'music':
        return <Music className="w-4 h-4 text-emerald-400" />;
      case 'search':
        return <Search className="w-4 h-4 text-amber-400" />;
      case 'system':
        return <Laptop className="w-4 h-4 text-rose-400" />;
      case 'camera_3d':
        return <Camera className="w-4 h-4 text-cyan-400" />;
      default:
        return <Globe className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden scanline-effect relative">
      {/* Top Feed Bar with Clear Log Action */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-950/60 bg-slate-950/60 text-xs mono-font text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
            <Bot className="w-3.5 h-3.5" />
            COMMUNICATION LOG ({messages.length})
          </span>
          {onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-100 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 transition-colors cursor-pointer"
              title="Open Voice Shortcuts Manager"
            >
              <Mic className="w-3 h-3 text-cyan-400" />
              <span>VOICE SHORTCUTS</span>
            </button>
          )}
        </div>
        <button
          onClick={onClearHistory}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
          title="Clear conversation history and reset feed"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>CLEAR FEED</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center p-6 border border-cyan-950/60 rounded-xl bg-slate-950/40">
            <div className="w-12 h-12 rounded-full border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 bg-cyan-950/20">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="hud-font text-base text-cyan-200 tracking-wider mb-1">
              J.A.R.V.I.S. READY FOR PROTOCOL DIRECTIVES
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Issue any vocal command: "what is AI?", "shutdown laptop", "check battery", "play a song", "open any website". Direct link routing and laptop control bridge are armed.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isPlaying = playingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                onContextMenu={(e) => handleContextMenu(e, msg)}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} transition-all group/msg relative`}
              >
                {/* Message Metadata Header */}
                <div className="flex items-center justify-between w-full max-w-2xl text-[11px] text-slate-400 mb-1 px-1">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      {isUser ? (
                        <>
                          <User className="w-3 h-3 text-cyan-400" />
                          <span className="font-semibold text-cyan-300">USER DIRECTIVE</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-3 h-3 text-cyan-400" />
                          <span className="hud-font font-bold text-cyan-300">J.A.R.V.I.S.</span>
                        </>
                      )}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="font-mono text-[10px]">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    {msg.modelUsed && (
                      <>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-[10px] text-cyan-400/80 font-mono">
                          {msg.modelUsed.replace('models/', '')}
                        </span>
                      </>
                    )}
                    {!isUser && msg.responseDurationSeconds !== undefined && (
                      <>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                          title={`Cognitive processing duration: ${msg.responseDurationSeconds} seconds`}
                        >
                          <Timer className="w-2.5 h-2.5 text-amber-400" />
                          <span>{msg.responseDurationSeconds.toFixed(2)}s PROC</span>
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Context Menu Trigger for Touch/Click */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setContextMenu({
                          x: Math.min(rect.left, window.innerWidth - 230),
                          y: Math.min(rect.bottom + 6, window.innerHeight - 180),
                          message: msg,
                        });
                      }}
                      className="opacity-40 group-hover/msg:opacity-100 p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 rounded transition-all cursor-pointer flex items-center text-[10px] font-mono"
                      title="Options: Copy text, Speak again, Delete"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>

                    {/* Remove Button for Query / Response */}
                    {onRemoveMessage && (
                      <button
                        onClick={() => onRemoveMessage(msg.id)}
                        className="opacity-60 hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono"
                        title="Remove this query directive from feed"
                      >
                        <X className="w-3 h-3" />
                        <span className="hidden sm:inline">REMOVE</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Content Bubble */}
                <div
                  title="Right-click for options (Copy, Speak again, Delete)"
                  className={`max-w-2xl rounded-xl p-3.5 text-sm leading-relaxed border transition-all ${
                    isUser
                      ? 'bg-cyan-950/40 border-cyan-800/50 text-cyan-50 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                      : 'bg-slate-900/80 border-cyan-900/40 text-slate-100 shadow-md backdrop-blur-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">
                    {renderFormattedText(msg.content)}
                  </div>

                  {/* System Hardware Action Card (Laptop Shutdown, Restart, Sleep, Battery) */}
                  {msg.actionCard && msg.actionCard.category === 'system' && (
                    <div className="mt-3 p-3.5 rounded-lg bg-slate-950/95 border border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.25)] flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-rose-950/80 border border-rose-500/60 flex items-center justify-center shrink-0">
                            <Power className="w-5 h-5 text-rose-400" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-rose-200 hud-font tracking-wide">
                              {msg.actionCard.title}
                            </div>
                            <div className="text-[11px] mono-font text-slate-400">
                              {msg.actionCard.description || 'Hardware control bridge active.'}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (onOpenLaptopControl) {
                              onOpenLaptopControl(msg.actionCard?.systemAction || 'shutdown');
                            }
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-slate-950 font-bold text-xs tracking-wider hud-font shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all shrink-0 cursor-pointer"
                        >
                          <Terminal className="w-3.5 h-3.5 fill-slate-950" />
                          <span>OPEN LAPTOP CONTROLLER</span>
                        </button>
                      </div>

                      {/* Direct Terminal Command Snippets */}
                      {msg.actionCard.osCommands && (
                        <div className="pt-2 border-t border-rose-950/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                          <div className="p-2 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 block">WINDOWS (CMD / POWERSHELL):</span>
                              <code className="text-cyan-300 font-bold">{msg.actionCard.osCommands.windows}</code>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(msg.actionCard!.osCommands!.windows);
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-800/60 transition-colors cursor-pointer"
                              title="Copy Windows command"
                            >
                              COPY
                            </button>
                          </div>

                          <div className="p-2 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 block">MAC / LINUX (TERMINAL):</span>
                              <code className="text-amber-300 font-bold">{msg.actionCard.osCommands.mac}</code>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(msg.actionCard!.osCommands!.mac);
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-amber-950 text-amber-300 text-[10px] border border-amber-800/60 transition-colors cursor-pointer"
                              title="Copy macOS / Linux command"
                            >
                              COPY
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Camera, Face/Hand Recognition & 3D Model Converter Action Card */}
                  {msg.actionCard && msg.actionCard.category === 'camera_3d' && (
                    <div className="mt-3 p-3.5 rounded-lg bg-slate-950/95 border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.25)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-950/90 border border-cyan-400/60 flex items-center justify-center shrink-0">
                          <Camera className="w-5 h-5 text-cyan-300 animate-pulse" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-cyan-200 hud-font tracking-wide flex items-center gap-1.5">
                            {msg.actionCard.title}
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-500/40 font-mono">
                              3D MESH
                            </span>
                          </div>
                          <div className="text-[11px] mono-font text-slate-400">
                            {msg.actionCard.description || 'Optical scan suite ready for biometric & 3D conversion.'}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (onOpenVisionScanner) {
                            onOpenVisionScanner();
                          }
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-bold text-xs tracking-wider hud-font shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all shrink-0 cursor-pointer"
                      >
                        <Box className="w-4 h-4 fill-slate-950" />
                        <span>LAUNCH CAMERA & 3D VIEWER</span>
                      </button>
                    </div>
                  )}

                  {/* Tactical Time & Chronometer Action Card */}
                  {msg.actionCard && msg.actionCard.category === 'time' && (
                    <div
                      className="mt-3 p-3.5 rounded-lg bg-slate-950/95 border shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      style={{ borderColor: `${effectiveAccentColor}70` }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border shadow"
                          style={{
                            backgroundColor: `${effectiveAccentColor}20`,
                            borderColor: `${effectiveAccentColor}60`,
                          }}
                        >
                          <Clock className="w-5 h-5 animate-pulse" style={{ color: effectiveAccentColor }} />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-100 hud-font tracking-wide flex items-center gap-1.5">
                            {msg.actionCard.title}
                            <span
                              className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold"
                              style={{
                                backgroundColor: `${effectiveAccentColor}20`,
                                color: effectiveAccentColor,
                                borderColor: `${effectiveAccentColor}40`,
                                borderWidth: '1px',
                              }}
                            >
                              ATOMIC SYNC
                            </span>
                          </div>
                          <div className="text-[11px] mono-font text-slate-400">
                            {msg.actionCard.description || 'Master system clock synchronized with global temporal nodes.'}
                          </div>
                          {msg.actionCard.timeDetails && (
                            <div className="text-xs font-mono font-bold text-amber-300 mt-1">
                              {msg.actionCard.timeDetails.time24} • {msg.actionCard.timeDetails.dateFormatted} ({msg.actionCard.timeDetails.timezone})
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenTimeModal) {
                            onOpenTimeModal();
                          }
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-slate-950 font-bold text-xs tracking-wider hud-font shadow-lg transition-all shrink-0 cursor-pointer"
                        style={{
                          backgroundColor: effectiveAccentColor,
                        }}
                      >
                        <Clock className="w-4 h-4 fill-slate-950" />
                        <span>OPEN FULL CHRONOMETER</span>
                      </button>
                    </div>
                  )}

                  {/* Tactical Geolocation & Orbital Radar Action Card */}
                  {msg.actionCard && msg.actionCard.category === 'location' && (
                    <div
                      className="mt-3 p-3.5 rounded-lg bg-slate-950/95 border shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      style={{ borderColor: `${effectiveAccentColor}70` }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border shadow"
                          style={{
                            backgroundColor: 'rgba(244, 63, 94, 0.15)',
                            borderColor: 'rgba(244, 63, 94, 0.5)',
                          }}
                        >
                          <MapPin className="w-5 h-5 text-rose-400 animate-bounce" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-100 hud-font tracking-wide flex items-center gap-1.5">
                            {msg.actionCard.title}
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                              GPS LOCKED
                            </span>
                          </div>
                          <div className="text-[11px] mono-font text-slate-400">
                            {msg.actionCard.description || 'Orbital satellite coordinates acquired and verified.'}
                          </div>
                          {msg.actionCard.locationDetails && (
                            <div className="text-xs font-mono font-bold text-cyan-300 mt-1">
                              {msg.actionCard.locationDetails.formattedCoordinates || `${msg.actionCard.locationDetails.latitude.toFixed(4)}°, ${msg.actionCard.locationDetails.longitude.toFixed(4)}°`}
                              {msg.actionCard.locationDetails.city ? ` • ${msg.actionCard.locationDetails.city}` : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenLocationModal) {
                              onOpenLocationModal();
                            }
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-slate-950 font-bold text-xs tracking-wider hud-font shadow-lg transition-all shrink-0 cursor-pointer"
                          style={{
                            backgroundColor: effectiveAccentColor,
                          }}
                        >
                          <Navigation className="w-3.5 h-3.5 fill-slate-950" />
                          <span>OPEN ORBITAL RADAR</span>
                        </button>

                        {msg.actionCard.locationDetails?.mapUrl && (
                          <a
                            href={msg.actionCard.locationDetails.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Open external map"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Gmail Automation Action Card */}
                  {msg.actionCard && msg.actionCard.category === 'gmail' && (
                    <div className="mt-3 p-3.5 rounded-lg bg-slate-950/95 border border-cyan-500/70 shadow-[0_0_20px_rgba(6,182,212,0.25)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-950/90 border border-cyan-500/60 flex items-center justify-center shrink-0">
                          <Mail className="w-5 h-5 text-rose-400 animate-pulse" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-cyan-200 hud-font tracking-wide flex items-center gap-1.5">
                            {msg.actionCard.title}
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-500/40 font-mono">
                              GOOGLE WORKSPACE
                            </span>
                          </div>
                          <div className="text-[11px] mono-font text-slate-400">
                            {msg.actionCard.description || 'Authorized Gmail automation and message transmission.'}
                          </div>
                          {msg.actionCard.emailDetails?.to && (
                            <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                              Target: <span className="font-bold">{msg.actionCard.emailDetails.to}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenAutomationHub) {
                            onOpenAutomationHub('gmail', {
                              emailTo: msg.actionCard?.emailDetails?.to,
                              emailSubject: msg.actionCard?.emailDetails?.subject,
                              emailBody: msg.actionCard?.emailDetails?.body,
                            });
                          }
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-bold text-xs tracking-wider hud-font shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all shrink-0 cursor-pointer"
                      >
                        <Mail className="w-4 h-4 fill-slate-950" />
                        <span>OPEN GMAIL AUTOMATION</span>
                      </button>
                    </div>
                  )}

                  {/* WhatsApp Automation Action Card */}
                  {msg.actionCard && msg.actionCard.category === 'whatsapp' && (
                    <div className="mt-3 p-3.5 rounded-lg bg-slate-950/95 border border-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.25)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-950/90 border border-emerald-500/60 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-5 h-5 text-emerald-400 animate-pulse" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-emerald-200 hud-font tracking-wide flex items-center gap-1.5">
                            {msg.actionCard.title}
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-500/40 font-mono">
                              UNIVERSAL RELAY
                            </span>
                          </div>
                          <div className="text-[11px] mono-font text-slate-400">
                            {msg.actionCard.description || 'WhatsApp deep-link dispatch and rapid communication macros.'}
                          </div>
                          {msg.actionCard.whatsappDetails?.phone && (
                            <div className="text-[11px] font-mono text-emerald-300 mt-0.5">
                              Phone: <span className="font-bold">{msg.actionCard.whatsappDetails.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenAutomationHub) {
                            onOpenAutomationHub('whatsapp', {
                              waPhone: msg.actionCard?.whatsappDetails?.phone,
                              waText: msg.actionCard?.whatsappDetails?.message,
                            });
                          }
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs tracking-wider hud-font shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all shrink-0 cursor-pointer"
                      >
                        <Send className="w-4 h-4 fill-slate-950" />
                        <span>DISPATCH VIA WHATSAPP</span>
                      </button>
                    </div>
                  )}

                  {/* Direct Website / Video / Music Navigation Action Card */}
                  {msg.actionCard &&
                    msg.actionCard.category !== 'system' &&
                    msg.actionCard.category !== 'camera_3d' &&
                    msg.actionCard.category !== 'time' &&
                    msg.actionCard.category !== 'location' &&
                    msg.actionCard.category !== 'gmail' &&
                    msg.actionCard.category !== 'whatsapp' &&
                    msg.actionCard.url && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-950/80 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500/40 flex items-center justify-center shrink-0">
                          {getActionIcon(msg.actionCard.category)}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-cyan-200">
                            {msg.actionCard.title}
                          </div>
                          <div className="text-[10px] mono-font text-slate-400 truncate max-w-xs">
                            {msg.actionCard.url}
                          </div>
                        </div>
                      </div>

                      <a
                        href={msg.actionCard.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (onDirectNavigate && msg.actionCard?.url) {
                            e.preventDefault();
                            onDirectNavigate(msg.actionCard.url);
                          }
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-bold text-xs tracking-wider hud-font shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all shrink-0 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-slate-950" />
                        <span>GO DIRECTLY NOW</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* AI Spoken Audio Action Bar */}
                  {!isUser && (
                    <div className="mt-2.5 pt-2 border-t border-cyan-950/60 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] mono-font text-cyan-400/70">
                          VOICE SYNTHESIS
                        </span>
                        {msg.responseDurationSeconds !== undefined && (
                          <span
                            className="text-[10px] mono-font text-amber-300/90 flex items-center gap-1 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50 shadow-sm"
                            title={`Query execution and cognitive synthesis time`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>LATENCY: {msg.responseDurationSeconds.toFixed(2)}s</span>
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => (isPlaying ? onStopSpeech() : onPlaySpeech(msg))}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                          isPlaying
                            ? 'bg-cyan-500 text-slate-950 font-semibold shadow-[0_0_10px_#06b6d4]'
                            : 'bg-slate-800 hover:bg-cyan-950/80 text-cyan-300 border border-cyan-800/40'
                        }`}
                        title={isPlaying ? 'Halt voice playback' : 'Play vocal output with Gemini Flash TTS'}
                      >
                        {isPlaying ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5" />
                            <span>STOP SPEECH</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>SPEAK AUDIO</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isThinking && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/85 border border-amber-500/50 max-w-sm shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-pulse">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping shrink-0" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-300">
                  SYNAPSE COGNITION IN PROGRESS
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-500/70 text-[10px] font-mono text-amber-200 font-bold shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                  {elapsedThinkingSeconds.toFixed(1)}s
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Neural tensor throughput active · Real-time timer
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Floating Tactical Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 9999,
          }}
          className="w-56 bg-slate-950/95 border border-cyan-500/60 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.35)] backdrop-blur-md p-1.5 font-sans select-none animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header indicator */}
          <div className="px-2.5 py-1.5 mb-1 border-b border-cyan-950/80 flex items-center justify-between text-[10px] mono-font text-cyan-400">
            <span className="flex items-center gap-1 font-semibold">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              MESSAGE PROTOCOL
            </span>
            <span className="text-[9px] px-1 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
              {contextMenu.message.role === 'user' ? 'USER' : 'JARVIS'}
            </span>
          </div>

          <div className="space-y-0.5">
            {/* 1. Copy text */}
            <button
              onClick={() => handleCopyText(contextMenu.message)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-mono text-slate-200 hover:text-cyan-200 hover:bg-cyan-950/70 border border-transparent hover:border-cyan-800/50 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Copy text</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">CTRL+C</span>
            </button>

            {/* 2. Speak message again */}
            <button
              onClick={() => handleSpeakAgain(contextMenu.message)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-mono text-slate-200 hover:text-cyan-200 hover:bg-cyan-950/70 border border-transparent hover:border-cyan-800/50 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Speak message again</span>
              </div>
              <Volume2 className="w-3.5 h-3.5 text-cyan-500/70" />
            </button>

            {/* 3. Delete message */}
            <button
              onClick={() => handleDeleteMessage(contextMenu.message)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-mono text-rose-300 hover:text-rose-100 hover:bg-rose-950/60 border border-transparent hover:border-rose-800/50 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete message</span>
              </div>
              <span className="text-[10px] text-rose-500/70 font-mono">DEL</span>
            </button>
          </div>
        </div>
      )}

      {/* Copied Feedback Toast */}
      {copiedToast && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-950/95 border border-cyan-400 text-cyan-200 text-xs font-mono shadow-[0_0_20px_rgba(6,182,212,0.4)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Message text copied to clipboard</span>
        </div>
      )}
    </div>
  );
};
