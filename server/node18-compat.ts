/**
 * Node 18 Compatibility Layer for Railway Deployment
 * 
 * Node 18 doesn't support import.meta.dirname (added in Node 20.11+)
 * This module provides __dirname for ESM modules running on Node 18
 */

import path from "path";
import { fileURLToPath } from "url";

/**
 * Get __dirname for the current module (Node 18 compatible)
 * Usage: const __dirname = getDirname(import.meta.url);
 */
export function getDirname(importMetaUrl: string): string {
  return path.dirname(fileURLToPath(importMetaUrl));
}

/**
 * Polyfill for import.meta.dirname (Node 20+ feature)
 * Call this at the top of your module to get __dirname
 */
export const __dirname = getDirname(import.meta.url);
