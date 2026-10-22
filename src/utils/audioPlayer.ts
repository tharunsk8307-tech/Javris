/**
 * Audio decoding and playback helper for 24kHz raw PCM or encoded audio from Gemini API.
 * Includes graceful browser SpeechSynthesis fallback when Gemini Cloud TTS quota is exceeded.
 */

let sharedAudioCtx: AudioContext | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioCtx = new AudioCtx({ sampleRate: 24000 });
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

export function stopCurrentAudio() {
  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
      currentSourceNode.disconnect();
    } catch {
      // ignore if already ended
    }
    currentSourceNode = null;
  }

  if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    currentUtterance = null;
  }
}

/**
 * Converts a base64 string (containing either raw PCM 16-bit or audio) to an AudioBuffer.
 * For gemini-3.8-flash-lite-tts / gemini-3.8-flash-tts, returns 24000Hz 1-channel 16-bit linear PCM.
 */
export async function playPcmBase64(
  base64Data: string,
  sampleRate = 24000,
  onEnded?: () => void,
  onAudioProcess?: (analyser: AnalyserNode) => void,
  playbackRate = 1.0
): Promise<{ stop: () => void }> {
  stopCurrentAudio();

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  // Convert base64 to binary byte array
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Check if it's a WAV container or raw PCM 16-bit
  let audioBuffer: AudioBuffer;

  const isWav =
    bytes.length > 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WAVE';

  if (isWav) {
    try {
      audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
    } catch {
      audioBuffer = decodeRawPcm(bytes, ctx, sampleRate);
    }
  } else {
    // Gemini TTS returns raw 16-bit linear PCM little-endian at 24kHz
    audioBuffer = decodeRawPcm(bytes, ctx, sampleRate);
  }

  // Set up source node and analyser
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  if (playbackRate && playbackRate > 0) {
    source.playbackRate.value = playbackRate;
  }

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 64;

  source.connect(analyser);
  analyser.connect(ctx.destination);

  currentSourceNode = source;

  if (onAudioProcess) {
    onAudioProcess(analyser);
  }

  source.onended = () => {
    if (currentSourceNode === source) {
      currentSourceNode = null;
    }
    if (onEnded) onEnded();
  };

  source.start(0);

  return {
    stop: () => {
      try {
        source.stop();
      } catch {
        // already stopped
      }
    },
  };
}

let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

/**
 * Fallback to browser SpeechSynthesis API when Cloud TTS quota (429) is temporarily exhausted
 * or when playing non-English world languages that require localized native phonetic engines.
 * Ensures J.A.R.V.I.S. continues speaking seamlessly with visual arc reactor animation.
 */
export function playBrowserTtsFallback(
  text: string,
  voiceCode = 'Puck',
  onEnded?: () => void,
  onAudioLevel?: (level: number) => void,
  langCode?: string,
  playbackRate = 1.0
): { stop: () => void } {
  stopCurrentAudio();

  if (!('speechSynthesis' in window)) {
    if (onEnded) onEnded();
    return { stop: () => {} };
  }

  // Sanitize markup & links from spoken text
  const cleanSpokenText = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*#_`]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .slice(0, 500);

  const utterance = new SpeechSynthesisUtterance(cleanSpokenText);
  currentUtterance = utterance;

  const targetLang = langCode || 'en-US';
  utterance.lang = targetLang;

  // Retrieve cached voices or live list
  const voices = (cachedVoices && cachedVoices.length > 0)
    ? cachedVoices
    : window.speechSynthesis.getVoices();

  const lowerCode = voiceCode.toLowerCase();
  const langPrefix = targetLang.split('-')[0].toLowerCase();
  const fullTargetLang = targetLang.toLowerCase();

  let selectedVoice: SpeechSynthesisVoice | undefined;

  // 1. First, search for exact match on full BCP-47 tag (e.g., 'ta-in', 'hi-in', 'es-es')
  selectedVoice = voices.find((v) => v.lang.toLowerCase().replace('_', '-') === fullTargetLang);

  // 2. Second, search for prefix match (e.g., starts with 'ta' or 'hi')
  if (!selectedVoice) {
    selectedVoice = voices.find((v) => {
      const vLang = v.lang.toLowerCase().replace('_', '-');
      return vLang.startsWith(langPrefix + '-') || vLang.startsWith(langPrefix);
    });
  }

  // 3. If English, customize persona voice style (British / Daniel / George / Samantha)
  if (langPrefix === 'en') {
    const personaVoice = voices.find((v) => {
      const vName = v.name.toLowerCase();
      if (lowerCode === 'kore' || lowerCode === 'zephyr') {
        return vName.includes('female') || vName.includes('samantha') || vName.includes('victoria') || vName.includes('zira');
      }
      return vName.includes('british') || vName.includes('uk english') || vName.includes('daniel') || vName.includes('male') || vName.includes('george');
    });
    if (personaVoice) {
      selectedVoice = personaVoice;
    } else if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
    }
  }

  // Only assign utterance.voice if a voice was found for that specific language!
  // If no matching voice object was found in the list, DO NOT force an English voice on other languages!
  // Setting utterance.lang ensures the browser's native localized TTS synthesizer handles pronunciation.
  if (selectedVoice && (langPrefix === 'en' || selectedVoice.lang.toLowerCase().startsWith(langPrefix))) {
    utterance.voice = selectedVoice;
  }

  utterance.rate = playbackRate || 1.0;
  utterance.pitch = lowerCode === 'fenrir' || lowerCode === 'charon' ? 0.9 : 1.0;

  // Animate arc reactor pulsing during speech
  let animTimer: any = null;
  if (onAudioLevel) {
    animTimer = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        onAudioLevel(0.3 + Math.random() * 0.45);
      } else {
        onAudioLevel(0);
        clearInterval(animTimer);
      }
    }, 100);
  }

  utterance.onend = () => {
    if (animTimer) clearInterval(animTimer);
    if (onAudioLevel) onAudioLevel(0);
    currentUtterance = null;
    if (onEnded) onEnded();
  };

  utterance.onerror = () => {
    if (animTimer) clearInterval(animTimer);
    if (onAudioLevel) onAudioLevel(0);
    currentUtterance = null;
    if (onEnded) onEnded();
  };

  window.speechSynthesis.speak(utterance);

  return {
    stop: () => {
      if (animTimer) clearInterval(animTimer);
      if (onAudioLevel) onAudioLevel(0);
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      currentUtterance = null;
    },
  };
}

function decodeRawPcm(bytes: Uint8Array, ctx: AudioContext, sampleRate: number): AudioBuffer {
  // 16-bit samples = 2 bytes per sample
  const numSamples = Math.floor(bytes.length / 2);
  const audioBuffer = ctx.createBuffer(1, numSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i < numSamples; i++) {
    // signed 16-bit integer, little-endian
    const int16 = dataView.getInt16(i * 2, true);
    // normalize to -1.0 .. +1.0
    channelData[i] = int16 < 0 ? int16 / 32768 : int16 / 32767;
  }

  return audioBuffer;
}
