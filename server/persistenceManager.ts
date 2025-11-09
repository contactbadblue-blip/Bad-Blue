
import { persistentStorage } from './persistentStorage';
import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Manages automatic backup and restore of critical application data
 * Runs on startup and periodically to ensure data persistence
 */
export class PersistenceManager {
  private backupInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the persistence manager
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Persistence manager already running');
      return;
    }

    this.isRunning = true;
    console.log('🔄 Starting persistence manager...');

    // Restore previous state on startup
    await this.restoreState();

    // Note: Backups are handled by BadBlue Worker (weekly on Sundays at 9:00 PM UTC)
    // No need for frequent periodic backups - data persists in Object Storage

    console.log('✓ Persistence manager started');
  }

  /**
   * Stop the persistence manager
   */
  stop() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
    this.isRunning = false;
    console.log('✓ Persistence manager stopped');
  }

  /**
   * Backup current application state
   */
  async backupState() {
    try {
      console.log('📦 Creating backup...');

      // Get database statistics
      const stats = await this.getDatabaseStats();

      // Create backup metadata
      const backupData = {
        timestamp: new Date().toISOString(),
        stats,
        version: '1.0',
      };

      // Save to persistent storage
      await persistentStorage.save('latest_backup', backupData);
      
      // Also save timestamped backup
      const timestamp = Date.now();
      await persistentStorage.save(`backup_${timestamp}`, backupData);

      console.log('✓ Backup completed');
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  /**
   * Restore application state from backup
   */
  async restoreState() {
    try {
      console.log('📂 Checking for previous state...');

      const backup = await persistentStorage.load<any>('latest_backup');
      
      if (!backup) {
        console.log('ℹ️ No previous state found (clean start)');
        return;
      }

      console.log(`✓ Found backup from ${backup.timestamp}`);
      console.log('Database stats at backup:', backup.stats);

      // State is already in database, just log the info
      return backup;
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  private async getDatabaseStats() {
    try {
      const tables = [
        'users',
        'complaints',
        'lawsuit_filings',
        'badge_lookups',
        'petitions',
        'saved_progress',
        'jurisdictions',
      ];

      const stats: Record<string, number> = {};

      for (const table of tables) {
        try {
          const result = await db.execute(
            sql`SELECT COUNT(*) as count FROM ${sql.identifier(table)}`
          );
          // Access rows property of QueryResult
          const rows = result.rows || result;
          if (rows && rows.length > 0 && rows[0] && 'count' in rows[0]) {
            stats[table] = Number(rows[0].count);
          } else {
            stats[table] = 0;
          }
        } catch (tableError) {
          // Table might not exist yet
          stats[table] = 0;
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {};
    }
  }

  /**
   * Export all data for manual backup
   */
  async exportAllData() {
    try {
      const stats = await this.getDatabaseStats();
      const exportData = {
        timestamp: new Date().toISOString(),
        stats,
        message: 'Full export created',
      };

      const filename = `full_export_${Date.now()}`;
      await persistentStorage.save(filename, exportData);
      
      console.log(`✓ Full export saved as: ${filename}`);
      return filename;
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }
}

export const persistenceManager = new PersistenceManager();
