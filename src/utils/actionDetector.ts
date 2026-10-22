/**
 * Command Parser & Action Dispatcher for JARVIS
 * Detects requests to open websites, search, play videos, play songs, navigate directly,
 * and execute laptop & OS system control directives (shutdown, restart, lock screen, battery telemetry, wake lock).
 */

import { VoiceShortcut, DEFAULT_VOICE_SHORTCUTS } from '../types';

export interface ParsedWebAction {
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
  embedUrl?: string;
  systemAction?: 'shutdown' | 'restart' | 'sleep' | 'battery' | 'fullscreen' | 'wakelock';
  osCommands?: {
    windows: string;
    mac: string;
    linux: string;
  };
  description?: string;
  isVoiceShortcut?: boolean;
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
}

function getOsCommandsForAction(action: string) {
  if (action === 'shutdown') {
    return {
      windows: 'shutdown /s /t 0',
      mac: 'sudo shutdown -h now',
      linux: 'sudo poweroff',
    };
  }
  if (action === 'restart') {
    return {
      windows: 'shutdown /r /t 0',
      mac: 'sudo shutdown -r now',
      linux: 'sudo reboot',
    };
  }
  if (action === 'sleep') {
    return {
      windows: 'rundll32.exe user32.dll,LockWorkStation',
      mac: 'pmset sleepnow',
      linux: 'systemctl suspend',
    };
  }
  if (action === 'battery') {
    return {
      windows: 'WMIC Path Win32_Battery Get EstimatedChargeRemaining',
      mac: 'pmset -g batt',
      linux: 'upower -i $(upower -e | grep BAT)',
    };
  }
  return undefined;
}

