/**
 * Graph Visual Effects
 *
 * This module provides visual effects and animations for knowledge graph visualization.
 * Includes particle systems, glow effects, and visual enhancements.
 */

import * as THREE from 'three';
import { ConceptNode, MasteryLevel } from '../types';

/**
 * Color palettes for different themes
 */
export const ColorPalettes = {
  dark: {
    background: '#0f172a',
    text: '#f1f5f9',
    grid: '#1e293b',
    mastery: {
      [MasteryLevel.Expert]: {
        main: '#10b981',
        glow: '#34d399',
        emissive: '#064e3b',
        ambient: 0.5,
        intensity: 0.8
      },
      [MasteryLevel.Competent]: {
        main: '#3b82f6',
        glow: '#60a5fa',
        emissive: '#1e3a8a',
        ambient: 0.5,
        intensity: 0.6
      },
      [MasteryLevel.Novice]: {
        main: '#f59e0b',
        glow: '#fbbf24',
        emissive: '#78350f',
        ambient: 0.5,
        intensity: 0.5
      },
      [MasteryLevel.Unknown]: {
        main: '#64748b',
        glow: '#94a3b8',
        emissive: '#1e293b',
        ambient: 0.5,
        intensity: 0.3
      }
    }
  },
  light: {
    background: '#f8fafc',
    text: '#0f172a',
    grid: '#e2e8f0',
    mastery: {
      [MasteryLevel.Expert]: {
        main: '#059669',
        glow: '#10b981',
        emissive: '#064e3b',
        ambient: 0.7,
        intensity: 0.6
      },
      [MasteryLevel.Competent]: {
        main: '#2563eb',
        glow: '#3b82f6',
        emissive: '#1e3a8a',
        ambient: 0.7,
        intensity: 0.5
      },
      [MasteryLevel.Novice]: {
        main: '#d97706',
        glow: '#f59e0b',
        emissive: '#78350f',
        ambient: 0.7,
        intensity: 0.4
      },
      [MasteryLevel.Unknown]: {
        main: '#475569',
        glow: '#64748b',
        emissive: '#1e293b',
        ambient: 0.7,
        intensity: 0.3
      }
    }
  }
};

/**
 * Create particle system for background
 */
export class ParticleSystem {
  private particles: THREE.Points;
  private velocities: Float32Array;
  private count: number;

  constructor(scene: THREE.Scene, count: number = 500, bounds: { width: number; height: number; depth: number }) {
    this.count = count;

    // Create particle geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * bounds.width;
      positions[i * 3 + 1] = (Math.random() - 0.5) * bounds.height;
      positions[i * 3 + 2] = (Math.random() - 0.5) * bounds.depth;

      this.velocities[i * 3] = (Math.random() - 0.5) * 0.1;
      this.velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Create particle material
    const material = new THREE.PointsMaterial({
      color: 0x64748b,
      size: 2,
      transparent: true,
      opacity: 0.3,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    scene.add(this.particles);
  }

  update(): void {
    const positions = this.particles.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < this.count; i++) {
      positions[i * 3] += this.velocities[i * 3];
      positions[i * 3 + 1] += this.velocities[i * 3 + 1];
      positions[i * 3 + 2] += this.velocities[i * 3 + 2];

      // Wrap around bounds
      if (Math.abs(positions[i * 3]) > 500) this.velocities[i * 3] *= -1;
      if (Math.abs(positions[i * 3 + 1]) > 500) this.velocities[i * 3 + 1] *= -1;
      if (Math.abs(positions[i * 3 + 2]) > 500) this.velocities[i * 3 + 2] *= -1;
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  dispose(): void {
    this.particles.geometry.dispose();
    (this.particles.material as THREE.Material).dispose();
  }
}

/**
 * Create glow effect for high mastery nodes
 */
export function createGlowEffect(
  scene: THREE.Scene,
  node: ConceptNode,
  position: THREE.Vector3,
  mastery: MasteryLevel,
  palette: typeof ColorPalettes.dark
): THREE.Mesh | null {
  if (mastery !== MasteryLevel.Expert && mastery !== MasteryLevel.Competent) {
    return null;
  }

  const colors = palette.mastery[mastery];
  const geometry = new THREE.SphereGeometry(1.2, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: colors.glow,
    transparent: true,
    opacity: 0.2
  });

  const glow = new THREE.Mesh(geometry, material);
  glow.position.copy(position);

  scene.add(glow);

  return glow;
}

/**
 * Create node with advanced material
 */
export function createAdvancedNode(
  node: ConceptNode,
  mastery: MasteryLevel,
  palette: typeof ColorPalettes.dark,
  size: number = 10
): THREE.Mesh {
  const colors = palette.mastery[mastery];
  const geometry = new THREE.SphereGeometry(size, 32, 32);

  const material = new THREE.MeshPhongMaterial({
    color: colors.main,
    emissive: colors.emissive,
    emissiveIntensity: mastery === MasteryLevel.Expert ? 0.5 : 0.3,
    shininess: 100,
    transparent: true,
    opacity: 0.95,
    specular: colors.glow
  });

  return new THREE.Mesh(geometry, material);
}

/**
 * Create animated link between nodes
 */
export function createAnimatedLink(
  scene: THREE.Scene,
  start: THREE.Vector3,
  end: THREE.Vector3,
  color: string = '#94a3b8',
  opacity: number = 0.4
): THREE.Line {
  const points = [start, end];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: opacity,
    linewidth: 1
  });

