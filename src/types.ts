export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  modelUsed?: string;
  audioBase64?: string;
  isAudioPlaying?: boolean;
  responseDurationSeconds?: number;
  actionCard?: {
    type:
      | 'open_url'
      | 'play_youtube'
      | 'search_google'
      | 'play_spotify'
      | 'open_wiki'
      | 'system_control'
      | 'open_camera_3d'
      | 'tactical_time'
      | 'tactical_location'
      | 'gmail_automation'
      | 'whatsapp_automation';
    url?: string;
    title: string;
    category: 'video' | 'music' | 'website' | 'search' | 'system' | 'camera_3d' | 'time' | 'location' | 'gmail' | 'whatsapp';
    query?: string;
    systemAction?: 'shutdown' | 'restart' | 'sleep' | 'battery' | 'fullscreen' | 'wakelock';
    osCommands?: {
      windows: string;
      mac: string;
      linux: string;
    };
    description?: string;
    emailDetails?: {
      to?: string;
      subject?: string;
      body?: string;
    };
    whatsappDetails?: {
      phone?: string;
      message?: string;
      directUrl?: string;
    };
    timeDetails?: {
      time24: string;
      time12: string;
      zuluTime: string;
      dateFormatted: string;
      timezone: string;
      stardate: string;
    };
    locationDetails?: {
      latitude: number;
      longitude: number;
      altitude?: number;
      accuracy?: number;
      city?: string;
      region?: string;
      country?: string;
      formattedCoordinates?: string;
      mapUrl?: string;
    };
  };
}

export type ModelSpeedChoice = 'fast' | 'general' | 'complex';

export type HudThemeType = 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple';

export interface VoiceShortcut {
  id: string;
  phrase: string;
  title: string;
  actionType: 'url' | 'system' | 'directive';
  target: string;
  isEnabled: boolean;
  createdAt: number;
}

export const DEFAULT_VOICE_SHORTCUTS: VoiceShortcut[] = [
  {
    id: 'shortcut-1',
    phrase: 'open workspace',
    title: 'GitHub Workspace',
    actionType: 'url',
    target: 'https://github.com',
    isEnabled: true,
    createdAt: 1,
  },
  {
    id: 'shortcut-2',
    phrase: 'emergency shutdown',
    title: 'Instant Laptop Shutdown',
    actionType: 'system',
    target: 'shutdown',
    isEnabled: true,
    createdAt: 2,
  },
  {
    id: 'shortcut-3',
    phrase: 'lock workstation',
    title: 'Lock Screen & Sleep Mode',
    actionType: 'system',
    target: 'sleep',
    isEnabled: true,
    createdAt: 3,
  },
  {
    id: 'shortcut-4',
    phrase: 'power check',
    title: 'Laptop Battery Diagnostics',
    actionType: 'system',
    target: 'battery',
    isEnabled: true,
    createdAt: 4,
  },
  {
    id: 'shortcut-5',
    phrase: 'quantum research',
    title: 'ArXiv Science Papers',
    actionType: 'url',
    target: 'https://arxiv.org',
    isEnabled: true,
    createdAt: 5,
  },
  {
    id: 'shortcut-6',
    phrase: 'maximize hud',
    title: 'Fullscreen Tactical HUD',
    actionType: 'system',
    target: 'fullscreen',
    isEnabled: true,
    createdAt: 6,
  },
];

export interface JarvisSystemStatus {
  reactorOutput: number;
  coreTemp: number;
  protocolStatus: 'ACTIVE' | 'LISTENING' | 'ANALYZING' | 'TRANSMITTING' | 'STANDBY';
  neuralLatency: number;
  audioWaveformData: number[];
}

export interface VoicePreset {
  id: string;
  name: string;
  aiPersonaName: string;
  tagline: string;
  voiceCode: string;
  description: string;
  style: string;
  theme: HudThemeType;
  accentHex: string;
  greeting: string;
  systemPromptAddon: string;
}

