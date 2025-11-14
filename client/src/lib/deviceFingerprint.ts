/**
 * Device Fingerprinting Utility
 * Generates a unique device identifier using various browser features
 * This is used to track sample consultation usage per device
 */

import crypto from 'crypto-js';

interface FingerprintComponents {
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  userAgent: string;
  colorDepth: number;
  pixelRatio: number;
  hardwareConcurrency: number;
  touchSupport: boolean;
  canvasFingerprint: string;
  webglFingerprint: string;
  audioFingerprint: string;
  fonts: string[];
}

/**
 * Get canvas fingerprint using 2D context
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    // Canvas dimensions
    canvas.width = 200;
    canvas.height = 50;

    // Add text with various styles
    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial"';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('BadBlue Canvas FP 💙', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('BadBlue Canvas FP 💙', 4, 17);

    // Add complex path
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgb(255,0,255)';
    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    // Get canvas data
    const dataURL = canvas.toDataURL();
    return dataURL.substring(0, 100); // Use first 100 chars for efficiency
  } catch (e) {
    return 'canvas-blocked';
  }
}

/**
 * Get WebGL fingerprint
 */
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl || !(gl instanceof WebGLRenderingContext)) return 'no-webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return `${vendor}~${renderer}`;
    }

    return 'webgl-no-debug';
  } catch (e) {
    return 'webgl-blocked';
  }
}

/**
 * Get audio context fingerprint
 */
function getAudioFingerprint(): string {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return 'no-audio';

    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const analyser = context.createAnalyser();
    const gain = context.createGain();
    const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

    oscillator.type = 'triangle';
    oscillator.frequency.value = 10000;
    gain.gain.value = 0; // Mute

    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gain);
    gain.connect(context.destination);

    oscillator.start(0);
    oscillator.stop(0.1);

    // Get frequency data
    const bins = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(bins);
    
    // Create fingerprint from frequency data
    const sum = bins.reduce((acc, val) => acc + Math.abs(val), 0);
    
    context.close();
    
    return sum.toString();
  } catch (e) {
    return 'audio-blocked';
  }
}

/**
 * Detect available fonts
 */
function getAvailableFonts(): string[] {
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testFonts = [
    'Arial', 'Arial Black', 'Arial Hebrew', 'Arial MT',
    'Calibri', 'Cambria', 'Comic Sans MS', 'Consolas',
    'Courier', 'Courier New', 'Georgia', 'Helvetica',
    'Impact', 'Lucida Console', 'Lucida Sans Unicode',
    'MS Gothic', 'MS Sans Serif', 'MS Serif', 'Palatino',
    'Tahoma', 'Times', 'Times New Roman', 'Trebuchet MS',
    'Verdana', 'Wingdings'
  ];

  const testString = 'mmmmmmmmmmlli';
  const testSize = '72px';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return [];

  const detectFont = (font: string): boolean => {
    for (const baseFont of baseFonts) {
      ctx.font = `${testSize} ${baseFont}`;
      const baseWidth = ctx.measureText(testString).width;
      
      ctx.font = `${testSize} '${font}', ${baseFont}`;
      const testWidth = ctx.measureText(testString).width;
      
      if (baseWidth !== testWidth) {
        return true;
      }
    }
    return false;
  };

  return testFonts.filter(font => detectFont(font));
}

/**
 * Collect all fingerprint components
 */
function collectFingerprintComponents(): FingerprintComponents {
  const screen = window.screen;
  const navigator = window.navigator;

  return {
    screenResolution: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
    language: navigator.language || 'unknown',
    platform: navigator.platform || 'unknown',
    userAgent: navigator.userAgent || 'unknown',
    colorDepth: screen.colorDepth || 0,
    pixelRatio: window.devicePixelRatio || 1,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    canvasFingerprint: getCanvasFingerprint(),
    webglFingerprint: getWebGLFingerprint(),
    audioFingerprint: getAudioFingerprint(),
    fonts: getAvailableFonts(),
  };
}

/**
 * Generate a stable hash from fingerprint components
 */
function generateHash(components: FingerprintComponents): string {
  // Create a stable string representation
  const fingerprintString = [
    components.screenResolution,
    components.timezone,
    components.language,
    components.platform,
    components.userAgent,
    components.colorDepth,
    components.pixelRatio,
    components.hardwareConcurrency,
    components.touchSupport ? '1' : '0',
    components.canvasFingerprint,
    components.webglFingerprint,
    components.audioFingerprint,
    components.fonts.join(','),
  ].join('|');

  // Generate SHA-256 hash
  return crypto.SHA256(fingerprintString).toString();
}

/**
 * Main function to generate device fingerprint
 * Returns a unique device identifier that persists across browser sessions
 */
export async function generateDeviceFingerprint(): Promise<string> {
  try {
    // Check if we have a cached fingerprint in localStorage
    const cachedFingerprint = localStorage.getItem('device_fingerprint');
    if (cachedFingerprint) {
      return cachedFingerprint;
    }

    // Collect fingerprint components
    const components = collectFingerprintComponents();
    
    // Generate hash
    const fingerprint = generateHash(components);
    
    // Cache the fingerprint
    localStorage.setItem('device_fingerprint', fingerprint);
    
    return fingerprint;
  } catch (error) {
    console.error('Error generating device fingerprint:', error);
    
    // Fallback: Generate a random ID if fingerprinting fails
    const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('device_fingerprint', fallbackId);
    
    return fallbackId;
  }
}

/**
 * Clear cached device fingerprint (useful for testing)
 */
export function clearDeviceFingerprint(): void {
  localStorage.removeItem('device_fingerprint');
}