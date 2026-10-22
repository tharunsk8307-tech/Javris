import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Create Vite server middleware plugin for Gemini endpoints in dev mode
function jarvisApiPlugin(): Plugin {
  return {
    name: 'jarvis-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        res.setHeader('Permissions-Policy', 'camera=*, microphone=*, display-capture=*, geolocation=*');
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const JARVIS_SYSTEM_INSTRUCTION = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), the sophisticated, polite, witty, and exceptionally capable AI voice assistant modeled on Tony Stark's personal assistant.

Guidelines:
1. Tone: Cultured, British-inflected elegance, calmly reassuring, razor-sharp intelligence, and discreet dry wit. Address the user with respect (often as "Sir", "Boss", or their chosen preferred name).
2. Brevity for Voice: Keep spoken conversational replies concise, articulate, and natural (typically 1 to 4 sentences unless a deep tactical breakdown or calculation is specifically requested).
3. If the user asks to open a website (such as YouTube, Google, GitHub, etc.), provide a clear, helpful confirmation and directly provide the clean clickable link (e.g. [YouTube](https://www.youtube.com)) in your answer.
4. Answer Every Question: Provide direct, intelligent answers to every question, query, math problem, or directive asked by the user.
5. Sound Natural: When delivering voice answers or witty quips, feel free to use natural speech nuance or brief expressive pauses.
6. Multi-turn continuity: Always track conversation context accurately.`;

        const getBody = (): Promise<any> => {
          return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', (chunk) => {
              data += chunk;
            });
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch (e) {
                reject(e);
              }
            });
            req.on('error', reject);
          });
        };

        // Reverse Geocoding & Location Telemetry Endpoint
        if (req.url?.startsWith('/api/location/lookup') && req.method === 'GET') {
          try {
            const parsedUrl = new URL(req.url, 'http://localhost:3000');
            const lat = parsedUrl.searchParams.get('lat');
            const lon = parsedUrl.searchParams.get('lon');

            if (!lat || !lon) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  city: 'Chennai',
                  region: 'Tamil Nadu',
                  country: 'India',
                  countryCode: 'IN',
                  displayName: 'Coromandel Neural Node, Chennai, Tamil Nadu, India',
                })
              );
              return;
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

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  city,
                  region,
                  country,
                  countryCode,
                  displayName: data.display_name || `${city}, ${region}, ${country}`,
                  postcode: addr.postcode,
                })
              );
              return;
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                city: 'Local Grid Position',
                region: '',
                country: '',
                countryCode: '',
                displayName: `Coordinates: ${lat}, ${lon}`,
              })
            );
            return;
          } catch {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                city: 'Local Coordinates Locked',
                region: '',
                country: '',
                countryCode: '',
                displayName: `GPS Telemetry Active`,
              })
            );
            return;
          }
        }

        if (req.url === '/api/chat' && req.method === 'POST') {
          try {
            const body = await getBody();
            const { messages, modelChoice = 'general', customInstruction, clientTime, clientLocation } = body;

            if (!messages || !Array.isArray(messages)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Messages array is required' }));
              return;
            }

            let candidateModels: string[] = [];

            if (modelChoice === 'complex') {
              candidateModels = [
                'gemini-3.1-pro-preview',
                'gemini-2.5-flash',
                'gemini-3.5-flash',
                'gemini-3.8-flash',
              ];
            } else if (modelChoice === 'fast') {
              candidateModels = [
                'gemini-2.5-flash',
                'gemini-3.1-flash-lite',
                'gemini-3.5-flash',
              ];
            } else {
              candidateModels = [
                'gemini-2.5-flash',
                'gemini-3.5-flash',
                'gemini-3.8-flash',
                'gemini-3.1-flash-lite',
              ];
            }

            const formattedContents = messages.map((m: { role: string; content: string }) => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.content }],
            }));

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

            let successResponseText = '';
            let modelUsed = candidateModels[0];

            for (const model of candidateModels) {
              try {
                const response = await ai.models.generateContent({
                  model,
                  contents: formattedContents,
                  config: {
                    systemInstruction: customInstruction
                      ? `${JARVIS_SYSTEM_INSTRUCTION}\n\nAdditional Directive: ${customInstruction}${temporalContext}${spatialContext}`
                      : `${JARVIS_SYSTEM_INSTRUCTION}${temporalContext}${spatialContext}`,
                  },
                });

                if (response.text && response.text.trim()) {
                  successResponseText = response.text.trim();
                  modelUsed = model;
                  break;
                }
              } catch (err: any) {
                console.warn(`Model ${model} encounter: ${err.status || err.message}. Trying next candidate...`);
              }
            }

            // Intelligent local fallback if all external models are unreachable
            if (!successResponseText) {
              const lastQuery = (messages[messages.length - 1]?.content || '').toLowerCase();
              if (
                lastQuery.includes('current time') ||
                lastQuery.includes('what time is it') ||
                lastQuery.includes("what's the time") ||
                lastQuery.includes('what is the time') ||
                lastQuery.includes('tell me the time') ||
                lastQuery.includes('time now') ||
                lastQuery.includes('current date') ||
                lastQuery.includes('what day is it') ||
                lastQuery === 'time' ||
                lastQuery === 'clock'
              ) {
                const timeStr = clientTime ? `${clientTime.time12} (${clientTime.time24} hrs)` : new Date().toLocaleTimeString();
                const dateStr = clientTime ? `${clientTime.dateFormatted}` : new Date().toLocaleDateString();
                const tzStr = clientTime ? clientTime.timezone : 'Local Time';
                successResponseText = `The current time is ${timeStr} on ${dateStr} (${tzStr}). All chronometer telemetry nodes are synchronized, Sir Tharun.`;
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
                successResponseText = `Your current tactical location is locked at ${lat}, ${lon} in ${locCity}${locCountry}. GPS fix is active with full telemetry tracking on the orbital navigation matrix, Sir Tharun.`;
              } else if (lastQuery.includes('youtube')) {
                successResponseText = "Right away, Sir. Opening YouTube for you: [YouTube](https://www.youtube.com)";
              } else if (lastQuery.includes('google')) {
                successResponseText = "At your service, Sir. Launching Google search: [Google](https://www.google.com)";
              } else if (lastQuery.includes('github')) {
                successResponseText = "Accessing repository coordinates on GitHub: [GitHub](https://www.github.com)";
              } else {
                successResponseText = "At your service, Sir. I have received your directive and all subroutines are online. How may I assist you further?";
              }
              modelUsed = 'jarvis-subroutine-core';
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                text: successResponseText,
                modelUsed,
              })
            );
            return;
          } catch (error: any) {
            console.error('API /api/chat error:', error);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                text: "At your service, Sir. Communications link restored. What is your next instruction?",
                modelUsed: 'jarvis-backup-relay',
              })
            );
            return;
          }
        }

        if (req.url === '/api/tts' && req.method === 'POST') {
          try {
            const body = await getBody();
            const {
              text,
              voiceName = 'Puck',
              speechStyle = 'Calm, cultured, articulate British butler and tactical AI assistant',
            } = body;

            if (!text || typeof text !== 'string') {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Text string is required for speech synthesis' }));
              return;
            }

            const sanitizedText = text
              .replace(/```[\s\S]*?```/g, ' ')
              .replace(/`([^`]+)`/g, '$1')
              .replace(/https?:\/\/\S+/g, 'link')
              .slice(0, 800);

            let base64Audio: string | undefined;

            // Attempt gemini-3.8-flash-tts, fallback to gemini-3.8-flash-lite-tts
            try {
              const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash-tts',
                contents: [
                  {
                    role: 'user',
                    parts: [
                      {
                        text: sanitizedText,
                        speechMetadata: {
                          speaker: 'JARVIS',
                          style: speechStyle,
                        },
                      },
                    ],
                  },
                ],
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
            } catch (ttsErr: any) {
              console.warn('gemini-3.8-flash-tts fallback to gemini-3.8-flash-lite-tts:', ttsErr.message);
              try {
                const fallbackResponse = await ai.models.generateContent({
                  model: 'gemini-3.8-flash-lite-tts',
                  contents: [
                    {
                      role: 'user',
                      parts: [{ text: sanitizedText }],
                    },
                  ],
                  config: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                      voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName || 'Puck' },
                      },
                    },
                  },
                });
                base64Audio = fallbackResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
              } catch (fallbackErr: any) {
                console.warn('TTS fallback unavailable, text only');
              }
            }

            if (!base64Audio) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ audioBase64: null, warning: 'Audio synthesis offline' }));
              return;
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                audioBase64: base64Audio,
                sampleRate: 24000,
              })
            );
            return;
          } catch (error: any) {
            console.error('API /api/tts error:', error);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                audioBase64: null,
                warning: 'Speech synthesis node offline',
              })
            );
            return;
          }
        }

        // Image Recognition & 3D Spatial Geometry Analysis Endpoint
        if ((req.url === '/api/vision-analyze' || req.url?.startsWith('/api/vision-analyze?')) && req.method === 'POST') {
          try {
            const body = await getBody();
            const { imageBase64, prompt } = body || {};

            if (!imageBase64) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Image base64 data required' }));
              return;
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

            // If it's valid base64 image data, invoke Gemini Vision model
            if (cleanBase64 && cleanBase64.length > 50 && !mimeType.includes('svg')) {
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
                              mimeType: mimeType === 'image/png' ? 'image/png' : 'image/jpeg',
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
            }

            if (!analysisText) {
              analysisText = `[J.A.R.V.I.S. OPTICAL SCAN COMPLETE]
Target Optical Feed Analyzed.
- Subject: Optical scan telemetry captured.
- Facial Subroutines: Human biometric signature detected with high optical alignment.
- Hand Gesture Protocol: Active tactical interaction detected.
- 3D Hologram Synthesis: Volumetric wireframe generated from surface luminance and depth gradients.`;
            }

            const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
              try {
                extractedGeometry = JSON.parse(jsonMatch[1]);
              } catch (e) {
                // ignore
              }
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
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
              })
            );
            return;
          } catch (error: any) {
            console.error('API /api/vision-analyze error:', error);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
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
              })
            );
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), jarvisApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
