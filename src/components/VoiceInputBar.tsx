import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Radio, Terminal, Settings2, X, Camera } from 'lucide-react';
import { ModelSpeedChoice, QUICK_DIRECTIVES } from '../types';
import { findLanguageByCode } from '../utils/languages';

interface VoiceInputBarProps {
  onSendMessage: (text: string) => void;
  isListening: boolean;
  onToggleListen: () => void;
  isThinking: boolean;
  modelChoice: ModelSpeedChoice;
  onSelectDirective: (prompt: string, choice: ModelSpeedChoice) => void;
  onOpenVisionScanner?: () => void;
  selectedLanguage?: string;
}

export const VoiceInputBar: React.FC<VoiceInputBarProps> = ({
  onSendMessage,
  isListening,
  onToggleListen,
  isThinking,
  modelChoice,
  onSelectDirective,
  onOpenVisionScanner,
  selectedLanguage = 'en-US',
}) => {
  const [inputText, setInputText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const langObj = findLanguageByCode(selectedLanguage);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isThinking) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleClearQuery = () => {
    setInputText('');
    inputRef.current?.focus();
  };

  return (
    <div className="border-t border-cyan-950/80 bg-slate-950/95 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-3 space-y-2 sm:space-y-2.5">
      {/* Quick Directives / Tactical Shortcuts */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-0.5 text-xs">
        <span className="text-[10px] sm:text-[11px] hud-font text-cyan-400 whitespace-nowrap flex items-center gap-1 shrink-0">
          <Terminal className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> DIRECTIVES:
        </span>
        {QUICK_DIRECTIVES.map((d, idx) => (
          <button
            key={idx}
            onClick={() => onSelectDirective(d.prompt, d.choice)}
            disabled={isThinking}
            className="whitespace-nowrap px-2 sm:px-2.5 py-0.5 sm:py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/40 hover:border-cyan-500/50 text-cyan-200 text-[11px] sm:text-xs transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Input Row */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 sm:gap-2">
        {/* Voice Dictation Button */}
        <button
          type="button"
          onClick={onToggleListen}
          disabled={!speechSupported || isThinking}
          className={`relative p-2.5 sm:p-3 rounded-xl border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
            isListening
              ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse'
              : 'bg-cyan-950/50 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          title={
            !speechSupported
              ? 'Web Speech API not supported in this browser'
              : isListening
              ? `Listening in ${langObj.name} (${langObj.nativeName})... Click to stop`
              : `Click to speak vocal directive in ${langObj.name} (${langObj.flag}) to JARVIS`
          }
        >
          {isListening ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          {isListening && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-400 rounded-full animate-ping" />
          )}
        </button>

        {/* Optical Camera & 3D Scanner Button */}
        {onOpenVisionScanner && (
          <button
            type="button"
            onClick={onOpenVisionScanner}
            className="p-2.5 sm:p-3 rounded-xl border border-cyan-500/40 bg-cyan-950/50 hover:bg-cyan-900/70 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="Scan with Camera, recognize faces/hands, or upload photo to convert to 3D hologram"
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Text Input Field */}
        <div className="relative flex-1 flex items-center min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening
                ? `Listening in ${langObj.name}...`
                : selectedLanguage.startsWith('en')
                ? 'Type or speak directive (e.g. "what is AI?")...'
                : `Ask in ${langObj.name}...`
            }
            disabled={isThinking}
            className="w-full bg-slate-900/80 border border-cyan-900/60 rounded-xl pl-3.5 sm:pl-4 pr-9 sm:pr-10 py-2.5 sm:py-3 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-500/50 transition-all font-sans"
          />

          {/* Remove / Clear Query Button */}
          {inputText && (
            <button
              type="button"
              onClick={handleClearQuery}
              className="absolute right-2.5 sm:right-3 p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Remove query / clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Send Action Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || isThinking}
          className="p-2.5 sm:p-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-semibold rounded-xl border border-cyan-300/40 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer shrink-0"
          title="Transmit directive to JARVIS"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </form>
    </div>
  );
};
