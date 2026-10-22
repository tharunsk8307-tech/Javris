/**
 * Preset Tactical Targets for 3D Hologram Reconstruction
 * Provides instant 1-click fallback targets when webcam hardware is restricted by browser policy.
 */

export interface SampleTarget {
  id: string;
  name: string;
  category: string;
  description: string;
  svgDataUri: string;
  defaultMesh: 'icosahedron' | 'torus' | 'octahedron' | 'box';
  wireframeColor: string;
}

function createSvgDataUri(svgContent: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

export const SAMPLE_TARGETS: SampleTarget[] = [
  {
    id: 'autonomous-drone',
    name: 'Autonomous Drone & Sensor Pod',
    category: 'Autonomous Robotics',
    description: 'Next-gen quad-rotor autonomous survey drone with LiDAR payload and optical telemetry.',
    defaultMesh: 'octahedron',
    wireframeColor: '#00f0ff',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="400" height="400" fill="#030712"/>
        <circle cx="200" cy="200" r="170" fill="none" stroke="#00f0ff" stroke-width="2" stroke-dasharray="8 4" opacity="0.3"/>
        <!-- Central Pod Body -->
        <circle cx="200" cy="200" r="45" fill="#0f172a" stroke="#00f0ff" stroke-width="3"/>
        <circle cx="200" cy="200" r="25" fill="#082f49" stroke="#38bdf8" stroke-width="2"/>
        <circle cx="200" cy="200" r="10" fill="#00f0ff"/>
        <!-- 4 Drone Rotor Arms -->
        <line x1="200" y1="200" x2="110" y2="110" stroke="#0284c7" stroke-width="6"/>
        <line x1="200" y1="200" x2="290" y2="110" stroke="#0284c7" stroke-width="6"/>
        <line x1="200" y1="200" x2="110" y2="290" stroke="#0284c7" stroke-width="6"/>
        <line x1="200" y1="200" x2="290" y2="290" stroke="#0284c7" stroke-width="6"/>
        <!-- Rotor Blades Rings -->
        <circle cx="110" cy="110" r="38" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 3"/>
        <circle cx="290" cy="110" r="38" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 3"/>
        <circle cx="110" cy="290" r="38" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 3"/>
        <circle cx="290" cy="290" r="38" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 3"/>
        <text x="200" y="375" fill="#00f0ff" font-family="monospace" font-size="12" text-anchor="middle">AUTONOMOUS AI DRONE POD [3D HOLOGRAM]</text>
      </svg>
    `),
  },
  {
    id: 'quantum-processor',
    name: 'Wafer-Scale AI Neural Processor',
    category: 'Computing Hardware',
    description: 'Next-generation wafer-scale multi-core neural processing unit with optical interconnects.',
    defaultMesh: 'box',
    wireframeColor: '#38bdf8',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="400" height="400" fill="#020617"/>
        <circle cx="200" cy="200" r="160" fill="none" stroke="#0284c7" stroke-width="2" opacity="0.3"/>
        <!-- Chip Die Frame -->
        <rect x="100" y="100" width="200" height="200" rx="16" fill="#082f49" stroke="#0ea5e9" stroke-width="4"/>
        <rect x="125" y="125" width="150" height="150" rx="8" fill="#0c4a6e" stroke="#38bdf8" stroke-width="2"/>
        <!-- Compute Cores Grid (3x3) -->
        <rect x="135" y="135" width="36" height="36" rx="4" fill="#0284c7"/>
        <rect x="182" y="135" width="36" height="36" rx="4" fill="#0284c7"/>
        <rect x="229" y="135" width="36" height="36" rx="4" fill="#0284c7"/>
        <rect x="135" y="182" width="36" height="36" rx="4" fill="#0284c7"/>
        <rect x="182" y="182" width="36" height="36" rx="4" fill="#38bdf8"/>
        <rect x="229" y="182" width="36" height="36" rx="4" fill="#0284c7"/>
        <rect x="135" y="229" width="36" height="36" rx="4" fill="#0284c7"/>
        <rect x="182" y="229" width="36" height="36" rx="4" fill="#0284c7"/>
        <rect x="229" y="229" width="36" height="36" rx="4" fill="#0284c7"/>
        <!-- Bus traces -->
        <line x1="60" y1="200" x2="100" y2="200" stroke="#f59e0b" stroke-width="3"/>
        <line x1="300" y1="200" x2="340" y2="200" stroke="#f59e0b" stroke-width="3"/>
        <line x1="200" y1="60" x2="200" y2="100" stroke="#f59e0b" stroke-width="3"/>
        <line x1="200" y1="300" x2="200" y2="340" stroke="#f59e0b" stroke-width="3"/>
        <text x="200" y="375" fill="#38bdf8" font-family="monospace" font-size="12" text-anchor="middle">NEURAL COMPUTE ACCELERATOR [3.2 TFLOPS]</text>
      </svg>
    `),
  },
  {
    id: 'biometric-face',
    name: 'Executive Biometric Facial Identity',
    category: 'Human Telemetry',
    description: 'Facial contour point cloud with eye pupil vectoring and emotion analysis.',
    defaultMesh: 'icosahedron',
    wireframeColor: '#22c55e',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="400" height="400" fill="#030712"/>
        <!-- Face oval -->
        <ellipse cx="200" cy="190" rx="95" ry="125" fill="#0f172a" stroke="#22c55e" stroke-width="2"/>
        <ellipse cx="200" cy="205" rx="75" ry="95" fill="none" stroke="#22c55e" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"/>
        <!-- Eyes -->
        <ellipse cx="165" cy="165" rx="20" ry="10" fill="none" stroke="#4ade80" stroke-width="2"/>
        <circle cx="165" cy="165" r="4" fill="#22c55e"/>
        <ellipse cx="235" cy="165" rx="20" ry="10" fill="none" stroke="#4ade80" stroke-width="2"/>
        <circle cx="235" cy="165" r="4" fill="#22c55e"/>
        <!-- Nose & Mouth -->
        <path d="M200 170 L195 210 L205 210 Z" fill="none" stroke="#4ade80" stroke-width="1.5"/>
        <path d="M175 245 Q200 260 225 245" fill="none" stroke="#4ade80" stroke-width="2"/>
        <!-- Bounding Box -->
        <rect x="80" y="50" width="240" height="280" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="6 3"/>
        <text x="200" y="375" fill="#4ade80" font-family="monospace" font-size="12" text-anchor="middle">BIOMETRIC CONTOUR RECONSTRUCTION</text>
      </svg>
    `),
  },
  {
    id: 'hand-gesture',
    name: 'Spatial Hand Tracking & Gesture Matrix',
    category: 'Spatial Interaction',
    description: 'Five-point articulated hand skeleton with spatial rotation coordinates.',
    defaultMesh: 'octahedron',
    wireframeColor: '#f59e0b',
    svgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="400" height="400" fill="#020617"/>
        <circle cx="200" cy="200" r="170" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="8 6" opacity="0.3"/>
        <!-- Palm & Fingers -->
        <path d="M150 280 C150 220 130 180 120 150 C115 135 130 130 140 145 C155 170 170 140 170 100 C170 85 185 85 185 100 C185 140 200 120 200 90 C200 75 215 75 215 90 C215 130 230 130 235 110 C240 95 255 100 250 120 C240 160 265 180 270 200 C275 220 250 300 200 310 Z" fill="#451a03" stroke="#f59e0b" stroke-width="3"/>
        <!-- Optical Sensor node in palm -->
        <circle cx="200" cy="235" r="18" fill="#00f0ff" stroke="#e0f2fe" stroke-width="3"/>
        <text x="200" y="375" fill="#f59e0b" font-family="monospace" font-size="12" text-anchor="middle">SPATIAL GESTURE SKELETON [SENSOR ACTIVE]</text>
      </svg>
    `),
  },
];
