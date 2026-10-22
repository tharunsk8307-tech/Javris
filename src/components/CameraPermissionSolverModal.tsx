import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Monitor,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
  Camera,
  Layers,
  ChevronRight,
  Info,
  Sliders,
  Compass,
  Laptop
} from 'lucide-react';

interface CameraPermissionSolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseSimulatedFeed: () => void;
  onStartScreenShare?: () => void;
  onRetryHardwareCamera?: () => void;
}

export const CameraPermissionSolverModal: React.FC<CameraPermissionSolverModalProps> = ({
  isOpen,
  onClose,
  onUseSimulatedFeed,
  onStartScreenShare,
  onRetryHardwareCamera,
}) => {
  const [activeGuideTab, setActiveGuideTab] = useState<'chrome' | 'safari' | 'firefox' | 'edge' | 'mobile'>('chrome');
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'success' | 'blocked' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  const isSecureContext = typeof window !== 'undefined' && window.isSecureContext;

  // Query browser camera permission status
  const checkPermissionState = async () => {
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: 'camera' as any });
        setPermissionState(status.state as any);
        status.onchange = () => {
          setPermissionState(status.state as any);
        };
      } catch (e) {
        // Some browsers (like Safari) don't support { name: 'camera' } in permissions.query
        setPermissionState('unknown');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkPermissionState();
    }
  }, [isOpen]);

  const handleTestCameraAccess = async () => {
    setIsTesting(true);
    setTestResult({ status: 'idle', message: 'Requesting optical video stream from browser...' });

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser context.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      // Stream granted! Stop tracks right away so we don't hold the camera
      stream.getTracks().forEach((track) => track.stop());

      setTestResult({
        status: 'success',
        message: 'Camera permission successfully verified! Hardware optical sensor is accessible.',
      });
      setPermissionState('granted');
      if (onRetryHardwareCamera) {
        onRetryHardwareCamera();
      }
    } catch (err: any) {
      console.warn('Camera test failed:', err);
      let errMsg = err.message || 'Access blocked.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || errMsg.includes('Permission')) {
        if (isInIframe) {
          errMsg = 'Blocked by Browser iFrame Sandbox Policy. Web browsers forbid camera access inside embedded preview frames. Launching in a Direct Tab resolves this immediately.';
        } else {
          errMsg = 'Permission Denied: Camera access is currently set to "Block" in your browser settings.';
        }
        setPermissionState('denied');
        setTestResult({ status: 'blocked', message: errMsg });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setTestResult({ status: 'error', message: 'No physical webcam device detected on your hardware.' });
      } else {
        setTestResult({ status: 'error', message: `Hardware notice: ${errMsg}` });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleOpenDirectTab = () => {
    const directUrl = window.location.origin || window.location.href;
    window.open(directUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative bg-slate-950 border border-cyan-800/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900/90 border-b border-cyan-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Camera className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="hud-font font-bold text-sm tracking-wider text-cyan-200 flex items-center gap-2">
                CAMERA PERMISSION RESOLVER & OPTICAL ASSISTANT
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-600/40 font-mono">
                  THARUN OS
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Fixing browser camera blocks, iframe restrictions, and alternate optical telemetry
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-slate-800 transition-colors"
            title="Close Resolver"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Diagnostic Context Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-800/60 shadow-inner">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-600/60 text-amber-400 shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="hud-font font-bold text-sm text-amber-300">
                  Why was camera access blocked?
                </h4>
                <p className="text-xs font-mono text-slate-300 leading-relaxed">
                  {isInIframe ? (
                    <>
                      You are using J.A.R.V.I.S. inside an <span className="text-cyan-300 font-semibold">embedded development preview frame</span>. 
                      Modern web browsers (Chrome, Edge, Safari) strictly enforce sandboxed security policies that prevent embedded iframes from accessing physical hardware webcams, even if you click Allow on the outer page.
                    </>
                  ) : (
                    <>
                      Your browser has set camera permissions for this domain to <span className="text-rose-300 font-semibold">"Block"</span> or your device lacks an active physical webcam.
                    </>
                  )}
                </p>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-mono">
                  <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                    <span>Environment:</span>
                    <span className={isInIframe ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                      {isInIframe ? "Embedded Preview Frame (iFrame)" : "Direct Window / Standalone"}
                    </span>
                  </span>
                  <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                    <span>Protocol:</span>
                    <span className={isSecureContext ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      {isSecureContext ? "HTTPS (Secure)" : "Insecure (HTTP)"}
                    </span>
                  </span>
                  <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                    <span>Permission State:</span>
                    <span className={
                      permissionState === 'granted'
                        ? 'text-emerald-400 font-bold'
                        : permissionState === 'denied'
                        ? 'text-rose-400 font-bold'
                        : 'text-amber-400 font-bold'
                    }>
                      {permissionState.toUpperCase()}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Instant 1-Click Solutions */}
          <div>
            <h3 className="hud-font font-bold text-xs text-cyan-300 tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              INSTANT 1-CLICK SOLUTIONS (CHOOSE ANY OPTION)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Option 1: Direct Standalone Tab */}
              <div className="p-4 rounded-xl bg-gradient-to-b from-cyan-950/40 to-slate-900 border border-cyan-500/50 hover:border-cyan-400 flex flex-col justify-between transition-all group shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      RECOMMENDED
                    </span>
                    <ExternalLink className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                  <h4 className="hud-font font-bold text-sm text-cyan-200">
                    Open in Standalone Tab
                  </h4>
                  <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
                    Bypasses the preview iframe sandbox completely. Your browser will prompt for camera access normally and connect your real webcam.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenDirectTab}
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs hud-font tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>LAUNCH DIRECT TAB</span>
                </button>
              </div>

              {/* Option 2: Simulated Neural Optical Sensor */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-700/50 hover:border-cyan-500 flex flex-col justify-between transition-all group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      100% OPERATIONAL
                    </span>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="hud-font font-bold text-sm text-emerald-200">
                    Use Neural Optical Feed
                  </h4>
                  <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
                    Zero hardware permissions needed. Full interactive face biometrics, hand gestures, radar tracking, and 3D hologram generation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUseSimulatedFeed();
                    onClose();
                  }}
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-emerald-950 border border-emerald-600/60 hover:border-emerald-500 text-emerald-200 font-mono font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>ENGAGE NEURAL FEED</span>
                </button>
              </div>

              {/* Option 3: Screen / Window Share */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-700/50 hover:border-cyan-500 flex flex-col justify-between transition-all group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      LIVE STREAM
                    </span>
                    <Monitor className="w-4 h-4 text-purple-400" />
                  </div>
                  <h4 className="hud-font font-bold text-sm text-purple-200">
                    Screen / Window Share
                  </h4>
                  <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
                    Stream your desktop, a webcam app window, or browser tab into J.A.R.V.I.S. using display capture, which is allowed in browsers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onStartScreenShare) {
                      onStartScreenShare();
                      onClose();
                    }
                  }}
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-purple-950 border border-purple-600/60 hover:border-purple-500 text-purple-200 font-mono font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Monitor className="w-4 h-4 text-purple-400" />
                  <span>STREAM WINDOW / TAB</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Permission Tester */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono font-semibold text-slate-200 flex items-center gap-2">
                <span>Hardware Webcam Access Diagnostic</span>
                {testResult.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {testResult.status === 'blocked' && <XCircle className="w-4 h-4 text-rose-400" />}
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-1 max-w-lg">
                {testResult.message || 'Click "Test Camera Connection" to trigger a non-destructive hardware stream handshake.'}
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestCameraAccess}
              disabled={isTesting}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-800/80 text-cyan-200 font-mono text-xs flex items-center justify-center gap-2 shrink-0 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'CHECKING...' : 'TEST CAMERA CONNECTION'}</span>
            </button>
          </div>

          {/* Browser-Specific Unblocking Instructions */}
          <div className="space-y-3">
            <h3 className="hud-font font-bold text-xs text-cyan-300 tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              BROWSER-SPECIFIC PERMISSION UNBLOCK GUIDE
            </h3>

            {/* Guide Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-900/90 border border-slate-800 rounded-lg text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveGuideTab('chrome')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  activeGuideTab === 'chrome'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Chrome / Chromium
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideTab('edge')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  activeGuideTab === 'edge'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Microsoft Edge
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideTab('safari')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  activeGuideTab === 'safari'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Safari (Mac / iOS)
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideTab('firefox')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  activeGuideTab === 'firefox'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Firefox
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideTab('mobile')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  activeGuideTab === 'mobile'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Android / Mobile
              </button>
            </div>

            {/* Guide Content */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-300 space-y-3">
              {activeGuideTab === 'chrome' && (
                <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                  <li>
                    Look at the left side of your browser address bar for the <strong className="text-cyan-300">View site information</strong> icon (tune sliders ⚙️ or padlock 🔒).
                  </li>
                  <li>
                    Click the icon and locate <strong className="text-cyan-300">Camera</strong> in the permissions menu.
                  </li>
                  <li>
                    Switch the toggle from <span className="text-rose-400 font-bold">Block</span> to <span className="text-emerald-400 font-bold">Allow</span>.
                  </li>
                  <li>
                    If running inside Google AI Studio, remember that the lock icon configures the outer domain. Click <strong className="text-cyan-300 underline cursor-pointer" onClick={handleOpenDirectTab}>Launch Direct Tab</strong> to open the app directly.
                  </li>
                </ol>
              )}

              {activeGuideTab === 'edge' && (
                <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                  <li>
                    Click the <strong className="text-cyan-300">Lock / Info</strong> icon next to the address URL.
                  </li>
                  <li>
                    Select <strong className="text-cyan-300">Permissions for this site</strong>.
                  </li>
                  <li>
                    Find <strong className="text-cyan-300">Camera</strong> and change the dropdown to <span className="text-emerald-400 font-bold">Allow</span>.
                  </li>
                  <li>
                    Return to this tab and press <strong className="text-cyan-300">Ctrl + R (or Cmd + R)</strong> to reload.
                  </li>
                </ol>
              )}

              {activeGuideTab === 'safari' && (
                <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                  <li>
                    In the macOS top menu, click <strong className="text-cyan-300">Safari</strong> &rarr; <strong className="text-cyan-300">Settings for This Website...</strong>
                  </li>
                  <li>
                    Find <strong className="text-cyan-300">Camera</strong> and set it to <span className="text-emerald-400 font-bold">Allow</span>.
                  </li>
                  <li>
                    Also verify macOS system settings: <strong className="text-cyan-300">System Settings &rarr; Privacy & Security &rarr; Camera</strong> and make sure Safari is checked.
                  </li>
                  <li>
                    Click <strong className="text-cyan-300 underline cursor-pointer" onClick={handleOpenDirectTab}>Launch Direct Tab</strong> if currently in an iframe.
                  </li>
                </ol>
              )}

              {activeGuideTab === 'firefox' && (
                <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                  <li>
                    Click the crossed-out camera icon or permissions shield in the address bar.
                  </li>
                  <li>
                    Click the <strong className="text-rose-400">&times;</strong> next to "Blocked Temporarily" or "Blocked" to clear the restriction.
                  </li>
                  <li>
                    Reload the page and click <strong className="text-emerald-400 font-bold">Allow</strong> when prompted.
                  </li>
                </ol>
              )}

              {activeGuideTab === 'mobile' && (
                <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                  <li>
                    Open your device's <strong className="text-cyan-300">Settings &rarr; Apps &rarr; Chrome / Safari &rarr; Permissions &rarr; Camera</strong>.
                  </li>
                  <li>
                    Ensure camera permission is set to <span className="text-emerald-400 font-bold">Allow only while using the app</span>.
                  </li>
                  <li>
                    In Chrome on Android, tap the three dots &rarr; Settings &rarr; Site settings &rarr; Camera &rarr; remove this domain from Blocked.
                  </li>
                </ol>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3.5 bg-slate-900/90 border-t border-cyan-900/60 gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Virtual Neural Optical Sensor is available at all times with 0 setup.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onUseSimulatedFeed();
                onClose();
              }}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs border border-slate-700 transition-colors cursor-pointer"
            >
              Use Neural Sensor
            </button>
            <button
              type="button"
              onClick={handleOpenDirectTab}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold hud-font text-xs shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Launch Standalone Tab</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
