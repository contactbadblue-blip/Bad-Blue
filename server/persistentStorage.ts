
import { ObjectStorageService, getObjectStorageClient } from './objectStorage';

const objectStorage = new ObjectStorageService();

/**
 * Interface for persistent storage implementations
 */
export interface IPersistentStorage {
  save(key: string, data: any): Promise<void>;
  load<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
  listKeys(): Promise<string[]>;
  exists(key: string): Promise<boolean>;
  saveAppConfig(config: any): Promise<void>;
  loadAppConfig<T>(): Promise<T | null>;
  saveWorkerState(state: any): Promise<void>;
  loadWorkerState<T>(): Promise<T | null>;
}

/**
 * Null implementation - no-op for environments without object storage
 */
class NullPersistentStorage implements IPersistentStorage {
  async save(key: string, data: any): Promise<void> {
    console.log(`ℹ️ Persistent storage not available - skipping save: ${key}`);
  }

  async load<T>(key: string): Promise<T | null> {
    return null;
  }

  async delete(key: string): Promise<void> {
    console.log(`ℹ️ Persistent storage not available - skipping delete: ${key}`);
  }

  async listKeys(): Promise<string[]> {
    return [];
  }

  async exists(key: string): Promise<boolean> {
    return false;
  }

  async saveAppConfig(config: any): Promise<void> {
    console.log('ℹ️ Persistent storage not available - skipping app config save');
  }

  async loadAppConfig<T>(): Promise<T | null> {
    return null;
  }

  async saveWorkerState(state: any): Promise<void> {
    console.log('ℹ️ Persistent storage not available - skipping worker state save');
  }

  async loadWorkerState<T>(): Promise<T | null> {
    return null;
  }
}

/**
 * Persistent storage service that survives deployments and republishing
 * Uses Cloud Object Storage for durable data persistence
 */
export class PersistentStorage implements IPersistentStorage {
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
      const client = await getObjectStorageClient();
      if (!client) {
        throw new Error('Object storage client not available');
      }
      
      const filePath = `${this.basePath}/${key}.json`;
      const bucket = client.bucket(this.bucketName);
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
      const client = await getObjectStorageClient();
      if (!client) {
        console.log(`Object storage not available - returning null for: ${key}`);
        return null;
      }
      
      const filePath = `${this.basePath}/${key}.json`;
      const bucket = client.bucket(this.bucketName);
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
      const client = await getObjectStorageClient();
      if (!client) {
        console.log(`Object storage not available - skipping delete for: ${key}`);
        return;
      }
      
      const filePath = `${this.basePath}/${key}.json`;
      const bucket = client.bucket(this.bucketName);
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
      const client = await getObjectStorageClient();
      if (!client) {
        console.log('Object storage not available - returning empty list');
        return [];
      }
      
      const bucket = client.bucket(this.bucketName);
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
      const client = await getObjectStorageClient();
      if (!client) {
        return false;
      }
      
      const filePath = `${this.basePath}/${key}.json`;
      const bucket = client.bucket(this.bucketName);
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

/**
 * Factory function to create appropriate persistent storage implementation
 * Returns real implementation when PRIVATE_OBJECT_DIR is set (Replit),
 * returns null implementation otherwise (Railway, other platforms)
 */
function createPersistentStorage(): IPersistentStorage {
  const privateDir = process.env.PRIVATE_OBJECT_DIR;
  
  if (privateDir) {
    try {
      console.log('✓ Object storage configured - using persistent storage');
      return new PersistentStorage();
    } catch (error) {
      console.warn('⚠️ Failed to initialize object storage, using null implementation:', error);
      return new NullPersistentStorage();
    }
  } else {
    console.log('ℹ️ Object storage not configured - persistent storage disabled');
    console.log('   (Data will be stored in PostgreSQL only)');
    return new NullPersistentStorage();
  }
}

export const persistentStorage: IPersistentStorage = createPersistentStorage();
