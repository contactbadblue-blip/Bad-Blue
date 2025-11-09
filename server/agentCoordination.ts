/**
 * Worker/Sub-Agent Coordination Channel
 * Allows both agents to communicate status and request mutual assistance
 * Uses system_guards.json for persistent, fast coordination without database dependency
 */

import * as fs from 'fs/promises';
import * as path from 'path';

const COORDINATION_FILE = path.join(process.cwd(), 'data', 'system_guards.json');

export type AgentType = 'worker' | 'subAgent';
export type AgentStatus = 'healthy' | 'needs_help' | 'paused';

export interface AgentState {
  status: AgentStatus;
  error?: string;
  helpRequestedAt?: string;
  lastHealthyAt: string;
}

export interface CoordinationState {
  worker: AgentState;
  subAgent: AgentState;
  isPaused: boolean;
  pauseReason?: string;
  pausedAt?: string;
  consecutiveHealthyRuns?: number;
}

const DEFAULT_STATE: CoordinationState = {
  worker: {
    status: 'healthy',
    lastHealthyAt: new Date().toISOString(),
  },
  subAgent: {
    status: 'healthy',
    lastHealthyAt: new Date().toISOString(),
  },
  isPaused: false,
  consecutiveHealthyRuns: 0,
};

/**
 * Get current coordination state
 */
export async function getCoordinationStatus(): Promise<CoordinationState> {
  try {
    await fs.mkdir(path.dirname(COORDINATION_FILE), { recursive: true });
    const content = await fs.readFile(COORDINATION_FILE, 'utf-8');
    return { ...DEFAULT_STATE, ...JSON.parse(content) };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(COORDINATION_FILE, JSON.stringify(DEFAULT_STATE, null, 2));
      return DEFAULT_STATE;
    }
    console.error('[Coordination] Error reading state:', error);
    return DEFAULT_STATE;
  }
}

/**
 * Signal that an agent needs help from its peer
 */
export async function requestHelp(agent: AgentType, error: string): Promise<void> {
  const state = await getCoordinationStatus();
  state[agent] = {
    status: 'needs_help',
    error,
    helpRequestedAt: new Date().toISOString(),
    lastHealthyAt: state[agent].lastHealthyAt,
  };
  await fs.writeFile(COORDINATION_FILE, JSON.stringify(state, null, 2));
  console.log(`[Coordination] ${agent} requested help: ${error}`);
}

/**
 * Mark an agent as healthy (clears help request)
 */
export async function markHealthy(agent: AgentType): Promise<void> {
  const state = await getCoordinationStatus();
  state[agent] = {
    status: 'healthy',
    lastHealthyAt: new Date().toISOString(),
  };
  await fs.writeFile(COORDINATION_FILE, JSON.stringify(state, null, 2));
}

/**
 * Mark an agent as paused
 */
export async function markPaused(agent: AgentType, reason: string): Promise<void> {
  const state = await getCoordinationStatus();
  state[agent] = {
    status: 'paused',
    lastHealthyAt: state[agent].lastHealthyAt,
  };
  state.isPaused = true;
  state.pauseReason = reason;
  state.pausedAt = new Date().toISOString();
  await fs.writeFile(COORDINATION_FILE, JSON.stringify(state, null, 2));
}

/**
 * Check if peer agent needs help
 * Returns null if peer is healthy, otherwise returns peer's error
 */
export async function checkPeerNeedsHelp(self: AgentType): Promise<string | null> {
  const peer: AgentType = self === 'worker' ? 'subAgent' : 'worker';
  const state = await getCoordinationStatus();
  
  if (state[peer].status === 'needs_help') {
    return state[peer].error || 'Unknown error';
  }
  
  return null;
}

/**
 * Check if system is globally paused
 */
export async function isSystemPaused(): Promise<boolean> {
  const state = await getCoordinationStatus();
  return state.isPaused;
}

/**
 * Resume system (clear global pause)
 */
export async function resumeSystem(): Promise<void> {
  const state = await getCoordinationStatus();
  state.isPaused = false;
  state.pauseReason = undefined;
  state.pausedAt = undefined;
  await fs.writeFile(COORDINATION_FILE, JSON.stringify(state, null, 2));
  console.log('[Coordination] System resumed');
}
