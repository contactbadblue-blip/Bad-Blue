import { promises as fs } from 'fs';
import path from 'path';

interface SystemGuards {
  aiSearchPaused: boolean;
  pausedAt?: string;
  pauseReason?: string;
  autoResumeAt?: string;
  consecutiveHealthyRuns: number;
  lastCheckedAt?: string;
}

class AutonomousSearchController {
  private static instance: AutonomousSearchController;
  private readonly GUARDS_FILE = path.join(process.cwd(), 'data', 'system_guards.json');
  private guards: SystemGuards = {
    aiSearchPaused: false,
    consecutiveHealthyRuns: 0,
  };

  private constructor() {}

  static getInstance(): AutonomousSearchController {
    if (!AutonomousSearchController.instance) {
      AutonomousSearchController.instance = new AutonomousSearchController();
    }
    return AutonomousSearchController.instance;
  }

  async initialize(): Promise<void> {
    try {
      const dataDir = path.dirname(this.GUARDS_FILE);
      await fs.mkdir(dataDir, { recursive: true });
      
      try {
        const data = await fs.readFile(this.GUARDS_FILE, 'utf-8');
        this.guards = JSON.parse(data);
      } catch {
        await this.saveGuards();
      }
    } catch (error) {
      console.error('[Search Controller] Error initializing:', error);
    }
  }

  private async saveGuards(): Promise<void> {
    try {
      await fs.writeFile(this.GUARDS_FILE, JSON.stringify(this.guards, null, 2));
    } catch (error) {
      console.error('[Search Controller] Error saving guards:', error);
    }
  }

  async pause(reason: string): Promise<void> {
    this.guards.aiSearchPaused = true;
    this.guards.pausedAt = new Date().toISOString();
    this.guards.pauseReason = reason;
    this.guards.autoResumeAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    this.guards.consecutiveHealthyRuns = 0;
    await this.saveGuards();
    console.log(`[Search Controller] Autonomous search PAUSED: ${reason}`);
  }

  async resume(reason: string): Promise<void> {
    this.guards.aiSearchPaused = false;
    this.guards.pausedAt = undefined;
    this.guards.pauseReason = undefined;
    this.guards.autoResumeAt = undefined;
    this.guards.consecutiveHealthyRuns = 0;
    await this.saveGuards();
    console.log(`[Search Controller] Autonomous search RESUMED: ${reason}`);
  }

  async recordHealthyRun(): Promise<void> {
    this.guards.consecutiveHealthyRuns++;
    this.guards.lastCheckedAt = new Date().toISOString();
    await this.saveGuards();
  }

  async recordUnhealthyRun(): Promise<void> {
    this.guards.consecutiveHealthyRuns = 0;
    this.guards.lastCheckedAt = new Date().toISOString();
    await this.saveGuards();
  }

  isPaused(): boolean {
    return this.guards.aiSearchPaused;
  }

  shouldAutoResume(): boolean {
    if (!this.guards.aiSearchPaused) {
      return false;
    }

    // Resume if 2 consecutive healthy runs (≈60 minutes)
    if (this.guards.consecutiveHealthyRuns >= 2) {
      return true;
    }

    // Resume if auto-resume time passed
    if (this.guards.autoResumeAt && new Date() >= new Date(this.guards.autoResumeAt)) {
      return true;
    }

    return false;
  }

  getStatus(): SystemGuards {
    return { ...this.guards };
  }
}

export const searchController = AutonomousSearchController.getInstance();