export function getStoredVoiceShortcuts(): VoiceShortcut[] {
  try {
    const raw = localStorage.getItem('tharun_voice_shortcuts_v1') || localStorage.getItem('stark_voice_shortcuts_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_VOICE_SHORTCUTS;
}

export function detectWebAction(
  rawText: string,
  providedShortcuts?: VoiceShortcut[]
): ParsedWebAction | null {
  const text = rawText.trim();
  const lower = text.toLowerCase().replace(/^(?:jarvis|friday|charon|vanguard|zephyr)[,.]?\s*/i, '');

  // 0. Check User's Custom Voice Shortcuts with Highest Priority
  const activeShortcuts = (providedShortcuts || getStoredVoiceShortcuts()).filter((s) => s.isEnabled);

  for (const sc of activeShortcuts) {
    const phraseLower = sc.phrase.trim().toLowerCase();
    if (!phraseLower) continue;

    // Check if input exactly matches or contains the voice trigger phrase
    if (lower === phraseLower || lower.includes(phraseLower)) {
      if (sc.actionType === 'url') {
        const fullUrl = sc.target.startsWith('http') ? sc.target : `https://${sc.target}`;
        return {
          type: 'open_url',
          url: fullUrl,
          title: sc.title || sc.phrase,
          category: 'website',
          description: `Voice Shortcut Triggered: "${sc.phrase}"`,
          isVoiceShortcut: true,
        };
      }

      if (sc.actionType === 'system') {
        const sysAction = sc.target as any;
        return {
          type: 'system_control',
          title: sc.title || `System: ${sc.target}`,
          category: 'system',
          systemAction: sysAction,
          osCommands: getOsCommandsForAction(sysAction),
          description: `Voice Shortcut Triggered: "${sc.phrase}" -> ${sc.title}`,
          isVoiceShortcut: true,
        };
      }

      if (sc.actionType === 'directive') {
        return {
          type: 'open_url',
          query: sc.target,
          title: sc.title || sc.phrase,
          category: 'system',
          description: `Voice Shortcut Directive: "${sc.phrase}"`,
          isVoiceShortcut: true,
        };
      }
    }
  }

  // A. Tactical Time, Clock, Chronometer, Date queries
  if (
    lower.includes('current time') ||
    lower.includes('what time is it') ||
    lower.includes("what's the time") ||
    lower.includes('what is the time') ||
    lower.includes('tell me the time') ||
    lower.includes('time now') ||
    lower.includes('current date') ||
    lower.includes('what day is it') ||
    lower.includes("today's date") ||
    lower.includes('todays date') ||
    lower.includes('show clock') ||
    lower.includes('open clock') ||
    lower.includes('chronometer') ||
    lower.includes('world clock') ||
    lower.includes('mission timer') ||
    lower.includes('stardate') ||
    lower.includes('zulu time') ||
    lower === 'time' ||
    lower === 'clock' ||
    lower === 'date'
  ) {
    return {
      type: 'tactical_time',
      title: 'Tactical Chronometer & Mission Clock',
      category: 'time',
      description: 'Synchronized atomic temporal telemetry node, military Zulu, and multi-timezone matrix.',
    };
  }

  // B. Tactical Location, GPS Coordinates, Navigation & Orbital Radar
  if (
    lower.includes('current location') ||
    lower.includes('what is my location') ||
    lower.includes("what's my location") ||
    lower.includes('where am i') ||
    lower.includes('where i am') ||
    lower.includes('location system') ||
    lower.includes('show location') ||
    lower.includes('open location') ||
    lower.includes('my coordinates') ||
    lower.includes('gps coordinates') ||
    lower.includes('gps location') ||
    lower.includes('tactical location') ||
    lower.includes('orbital radar') ||
    lower.includes('show map') ||
    lower.includes('open map') ||
    lower.includes('where are we') ||
    lower === 'location' ||
    lower === 'gps' ||
    lower === 'coordinates'
  ) {
    return {
      type: 'tactical_location',
      title: 'Tactical Geolocation & Orbital Radar',
      category: 'location',
      description: 'High-precision GPS fix, orbital grid coordinates, heading, altitude, and navigation matrix.',
    };
  }

  // C. Combined Communications Hub / Automation Hub Directives
  if (
    lower.includes('whatsapp and email') ||
    lower.includes('email and whatsapp') ||
    lower.includes('automation hub') ||
    lower.includes('comms hub') ||
    lower.includes('communications hub') ||
    lower.includes('access my whatsapp and email') ||
    lower.includes('automation station')
  ) {
    return {
      type: 'gmail_automation',
      title: 'Tactical Communications & Automation Hub',
      category: 'gmail',
      description: 'Authorized Google Workspace Gmail automation & WhatsApp universal dispatch station.',
    };
  }

  // D. Gmail & Email Automation Directives
  if (
    lower.includes('gmail') ||
    lower.includes('email automation') ||
    lower.includes('access my email') ||
    lower.includes('check my email') ||
    lower.includes('check email') ||
    lower.includes('read my email') ||
    lower.includes('read emails') ||
    lower.includes('open email') ||
    lower.includes('open gmail') ||
    lower.includes('send email') ||
    lower.includes('compose email') ||
    lower.includes('write email') ||
    lower.includes('inbox')
  ) {
    let to = '';
    let body = '';
    const toMatch = text.match(/(?:to|send email to)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (toMatch) {
      to = toMatch[1];
    }
    const sayingMatch = text.match(/(?:saying|with body|message|about)\s+(.+)$/i);
    if (sayingMatch) {
      body = sayingMatch[1];
    }

    return {
      type: 'gmail_automation',
      title: 'Google Workspace Gmail Automation',
      category: 'gmail',
      description: 'Authorized Google Workspace email reading, AI drafting, and automated transmission.',
      emailDetails: {
        to,
        subject: to ? `Tactical Message from Sir Tharun` : 'Operational Briefing',
        body,
      },
    };
  }

  // E. WhatsApp Automation & Direct Message Directives
  if (
    lower.includes('whatsapp') ||
    lower.includes('access my whatsapp') ||
    lower.includes('send whatsapp') ||
    lower.includes('open whatsapp') ||
    lower.includes('whatsapp message') ||
    lower.includes('whatsapp automation')
  ) {
    let phone = '';
    let message = '';
    const phoneMatch = text.match(/(?:\+?\d[\d -]{7,}\d)/);
    if (phoneMatch) {
      phone = phoneMatch[0].replace(/[\s-]/g, '');
    }
    const msgMatch = text.match(/(?:saying|message|text|that)\s+(.+)$/i);
    if (msgMatch) {
      message = msgMatch[1];
    }

    return {
      type: 'whatsapp_automation',
      title: 'WhatsApp Automation & Relay',
      category: 'whatsapp',
      description: 'Instant WhatsApp deep-link dispatch, tactical macros, and automated contact routing.',
      whatsappDetails: {
        phone,
        message: message || 'Greetings from Sir Tharun. Tactical communication link established.',
      },
    };
  }

  // 0. Camera, Live Camera, Face Recognition, Hand Recognition, Image 3D Model, Permission & Unblock directives
  if (
    lower.includes('camera') ||
    lower.includes('webcam') ||
    lower.includes('live camera') ||
    lower.includes('camera access') ||
    lower.includes('live camera access') ||
    lower.includes('permission denied') ||
    lower.includes('camera access was blocked') ||
    lower.includes('camera was blocked') ||
    lower.includes('camera blocked') ||
    lower.includes('unblock camera') ||
    lower.includes('fix camera') ||
    lower.includes('retry live camera') ||
    lower.includes('solve the problem') ||
    lower.includes('open camera') ||
    lower.includes('start camera') ||
    lower.includes('turn on camera') ||
    lower.includes('video feed') ||
    lower.includes('optical feed') ||
    lower.includes('face recognition') ||
    lower.includes('hand recognition') ||
    lower.includes('recognize face') ||
    lower.includes('recognize hand') ||
    lower.includes('3d model') ||
    lower.includes('convert to 3d') ||
    lower.includes('3d hologram') ||
    lower.includes('optical scanner') ||
    lower.includes('upload photo') ||
    lower.includes('scan photo')
  ) {
    const isPermissionIssue =
      lower.includes('permission') ||
      lower.includes('blocked') ||
      lower.includes('solve the problem') ||
      lower.includes('retry') ||
      lower.includes('allow');

    return {
      type: 'open_camera_3d',
      title: isPermissionIssue
        ? 'Camera Permission Resolver & Optical Telemetry'
        : 'Tharun Optical Scanner & 3D Model Converter',
      category: 'camera_3d',
      description: isPermissionIssue
        ? 'Resolving browser camera permission block: activating Neural Optical Sensor and standalone tab launcher.'
        : 'Engaging live camera access with real-time biometric face detection, hand gesture tracking, and 3D hologram generation.',
    };
  }

  // 1. Laptop & OS System Directives: Shutdown, Restart, Sleep/Lock, Battery
  // Shutdown Laptop
  if (
    lower.includes('shutdown') ||
    lower.includes('shut down') ||
    lower.includes('power off') ||
    lower.includes('turn off my laptop') ||
    lower.includes('power off laptop') ||
    lower.includes('turn off computer') ||
    lower.includes('power down laptop') ||
    lower.includes('close laptop') ||
    lower.includes('kill system') ||
    lower.includes('halt laptop')
  ) {
    return {
      type: 'system_control',
      title: 'Initiate Laptop System Shutdown',
      category: 'system',
      systemAction: 'shutdown',
      osCommands: {
        windows: 'shutdown /s /t 0',
        mac: 'sudo shutdown -h now',
        linux: 'sudo poweroff',
      },
      description: 'Web applications run in an isolated sandbox. Use the one-click copy terminal command or script below to trigger native hardware shutdown.',
    };
  }

  // Restart / Reboot Laptop
  if (
    lower.includes('restart laptop') ||
    lower.includes('reboot laptop') ||
    lower.includes('restart my computer') ||
    lower.includes('reboot computer') ||
    lower === 'restart' ||
    lower === 'reboot'
  ) {
    return {
      type: 'system_control',
      title: 'Laptop System Reboot',
      category: 'system',
      systemAction: 'restart',
      osCommands: {
        windows: 'shutdown /r /t 0',
        mac: 'sudo shutdown -r now',
        linux: 'sudo reboot',
      },
      description: 'Native reboot command prepared for your operating system terminal.',
    };
  }

  // Sleep / Lock Laptop Screen
  if (
    lower.includes('lock laptop') ||
    lower.includes('lock my screen') ||
    lower.includes('lock screen') ||
    lower.includes('sleep laptop') ||
    lower.includes('put laptop to sleep')
  ) {
    return {
      type: 'system_control',
      title: 'Lock Laptop & Sleep Protocol',
      category: 'system',
      systemAction: 'sleep',
      osCommands: {
        windows: 'rundll32.exe user32.dll,LockWorkStation',
        mac: 'pmset sleepnow',
        linux: 'systemctl suspend',
      },
      description: 'Instant lock sequence prepared for your machine.',
    };
  }

  // Laptop Battery Diagnostics
  if (
    lower.includes('battery') ||
    lower.includes('power status') ||
    lower.includes('check battery') ||
    lower.includes('battery percentage') ||
    lower.includes('charge level')
  ) {
    return {
      type: 'system_control',
      title: 'Laptop Battery Diagnostics Telemetry',
      category: 'system',
      systemAction: 'battery',
      osCommands: {
        windows: 'WMIC Path Win32_Battery Get EstimatedChargeRemaining',
        mac: 'pmset -g batt',
        linux: 'upower -i $(upower -e | grep BAT)',
      },
      description: 'Accessing real-time laptop battery API telemetry.',
    };
  }

  // Fullscreen / HUD Maximizer
  if (
    lower.includes('fullscreen') ||
    lower.includes('maximize screen') ||
    lower.includes('full screen')
  ) {
    return {
      type: 'system_control',
      title: 'Laptop Fullscreen HUD Mode',
      category: 'system',
      systemAction: 'fullscreen',
      description: 'Toggle fullscreen tactical interface on your laptop monitor.',
    };
  }

  // Prevent Sleep / Keep Screen Awake
  if (
    lower.includes('keep screen awake') ||
    lower.includes('wake lock') ||
    lower.includes('prevent sleep') ||
    lower.includes('dont sleep')
  ) {
    return {
      type: 'system_control',
      title: 'Screen Wake Lock Protocol',
      category: 'system',
      systemAction: 'wakelock',
      description: 'Prevents your laptop screen from dimming or falling asleep.',
    };
  }

  // 2. Play song / play music
  const playSongMatch = lower.match(/(?:play\s+(?:the\s+)?(?:song|music|track)\s+|(?:play\s+))(.*)/i);
  const isMusicRequest =
    lower.includes('song') ||
    lower.includes('music') ||
    lower.includes('spotify') ||
    lower.startsWith('play ');

  if (isMusicRequest && playSongMatch && playSongMatch[1]) {
    let query = playSongMatch[1].replace(/on (youtube|spotify|google)/i, '').trim();
    query = query.replace(/[?.!]+$/, '').trim();

    if (query && !query.startsWith('with ') && query !== 'diagnostics') {
      const encoded = encodeURIComponent(query);
      return {
        type: 'play_youtube',
        url: `https://www.youtube.com/results?search_query=${encoded}`,
        title: `Playing "${query}" on YouTube`,
        category: 'music',
        query,
      };
    }
  }

  // 3. Play video / watch video
  const videoMatch = lower.match(/(?:watch|play\s+video)\s+(.*)/i);
  if (videoMatch && videoMatch[1]) {
    let query = videoMatch[1].replace(/on youtube/i, '').replace(/[?.!]+$/, '').trim();
    const encoded = encodeURIComponent(query);
    return {
      type: 'play_youtube',
      url: `https://www.youtube.com/results?search_query=${encoded}`,
      title: `Playing video "${query}" on YouTube`,
      category: 'video',
      query,
    };
  }

  // 4. Direct website opening: "open youtube", "open google", "open github", "open reddit", "go to wikipedia"
  const openMatch = lower.match(/(?:open|launch|navigate to|go to)\s+([a-zA-Z0-9.-]+\.?[a-zA-Z0-9.-]*)(?:\s+(?:website|com|page))?/i);
  
  if (openMatch && openMatch[1]) {
    let target = openMatch[1].replace(/[?.!]+$/, '').trim().toLowerCase();

    const sites: Record<string, { url: string; title: string; category: 'website' | 'video' | 'music' }> = {
      youtube: { url: 'https://www.youtube.com', title: 'YouTube', category: 'video' },
      'youtube.com': { url: 'https://www.youtube.com', title: 'YouTube', category: 'video' },
      google: { url: 'https://www.google.com', title: 'Google', category: 'website' },
      'google.com': { url: 'https://www.google.com', title: 'Google', category: 'website' },
      spotify: { url: 'https://open.spotify.com', title: 'Spotify Web Player', category: 'music' },
      'spotify.com': { url: 'https://open.spotify.com', title: 'Spotify', category: 'music' },
      github: { url: 'https://github.com', title: 'GitHub', category: 'website' },
      'github.com': { url: 'https://github.com', title: 'GitHub', category: 'website' },
      reddit: { url: 'https://www.reddit.com', title: 'Reddit', category: 'website' },
      'reddit.com': { url: 'https://www.reddit.com', title: 'Reddit', category: 'website' },
      wikipedia: { url: 'https://www.wikipedia.org', title: 'Wikipedia', category: 'website' },
      'wikipedia.org': { url: 'https://www.wikipedia.org', title: 'Wikipedia', category: 'website' },
      twitter: { url: 'https://x.com', title: 'X (Twitter)', category: 'website' },
      x: { url: 'https://x.com', title: 'X', category: 'website' },
      netflix: { url: 'https://www.netflix.com', title: 'Netflix', category: 'video' },
      soundcloud: { url: 'https://soundcloud.com', title: 'SoundCloud', category: 'music' },
      chatgpt: { url: 'https://chatgpt.com', title: 'ChatGPT', category: 'website' },
    };

    if (sites[target]) {
      return {
        type: 'open_url',
        url: sites[target].url,
        title: sites[target].title,
        category: sites[target].category,
      };
    }

    if (target.includes('.')) {
      const fullUrl = target.startsWith('http') ? target : `https://${target}`;
      return {
        type: 'open_url',
        url: fullUrl,
        title: target,
        category: 'website',
      };
    }
  }

  // 5. Explicit URL in text
  const urlMatch = text.match(/(https?:\/\/[^\s]+|www\.[a-zA-Z0-9.-]+\.[a-z]{2,})/i);
  if (urlMatch) {
    const rawUrl = urlMatch[0];
    const fullUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    return {
      type: 'open_url',
      url: fullUrl,
      title: rawUrl,
      category: 'website',
    };
  }

  // 6. Search request
  const searchMatch = lower.match(/(?:search(?:\s+for)?|google)\s+(.*)/i);
  if (searchMatch && searchMatch[1]) {
    const query = searchMatch[1].replace(/[?.!]+$/, '').trim();
    if (query) {
      return {
        type: 'search_google',
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        title: `Search: "${query}"`,
        category: 'search',
        query,
      };
    }
  }

  return null;
}
