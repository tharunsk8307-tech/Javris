import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  KeyRound,
  AlertTriangle,
  X,
  LogIn,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  Database,
  ArrowRight,
  Radio,
  Sparkles,
} from 'lucide-react';
import { JARVIS_VOICE_PRESETS, VoicePreset, HudThemeType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const { registerWithEmail, loginWithEmail, signInWithGoogle, authError, clearAuthError, loading } = useAuth();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('puck');
  const [showPassword, setShowPassword] = useState(false);
  const [localValidationErr, setLocalValidationErr] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedPreset = JARVIS_VOICE_PRESETS.find((v) => v.id === selectedVoiceId) || JARVIS_VOICE_PRESETS[0];

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setLocalValidationErr(null);
    clearAuthError();
  };

  const handleModeSwitch = (newMode: 'login' | 'register') => {
    setMode(newMode);
    resetForm();
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'NONE', color: 'bg-slate-700' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score: 1, label: 'VULNERABLE (6+ chars needed)', color: 'bg-rose-500' };
    if (score <= 4) return { score: 2, label: 'OPERATIONAL (Good)', color: 'bg-amber-400' };
    return { score: 3, label: 'ENTERPRISE-GRADE (Strong)', color: 'bg-emerald-400' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalValidationErr(null);
    clearAuthError();

    if (mode === 'register') {
      if (!name.trim()) {
        setLocalValidationErr('Operative Name or Callsign is mandatory.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setLocalValidationErr('Please enter a valid operative email address.');
        return;
      }
      if (!password || password.length < 6) {
        setLocalValidationErr('Security clearance requires password with at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalValidationErr('Passwords do not match. Please re-enter.');
        return;
      }

      setIsSubmitting(true);
      try {
        await registerWithEmail(
          name,
          email,
          password,
          selectedPreset.id,
          selectedPreset.theme as HudThemeType
        );
        onClose();
      } catch {
        // AuthContext handles error message
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Login mode
      if (!email.trim()) {
        setLocalValidationErr('Please enter your authorized email address.');
        return;
      }
      if (!password) {
        setLocalValidationErr('Please enter your security access password.');
        return;
      }

      setIsSubmitting(true);
      try {
        await loginWithEmail(email, password);
        onClose();
      } catch {
        // AuthContext handles error message
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleQuickAuth = async () => {
    clearAuthError();
    setLocalValidationErr(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden my-8">
        {/* Holographic Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-cyan-950/60 to-slate-950 border-b border-cyan-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="hud-font font-bold text-sm tracking-wider text-cyan-200">
                ENTERPRISE SECURITY & IDENTITY GATEWAY
              </h2>
              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>PERSON-SPECIFIC AI VOICE PAGE ARCHITECTURE</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950/70 border-b border-cyan-950 text-xs font-mono">
          <button
            type="button"
            onClick={() => handleModeSwitch('login')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              mode === 'login'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>EXECUTIVE SIGN IN</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('register')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              mode === 'register'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>NEW REGISTRATION</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {(authError || localValidationErr) && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block font-mono text-[11px] text-rose-300">SECURITY NOTICE:</span>
                  <span>
                    {(localValidationErr || authError)?.includes('operation-not-allowed')
                      ? 'Authentication gateway initialized. Please submit registration to save credentials.'
                      : localValidationErr || authError}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLocalValidationErr(null);
                  clearAuthError();
                }}
                className="text-rose-400 hover:text-white underline text-[11px] font-mono shrink-0 ml-2"
                title="Dismiss error notice"
              >
                DISMISS
              </button>
            </div>
          )}

          {/* Description header */}
          <div className="text-left border-b border-cyan-950/80 pb-3">
            <h3 className="hud-font text-sm text-cyan-100 font-semibold flex items-center gap-2">
              {mode === 'register' ? (
                <>
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  <span>REGISTER OPERATIVE & ASSIGN DEDICATED VOICE PAGE</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>LOGIN TO LOAD YOUR PERSONAL VOICE PAGE</span>
                </>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {mode === 'register'
                ? 'Each person gets their own distinct AI Voice Persona, custom Voice Page, HUD color theme, and speech synthesizer.'
                : 'Logging in automatically switches the entire Voice Page and AI Persona to match your personal identity.'}
            </p>
          </div>

          {/* Field 1: Name (for Register only) */}
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-cyan-300 font-medium">
                OPERATIVE NAME / CALLSIGN
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tharun, Colonel Rhodes, Pepper Potts"
                  disabled={isSubmitting}
                  className="w-full bg-slate-950/80 border border-cyan-900/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-sans"
                  required
                />
              </div>
            </div>
          )}

          {/* Field: Voice Persona & Voice Page Selection (for Register only) */}
          {mode === 'register' && (
            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-mono text-cyan-300 font-medium flex items-center justify-between">
                <span>SELECT YOUR PERSONAL AI VOICE PAGE PERSONA:</span>
                <span className="text-[10px] text-slate-400">Different per person</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {JARVIS_VOICE_PRESETS.map((v) => {
                  const isSelected = selectedVoiceId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVoiceId(v.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                          : 'bg-slate-950/60 border-cyan-950/80 hover:border-cyan-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="hud-font font-bold text-xs text-slate-100">
                          {v.aiPersonaName}
                        </span>
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: v.accentHex }}
                        />
                      </div>
                      <div className="text-[10px] text-cyan-300 font-mono mt-0.5">
                        {v.name.split('(')[0]}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 mt-1">
                        {v.tagline}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Persona Preview Badge */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-900/60 flex items-center gap-3 text-xs">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 text-slate-950"
                  style={{ backgroundColor: selectedPreset.accentHex }}
                >
                  <Radio className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-cyan-200 font-semibold text-xs truncate">
                    {selectedPreset.aiPersonaName} — {selectedPreset.tagline}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    Theme: {selectedPreset.theme.toUpperCase()} • Voice: {selectedPreset.voiceCode}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Field 2: Email */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono text-cyan-300 font-medium">
              AUTHORIZED EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.turner@company.com"
                disabled={isSubmitting}
                className="w-full bg-slate-950/80 border border-cyan-900/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-sans"
                required
              />
            </div>
          </div>

          {/* Field 3: Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-mono text-cyan-300 font-medium">
                SECURITY ACCESS PASSWORD
              </label>
              {mode === 'register' && password && (
                <span className="text-[10px] font-mono text-slate-400">
                  Strength: <span className="font-semibold text-cyan-300">{strength.label}</span>
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Min 6 characters' : 'Enter access password'}
                disabled={isSubmitting}
                className="w-full bg-slate-950/80 border border-cyan-900/60 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-sans"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Field 4: Confirm Password (for Register only) */}
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-cyan-300 font-medium">
                CONFIRM SECURITY PASSWORD
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter security password"
                  disabled={isSubmitting}
                  className="w-full bg-slate-950/80 border border-cyan-900/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-sans"
                  required
                />
              </div>
            </div>
          )}

          {/* Persona Architecture Notice */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-950 text-[11px] text-slate-400 font-mono space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>INDIVIDUAL PERSON VOICE PAGE BINDING</span>
            </div>
            <p className="text-[10px] text-slate-400">
              When you log in, your assigned AI persona and custom voice parameters load automatically. Another operative logging in will load their completely different voice page!
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold hud-font text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 fill-slate-950" />
            <span>
              {isSubmitting
                ? 'INITIALIZING PERSONAL VOICE PAGE...'
                : mode === 'register'
                ? `REGISTER & LOAD ${selectedPreset.aiPersonaName} VOICE PAGE`
                : 'VERIFY & LOAD YOUR VOICE PAGE'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-cyan-950"></div>
            <span className="flex-shrink mx-3 text-slate-500 text-[10px] font-mono">OR SIGN IN WITH</span>
            <div className="flex-grow border-t border-cyan-950"></div>
          </div>

          {/* Alternative Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleQuickAuth}
            disabled={isSubmitting || loading}
            className="w-full py-2.5 px-3 rounded-xl border border-cyan-800/60 bg-slate-950/60 hover:bg-cyan-950/60 text-cyan-300 text-xs font-mono flex items-center justify-center gap-2 transition-colors"
          >
            <span>CONTINUE WITH GOOGLE ACCOUNT</span>
          </button>

          {/* Bottom Switch Link */}
          <div className="text-center pt-2 border-t border-cyan-950/70">
            <button
              type="button"
              onClick={() => handleModeSwitch(mode === 'login' ? 'register' : 'login')}
              className="text-xs text-cyan-400 hover:text-cyan-200 font-mono underline"
            >
              {mode === 'login'
                ? "Don't have an operative profile? Register and select your AI Voice Page"
                : 'Already registered in the database? Switch to Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
