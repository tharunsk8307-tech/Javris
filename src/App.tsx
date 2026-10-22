import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TacticalHudHeader } from './components/TacticalHudHeader';
import { OperativeVoicePageBanner } from './components/OperativeVoicePageBanner';
import { ArcReactorCore } from './components/ArcReactorCore';
import { MessageFeed } from './components/MessageFeed';
import { VoiceInputBar } from './components/VoiceInputBar';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { AuthModal } from './components/AuthModal';
import { LaptopCommandCenter } from './components/LaptopCommandCenter';
import { VisionScanModal } from './components/VisionScanModal';
import { SimulatedCameraFeed } from './components/SimulatedCameraFeed';
import { CameraPermissionSolverModal } from './components/CameraPermissionSolverModal';
import { DynamicHudBackground } from './components/DynamicHudBackground';
import { FaceLockReticle } from './components/FaceLockReticle';
import { RealtimeFaceTracker, FaceTrackingMetrics } from './utils/faceTracker';
import { TacticalTimeModal } from './components/TacticalTimeModal';
import { TacticalLocationModal } from './components/TacticalLocationModal';
import { AutomationHubModal } from './components/AutomationHubModal';
import { CustomerSystemGuideModal } from './components/CustomerSystemGuideModal';
import {
  TacticalTimeData,
  TacticalLocationData,
  TacticalLocationPreset,
  getTacticalTimeData,
  DEFAULT_TACTICAL_LOCATION,
  formatCoordinates,
} from './utils/tacticalTimeLocation';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatMessage, ModelSpeedChoice, VoicePreset, JARVIS_VOICE_PRESETS, VoiceShortcut, DEFAULT_VOICE_SHORTCUTS } from './types';
import { playPcmBase64, stopCurrentAudio, playBrowserTtsFallback } from './utils/audioPlayer';
import { detectWebAction } from './utils/actionDetector';
import { THEME_CONFIGS, applyHudCssVariables } from './utils/themeStyles';
import { findLanguageByCode, WORLD_LANGUAGES, getLanguageTestPhrase } from './utils/languages';
import { SlidersHorizontal, ShieldAlert, Sparkles, User, LogIn, Mic, Globe, Camera, Video, Eye, Box, Monitor, ShieldCheck, ExternalLink, Upload, Radio, Bot } from 'lucide-react';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'intro-msg-1',
    role: 'model',
    content: "Good day. J.A.R.V.I.S. Executive OS is online and synchronized. Speak or type to manage workspace emails, trigger WhatsApp alerts, inspect live camera vision, control laptop hardware, or access global chronometers.",
    timestamp: Date.now() - 10000,
    modelUsed: 'gemini-3.5-flash',
  },
];

