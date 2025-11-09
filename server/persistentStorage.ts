
import { ObjectStorageService } from './objectStorage';
import { objectStorageClient } from './objectStorage';

const objectStorage = new ObjectStorageService();

/**
 * Persistent storage service that survives deployments and republishing
 * Uses Replit Object Storage for durable data persistence
 */
export class PersistentStorage {
  private bucketName: string;
  private basePath: string;

  constructor() {
    // Get the private directory from environment
    const privateDir = process.env.PRIVATE_OBJECT_DIR || '';
    if (!privateDir) {
      throw new Error('PRIVATE_OBJECT_DIR not set');
    }

    // Parse bucket name and base path
    const parts = privateDir.split('/').filter(p => p);
    this.bucketName = parts[0];
    this.basePath = parts.slice(1).join('/') + '/persistent';
  }

  /**
   * Save data to persistent storage
   */
  async save(key: string, data: any): Promise<void> {
    try {
      const filePath = `${this.basePath}/${key}.json`;
      const bucket = objectStorageClient.bucket(this.bucketName);
      const file = bucket.file(filePath);

      const jsonData = JSON.stringify(data, null, 2);
      await file.save(jsonData, {
        contentType: 'application/json',
        metadata: {
          lastModified: new Date().toISOString(),
        },
      });

      console.log(`✓ Saved persistent data: ${key}`);
    } catch (error) {
      console.error(`Error saving persistent data (${key}):`, error);
      throw error;
    }
  }

  /**
   * Load data from persistent storage
   */
  async load<T>(key: string): Promise<T | null> {
    try {
      const filePath = `${this.basePath}/${key}.json`;
      const bucket = objectStorageClient.bucket(this.bucketName);
      const file = bucket.file(filePath);

      const [exists] = await file.exists();
      if (!exists) {
        return null;
      }

      const [contents] = await file.download();
      const data = JSON.parse(contents.toString('utf-8'));

      console.log(`✓ Loaded persistent data: ${key}`);
      return data as T;
    } catch (error) {
      console.error(`Error loading persistent data (${key}):`, error);
      return null;
    }
  }

  /**
   * Delete data from persistent storage
   */
  async delete(key: string): Promise<void> {
    try {
      const filePath = `${this.basePath}/${key}.json`;
      const bucket = objectStorageClient.bucket(this.bucketName);
      const file = bucket.file(filePath);

      await file.delete();
      console.log(`✓ Deleted persistent data: ${key}`);
    } catch (error) {
      console.error(`Error deleting persistent data (${key}):`, error);
      throw error;
    }
  }

  /**
   * List all keys in persistent storage
   */
  async listKeys(): Promise<string[]> {
    try {
      const bucket = objectStorageClient.bucket(this.bucketName);
      const [files] = await bucket.getFiles({
        prefix: `${this.basePath}/`,
      });

      const keys = files.map(file => {
        const name = file.name.replace(`${this.basePath}/`, '').replace('.json', '');
        return name;
      });

      return keys;
    } catch (error) {
      console.error('Error listing persistent data keys:', error);
      return [];
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const filePath = `${this.basePath}/${key}.json`;
      const bucket = objectStorageClient.bucket(this.bucketName);
      const file = bucket.file(filePath);

      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      console.error(`Error checking if key exists (${key}):`, error);
      return false;
    }
  }

  /**
   * Save application configuration that persists across deployments
   */
  async saveAppConfig(config: any): Promise<void> {
    await this.save('app_config', config);
  }

  /**
   * Load application configuration
   */
  async loadAppConfig<T>(): Promise<T | null> {
    return await this.load<T>('app_config');
  }

  /**
   * Save worker state (for BadBlue Worker)
   */
  async saveWorkerState(state: any): Promise<void> {
    await this.save('worker_state', {
      ...state,
      savedAt: new Date().toISOString(),
    });
  }

  /**
   * Load worker state
   */
  async loadWorkerState<T>(): Promise<T | null> {
    return await this.load<T>('worker_state');
  }
}

export const persistentStorage = new PersistentStorage();