  const line = new THREE.Line(geometry, material);
  scene.add(line);

  return line;
}

/**
 * Create pulsing animation for selected node
 */
export class PulsingAnimation {
  private mesh: THREE.Mesh;
  private baseScale: number;
  private phase: number;
  private speed: number;
  private amplitude: number;

  constructor(mesh: THREE.Mesh, speed: number = 2, amplitude: number = 0.1) {
    this.mesh = mesh;
    this.baseScale = mesh.scale.x;
    this.phase = 0;
    this.speed = speed;
    this.amplitude = amplitude;
  }

  update(deltaTime: number): void {
    this.phase += this.speed * deltaTime;
    const scale = this.baseScale + Math.sin(this.phase) * this.amplitude;
    this.mesh.scale.set(scale, scale, scale);
  }

  stop(): void {
    this.mesh.scale.set(this.baseScale, this.baseScale, this.baseScale);
  }
}

/**
 * Camera transition animation
 */
export class CameraTransition {
  private camera: THREE.Camera;
  private targetPosition: THREE.Vector3;
  private targetLookAt: THREE.Vector3;
  private startPosition: THREE.Vector3;
  private startLookAt: THREE.Vector3;
  private duration: number;
  private elapsed: number;
  private onComplete?: () => void;

  constructor(
    camera: THREE.Camera,
    targetPosition: THREE.Vector3,
    targetLookAt: THREE.Vector3,
    duration: number = 1000,
    onComplete?: () => void
  ) {
    this.camera = camera;
    this.targetPosition = targetPosition;
    this.targetLookAt = targetLookAt;
    this.startPosition = camera.position.clone();
    this.startLookAt = new THREE.Vector3(0, 0, 0);
    this.duration = duration;
    this.elapsed = 0;
    this.onComplete = onComplete;
  }

  update(deltaTime: number): boolean {
    this.elapsed += deltaTime;
    const progress = Math.min(this.elapsed / this.duration, 1);

    // Ease-in-out function
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    this.camera.position.lerpVectors(this.startPosition, this.targetPosition, eased);

    if (progress >= 1) {
      this.onComplete?.();
      return true;
    }

    return false;
  }
}

/**
 * Level of Detail (LOD) system for performance optimization
 */
export class LODManager {
  private lods: Map<string, THREE.LOD> = new Map();
  private distances = [50, 100, 200];

  addNode(id: string, highDetail: THREE.Object3D, mediumDetail: THREE.Object3D, lowDetail: THREE.Object3D): void {
    const lod = new THREE.LOD();
    lod.addLevel(highDetail, this.distances[0]);
    lod.addLevel(mediumDetail, this.distances[1]);
    lod.addLevel(lowDetail, this.distances[2]);
    this.lods.set(id, lod);
  }

