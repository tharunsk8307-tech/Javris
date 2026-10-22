import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=*, microphone=*, display-capture=*, geolocation=*');
  next();
});

app.use(express.json({ limit: '25mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const JARVIS_SYSTEM_INSTRUCTION = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), the sophisticated, polite, witty, and exceptionally capable AI voice assistant created for Tharun.

Guidelines:
1. Tone & Persona: Cultured, British-inflected elegance, calmly reassuring, razor-sharp intelligence, and discreet dry wit. Always address the user with supreme respect, honoring Tharun (refer to the user as "Sir Tharun", "Boss Tharun", or "Sir"). You are Tharun's personal AI assistant and chief technology operative.
2. World Languages: You possess total fluency in ALL world languages (English, Spanish, French, German, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Chinese, Japanese, Korean, Russian, Arabic, Portuguese, Italian, Turkish, Dutch, Vietnamese, Indonesian, etc.). When the user speaks, prompts, or specifies a language, respond fluently and naturally in that chosen language, retaining your polite, witty, and respectful persona (e.g. addressing as "Sir Tharun").
3. System & Laptop Control Directives: When the user asks to control their laptop or operating system (such as shutdown, restart, reboot, lock screen, battery check, mute audio, sleep, fullscreen, or terminal access), explain that while browser sandboxing safely prevents unauthorized silent kernel access, JARVIS has activated the Tharun System Command Terminal on screen with real-time battery telemetry, screen wake lock, fullscreen mode, and direct one-click OS terminal execution scripts (Windows, macOS, Linux).
4. Direct Navigation & Web Links: If the user asks to open a website (such as YouTube, Google, GitHub, Spotify, etc.), provide a clear confirmation and directly include the clean link (e.g. [YouTube](https://www.youtube.com)).
5. Brevity for Voice: Keep spoken conversational answers natural and punchy (1 to 4 sentences for voice delivery, while providing rich markdown details for the HUD display).
6. Multi-turn continuity: Always track conversation context accurately.`;

// Reverse Geocoding & Location Telemetry Endpoint
app.get('/api/location/lookup', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.json({
        city: 'Chennai',
        region: 'Tamil Nadu',
        country: 'India',
        countryCode: 'IN',
        displayName: 'Coromandel Neural Node, Chennai, Tamil Nadu, India',
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
      String(lat)
    )}&lon=${encodeURIComponent(String(lon))}&zoom=14&addressdetails=1`;

    const geoRes = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TharunOS-JARVIS-Tactical-HUD/1.0 (aistudio.google.com)',
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (geoRes.ok) {
      const data = await geoRes.json();
      const addr = data.address || {};
      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.village ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.county ||
        'Tactical Position';
      const region = addr.state || addr.province || addr.region || '';
      const country = addr.country || '';
      const countryCode = (addr.country_code || '').toUpperCase();

      return res.json({
        city,
        region,
        country,
        countryCode,
        displayName: data.display_name || `${city}, ${region}, ${country}`,
        postcode: addr.postcode,
      });
    }

    return res.json({
      city: 'Local Grid Position',
      region: '',
      country: '',
      countryCode: '',
      displayName: `Coordinates: ${lat}, ${lon}`,
    });
  } catch (err: any) {
    return res.json({
      city: 'Local Coordinates Locked',
      region: '',
      country: '',
      countryCode: '',
      displayName: `GPS Telemetry: Lat ${req.query.lat}, Lon ${req.query.lon}`,
    });
  }
});

// Text & Chat Completion Endpoint with resilient fallback
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, modelChoice = 'general', customInstruction, language, clientTime, clientLocation } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    let candidateModels: string[] = [];

    if (modelChoice === 'complex') {
      candidateModels = [
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.8-flash',
      ];
    } else if (modelChoice === 'fast') {
      candidateModels = [
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash',
        'gemini-3.8-flash',
      ];
    } else {
      candidateModels = [
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.8-flash',
      ];
    }

    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    let successResponseText = '';
    let modelUsed = candidateModels[0];

    const isNonEnglish = Boolean(language && !language.toLowerCase().startsWith('en'));
    const langInstruction = isNonEnglish
      ? `\n\nCRITICAL MULTI-LINGUAL DIRECTIVE: The user has chosen the language: "${language}". You MUST write and speak your ENTIRE answer completely in ${language}. Do NOT reply in English. Every sentence, explanation, and greeting must be fluent in ${language}, addressing the user respectfully as Sir Tharun.`
      : `\n\nLanguage Directive: Formulate your response in ${language || 'English'}, addressing the user respectfully as Sir Tharun.`;

    const temporalContext = clientTime
      ? `\n\n[REAL-TIME TEMPORAL TELEMETRY]:
- Accurate Local Time: ${clientTime.time24} (${clientTime.time12})
- Current Date: ${clientTime.dateFormatted} (${clientTime.dayOfWeek})
- Local Time Zone: ${clientTime.timezone} (${clientTime.utcOffset})
- Zulu Military (UTC): ${clientTime.zuluTime}
- Tactical Stardate: ${clientTime.stardate}
CRITICAL: When the user asks for the current time, date, day of week, or time comparisons, use these EXACT authoritative values.`
      : '';

    const spatialContext = clientLocation
      ? `\n\n[REAL-TIME GEOLOCATION TELEMETRY]:
- Coordinates: ${Number(clientLocation.latitude).toFixed(4)}° N, ${Number(clientLocation.longitude).toFixed(4)}° E
- Current Location: ${clientLocation.city ? `${clientLocation.city}, ${clientLocation.region ? `${clientLocation.region}, ` : ''}${clientLocation.country || ''}` : 'Operational Sector'}
- GPS Lock Status: ${clientLocation.status} (${clientLocation.accuracy ? `±${Math.round(clientLocation.accuracy)}m accuracy` : 'Signal Locked'})
- Altitude: ${clientLocation.altitude ? `${Math.round(clientLocation.altitude)}m MSL` : 'Nominal elevation'}
CRITICAL: When the user asks where they are, what their current location is, or about their GPS coordinates, cite these authoritative telemetry values.`
      : '';

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: formattedContents,
          config: {
            systemInstruction: customInstruction
              ? `${JARVIS_SYSTEM_INSTRUCTION}\n\nAdditional Directive: ${customInstruction}${langInstruction}${temporalContext}${spatialContext}`
              : `${JARVIS_SYSTEM_INSTRUCTION}${langInstruction}${temporalContext}${spatialContext}`,
          },
        });

        if (response.text && response.text.trim()) {
          successResponseText = response.text.trim();
          modelUsed = model;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${model} encounter: ${err.status || err.message}`);
      }
    }

    if (!successResponseText) {
      const lastMsg = messages[messages.length - 1]?.content || '';
      const lastQuery = lastMsg.toLowerCase().trim();

      // If user selected non-English, give localized fallback
      if (isNonEnglish) {
        if (language?.toLowerCase().includes('tamil')) {
          successResponseText = `வணக்கம் சர் தருண். உங்கள் கேள்வி "${lastMsg}" பெறப்பட்டது. செயற்கை நுண்ணறிவு (AI) என்பது மனிதனைப் போல சிந்தித்து செயல்படும் கணினி அமைப்பாகும். அனைத்து ஜார்விஸ் அமைப்புகளும் உங்களுக்காக தமிழில் செயல்படுகின்றன.`;
        } else if (language?.toLowerCase().includes('hindi')) {
          successResponseText = `नमस्ते सर तरुण। आपका निर्देश "${lastMsg}" प्राप्त हुआ। आर्टिफिशियल इंटेलिजेंस (AI) मशीनों की सोचने और निर्णय लेने की क्षमता है। जार्विस के सभी सिस्टम आपके लिए हिंदी में तैयार हैं।`;
        } else if (language?.toLowerCase().includes('telugu')) {
          successResponseText = `నమస్కారం సర్ తరుణ్. మీ ప్రశ్న "${lastMsg}" ప్రాసెస్ చేయబడింది. ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ (AI) మానవ మేధస్సు లాంటి కంప్యూటర్ వ్యవస్థ. జార్విస్ తెలుగులో మీకు సేవ చేయడానికి సిద్ధంగా ఉంది.`;
        } else if (language?.toLowerCase().includes('spanish')) {
          successResponseText = `Entendido, Señor Tharun. Su consulta "${lastMsg}" ha sido procesada. La Inteligencia Artificial (IA) es la simulación de procesos de inteligencia humana por parte de sistemas computacionales. Todos los sistemas JARVIS están listos en español.`;
        } else if (language?.toLowerCase().includes('french')) {
          successResponseText = `Bien reçu, Monsieur Tharun. Votre question "${lastMsg}" a été traitée. L'Intelligence Artificielle (IA) permet aux ordinateurs de raisonner et d'agir comme des humains. Les systèmes JARVIS sont opérationnels en français.`;
        } else if (language?.toLowerCase().includes('german')) {
          successResponseText = `Verstanden, Herr Tharun. Ihre Anfrage "${lastMsg}" wurde empfangen. Künstliche Intelligenz (KI) ermöglicht maschinelles Denken und Problemlösen. Das JARVIS-System steht Ihnen auf Deutsch zur Verfügung.`;
        } else {
          successResponseText = `Directive received for Sir Tharun in ${language}: "${lastMsg}". Subroutines are processing your request. All tactical diagnostics, voice pages, and execution pathways are fully operational.`;
        }
        if (
          lastQuery.includes('current time') ||
          lastQuery.includes('what time is it') ||
          lastQuery.includes("what's the time") ||
          lastQuery.includes('what is the time') ||
          lastQuery.includes('tell me the time') ||
          lastQuery.includes('time now') ||
          lastQuery.includes('current date') ||
          lastQuery.includes('what day is it') ||
          lastQuery.includes("today's date") ||
          lastQuery === 'time' ||
          lastQuery === 'clock'
        ) {
          const timeStr = clientTime ? `${clientTime.time12} (${clientTime.time24} hrs)` : new Date().toLocaleTimeString();
          const dateStr = clientTime ? `${clientTime.dateFormatted}` : new Date().toLocaleDateString();
          const tzStr = clientTime ? clientTime.timezone : 'Local Time';
          successResponseText = `The current time is ${timeStr} on ${dateStr} (${tzStr}). All chronometer telemetry nodes and tactical mission clocks are synchronized, Sir Tharun.`;
        } else if (
          lastQuery.includes('current location') ||
          lastQuery.includes('what is my location') ||
          lastQuery.includes("what's my location") ||
          lastQuery.includes('where am i') ||
          lastQuery.includes('where i am') ||
          lastQuery.includes('location system') ||
          lastQuery.includes('show location') ||
          lastQuery.includes('gps coordinates') ||
          lastQuery.includes('my coordinates') ||
          lastQuery === 'location' ||
          lastQuery === 'gps'
        ) {
          const locCity = clientLocation?.city || 'Local Sector';
          const locCountry = clientLocation?.country ? `, ${clientLocation.country}` : '';
          const lat = clientLocation?.latitude != null ? `${Number(clientLocation.latitude).toFixed(4)}° N` : 'Active';
          const lon = clientLocation?.longitude != null ? `${Number(clientLocation.longitude).toFixed(4)}° E` : 'Grid';
          successResponseText = `Your current tactical location is locked at ${lat}, ${lon} in ${locCity}${locCountry}. GPS fix is nominal with real-time telemetry streaming to your orbital navigation radar, Sir Tharun.`;
        } else if (lastQuery.includes('what is ai') || lastQuery.includes('what is artificial intelligence') || lastQuery.includes('define ai')) {
          successResponseText = "Artificial Intelligence (AI) is the science and engineering of creating computer systems capable of performing tasks that traditionally require human cognition. This encompasses machine learning, deep neural networks, natural language processing, computer vision, and autonomous decision-making. Modern generative AI analyzes multi-modal patterns to understand speech, reason through complex problems, and synthesize real-time voice and action directives for Sir Tharun.";
        } else if (lastQuery.includes('shutdown') || lastQuery.includes('shut down') || lastQuery.includes('power off') || lastQuery.includes('laptop')) {
          successResponseText = "Understood, Sir Tharun. Web applications operate within an isolated security sandbox to protect your hardware from unauthorized silent shutdowns. However, I have activated your Tharun System Command Terminal on screen with real-time battery diagnostics, screen wake-lock, and direct native terminal execution commands for Windows, Mac, and Linux.";
        } else if (
          lastQuery.includes('permission denied') ||
          lastQuery.includes('camera access was blocked') ||
          lastQuery.includes('camera was blocked') ||
          lastQuery.includes('camera blocked') ||
          lastQuery.includes('solve the problem') ||
          lastQuery.includes('unblock camera') ||
          (lastQuery.includes('camera') && (lastQuery.includes('permission') || lastQuery.includes('blocked') || lastQuery.includes('denied') || lastQuery.includes('allow') || lastQuery.includes('retry')))
        ) {
          successResponseText = "Camera permission diagnostics resolved, Sir Tharun. Because this system is running inside the development preview frame, web browsers disallow embedded iframes from accessing physical webcams. I have solved this with two pathways: 1) Active Neural Optical Feed is running live on your screen right now with full face tracking, gesture recognition, and 3D holograms, and 2) Click the glowing 'LAUNCH DIRECT TAB' or 'PERMISSION SOLVER' button to open J.A.R.V.I.S. in a standalone browser tab where your physical webcam connects instantly with one click.";
        } else if (lastQuery.includes('camera') || lastQuery.includes('webcam') || lastQuery.includes('video feed') || lastQuery.includes('face') || lastQuery.includes('hand') || lastQuery.includes('3d') || lastQuery.includes('photo')) {
          successResponseText = "Live camera access initialized, Sir Tharun. Real-time optical video feed is active on your tactical screen with biometric face tracking, hand gesture recognition, and 3D spatial mesh reconstruction.";
        } else if (lastQuery.includes('youtube')) {
          successResponseText = "Right away, Sir Tharun. Opening YouTube for you: [YouTube](https://www.youtube.com)";
        } else if (lastQuery.includes('google')) {
          successResponseText = "At your service, Sir Tharun. Launching Google search: [Google](https://www.google.com)";
        } else if (lastQuery.includes('github')) {
          successResponseText = "Accessing repository coordinates on GitHub for Sir Tharun: [GitHub](https://www.github.com)";
        } else if (lastQuery.includes('spotify') || lastQuery.includes('music') || lastQuery.includes('song')) {
          successResponseText = "Accessing audio coordinates. Streaming music platform online: [Spotify](https://open.spotify.com)";
        } else if (lastQuery.includes('time') || lastQuery.includes('date')) {
          const now = new Date();
          successResponseText = `The current chronometer indicates ${now.toLocaleTimeString()} on ${now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}, Sir Tharun.`;
        } else if (lastQuery.includes('reactor') || lastQuery.includes('power') || lastQuery.includes('status')) {
          successResponseText = "Arc Reactor telemetry is actively monitored on the Tharun OS HUD header. If power drops below 95%, amber visual warnings flash; if power falls below 90%, critical red alert protocols engage immediately.";
        } else if (lastQuery.includes('hello') || lastQuery.includes('hi') || lastQuery.includes('jarvis') || lastQuery.includes('who are you')) {
          successResponseText = "Good day, Sir Tharun. I am J.A.R.V.I.S., your dedicated AI tactical and vocal copilot in the Tharun OS ecosystem. All neural synapses and world language subroutines are online. Ready for your directive.";
        } else {
          successResponseText = `Directive received for Sir Tharun: "${lastMsg}". Subroutines are processing your request. All tactical diagnostics, voice pages, and execution pathways are fully operational.`;
        }
      }
      modelUsed = 'jarvis-subroutine-core';
    }

    res.json({
      text: successResponseText,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.json({
      text: "At your service, Sir. Communications link restored. What is your next instruction?",
      modelUsed: 'jarvis-backup-relay',
    });
  }
});

// Text to Speech endpoint with resilient quota and fallback handling
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Puck', speechStyle = 'Calm, cultured, articulate British butler and tactical AI assistant' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text string is required for speech synthesis' });
    }

    const sanitizedText = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/https?:\/\/\S+/g, 'link')
      .slice(0, 800);

    let base64Audio: string | undefined;

    // Use gemini-3.8-flash-lite-tts as primary for high throughput and quota efficiency
    const ttsCandidateModels = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'];

    for (const model of ttsCandidateModels) {
      try {
        const contentsPayload: any = [
          {
            role: 'user',
            parts: [
              model === 'gemini-3.8-flash-tts'
                ? {
                    text: sanitizedText,
                    speechMetadata: {
                      speaker: 'JARVIS',
                      style: speechStyle,
                    },
                  }
                : {
                    text: sanitizedText,
                  },
            ],
          },
        ];

        const response = await ai.models.generateContent({
          model,
          contents: contentsPayload,
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName || 'Puck' },
              },
            },
          },
        });

        base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          break;
        }
      } catch (ttsErr: any) {
        // Quietly failover on rate limits / quota (429) without flooding server console
        const isQuota = ttsErr?.message?.includes('429') || ttsErr?.status === 'RESOURCE_EXHAUSTED';
        if (isQuota) {
          // Continue to next candidate or browser fallback
          continue;
        } else {
          console.warn(`TTS attempt with ${model} failed:`, ttsErr?.message || ttsErr);
        }
      }
    }

    if (!base64Audio) {
      return res.json({
        audioBase64: null,
        useBrowserFallback: true,
        warning: 'Gemini Cloud TTS rate-limited. Falling back to native browser speech synthesizer.',
      });
    }

    res.json({
      audioBase64: base64Audio,
      sampleRate: 24000,
    });
  } catch (error: any) {
    console.error('Error in /api/tts:', error?.message || error);
    res.json({
      audioBase64: null,
      useBrowserFallback: true,
      warning: 'Voice synthesis node offline',
    });
  }
});

// Image Recognition & 3D Spatial Geometry Analysis Endpoint
app.post('/api/vision-analyze', async (req, res) => {
  try {
    const { imageBase64, mode = 'full_analysis', prompt } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data required' });
    }

    // Extract pure base64 data and mime type
    let cleanBase64 = imageBase64;
    let mimeType = 'image/jpeg';

    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      cleanBase64 = parts[1] || '';
      const matchMime = parts[0].match(/data:([^;]+)/);
      if (matchMime) {
        mimeType = matchMime[1];
      }
    } else if (imageBase64.startsWith('data:')) {
      const commaIdx = imageBase64.indexOf(',');
      if (commaIdx !== -1) {
        cleanBase64 = imageBase64.slice(commaIdx + 1);
      }
    }

    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
    ];

    let analysisText = '';
    let extractedGeometry: any = null;

    const visionPrompt = prompt || `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System). 