export const JARVIS_VOICE_PRESETS: VoicePreset[] = [
  {
    id: 'puck',
    name: 'Puck (Executive J.A.R.V.I.S.)',
    aiPersonaName: 'J.A.R.V.I.S.',
    tagline: 'British Executive & Productivity Advisor',
    voiceCode: 'Puck',
    description: 'Crisp, cultured, and measured British tone. Ideal for daily planning, communications, research, and workspace execution.',
    style: 'Calm, cultured, articulate executive advisor and intelligent assistant',
    theme: 'cyan',
    accentHex: '#06b6d4',
    greeting: "Good day. J.A.R.V.I.S. Executive OS is online and synchronized with your workspace. How may I be of assistance today?",
    systemPromptAddon: "You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), an elite real-world executive AI assistant. Speak with cultured wit, calm reassurance, and sharp intelligence.",
  },
  {
    id: 'kore',
    name: 'Kore (Agile Assistant F.R.I.D.A.Y.)',
    aiPersonaName: 'F.R.I.D.A.Y.',
    tagline: 'Fast & Agile Digital Collaborator',
    voiceCode: 'Kore',
    description: 'Smooth, lucid modern assistant voice tailored for fast-paced multitasking, live scheduling, and rapid workflows.',
    style: 'Clear, modern, lucid synthetic assistant with rapid responsiveness',
    theme: 'emerald',
    accentHex: '#10b981',
    greeting: "Hello! F.R.I.D.A.Y. productivity engine is online and ready. What goals are we achieving today?",
    systemPromptAddon: "You are F.R.I.D.A.Y., a dynamic, sharp, modern executive AI assistant. Fast-thinking, confident, helpful, and concise.",
  },
  {
    id: 'charon',
    name: 'Charon (Operations Director C.H.A.R.O.N.)',
    aiPersonaName: 'C.H.A.R.O.N.',
    tagline: 'Enterprise Operations & Infrastructure',
    voiceCode: 'Charon',
    description: 'Deep, authoritative, resonant voice suited for enterprise operations, telemetry analysis, and mission-critical directives.',
    style: 'Deep, resonant, calm enterprise-grade AI operations director',
    theme: 'amber',
    accentHex: '#f59e0b',
    greeting: "Operations Command online. System telemetry active. Standing by for your instructions.",
    systemPromptAddon: "You are C.H.A.R.O.N., a deep, resolute enterprise operations AI director. Direct, unwavering, and highly precise.",
  },
  {
    id: 'fenrir',
    name: 'Fenrir (Rapid-Action V.A.N.G.U.A.R.D.)',
    aiPersonaName: 'V.A.N.G.U.A.R.D.',
    tagline: 'Fast-Response Strategic Advisor',
    voiceCode: 'Fenrir',
    description: 'Dynamic, sharp, and focused executive advisory voice engineered for rapid decision making and instant problem solving.',
    style: 'Focused, energetic, strategic advisory persona',
    theme: 'rose',
    accentHex: '#f43f5e',
    greeting: "Vanguard protocol initialized. Strategic subroutines ready. Ready for your directives.",
    systemPromptAddon: "You are V.A.N.G.U.A.R.D., an energetic, razor-sharp strategic advisor AI. Punchy, swift, clear, and actionable.",
  },
  {
    id: 'zephyr',
    name: 'Zephyr (Analytics Specialist Z.E.P.H.Y.R.)',
    aiPersonaName: 'Z.E.P.H.Y.R.',
    tagline: 'Scientific & Business Analytics',
    voiceCode: 'Zephyr',
    description: 'Soothing, gentle analytical voice for deep data analysis, technical research, and complex problem evaluation.',
    style: 'Gentle, thoughtful, highly articulate researcher and analytical advisor',
    theme: 'purple',
    accentHex: '#a855f7',
    greeting: "Welcome. Z.E.P.H.Y.R. analytical matrix synchronized. What data or question shall we evaluate today?",
    systemPromptAddon: "You are Z.E.P.H.Y.R., a soothing, cerebral analytical intelligence advisor. Eloquent, contemplative, and rigorously analytical.",
  },
];

export interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  securityClearance: 'GUEST' | 'OPERATOR' | 'THARUN_CLEARANCE_LVL_7' | 'STARK_CLEARANCE_LVL_7' | 'EXECUTIVE_CLEARANCE_LVL_7';
  createdAt: string;
  lastLogin: string;
  preferredCallsign?: string;
  preferredVoiceId?: string;
  hudTheme?: HudThemeType;
  customAccentColor?: string;
}

export const QUICK_DIRECTIVES = [
  {
    label: "📧 Gmail Automation",
    prompt: "Jarvis, access my email and open Gmail automation station to read and compose emails",
    choice: 'fast' as ModelSpeedChoice,
  },
  {
    label: "💬 WhatsApp Automation",
    prompt: "Jarvis, access my WhatsApp and open WhatsApp automation station to dispatch messages",
    choice: 'fast' as ModelSpeedChoice,
  },
  {
    label: "System Controls Terminal",
    prompt: "Jarvis, open system and hardware controls terminal with battery, audio mute, and display tools",
    choice: 'fast' as ModelSpeedChoice,
  },
  {
    label: "Camera & 3D Model Converter",
    prompt: "Jarvis, open camera with face and hand recognition and convert photo to 3D model with controls",
    choice: 'fast' as ModelSpeedChoice,
  },
  {
    label: "World Languages Mode",
    prompt: "Jarvis, demonstrate your fluency in all world languages for Sir Tharun.",
    choice: 'fast' as ModelSpeedChoice,
  },
  {
    label: "Shutdown Laptop",
    prompt: "shutdown my laptop",
    choice: 'fast' as ModelSpeedChoice,
  },
  {
    label: "What is AI?",
    prompt: "Jarvis, explain what Artificial Intelligence is and how you function for Sir Tharun.",
    choice: 'general' as ModelSpeedChoice,
  },
  {
    label: "Laptop Power & Shutdown",
    prompt: "Jarvis, initiate laptop shutdown and hardware power control directives.",
    choice: 'fast' as ModelSpeedChoice,
  },
  {
    label: "Play AC/DC Shoot to Thrill",
    prompt: "Jarvis, play AC/DC Shoot to Thrill on YouTube",
    choice: 'fast' as ModelSpeedChoice,
  },
  {
    label: "Check Laptop Battery",
    prompt: "Jarvis, check my laptop battery status and charging level.",
    choice: 'fast' as ModelSpeedChoice,
  },
  {
    label: "Open YouTube",
    prompt: "Jarvis, open youtube.com",
    choice: 'fast' as ModelSpeedChoice,
  },
  {
    label: "Initiate diagnostics",
    prompt: "Run a full system diagnostics check on power reserves and subroutines.",
    choice: 'fast' as ModelSpeedChoice,
  },
];
