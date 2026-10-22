import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Camera, Sparkles, Hand, Eye, Shield } from 'lucide-react';

export interface SimulatedCameraFeedHandle {
  captureFrame: () => string;
}

interface SimulatedCameraFeedProps {
  onCaptureFrame?: (dataUrl: string) => void;
  className?: string;
  isCapturing?: boolean;
}

export const SimulatedCameraFeed = forwardRef<SimulatedCameraFeedHandle, SimulatedCameraFeedProps>(
  ({ className = '', isCapturing = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const mousePos = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

    useImperativeHandle(ref, () => ({
      captureFrame: () => {
        if (!canvasRef.current) return '';
        return canvasRef.current.toDataURL('image/jpeg', 0.92);
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let scanY = 0;
      let scanDirection = 1;
      let frameCount = 0;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mousePos.current = {
          x: Math.max(0.1, Math.min(0.9, (e.clientX - rect.left) / rect.width)),
          y: Math.max(0.1, Math.min(0.9, (e.clientY - rect.top) / rect.height)),
        };
      };

      canvas.addEventListener('mousemove', handleMouseMove);

      const render = () => {
        frameCount++;
        const width = canvas.width;
        const height = canvas.height;

        // Background dark gradient
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#020617');
        bgGrad.addColorStop(0.5, '#04101e');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Perspective Grid in Background
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
        ctx.lineWidth = 1;
        const gridSize = 32;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Central Face & Biometric Target
        const targetX = width * (0.45 + mousePos.current.x * 0.1);
        const targetY = height * (0.42 + mousePos.current.y * 0.1);
        const headRadiusX = Math.min(width, height) * 0.22;
        const headRadiusY = Math.min(width, height) * 0.28;

        // Holographic Head Wireframe Silhouette
        ctx.save();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;

        // Head Oval
        ctx.beginPath();
        ctx.ellipse(targetX, targetY, headRadiusX, headRadiusY, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Inner facial contour rings
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(targetX, targetY + headRadiusY * 0.1, headRadiusX * 0.75, headRadiusY * 0.7, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Eye Wireframes & Tracking Dots
        const eyeOffsetX = headRadiusX * 0.38;
        const eyeOffsetY = -headRadiusY * 0.15;
        const eyeSize = headRadiusX * 0.22;

        // Left Eye
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        ctx.ellipse(targetX - eyeOffsetX, targetY + eyeOffsetY, eyeSize, eyeSize * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(targetX - eyeOffsetX + (mousePos.current.x - 0.5) * 6, targetY + eyeOffsetY + (mousePos.current.y - 0.5) * 4, 3, 0, Math.PI * 2);
        ctx.fill();

        // Right Eye
        ctx.beginPath();
        ctx.ellipse(targetX + eyeOffsetX, targetY + eyeOffsetY, eyeSize, eyeSize * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(targetX + eyeOffsetX + (mousePos.current.x - 0.5) * 6, targetY + eyeOffsetY + (mousePos.current.y - 0.5) * 4, 3, 0, Math.PI * 2);
        ctx.fill();

        // Nose Bridge & Mouth
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
        ctx.beginPath();
        ctx.moveTo(targetX, targetY + eyeOffsetY + 8);
        ctx.lineTo(targetX - 4, targetY + headRadiusY * 0.15);
        ctx.lineTo(targetX + 4, targetY + headRadiusY * 0.15);
        ctx.stroke();

        // Mouth arc
        ctx.beginPath();
        ctx.arc(targetX, targetY + headRadiusY * 0.38, headRadiusX * 0.3, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Mesh Vertices on Face
        const vertices = [
          { x: targetX - headRadiusX * 0.6, y: targetY - headRadiusY * 0.6 },
          { x: targetX + headRadiusX * 0.6, y: targetY - headRadiusY * 0.6 },
          { x: targetX, y: targetY - headRadiusY * 0.9 },
          { x: targetX - headRadiusX * 0.8, y: targetY },
          { x: targetX + headRadiusX * 0.8, y: targetY },
          { x: targetX, y: targetY + headRadiusY * 0.85 },
          { x: targetX - headRadiusX * 0.5, y: targetY + headRadiusY * 0.7 },
          { x: targetX + headRadiusX * 0.5, y: targetY + headRadiusY * 0.7 },
        ];

        ctx.fillStyle = '#67e8f9';
        for (const pt of vertices) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Connecting wireframe lines
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        ctx.lineTo(vertices[2].x, vertices[2].y);
        ctx.lineTo(vertices[1].x, vertices[1].y);
        ctx.lineTo(vertices[4].x, vertices[4].y);
        ctx.lineTo(vertices[7].x, vertices[7].y);
        ctx.lineTo(vertices[5].x, vertices[5].y);
        ctx.lineTo(vertices[6].x, vertices[6].y);
        ctx.lineTo(vertices[3].x, vertices[3].y);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();

        // Real-time Sweeping Scanline
        scanY += scanDirection * 2.8;
        if (scanY > height) {
          scanY = height;
          scanDirection = -1;
        } else if (scanY < 0) {
          scanY = 0;
          scanDirection = 1;
        }

        const scanGrad = ctx.createLinearGradient(0, scanY - 24, 0, scanY + 24);
        scanGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
        scanGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.45)');
        scanGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = scanGrad;
        ctx.fillRect(0, scanY - 24, width, 48);

        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(width, scanY);
        ctx.stroke();

        // Biometric Face Bounding Box
        const boxX = targetX - headRadiusX * 1.15;
        const boxY = targetY - headRadiusY * 1.1;
        const boxW = headRadiusX * 2.3;
        const boxH = headRadiusY * 2.2;
        const cornerLen = 16;

        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;

        // Corners
        ctx.beginPath();
        // Top-left
        ctx.moveTo(boxX, boxY + cornerLen);
        ctx.lineTo(boxX, boxY);
        ctx.lineTo(boxX + cornerLen, boxY);
        // Top-right
        ctx.moveTo(boxX + boxW - cornerLen, boxY);
        ctx.lineTo(boxX + boxW, boxY);
        ctx.lineTo(boxX + boxW, boxY + cornerLen);
        // Bottom-right
        ctx.moveTo(boxX + boxW, boxY + boxH - cornerLen);
        ctx.lineTo(boxX + boxW, boxY + boxH);
        ctx.lineTo(boxX + boxW - cornerLen, boxY + boxH);
        // Bottom-left
        ctx.moveTo(boxX + cornerLen, boxY + boxH);
        ctx.lineTo(boxX, boxY + boxH);
        ctx.lineTo(boxX, boxY + boxH - cornerLen);
        ctx.stroke();

        // Target Tag
        ctx.fillStyle = 'rgba(6, 182, 212, 0.85)';
        ctx.fillRect(boxX, boxY - 20, 140, 18);
        ctx.fillStyle = '#020617';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('TARGET: OPERATIVE THARUN', boxX + 6, boxY - 7);

        // Hand Gesture Tracking Reticle in Lower Right
        const handX = width * 0.78 + Math.sin(frameCount * 0.05) * 8;
        const handY = height * 0.65 + Math.cos(frameCount * 0.05) * 6;
        const handSize = 58;

        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(handX - handSize / 2, handY - handSize / 2, handSize, handSize);

        ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
        ctx.fillRect(handX - handSize / 2, handY - handSize / 2 - 16, 115, 16);
        ctx.fillStyle = '#020617';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('GESTURE: PALM / ACTIVE', handX - handSize / 2 + 4, handY - handSize / 2 - 4);
        ctx.restore();

        // Top Telemetry Header
        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px monospace';
        ctx.fillText('[SENSOR: SIMULATED NEURAL OPTICAL STREAM]', 14, 20);
        ctx.fillText('FPS: 30.0 | LUMINANCE: 98%', 14, 34);

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        ctx.fillText(`CHRONO: ${timeStr}`, width - 130, 20);
        ctx.fillStyle = '#10b981';
        ctx.fillText('STATUS: SYNAPSE LOCKED ●', width - 165, 34);

        animationFrameId.current = requestAnimationFrame(render);
      };

      animationFrameId.current = requestAnimationFrame(render);

      return () => {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
        canvas.removeEventListener('mousemove', handleMouseMove);
      };
    }, []);

    return (
      <div className={`relative w-full h-full bg-slate-950 overflow-hidden flex items-center justify-center ${className}`}>
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="w-full h-full object-cover"
        />

        {/* Live HUD Overlay Badges */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/60 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>NEURAL OPTICAL FEED (DEMO SENSOR)</span>
        </div>

        <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-slate-950/80 border border-cyan-900/80 text-[10px] font-mono text-slate-300">
          <span className="text-cyan-400 font-bold">100% READY:</span> Click "Capture" to convert this live target into interactive 3D!
        </div>
      </div>
    );
  }
);