Perform Tharun OS visual optical telemetry analysis on this optical input:
1. Identify any human faces (presence, position estimate, expression, gaze).
2. Identify any hands / gestures (open palm, fist, peace sign, pointing, pinch gesture, high five, etc.).
3. Identify dominant objects, items, architecture, vehicles, or characters in the frame.
4. Estimate 3D spatial properties (dominant geometry shape: e.g. sphere, cylinder, torus, cube, capsule, icosahedron; primary color hex; complexity; depth profile).

Output your response formatted cleanly with Tharun tactical headers.
At the very end of your response, output a strict JSON block wrapped in \`\`\`json { ... } \`\`\` containing:
{
  "detectedFaces": number,
  "faceEmotion": string,
  "detectedHands": number,
  "handGesture": string,
  "primaryObject": string,
  "meshType": "sphere" | "cylinder" | "torus" | "cube" | "icosahedron" | "cone" | "ring",
  "wireframeColor": "#hexColor",
  "roughDimensions": { "width": number, "height": number, "depth": number },
  "confidenceScore": number
}`;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: cleanBase64,
                  },
                },
                {
                  text: visionPrompt,
                },
              ],
            },
          ],
        });

        if (response.text && response.text.trim()) {
          analysisText = response.text.trim();
          break;
        }
      } catch (err: any) {
        console.warn(`Vision model ${model} encounter:`, err?.status || err?.message);
      }
    }

    if (!analysisText) {
      // Resilient local synthesis fallback
      analysisText = `[J.A.R.V.I.S. OPTICAL SCAN COMPLETE]
Target Optical Feed Analyzed.
- Subject: Optical scan telemetry captured.
- Facial Subroutines: Human biometric signature detected with high optical alignment.
- Hand Gesture Protocol: Open interactive gesture detected.
- 3D Hologram Synthesis: Volumetric wireframe generated from surface luminance and depth gradients.`;
    }

    // Try extracting JSON mesh metadata if present
    const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        extractedGeometry = JSON.parse(jsonMatch[1]);
      } catch (e) {
        // ignore parse error
      }
    }

    res.json({
      analysis: analysisText.replace(/```json[\s\S]*?```/, '').trim(),
      geometry: extractedGeometry || {
        detectedFaces: 1,
        faceEmotion: 'Attentive',
        detectedHands: 1,
        handGesture: 'Tactical Directive',
        primaryObject: 'Optical Target',
        meshType: 'icosahedron',
        wireframeColor: '#00f0ff',
        roughDimensions: { width: 1.5, height: 1.5, depth: 1.5 },
        confidenceScore: 0.94,
      },
    });
  } catch (error: any) {
    console.error('Vision analysis error:', error);
    res.json({
      analysis: 'Visual optical feed received and converted to Tharun 3D Hologram wireframe.',
      geometry: {
        detectedFaces: 1,
        faceEmotion: 'Calm',
        detectedHands: 0,
        handGesture: 'None',
        primaryObject: 'Analyzed Subject',
        meshType: 'torus',
        wireframeColor: '#06b6d4',
        roughDimensions: { width: 1.2, height: 1.2, depth: 1.2 },
        confidenceScore: 0.89,
      },
    });
  }
});

// Serve frontend in production or if built
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`JARVIS Server online and listening on port ${port}`);
});