  update(camera: THREE.Camera): void {
    this.lods.forEach(lod => {
      lod.update(camera);
    });
  }

  removeNode(id: string): void {
    const lod = this.lods.get(id);
    if (lod) {
      // Clean up LOD levels
      for (let i = 0; i < lod.levels.length; i++) {
        const obj = lod.levels[i].object;
        if (obj && 'dispose' in obj && typeof obj.dispose === 'function') {
          (obj as any).dispose();
        }
      }
      this.lods.delete(id);
    }
  }

  dispose(): void {
    this.lods.forEach(lod => {
      for (let i = 0; i < lod.levels.length; i++) {
        const obj = lod.levels[i].object;
        if (obj && 'dispose' in obj && typeof obj.dispose === 'function') {
          (obj as any).dispose();
        }
      }
    });
    this.lods.clear();
  }
}

/**
 * Visual enhancement utilities
 */
export const VisualEnhancements = {
  /**
   * Create gradient background
   */
  createGradientBackground(colors: [string, string, string]): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  },

  /**
   * Create grid helper with custom colors
   */
  createGridHelper(
    size: number,
    divisions: number,
    color1: string = '#1e293b',
    color2: string = '#334155'
  ): THREE.GridHelper {
    const grid = new THREE.GridHelper(size, divisions, new THREE.Color(color1), new THREE.Color(color2));
    return grid;
  },

  /**
   * Add bloom effect (requires EffectComposer)
   */
  async createBloomEffect(strength: number = 1.5, radius: number = 0.4, threshold: number = 0.85) {
    // Note: This would require additional post-processing dependencies
    // Returning placeholder for now
    return null;
  },

  /**
   * Create ambient light with color temperature
   */
  createAmbientLight(temperature: number = 6500, intensity: number = 0.5): THREE.AmbientLight {
    const color = this.temperatureToColor(temperature);
    return new THREE.AmbientLight(color, intensity);
  },

  /**
   * Create directional light for shadows
   */
  createDirectionalLight(
    position: THREE.Vector3,
    intensity: number = 1,
    castShadow: boolean = true
  ): THREE.DirectionalLight {
    const light = new THREE.DirectionalLight(0xffffff, intensity);
    light.position.copy(position);

    if (castShadow) {
      light.castShadow = true;
      light.shadow.mapSize.width = 2048;
      light.shadow.mapSize.height = 2048;
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = 500;
    }

    return light;
  },

  /**
   * Convert color temperature to RGB
   */
  temperatureToColor(temp: number): THREE.Color {
    // Approximate color temperature conversion
    let r, g, b;

    if (temp <= 6600) {
      r = 255;
      g = temp / 100 - 2;
      g = -155.25485562709179 - 0.44596950469579133 * (g - 2) + 104.49216199393888 * Math.log(g - 2);
      if (temp <= 2000) b = 0;
      else {
        b = temp / 100 - 10;
        b = -254.76935184120902 + 0.8274096064007395 * (b - 10) + 115.67994401066147 * Math.log(b - 10);
      }
    } else {
      r = temp / 100 - 55;
      r = 329.698727446 * Math.pow(r, -0.1332047592);
      g = temp / 100 - 50;
      g = 288.1221695283 * Math.pow(g, -0.0755148492);
      b = 255;
    }

    return new THREE.Color(
      Math.min(255, Math.max(0, r)) / 255,
      Math.min(255, Math.max(0, g)) / 255,
      Math.min(255, Math.max(0, b)) / 255
    );
  }
};

/**
 * Performance monitoring utilities
 */
export const PerformanceMonitor = {
  frameCount: 0,
  lastTime: performance.now(),
  fps: 60,

  update(): void {
    this.frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;

    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  },

  getFPS(): number {
    return this.fps;
  },

  isPerformanceGood(): boolean {
    return this.fps >= 30;
  },

  getRecommendedQuality(): 'low' | 'medium' | 'high' {
    if (this.fps < 30) return 'low';
    if (this.fps < 50) return 'medium';
    return 'high';
  }
};