function JarvisMainApp() {
  const { currentUser, userProfile, updateUserCustomAccent } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('jarvis_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        const sanitized = parsed.filter(
          (m: ChatMessage) =>
            !m.content.includes('"code":503') &&
            !m.content.includes('UNAVAILABLE') &&
            !m.content.includes('satellite uplink channels are under high transmission load')
        );
        return sanitized.length > 0 ? sanitized : INITIAL_MESSAGES;
      }
    } catch {
      // fallback
    }
    return INITIAL_MESSAGES;
  });

  const [modelChoice, setModelChoice] = useState<ModelSpeedChoice>('general');
  const [selectedVoice, setSelectedVoice] = useState<VoicePreset>(JARVIS_VOICE_PRESETS[0]);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const [reactorPower, setReactorPower] = useState(99.4);
  const [coreTemp, setCoreTemp] = useState(38);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Voice speech rate state (0.5x to 2.0x, default 1.0x)
  const [speechRate, setSpeechRate] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('jarvis_speech_rate')) || 1.0;
    } catch {
      return 1.0;
    }
  });

  // Dynamic HUD Background simulation state
  const [simulatedHighLoad, setSimulatedHighLoad] = useState<boolean>(false);

  const handleSpeechRateChange = (rate: number) => {
    setSpeechRate(rate);
    try {
      localStorage.setItem('jarvis_speech_rate', rate.toString());
    } catch {}
  };

  // System-wide Custom HUD Accent Color Override (overrides default cyan and theme presets)
  const [customAccentColor, setCustomAccentColor] = useState<string | null>(() => {
    try {
      return localStorage.getItem('jarvis_custom_hud_accent') || null;
    } catch {
      return null;
    }
  });

  // Sync custom accent color if user cloud profile has it saved
  useEffect(() => {
    if (userProfile?.customAccentColor) {
      setCustomAccentColor(userProfile.customAccentColor);
      try {
        localStorage.setItem('jarvis_custom_hud_accent', userProfile.customAccentColor);
      } catch {}
    }
  }, [userProfile?.customAccentColor]);

  // Effective accent color: customAccentColor overrides the active voice preset accentHex
  const effectiveAccentHex = customAccentColor || selectedVoice.accentHex;

  // Apply CSS root variables system-wide whenever effective accent color changes
  useEffect(() => {
    applyHudCssVariables(effectiveAccentHex);
  }, [effectiveAccentHex]);

  const handleSetCustomAccentColor = (color: string | null) => {
    setCustomAccentColor(color);
    try {
      if (color) {
        localStorage.setItem('jarvis_custom_hud_accent', color);
      } else {
        localStorage.removeItem('jarvis_custom_hud_accent');
      }
    } catch {}

    if (currentUser) {
      updateUserCustomAccent(color).catch((err) => {
        console.warn('Failed to sync custom accent color to cloud profile:', err);
      });
    }
  };

  // Tactical Time & Geolocation Telemetry State
  const [timeData, setTimeData] = useState<TacticalTimeData>(getTacticalTimeData());
  const [locationData, setLocationData] = useState<TacticalLocationData>(DEFAULT_TACTICAL_LOCATION);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSystemGuideOpen, setIsSystemGuideOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'core' | 'chat'>('core');

  // Communications & Automation Hub State (Gmail & WhatsApp)
  const [isAutomationHubOpen, setIsAutomationHubOpen] = useState(false);
  const [automationHubTab, setAutomationHubTab] = useState<'gmail' | 'whatsapp' | 'broadcast'>('gmail');
  const [automationHubParams, setAutomationHubParams] = useState<{
    emailTo?: string;
    emailSubject?: string;
    emailBody?: string;
    waPhone?: string;
    waText?: string;
  }>({});

  const handleOpenAutomationHub = (
    tab: 'gmail' | 'whatsapp' | 'broadcast' = 'gmail',
    options?: {
      emailTo?: string;
      emailSubject?: string;
      emailBody?: string;
      waPhone?: string;
      waText?: string;
    }
  ) => {
    setAutomationHubTab(tab);
    if (options) {
      setAutomationHubParams(options);
    } else {
      setAutomationHubParams({});
    }
    setIsAutomationHubOpen(true);
  };

  // Live Clock Tick (every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeData(getTacticalTimeData());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Geolocation Init & Browser Location Watcher
  useEffect(() => {
    const queryLocationDetails = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`/api/location/lookup?lat=${lat}&lon=${lon}`);
        if (res.ok) {
          const data = await res.json();
          setLocationData((prev) => ({
            ...prev,
            city: data.city || prev.city,
            region: data.region || prev.region,
            country: data.country || prev.country,
            countryCode: data.countryCode || prev.countryCode,
            formattedAddress: data.displayName || prev.formattedAddress,
          }));
        }
      } catch (err) {
        console.warn('Location lookup fallback notice:', err);
      }
    };

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, altitude, accuracy, heading, speed } = pos.coords;
          setLocationData({
            latitude,
            longitude,
            altitude,
            accuracy,
            heading,
            speed,
            city: 'Detecting Location...',
            region: '',
            country: '',
            countryCode: '',
            status: 'LOCKED',
            isSimulated: false,
            source: 'GPS',
            timestamp: pos.timestamp,
            satellitesTracked: Math.min(12, Math.max(7, Math.round(20 - (accuracy || 10) / 3))),
            hdop: accuracy ? Number((accuracy / 8).toFixed(1)) : 1.1,
          });
          queryLocationDetails(latitude, longitude);
        },
        (err) => {
          console.warn('Geolocation acquire notice (using tactical fallback):', err.message);
          fetch('/api/location/lookup')
            .then((r) => r.json())
            .then((data) => {
              setLocationData((prev) => ({
                ...prev,
                city: data.city || prev.city,
                region: data.region || prev.region,
                country: data.country || prev.country,
                countryCode: data.countryCode || prev.countryCode,
                status: 'SIMULATED',
              }));
            })
            .catch(() => {});
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
      );
    }
  }, []);

  const handleRequestLiveGps = () => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      setLocationData((prev) => ({ ...prev, status: 'ACQUIRING' }));
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, altitude, accuracy, heading, speed } = pos.coords;
          setLocationData({
            latitude,
            longitude,
            altitude,
            accuracy,
            heading,
            speed,
            city: 'Resolving Satellite Fix...',
            region: '',
            country: '',
            countryCode: '',
            status: 'LOCKED',
            isSimulated: false,
            source: 'GPS',
            timestamp: pos.timestamp,
            satellitesTracked: Math.min(12, Math.max(8, Math.round(20 - (accuracy || 8) / 3))),
            hdop: accuracy ? Number((accuracy / 8).toFixed(1)) : 1.0,
          });

          try {
            const res = await fetch(`/api/location/lookup?lat=${latitude}&lon=${longitude}`);
            if (res.ok) {
              const data = await res.json();
              setLocationData((prev) => ({
                ...prev,
                city: data.city,
                region: data.region,
                country: data.country,
                countryCode: data.countryCode,
                formattedAddress: data.displayName,
              }));
            }
          } catch {}
        },
        (err) => {
          console.warn('GPS hardware refresh notice:', err.message);
          setLocationData((prev) => ({ ...prev, status: 'DENIED' }));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const handleSelectLocationPreset = (preset: TacticalLocationPreset) => {
    setLocationData({
      latitude: preset.latitude,
      longitude: preset.longitude,
      altitude: preset.altitude,
      accuracy: 5.0,
      heading: 45,
      speed: 0,
      city: preset.city,
      region: preset.region,
      country: preset.country,
      countryCode: preset.countryCode,
      status: 'LOCKED',
      isSimulated: true,
      source: 'SIMULATOR',
      timestamp: Date.now(),
      satellitesTracked: 11,
      hdop: 0.9,
      formattedAddress: `${preset.name}, ${preset.city}, ${preset.country}`,
    });
  };

  const handleSetCustomCoordinates = (lat: number, lon: number, customCity?: string) => {
    setLocationData({
      latitude: lat,
      longitude: lon,
      altitude: 20,
      accuracy: 6.0,
      heading: 0,
      speed: 0,
      city: customCity || 'Custom Operative Fix',
      region: '',
      country: '',
      countryCode: '',
      status: 'LOCKED',
      isSimulated: true,
      source: 'SIMULATOR',
      timestamp: Date.now(),
      satellitesTracked: 10,
      hdop: 1.0,
      formattedAddress: `Manual Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`,
    });
  };

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Laptop Hardware Command Center State
  const [isLaptopControlOpen, setIsLaptopControlOpen] = useState(false);
  const [laptopDirective, setLaptopDirective] = useState<'shutdown' | 'restart' | 'sleep' | 'battery' | 'fullscreen' | 'wakelock'>('shutdown');

  // Optical Camera & 3D Model Scanner State
  const [isVisionScannerOpen, setIsVisionScannerOpen] = useState(false);
  const [isCameraSolverOpen, setIsCameraSolverOpen] = useState(false);
  const [leftPanelMode, setLeftPanelMode] = useState<'reactor' | 'camera'>('reactor');
  const [dashCameraSource, setDashCameraSource] = useState<'hardware' | 'simulated' | 'screen'>('hardware');
  const [dashCameraNotice, setDashCameraNotice] = useState<string | null>(null);
  const [initialScanImage, setInitialScanImage] = useState<string | null>(null);

  const dashVideoRef = useRef<HTMLVideoElement | null>(null);
  const dashStreamRef = useRef<MediaStream | null>(null);
  const dashFaceUploadInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Real-Time Face Tracking Metrics for Left Dashboard Module
  const [dashFaceMetrics, setDashFaceMetrics] = useState<FaceTrackingMetrics>({
    detected: true,
    x: 0.5,
    y: 0.46,
    pixelX: 320,
    pixelY: 240,
    tiltAngle: 0,
    confidence: 0.94,
    faceWidth: 140,
    faceHeight: 180,
    aspectRatio: 1.35,
    statusLabel: 'LOCK ACTIVE',
  });
  const dashFaceTrackerRef = useRef<RealtimeFaceTracker | null>(null);
  const dashAnimationLoopRef = useRef<number | null>(null);

  useEffect(() => {
    dashFaceTrackerRef.current = new RealtimeFaceTracker();
    return () => {
      dashFaceTrackerRef.current?.stop();
      if (dashAnimationLoopRef.current) {
        cancelAnimationFrame(dashAnimationLoopRef.current);
      }
    };
  }, []);

  const startDashHardwareCamera = async () => {
    setDashCameraNotice(null);
    try {
      if (dashStreamRef.current) {
        dashStreamRef.current.getTracks().forEach((t) => t.stop());
        dashStreamRef.current = null;
      }
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
      dashStreamRef.current = stream;
      if (dashVideoRef.current) {
        dashVideoRef.current.srcObject = stream;
        await dashVideoRef.current.play().catch(() => {});
        dashFaceTrackerRef.current?.setVideo(dashVideoRef.current);
      }
      setDashCameraSource('hardware');
      setDashCameraNotice(null);
    } catch (err: any) {
      console.warn('Dashboard camera access notice:', err);
      setDashCameraNotice('Webcam permission needed. Click below to allow camera or upload face photo.');
    }
  };

  const handleCaptureDashFace = () => {
    let photoData = '';
    if (dashVideoRef.current && dashVideoRef.current.videoWidth) {
      const canvas = document.createElement('canvas');
      canvas.width = dashVideoRef.current.videoWidth;
      canvas.height = dashVideoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(dashVideoRef.current, 0, 0);
        photoData = canvas.toDataURL('image/jpeg', 0.95);
      }
    }
    if (photoData) {
      setInitialScanImage(photoData);
      setIsVisionScannerOpen(true);
    } else {
      setIsVisionScannerOpen(true);
    }
  };

  const handleUploadDashFace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        if (result) {
          setInitialScanImage(result);
          setIsVisionScannerOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (leftPanelMode === 'camera') {
      if (dashCameraSource === 'hardware') {
        startDashHardwareCamera();
      }

      if (dashFaceTrackerRef.current) {
        dashFaceTrackerRef.current.setVideo(dashVideoRef.current);
        dashFaceTrackerRef.current.start();
      }

      const loop = () => {
        if (dashFaceTrackerRef.current) {
          const vw = dashVideoRef.current?.videoWidth || 640;
          const vh = dashVideoRef.current?.videoHeight || 480;
          const metrics = dashFaceTrackerRef.current.processFrame(vw, vh);
          setDashFaceMetrics(metrics);
        }
        dashAnimationLoopRef.current = requestAnimationFrame(loop);
      };
      dashAnimationLoopRef.current = requestAnimationFrame(loop);
    } else {
      if (dashAnimationLoopRef.current) {
        cancelAnimationFrame(dashAnimationLoopRef.current);
        dashAnimationLoopRef.current = null;
      }
      if (dashStreamRef.current) {
        dashStreamRef.current.getTracks().forEach((t) => t.stop());
        dashStreamRef.current = null;
      }
    }

    return () => {
      if (dashAnimationLoopRef.current) {
        cancelAnimationFrame(dashAnimationLoopRef.current);
      }
    };
  }, [leftPanelMode, dashCameraSource]);

  // World Languages State (BCP 47 language tag)
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return localStorage.getItem('tharun_jarvis_language') || 'en-US';
  });

  // Voice Directive Shortcuts State
  const [voiceShortcuts, setVoiceShortcuts] = useState<VoiceShortcut[]>(() => {
    try {
      const saved = localStorage.getItem('tharun_voice_shortcuts_v1') || localStorage.getItem('stark_voice_shortcuts_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_VOICE_SHORTCUTS;
  });

  // Save shortcuts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tharun_voice_shortcuts_v1', JSON.stringify(voiceShortcuts));
    } catch {
      // ignore
    }
  }, [voiceShortcuts]);

  // Save selected language to localStorage & sync speech recognition
  useEffect(() => {
    try {
      localStorage.setItem('tharun_jarvis_language', selectedLanguage);
    } catch {
      // ignore
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = selectedLanguage;
      } catch (e) {
        // ignore
      }
    }
  }, [selectedLanguage]);

  const handleAddShortcut = (shortcut: Omit<VoiceShortcut, 'id' | 'createdAt'>) => {
    const newSc: VoiceShortcut = {
      ...shortcut,
      id: 'sc-' + Date.now(),
      createdAt: Date.now(),
    };
    setVoiceShortcuts((prev) => [newSc, ...prev]);
  };

  const handleToggleShortcut = (id: string) => {
    setVoiceShortcuts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isEnabled: !s.isEnabled } : s))
    );
  };

  const handleDeleteShortcut = (id: string) => {
    setVoiceShortcuts((prev) => prev.filter((s) => s.id !== id));
  };

  const handleResetShortcuts = () => {
    setVoiceShortcuts(DEFAULT_VOICE_SHORTCUTS);
  };

  const handleTriggerShortcut = (shortcut: VoiceShortcut) => {
    if (shortcut.actionType === 'url') {
      handleDirectNavigate(shortcut.target);
      handleSendMessage(shortcut.phrase);
    } else if (shortcut.actionType === 'system') {
      setLaptopDirective(shortcut.target as any);
      setIsLaptopControlOpen(true);
      handleSendMessage(shortcut.phrase);
    } else if (shortcut.actionType === 'directive') {
      handleSendMessage(shortcut.target);
    }
  };

  const recognitionRef = useRef<any>(null);
  const audioAnimationRef = useRef<number | null>(null);

  // Synchronize person-specific AI voice persona whenever user logs in or profile changes
  useEffect(() => {
    if (userProfile?.preferredVoiceId) {
      const matched = JARVIS_VOICE_PRESETS.find((v) => v.id === userProfile.preferredVoiceId);
      if (matched && matched.id !== selectedVoice.id) {
        setSelectedVoice(matched);
      }
    } else if (!currentUser && selectedVoice.id !== JARVIS_VOICE_PRESETS[0].id) {
      // Revert to classic J.A.R.V.I.S. for unauthenticated guests
      setSelectedVoice(JARVIS_VOICE_PRESETS[0]);
    }
  }, [userProfile?.preferredVoiceId, currentUser]);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Direct navigation helper
  const handleDirectNavigate = useCallback((url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Sync messages to localStorage for persistence
  useEffect(() => {
    try {
      localStorage.setItem('jarvis_chat_history', JSON.stringify(messages.slice(-30)));
    } catch {
      // ignore
    }
  }, [messages]);

  // Minor telemetry fluctuation for realistic Tharun HUD feel
  useEffect(() => {
    const timer = setInterval(() => {
      setReactorPower(98.8 + Math.random() * 1.1);
      setCoreTemp(37 + Math.floor(Math.random() * 3));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLanguage;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          handleSendMessage(transcript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access was denied. Please allow microphone permission.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleToggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (isSpeaking) {
        handleStopSpeech();
      }
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = selectedLanguage;
        }
        recognitionRef.current?.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const handleStopSpeech = () => {
    stopCurrentAudio();
    setIsSpeaking(false);
    setPlayingMessageId(null);
    setAudioLevel(0);
    if (audioAnimationRef.current) {
      cancelAnimationFrame(audioAnimationRef.current);
      audioAnimationRef.current = null;
    }
  };

  const handleClearHistory = () => {
    handleStopSpeech();
    setMessages(INITIAL_MESSAGES);
    try {
      localStorage.removeItem('jarvis_chat_history');
    } catch {
      // ignore
    }
    setErrorMessage(null);
  };

  const handleRemoveMessage = (messageId: string) => {
    if (playingMessageId === messageId) {
      handleStopSpeech();
    }
    setMessages((prev) => {
      const filtered = prev.filter((m) => m.id !== messageId);
      return filtered.length > 0 ? filtered : INITIAL_MESSAGES;
    });
  };

  const handleSetSimulatedReactorPower = (power: number) => {
    setReactorPower(power);
  };

  const handlePlaySpeech = useCallback(
    async (message: ChatMessage, overrideVoice?: VoicePreset) => {
      try {
        handleStopSpeech();
        setPlayingMessageId(message.id);
        setIsSpeaking(true);

        const voiceToUse = overrideVoice || selectedVoice;
        const isNonEnglish = !selectedLanguage.toLowerCase().startsWith('en');

        // For non-English languages, directly vocalize using the browser's native localized TTS
        // so it speaks with authentic native pronunciation, accent, and phonemes for that particular language.
        if (isNonEnglish) {
          playBrowserTtsFallback(
            message.content,
            voiceToUse.voiceCode,
            () => {
              setIsSpeaking(false);
              setPlayingMessageId(null);
              setAudioLevel(0);
            },
            (level) => {
              setAudioLevel(level);
            },
            selectedLanguage
          );
          return;
        }

        let audioBase64 = message.audioBase64;

        if (!audioBase64 || overrideVoice) {
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: message.content,
              voiceName: voiceToUse.voiceCode,
              speechStyle: voiceToUse.style,
            }),
          });

          if (!res.ok) {
            throw new Error('Failed to synthesize voice');
          }

          let data: any = {};
          const text = await res.text();
          if (text && text.trim()) {
            try {
              data = JSON.parse(text);
            } catch {
              data = {};
            }
          }
          audioBase64 = data.audioBase64;

          if (audioBase64 && !overrideVoice) {
            setMessages((prev) =>
              prev.map((m) => (m.id === message.id ? { ...m, audioBase64 } : m))
            );
          }
        }

        if (audioBase64) {
          await playPcmBase64(
            audioBase64,
            24000,
            () => {
              setIsSpeaking(false);
              setPlayingMessageId(null);
              setAudioLevel(0);
            },
            (analyser) => {
              const buffer = new Uint8Array(analyser.frequencyBinCount);
              const updateLevel = () => {
                analyser.getByteFrequencyData(buffer);
                let sum = 0;
                for (let i = 0; i < buffer.length; i++) {
                  sum += buffer[i];
                }
                const avg = sum / buffer.length / 255;
                setAudioLevel(avg);
                audioAnimationRef.current = requestAnimationFrame(updateLevel);
              };
              updateLevel();
            },
            speechRate
          );
        } else {
          // Graceful fallback to client browser speech synthesis when Cloud TTS quota is rate-limited
          playBrowserTtsFallback(
            message.content,
            voiceToUse.voiceCode,
            () => {
              setIsSpeaking(false);
              setPlayingMessageId(null);
              setAudioLevel(0);
            },
            (level) => {
              setAudioLevel(level);
            },
            selectedLanguage,
            speechRate
          );
        }
      } catch (err: any) {
        console.warn('Cloud TTS synthesis rate-limited, switching to browser speech synthesis:', err);
        // Fallback to browser TTS so user always hears voice response
        try {
          playBrowserTtsFallback(
            message.content,
            selectedVoice.voiceCode,
            () => {
              setIsSpeaking(false);
              setPlayingMessageId(null);
              setAudioLevel(0);
            },
            (level) => {
              setAudioLevel(level);
            },
            selectedLanguage,
            speechRate
          );
        } catch {
          setIsSpeaking(false);
          setPlayingMessageId(null);
          setAudioLevel(0);
        }
      }
    },
    [selectedVoice, selectedLanguage, speechRate]
  );

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isThinking) return;

    setErrorMessage(null);
    const userMsgId = 'user-' + Date.now();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const updatedHistory = [...messages, newUserMsg];
    setMessages(updatedHistory);
    setIsThinking(true);

    const lowerText = text.toLowerCase();

    // Direct Voice & Text System Controls Execution
    if (lowerText.includes('mute audio') || lowerText.includes('silence jarvis') || lowerText.includes('mute voice') || lowerText.includes('turn off audio')) {
      setIsAudioMuted(true);
      setAutoSpeak(false);
      window.speechSynthesis?.cancel();
    } else if (lowerText.includes('unmute audio') || lowerText.includes('unmute jarvis') || lowerText.includes('turn on audio') || lowerText.includes('enable audio')) {
      setIsAudioMuted(false);
      setAutoSpeak(true);
    } else if (lowerText.includes('system control') || lowerText.includes('hardware control') || lowerText.includes('laptop control') || lowerText.includes('hardware terminal')) {
      setLaptopDirective('shutdown');
      setIsLaptopControlOpen(true);
    }

    const detectedAction = detectWebAction(text, voiceShortcuts);

    if (detectedAction) {
      if (detectedAction.type === 'system_control') {
        setLaptopDirective(detectedAction.systemAction || 'shutdown');
        setIsLaptopControlOpen(true);
      } else if (detectedAction.type === 'tactical_time') {
        setIsTimeModalOpen(true);
      } else if (detectedAction.type === 'tactical_location') {
        setIsLocationModalOpen(true);
      } else if (detectedAction.type === 'gmail_automation') {
        handleOpenAutomationHub('gmail', {
          emailTo: detectedAction.emailDetails?.to,
          emailSubject: detectedAction.emailDetails?.subject,
          emailBody: detectedAction.emailDetails?.body,
        });
      } else if (detectedAction.type === 'whatsapp_automation') {
        handleOpenAutomationHub('whatsapp', {
          waPhone: detectedAction.whatsappDetails?.phone,
          waText: detectedAction.whatsappDetails?.message,
        });
      } else if (detectedAction.type === 'open_camera_3d') {
        const isPermissionIssue =
          lowerText.includes('permission') ||
          lowerText.includes('blocked') ||
          lowerText.includes('solve the problem') ||
          lowerText.includes('allow') ||
          lowerText.includes('retry');

        if (isPermissionIssue) {
          setIsCameraSolverOpen(true);
        } else {
          setIsVisionScannerOpen(true);
        }
        setLeftPanelMode('camera');
      } else if (detectedAction.url) {
        setTimeout(() => {
          handleDirectNavigate(detectedAction.url!);
        }, 350);
      }
    }

    try {
      // Craft instruction with persona identity & user callsign
      const callsign = userProfile?.preferredCallsign || 'Sir Tharun';
      const langObj = findLanguageByCode(selectedLanguage);
      const isTargetNonEnglish = !selectedLanguage.toLowerCase().startsWith('en');
      const langMandate = isTargetNonEnglish
        ? `\nCRITICAL MULTI-LINGUAL MANDATE: The user has explicitly selected the language: ${langObj.name} (${langObj.nativeName}). You MUST generate and formulate your ENTIRE reply in ${langObj.name}. Do NOT reply in English. Address the operative as ${callsign} in ${langObj.name}.`
        : '';
      const effectiveInstruction = `
${selectedVoice.systemPromptAddon}
You are currently functioning as ${selectedVoice.aiPersonaName} in Tharun OS.
Address the operative as ${callsign}.${langMandate}
${customInstruction}
`.trim();

      const requestStartTime = performance.now();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          modelChoice,
          customInstruction: effectiveInstruction,
          language: findLanguageByCode(selectedLanguage).name,
          clientTime: timeData,
          clientLocation: locationData,
        }),
      });

      let data: any = {};
      if (response.ok) {
        const text = await response.text();
        if (text && text.trim()) {
          try {
            data = JSON.parse(text);
          } catch {
            data = {};
          }
        }
      }
      let botReply = data.text || `Understood, ${callsign}. Processing directive.`;

      let finalActionCard: any = detectedAction ? { ...detectedAction } : undefined;

      if (detectedAction && detectedAction.url && !botReply.includes(detectedAction.url)) {
        botReply = `${botReply}\n\nNavigating to [${detectedAction.title}](${detectedAction.url})`;
      } else if (detectedAction && detectedAction.type === 'system_control') {
        if (!botReply.toLowerCase().includes('laptop') && !botReply.toLowerCase().includes('terminal')) {
          botReply = `${botReply}\n\n⚡ **Hardware Directive Ready**: Laptop hardware control protocol for **${detectedAction.title}** has been dispatched to your screen.`;
        }
      } else if (detectedAction && detectedAction.type === 'open_camera_3d') {
        botReply = `${botReply}\n\n📷 **Optical Scanner Activated**: Camera subroutines initialized with real-time face tracking, gesture detection, and 3D holographic conversion. You can also upload any photo to generate and inspect interactive 3D models with full zoom, rotation, and texture mapping controls.`;
      } else if (detectedAction && detectedAction.type === 'tactical_time') {
        finalActionCard = {
          ...detectedAction,
          timeDetails: {
            time24: timeData.time24,
            time12: timeData.time12,
            zuluTime: timeData.zuluTime,
            dateFormatted: timeData.dateFormatted,
            timezone: timeData.timezone,
            stardate: timeData.stardate,
          },
        };
        if (!botReply.toLowerCase().includes('time') && !botReply.toLowerCase().includes('clock')) {
          botReply = `${botReply}\n\n⏱️ **Tactical Chronometer Synchronized**: Master system clock reading **${timeData.time24}** (${timeData.time12}), **${timeData.dateFormatted}** [${timeData.timezone} • Zulu: ${timeData.zuluTime}].`;
        }
      } else if (detectedAction && detectedAction.type === 'tactical_location') {
        const coordFormatted = formatCoordinates(locationData.latitude, locationData.longitude, 'DD');
        finalActionCard = {
          ...detectedAction,
          locationDetails: {
            latitude: locationData.latitude || 0,
            longitude: locationData.longitude || 0,
            altitude: locationData.altitude || undefined,
            accuracy: locationData.accuracy || undefined,
            city: locationData.city || undefined,
            region: locationData.region || undefined,
            country: locationData.country || undefined,
            formattedCoordinates: coordFormatted,
            mapUrl: locationData.latitude && locationData.longitude
              ? `https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`
              : undefined,
          },
        };
        if (!botReply.toLowerCase().includes('coordinate') && !botReply.toLowerCase().includes('location') && !botReply.toLowerCase().includes('radar')) {
          botReply = `${botReply}\n\n📍 **Tactical Geolocation Locked**: Position **${coordFormatted}** in **${locationData.city || 'Command Sector'}**, **${locationData.country || 'Territory'}**. Orbital navigation matrix engaged.`;
        }
      } else if (detectedAction && detectedAction.type === 'gmail_automation') {
        if (!botReply.toLowerCase().includes('email') && !botReply.toLowerCase().includes('gmail')) {
          botReply = `${botReply}\n\n📧 **Gmail Automation Uplink Online**: Google Workspace authorization matrix engaged. Live inbox reading, automated drafting, and secured transmission channels are active on your tactical display.`;
        }
      } else if (detectedAction && detectedAction.type === 'whatsapp_automation') {
        if (!botReply.toLowerCase().includes('whatsapp')) {
          botReply = `${botReply}\n\n💬 **WhatsApp Automation Relay Initialized**: Universal dispatch matrix engaged. Fast macros, location telemetry pings, and direct messaging links are ready.`;
        }
      }

      const durationSeconds = Number(((performance.now() - requestStartTime) / 1000).toFixed(2));

      const botMsgId = 'jarvis-' + Date.now();
      const newBotMsg: ChatMessage = {
        id: botMsgId,
        role: 'model',
        content: botReply,
        timestamp: Date.now(),
        modelUsed: data.modelUsed,
        responseDurationSeconds: durationSeconds,
        actionCard: finalActionCard,
      };

      setMessages((prev) => [...prev, newBotMsg]);

      if (autoSpeak && !isAudioMuted) {
        handlePlaySpeech(newBotMsg);
      }
    } catch (err: any) {
      console.warn('Chat request handling:', err);

      let fallbackText = `At your service, ${userProfile?.preferredCallsign || 'Sir'}. Directive acknowledged.`;
      if (detectedAction?.type === 'tactical_time') {
        fallbackText = `The current time is ${timeData.time12} (${timeData.time24} hrs) on ${timeData.dateFormatted} (${timeData.timezone}). All chronometer telemetry nodes are synchronized, ${userProfile?.preferredCallsign || 'Sir Tharun'}.`;
      } else if (detectedAction?.type === 'tactical_location') {
        fallbackText = `Your tactical geolocation is locked at ${formatCoordinates(locationData.latitude, locationData.longitude, 'DD')} in ${locationData.city || 'Command Sector'}${locationData.country ? `, ${locationData.country}` : ''}. Orbital navigation matrix is active, ${userProfile?.preferredCallsign || 'Sir Tharun'}.`;
      } else if (detectedAction?.type === 'gmail_automation') {
        fallbackText = `Google Workspace Gmail automation is online, ${userProfile?.preferredCallsign || 'Sir Tharun'}. Your communications console has been opened to review inboxes, auto-draft replies, and dispatch secure emails.`;
      } else if (detectedAction?.type === 'whatsapp_automation') {
        fallbackText = `WhatsApp automation matrix initialized, ${userProfile?.preferredCallsign || 'Sir Tharun'}. Prepared universal dispatch controls and rapid messaging macros on your HUD.`;
      } else if (detectedAction && detectedAction.url) {
        fallbackText = `Right away, ${userProfile?.preferredCallsign || 'Sir'}. Opening ${detectedAction.title} directly: [${detectedAction.title}](${detectedAction.url})`;
      }

      const fallbackReply: ChatMessage = {
        id: 'jarvis-' + Date.now(),
        role: 'model',
        content: fallbackText,
        timestamp: Date.now(),
        modelUsed: 'jarvis-core',
        responseDurationSeconds: 0.85,
        actionCard: detectedAction || undefined,
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleTestVocalPhrase = (testLang?: string) => {
    const langToUse = testLang || selectedLanguage;
    const callsign = userProfile?.preferredCallsign || 'Sir Tharun';
    const testPhrase = getLanguageTestPhrase(langToUse, callsign);

    const testMsg: ChatMessage = {
      id: 'test-' + Date.now(),
      role: 'model',
      content: testPhrase,
      timestamp: Date.now(),
    };
    handlePlaySpeech(testMsg);
  };

  const activeTheme = THEME_CONFIGS[selectedVoice.theme] || THEME_CONFIGS.cyan;

  return (
    <div className="relative flex flex-col h-[100dvh] max-h-[100dvh] w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Dynamic Animated HUD Background (shifts colors based on system status: cool blue for normal, pulsing amber for high processing load) */}
      <DynamicHudBackground
        isThinking={isThinking}
        isSpeaking={isSpeaking}
        reactorPower={reactorPower}
        coreTemp={coreTemp}
        accentColor={effectiveAccentHex}
        simulatedHighLoad={simulatedHighLoad}
        onToggleSimulatedLoad={() => setSimulatedHighLoad((prev) => !prev)}
      />

      {/* Fixed Top Deck: Master HUD Header & Person-Specific AI Voice Page Deck */}
      <header className="sticky top-0 z-40 w-full shrink-0 bg-slate-950/95 backdrop-blur-md border-b border-cyan-950/80 shadow-md">
        {/* Master HUD System Header */}
        <TacticalHudHeader
          reactorPower={reactorPower}
          coreTemp={coreTemp}
          selectedVoice={selectedVoice}
          onOpenAuthModal={handleOpenAuth}
          onOpenLaptopControl={() => {
            setLaptopDirective('shutdown');
            setIsLaptopControlOpen(true);
          }}
          showDiagnostics={showDiagnostics}
          onToggleDiagnostics={() => setShowDiagnostics(!showDiagnostics)}
          onCycleReactorPower={handleSetSimulatedReactorPower}
          onOpenVisionScanner={() => setIsVisionScannerOpen(true)}
          onOpenAutomationHub={handleOpenAutomationHub}
          effectiveAccentColor={effectiveAccentHex}
          customAccentColor={customAccentColor}
          timeData={timeData}
          locationData={locationData}
          onOpenTimeModal={() => setIsTimeModalOpen(true)}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          onOpenSystemGuide={() => setIsSystemGuideOpen(true)}
        />

        {/* Person-Specific AI Voice Page Header Deck */}
        <OperativeVoicePageBanner
          currentVoice={selectedVoice}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          onSelectVoice={(v) => {
            setSelectedVoice(v);
            handlePlaySpeech(
              {
                id: 'switch-' + Date.now(),
                role: 'model',
                content: v.greeting,
                timestamp: Date.now(),
              },
              v
            );
          }}
          onTestVoice={handleTestVocalPhrase}
          isSpeaking={isSpeaking}
          speechRate={speechRate}
          onSpeechRateChange={handleSpeechRateChange}
          autoSpeak={autoSpeak}
          onToggleAutoSpeak={() => setAutoSpeak(!autoSpeak)}
          modelChoice={modelChoice}
          onModelChange={setModelChoice}
          onOpenAuthModal={handleOpenAuth}
          effectiveAccentColor={effectiveAccentHex}
          customAccentColor={customAccentColor}
          onOpenSettings={() => setShowDiagnostics(true)}
        />

        {errorMessage && (
          <div className="bg-rose-950/80 border-b border-rose-800 px-4 py-2 text-xs text-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-300 hover:text-white underline text-[11px]"
            >
              DISMISS
            </button>
          </div>
        )}
      </header>

      {/* Main Operational Workspace: Left Column is Fixture, Right Column has Scroll-Attached Input Field */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl w-full mx-auto min-h-0">
        {/* Mobile View Switcher (< md only): Thumb-Friendly Switch between AI Voice Core and Chat Feed */}
        <div className="md:hidden flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-cyan-950/80 shrink-0 w-full">
          <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono w-full">
            <button
              type="button"
              onClick={() => setMobileTab('core')}
              className={`flex-1 py-1.5 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all font-semibold ${
                mobileTab === 'core'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>AI VOICE CORE</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('chat')}
              className={`flex-1 py-1.5 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all font-semibold ${
                mobileTab === 'chat'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>CHAT FEED ({messages.length})</span>
            </button>
          </div>
        </div>

        {/* Left Column: AI Voice Core & Vision HUD (Permanent Fixture on Tablet & Desktop) */}
        <aside className={`w-full md:w-5/12 lg:w-5/12 xl:w-4/12 ${mobileTab === 'core' ? 'flex' : 'hidden md:flex'} flex-col items-center justify-between border-b md:border-b-0 md:border-r border-slate-800/80 p-2 sm:p-3 md:p-4 lg:p-5 bg-gradient-to-b from-slate-950/50 to-slate-900/30 shrink-0 h-full overflow-y-auto no-scrollbar`}>
          {/* Persona Header & Mode Switcher */}
          <div className="w-full flex items-center justify-between text-xs mono-font text-slate-400 px-1 pb-2 border-b border-cyan-950/60">
            <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setLeftPanelMode('reactor')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
                  leftPanelMode === 'reactor'
                    ? 'bg-cyan-950/90 border border-cyan-500/60 text-cyan-200 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                AI VOICE CORE
              </button>
              <button
                type="button"
                onClick={() => setLeftPanelMode('camera')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
                  leftPanelMode === 'camera'
                    ? 'bg-cyan-950/90 border border-cyan-500/60 text-cyan-200 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-cyan-300'
                }`}
              >
                <Camera className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>LIVE CAMERA</span>
              </button>
            </div>

            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="lg:hidden flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showDiagnostics ? 'FEED' : 'TELEMETRY'}</span>
            </button>
          </div>

          {leftPanelMode === 'reactor' ? (
            /* Central Arc Reactor Interactive Sphere */
            <div className="my-auto py-4 flex flex-col items-center">
              <ArcReactorCore
                isSpeaking={isSpeaking}
                isListening={isListening}
                isThinking={isThinking}
                audioLevel={audioLevel}
                onClick={handleToggleListen}
                accentHex={effectiveAccentHex}
                aiPersonaName={selectedVoice.aiPersonaName}
              />

              {/* Mobile Quick Vocal Trigger Bar (< md only) */}
              <button
                type="button"
                onClick={handleToggleListen}
                className={`md:hidden mt-3 w-full max-w-xs py-2.5 px-4 rounded-xl border font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse'
                    : 'bg-cyan-950/70 border-cyan-500/50 text-cyan-200 hover:bg-cyan-900/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{isListening ? 'RECORDING... (TAP TO STOP)' : 'TAP TO SPEAK DIRECTIVE'}</span>
              </button>

              {/* Quick Live Camera Launcher Button */}
              <button
                type="button"
                onClick={() => {
                  setLeftPanelMode('camera');
                  setIsVisionScannerOpen(true);
                }}
                className="mt-3 sm:mt-4 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-cyan-500/50 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-200 text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all cursor-pointer"
                title="Open Live Camera Access, Face & Hand Gestures, and 3D Hologram Synthesizer"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>ACCESS LIVE CAMERA & 3D SCANNER</span>
              </button>
            </div>
          ) : (
            /* Live Camera HUD Telemetry Panel */
            <div className="my-auto py-2 w-full flex flex-col items-center space-y-3">
              <div className="w-full relative aspect-video bg-slate-900 rounded-xl border border-cyan-500/60 overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.25)] flex items-center justify-center">
                {dashCameraSource === 'simulated' ? (
                  <SimulatedCameraFeed />
                ) : dashCameraSource === 'screen' ? (
                  <>
                    <video
                      ref={(el) => {
                        if (el && !el.srcObject) {
                          navigator.mediaDevices?.getDisplayMedia({ video: true, audio: false })
                            .then((stream) => {
                              el.srcObject = stream;
                              el.play().catch(() => {});
                              setDashCameraNotice(null);
                            })
                            .catch(() => {
                              setDashCameraSource('simulated');
                            });
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 border border-purple-500/30 m-2 rounded-lg pointer-events-none flex flex-col justify-between p-2.5 text-[10px] font-mono text-purple-400">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                          SCREEN STREAM
                        </span>
                        <span className="text-purple-400 font-bold">ONLINE</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <video
                      ref={dashVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />

                    {/* Dynamic Real-Time FACE LOCK Reticle with Live Tracking Metrics */}
                    <FaceLockReticle metrics={dashFaceMetrics} compact={true} accentColor={effectiveAccentHex} />

                    {/* Tactical HUD Overlay with Dynamic Real-Time Coordinates, Tilt & Confidence */}
                    <div className="absolute inset-0 border border-cyan-500/30 m-2 rounded-lg pointer-events-none flex flex-col justify-between p-2.5 text-[10px] font-mono text-cyan-400">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${dashFaceMetrics.detected ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'}`} />
                          LIVE WEBCAM
                        </span>
                        <span className="text-emerald-400 font-bold">
                          {dashFaceMetrics.statusLabel}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[9px] bg-slate-950/85 px-2 py-1 rounded border border-cyan-800/70 shadow-md">
                        <span className="text-cyan-300 font-bold">
                          X:{dashFaceMetrics.x.toFixed(2)} Y:{dashFaceMetrics.y.toFixed(2)}
                        </span>
                        <span className="text-amber-300 font-bold">
                          TILT:{dashFaceMetrics.tiltAngle > 0 ? '+' : ''}{dashFaceMetrics.tiltAngle.toFixed(1)}°
                        </span>
                        <span className="text-emerald-300 font-bold">
                          CONF:{(dashFaceMetrics.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {dashCameraNotice && (
                <div className="w-full p-2 rounded-lg bg-amber-950/70 border border-amber-600/50 flex items-center justify-between gap-2 text-[10px] font-mono text-amber-200">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{dashCameraNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCameraSolverOpen(true)}
                    className="underline text-amber-300 hover:text-white shrink-0 cursor-pointer"
                  >
                    Solve →
                  </button>
                </div>
              )}

              {/* Source Switcher: Simulated vs Hardware vs Screen */}
              <div className="w-full flex items-center justify-between text-[11px] font-mono px-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDashCameraSource('simulated');
                      setDashCameraNotice(null);
                    }}
                    className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      dashCameraSource === 'simulated'
                        ? 'bg-cyan-950 border-cyan-500/60 text-cyan-200 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    NEURAL
                  </button>
                  <button
                    type="button"
                    onClick={() => setDashCameraSource('hardware')}
                    className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      dashCameraSource === 'hardware'
                        ? 'bg-cyan-950 border-cyan-500/60 text-cyan-200 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    WEBCAM
                  </button>
                  <button
                    type="button"
                    onClick={() => setDashCameraSource('screen')}
                    className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      dashCameraSource === 'screen'
                        ? 'bg-purple-950 border-purple-500/60 text-purple-200 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-purple-300'
                    }`}
                  >
                    SCREEN
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCameraSolverOpen(true)}
                    className="text-amber-400 hover:text-amber-200 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                    title="Open Camera Permission Troubleshooter"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>Permission</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(window.location.origin || window.location.href, '_blank', 'noopener,noreferrer')}
                    className="text-cyan-400 hover:text-cyan-200 text-[10px] underline flex items-center gap-1 cursor-pointer"
                    title="Open app directly in new browser tab to grant physical camera permissions"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Direct Tab</span>
                  </button>
                </div>
              </div>

              {/* Live Camera Quick Actions */}
              <div className="w-full flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleCaptureDashFace}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-bold text-xs hud-font flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
                  title="Capture live webcam photo of your face and generate 3D hologram"
                >
                  <Camera className="w-4 h-4 fill-slate-950" />
                  <span>📸 CAPTURE MY FACE FOR 3D SCAN</span>
                </button>

                <div className="w-full flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => dashFaceUploadInputRef.current?.click()}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-200 font-mono text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Upload face portrait or selfie photo"
                  >
                    <Upload className="w-3 h-3 text-cyan-400" />
                    <span>UPLOAD FACE PHOTO</span>
                  </button>
                  <input
                    ref={dashFaceUploadInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleUploadDashFace}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setIsVisionScannerOpen(true)}
                    className="py-1.5 px-2.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 font-mono text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Box className="w-3 h-3 text-cyan-400" />
                    <span>3D VIEWER</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeftPanelMode('reactor')}
                    className="py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px] transition-colors cursor-pointer"
                  >
                    REACTOR
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Core Controls & Audio Status Indicators */}
          <div className="w-full space-y-2 mt-4">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">MICROPHONE</span>
                <span
                  className={`font-semibold ${
                    isListening ? 'text-emerald-400 animate-pulse' : 'text-slate-300'
                  }`}
                >
                  {isListening ? 'RECORDING' : 'IDLE'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">SYNTHESIS</span>
                <span
                  className={`font-semibold ${
                    isSpeaking ? 'text-cyan-300 animate-pulse' : 'text-slate-300'
                  }`}
                >
                  {isSpeaking ? 'TRANSMITTING' : 'STANDBY'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">NEURAL COG</span>
                <span
                  className={`font-semibold ${
                    isThinking ? 'text-amber-400 animate-pulse' : 'text-slate-300'
                  }`}
                >
                  {isThinking ? 'ACTIVE' : 'NOMINAL'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
              <span>VOICE ENGINE: {selectedVoice.voiceCode} (24kHz)</span>
              <button
                onClick={() => {
                  if (isSpeaking) handleStopSpeech();
                  else handleTestVocalPhrase();
                }}
                className="hover:underline font-mono text-[10px]"
                style={{ color: effectiveAccentHex }}
              >
                {isSpeaking ? 'HALT AUDIO' : 'PING VOICE PERSONA'}
              </button>
            </div>
          </div>
        </aside>

        {/* Right Column: Tactical Multi-Turn Conversation & Scroll-Attached Typing Field */}
        <section className={`w-full md:w-7/12 lg:w-7/12 xl:w-8/12 flex-1 min-w-0 ${mobileTab === 'chat' ? 'flex' : 'hidden md:flex'} flex-col h-full min-h-0 overflow-hidden bg-slate-950/40 relative`}>
          {/* Scrollable Conversation History & Diagnostics Feed */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {showDiagnostics ? (
              <DiagnosticsPanel
                modelChoice={modelChoice}
                onModelChange={setModelChoice}
                selectedVoice={selectedVoice}
                onVoiceChange={setSelectedVoice}
                speechRate={speechRate}
                onSpeechRateChange={handleSpeechRateChange}
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
                reactorPower={reactorPower}
                coreTemp={coreTemp}
                customInstruction={customInstruction}
                onCustomInstructionChange={setCustomInstruction}
                onTestVocalPhrase={handleTestVocalPhrase}
                voiceShortcuts={voiceShortcuts}
                onAddShortcut={handleAddShortcut}
                onToggleShortcut={handleToggleShortcut}
                onDeleteShortcut={handleDeleteShortcut}
                onResetShortcuts={handleResetShortcuts}
                onTriggerShortcut={handleTriggerShortcut}
                customAccentColor={customAccentColor}
                effectiveAccentColor={effectiveAccentHex}
                onSetCustomAccentColor={handleSetCustomAccentColor}
                timeData={timeData}
                locationData={locationData}
                onOpenTimeModal={() => setIsTimeModalOpen(true)}
                onOpenLocationModal={() => setIsLocationModalOpen(true)}
              />
            ) : (
              <MessageFeed
                messages={messages}
                isThinking={isThinking}
                playingMessageId={playingMessageId}
                onPlaySpeech={handlePlaySpeech}
                onStopSpeech={handleStopSpeech}
                onClearHistory={handleClearHistory}
                onRemoveMessage={handleRemoveMessage}
                onDirectNavigate={handleDirectNavigate}
                onOpenLaptopControl={(dir) => {
                  setLaptopDirective(dir || 'shutdown');
                  setIsLaptopControlOpen(true);
                }}
                onOpenShortcuts={() => setShowDiagnostics(true)}
                onOpenVisionScanner={() => setIsVisionScannerOpen(true)}
                onOpenTimeModal={() => setIsTimeModalOpen(true)}
                onOpenLocationModal={() => setIsLocationModalOpen(true)}
                onOpenAutomationHub={handleOpenAutomationHub}
                effectiveAccentColor={effectiveAccentHex}
              />
            )}
          </div>

          {/* Voice & Directive Input Command Bar: Permanently Attached on Tablet & Desktop (Hidden on Mobile View as requested) */}
          <footer className="shrink-0 z-30 sticky bottom-0 hidden md:block">
            <VoiceInputBar
              onSendMessage={handleSendMessage}
              isListening={isListening}
              onToggleListen={handleToggleListen}
              isThinking={isThinking}
              modelChoice={modelChoice}
              selectedLanguage={selectedLanguage}
              onSelectDirective={(prompt, choice) => {
                setModelChoice(choice);
                handleSendMessage(prompt);
              }}
              onOpenVisionScanner={() => setIsVisionScannerOpen(true)}
            />
          </footer>

          {/* Mobile Bottom Vocal Action Bar (< md only: Clean Speech Trigger without bulky text typing field) */}
          <div className="md:hidden shrink-0 p-2.5 bg-slate-950/95 border-t border-cyan-950/80 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleToggleListen}
              className={`flex-1 py-2.5 px-3 rounded-xl border font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse'
                  : 'bg-cyan-950/60 border-cyan-500/50 text-cyan-200'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>{isListening ? 'RECORDING... (TAP TO STOP)' : 'SPEAK DIRECTIVE'}</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('core')}
              className="py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 font-mono text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>CORE</span>
            </button>
          </div>
        </section>
      </main>

      {/* Optical Camera, Face/Hand Recognition & 3D Hologram Modal */}
      <VisionScanModal
        isOpen={isVisionScannerOpen}
        initialImage={initialScanImage}
        onClose={() => {
          setIsVisionScannerOpen(false);
          setInitialScanImage(null);
        }}
        onTransmitDirective={(text) => handleSendMessage(text)}
        effectiveAccentColor={effectiveAccentHex}
      />

      {/* Standalone Camera Permission Solver Modal */}
      <CameraPermissionSolverModal
        isOpen={isCameraSolverOpen}
        onClose={() => setIsCameraSolverOpen(false)}
        onUseSimulatedFeed={() => {
          setDashCameraSource('simulated');
          setDashCameraNotice(null);
          setLeftPanelMode('camera');
        }}
        onStartScreenShare={() => {
          setDashCameraSource('screen');
          setDashCameraNotice(null);
          setLeftPanelMode('camera');
        }}
        onRetryHardwareCamera={() => {
          setDashCameraSource('hardware');
          setLeftPanelMode('camera');
          startDashHardwareCamera();
        }}
      />

      {/* Laptop & Hardware System Command Center */}
      <LaptopCommandCenter
        isOpen={isLaptopControlOpen}
        onClose={() => setIsLaptopControlOpen(false)}
        selectedVoice={selectedVoice}
        initialDirective={laptopDirective}
        effectiveAccentColor={effectiveAccentHex}
      />

      {/* Security Register & Login Gateway Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Tactical Chronometer & World Clocks Modal */}
      <TacticalTimeModal
        isOpen={isTimeModalOpen}
        onClose={() => setIsTimeModalOpen(false)}
        timeData={timeData}
        effectiveAccentColor={effectiveAccentHex}
      />

      {/* Tactical Geolocation & Orbital Radar Modal */}
      <TacticalLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        locationData={locationData}
        effectiveAccentColor={effectiveAccentHex}
        onRequestLiveGps={handleRequestLiveGps}
        onSelectPreset={handleSelectLocationPreset}
        onSetCustomCoordinates={handleSetCustomCoordinates}
      />

      {/* Tactical Communications & Automation Hub (Gmail & WhatsApp) */}
      <AutomationHubModal
        isOpen={isAutomationHubOpen}
        onClose={() => setIsAutomationHubOpen(false)}
        locationData={locationData}
        effectiveAccentColor={effectiveAccentHex}
        initialTab={automationHubTab}
        initialEmailTo={automationHubParams.emailTo}
        initialEmailSubject={automationHubParams.emailSubject}
        initialEmailBody={automationHubParams.emailBody}
        initialWhatsAppPhone={automationHubParams.waPhone}
        initialWhatsAppText={automationHubParams.waText}
      />

      {/* Real-World Customer System Guide & Architectural Overview */}
      <CustomerSystemGuideModal
        isOpen={isSystemGuideOpen}
        onClose={() => setIsSystemGuideOpen(false)}
        selectedVoice={selectedVoice}
        effectiveAccentColor={effectiveAccentHex}
        onLaunchModule={(mod) => {
          if (mod === 'gmail') handleOpenAutomationHub('gmail');
          else if (mod === 'whatsapp') handleOpenAutomationHub('whatsapp');
          else if (mod === 'vision') setIsVisionScannerOpen(true);
          else if (mod === 'hardware') setIsLaptopControlOpen(true);
          else if (mod === 'time') setIsTimeModalOpen(true);
          else if (mod === 'voice') handleToggleListen();
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <JarvisMainApp />
    </AuthProvider>
  );
}
