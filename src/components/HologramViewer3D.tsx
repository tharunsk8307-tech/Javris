import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Box,
  Layers,
  Sparkles,
  RefreshCw,
  Sun,
  Eye,
  Sliders,
  Move
} from 'lucide-react';

import { HandGestureState } from '../utils/handGestureTracker';

export interface ModelGeometryData {
  detectedFaces?: number;
  faceEmotion?: string;
  detectedHands?: number;
  handGesture?: string;
  primaryObject?: string;
  meshType?: 'sphere' | 'cylinder' | 'torus' | 'cube' | 'icosahedron' | 'cone' | 'ring' | 'pointcloud';
  wireframeColor?: string;
  roughDimensions?: { width: number; height: number; depth: number };
  confidenceScore?: number;
  sourceImage?: string;
}

interface HologramViewer3DProps {
  modelData: ModelGeometryData;
  sourceImageUrl?: string;
  activeGesture?: HandGestureState | null;
  className?: string;
}

export const HologramViewer3D: React.FC<HologramViewer3DProps> = ({
  modelData,
  sourceImageUrl,
  activeGesture,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [wireframeMode, setWireframeMode] = useState<'hologram' | 'textured' | 'points' | 'solid'>('hologram');
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(0.012);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedShape, setSelectedShape] = useState<string>(modelData.meshType || 'icosahedron');
  const [pointCount, setPointCount] = useState(1850);
  const [glowColor, setGlowColor] = useState<string>(modelData.wireframeColor || '#00f0ff');

  // Internal references to ThreeJS objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Mouse interaction for rotate / pan
  const isDraggingRef = useRef(false);
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update selected shape when modelData updates
  useEffect(() => {
    if (modelData.meshType) {
      setSelectedShape(modelData.meshType);
    }
    if (modelData.wireframeColor) {
      setGlowColor(modelData.wireframeColor);
    }
  }, [modelData]);

  // Optical Hand Gesture Real-time Interaction
  useEffect(() => {
    if (!activeGesture || activeGesture.gesture === 'none') return;

    if (activeGesture.gesture === 'swipe_left') {
      // Rotate Model Left
      if (modelGroupRef.current) {
        modelGroupRef.current.rotation.y -= Math.max(Math.abs(activeGesture.deltaX) * 2.5, 0.08);
      }
    } else if (activeGesture.gesture === 'swipe_right') {
      // Rotate Model Right
      if (modelGroupRef.current) {
        modelGroupRef.current.rotation.y += Math.max(Math.abs(activeGesture.deltaX) * 2.5, 0.08);
      }
    } else if (activeGesture.gesture === 'swipe_up') {
      // Tilt Model Up
      if (modelGroupRef.current) {
        modelGroupRef.current.rotation.x -= Math.max(Math.abs(activeGesture.deltaY) * 2.5, 0.08);
      }
    } else if (activeGesture.gesture === 'swipe_down') {
      // Tilt Model Down
      if (modelGroupRef.current) {
        modelGroupRef.current.rotation.x += Math.max(Math.abs(activeGesture.deltaY) * 2.5, 0.08);
      }
    } else if (activeGesture.gesture === 'pinch_zoom_in') {
      // Pinch spread / Zoom in
      handleZoom(-0.25);
    } else if (activeGesture.gesture === 'pinch_zoom_out') {
      // Pinch in / Zoom out
      handleZoom(0.25);
    } else if (activeGesture.gesture === 'fist_stop') {
      // Pause rotation
      setAutoRotate(false);
    }
  }, [activeGesture]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 350;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // 3. Renderer with antialias and alpha transparency
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00f0ff, 2.5, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const backLight = new THREE.PointLight(0xec4899, 1.8, 50);
    backLight.position.set(-5, -3, -5);
    scene.add(backLight);

    // 5. Model Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // 6. Holographic Grid Platform
    const gridHelper = new THREE.GridHelper(6, 20, 0x00f0ff, 0x034b5c);
    gridHelper.position.y = -1.8;
    scene.add(gridHelper);

    // 7. Holographic Target Ring
    const ringGeo = new THREE.RingGeometry(1.9, 2.05, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
    });
    const floorRing = new THREE.Mesh(ringGeo, ringMat);
    floorRing.rotation.x = Math.PI / 2;
    floorRing.position.y = -1.79;
    scene.add(floorRing);

    // 8. Rebuild Mesh
    buildMesh(modelGroup, selectedShape, wireframeMode, glowColor, sourceImageUrl);

    // Animation Loop
    const animate = () => {
      if (modelGroupRef.current && autoRotate) {
        modelGroupRef.current.rotation.y += rotationSpeed;
        floorRing.rotation.z += 0.005;
      }
      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [selectedShape, wireframeMode, glowColor, sourceImageUrl]);

  // Helper to construct Tharun holographic 3D geometries
  const buildMesh = (
    group: THREE.Group,
    shape: string,
    mode: string,
    colorHex: string,
    imgUrl?: string
  ) => {
    // Clear previous children
    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      group.remove(child);
    }

    let geometry: THREE.BufferGeometry;

    switch (shape) {
      case 'sphere':
        geometry = new THREE.SphereGeometry(1.4, 32, 24);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(1.1, 1.1, 2.2, 32);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(1.2, 0.45, 24, 48);
        break;
      case 'cube':
        geometry = new THREE.BoxGeometry(1.8, 1.8, 1.8, 12, 12, 12);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(1.3, 2.4, 32);
        break;
      case 'ring':
        geometry = new THREE.TorusKnotGeometry(1.0, 0.35, 64, 16);
        break;
      case 'icosahedron':
      default:
        geometry = new THREE.IcosahedronGeometry(1.4, 3);
        break;
    }

    const parsedColor = new THREE.Color(colorHex);

    if (mode === 'points') {
      // 3D Point Cloud Hologram
      const pMaterial = new THREE.PointsMaterial({
        color: parsedColor,
        size: 0.045,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const points = new THREE.Points(geometry, pMaterial);
      group.add(points);
    } else if (mode === 'solid') {
      // Volumetric Tharun Solid Hologram
      const sMaterial = new THREE.MeshStandardMaterial({
        color: parsedColor,
        roughness: 0.2,
        metalness: 0.8,
        wireframe: false,
        emissive: parsedColor,
        emissiveIntensity: 0.25,
      });
      const mesh = new THREE.Mesh(geometry, sMaterial);
      group.add(mesh);
    } else if (mode === 'textured' && imgUrl) {
      // Image projected texture mapping onto 3D reconstructed mesh
      const loader = new THREE.TextureLoader();
      loader.load(
        imgUrl,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          const tMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.4,
            metalness: 0.3,
            wireframe: false,
          });
          const mesh = new THREE.Mesh(geometry, tMaterial);

          // Add subtle outer holographic wireframe cage
          const wireMat = new THREE.MeshBasicMaterial({
            color: parsedColor,
            wireframe: true,
            transparent: true,
            opacity: 0.3,
          });
          const wireMesh = new THREE.Mesh(geometry.clone(), wireMat);
          wireMesh.scale.set(1.02, 1.02, 1.02);

          group.add(mesh);
          group.add(wireMesh);
        },
        undefined,
        () => {
          // fallback to wireframe on texture error
          buildMesh(group, shape, 'hologram', colorHex);
        }
      );
    } else {
      // Default: Dual Layered Tharun OS Holographic Mesh
      const holoMaterial = new THREE.MeshBasicMaterial({
        color: parsedColor,
        wireframe: true,
        transparent: true,
        opacity: 0.75,
      });
      const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0x082f49,
        transparent: true,
        opacity: 0.4,
      });

      const coreMesh = new THREE.Mesh(geometry, coreMaterial);
      const wireMesh = new THREE.Mesh(geometry, holoMaterial);

      // Vertex glow points
      const pointsMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.04,
        transparent: true,
        opacity: 0.9,
      });
      const vertexPoints = new THREE.Points(geometry, pointsMat);

      group.add(coreMesh);
      group.add(wireMesh);
      group.add(vertexPoints);
    }
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    if (!cameraRef.current) return;
    const newZ = Math.min(Math.max(cameraRef.current.position.z + delta, 2), 12);
    cameraRef.current.position.z = newZ;
    setZoomLevel(Number((5 / newZ).toFixed(2)));
  };

  const handleResetCamera = () => {
    if (!cameraRef.current || !modelGroupRef.current) return;
    cameraRef.current.position.set(0, 0, 5);
    modelGroupRef.current.rotation.set(0, 0, 0);
    setZoomLevel(1);
  };

  // Mouse Drag to rotate 3D model manually
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !modelGroupRef.current) return;
    const deltaX = e.clientX - prevMousePos.current.x;
    const deltaY = e.clientY - prevMousePos.current.y;

    modelGroupRef.current.rotation.y += deltaX * 0.01;
    modelGroupRef.current.rotation.x += deltaY * 0.01;

    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    handleZoom(e.deltaY * 0.003);
  };

  return (
    <div className={`relative bg-slate-950/95 border border-cyan-900/60 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col ${className}`}>
      {/* HUD Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-cyan-950 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="hud-font font-bold text-cyan-300 tracking-wider">
            NEURAL 3D SPATIAL RECONSTRUCTION
          </span>
          <span className="text-[10px] text-slate-500">· THREE.JS RENDERER</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>ZOOM: <strong className="text-cyan-300">{zoomLevel}x</strong></span>
          <span>GEOMETRY: <strong className="text-cyan-300 uppercase">{selectedShape}</strong></span>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div
        ref={mountRef}
        className="w-full h-80 sm:h-96 cursor-grab active:cursor-grabbing relative select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Hologram Overlay Coordinates and Telemetry */}
      <div className="absolute top-12 left-3 pointer-events-none text-[10px] font-mono text-cyan-400/80 space-y-0.5">
        <div>X-COORD: +42.109</div>
        <div>Y-COORD: -14.882</div>
        <div>POLYGON COUNT: {pointCount} FACETS</div>
        <div>SPATIAL DEPTH: RECONSTRUCTED</div>
      </div>

      {/* Real-time Hand Gesture HUD Indicator */}
      {activeGesture && activeGesture.gesture !== 'none' && (
        <div className="absolute top-12 right-3 pointer-events-none px-2.5 py-1 rounded bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs font-mono flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-in fade-in zoom-in-95">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="hud-font font-bold">{activeGesture.rawLabel}</span>
        </div>
      )}

      {/* Interactive Controls Overlay */}
      <div className="p-3 bg-slate-900/90 border-t border-cyan-950/90 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Shape / Geometry Topology Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Box className="w-3 h-3 text-cyan-400" /> MESH:
          </span>
          {['icosahedron', 'sphere', 'torus', 'cylinder', 'cube', 'ring'].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedShape(s)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors ${
                selectedShape === s
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_#06b6d4]'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* View Mode: Hologram, Textured, Points, Solid */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" /> SHADER:
          </span>
          <button
            onClick={() => setWireframeMode('hologram')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              wireframeMode === 'hologram'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            HOLOGRAM
          </button>
          {sourceImageUrl && (
            <button
              onClick={() => setWireframeMode('textured')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                wireframeMode === 'textured'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              TEXTURE MAP
            </button>
          )}
          <button
            onClick={() => setWireframeMode('points')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              wireframeMode === 'points'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            POINT CLOUD
          </button>
          <button
            onClick={() => setWireframeMode('solid')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              wireframeMode === 'solid'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            SOLID
          </button>
        </div>

        {/* Camera & Zoom Action Buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => handleZoom(-0.6)}
            className="p-1.5 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 hover:border-cyan-500 transition-colors"
            title="Zoom In (or scroll wheel up)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(0.6)}
            className="p-1.5 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 hover:border-cyan-500 transition-colors"
            title="Zoom Out (or scroll wheel down)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetCamera}
            className="p-1.5 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 hover:border-cyan-500 transition-colors"
            title="Reset 3D Orientation & Center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
              autoRotate
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Toggle Continuous Rotation"
          >
            {autoRotate ? 'ROTATE ON' : 'PAUSED'}
          </button>
        </div>
      </div>
    </div>
  );
};
