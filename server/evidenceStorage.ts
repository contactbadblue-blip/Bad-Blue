// Platform-agnostic evidence storage system
import { Response } from "express";
import { randomUUID } from "crypto";
import * as fs from "fs/promises";
import * as path from "path";
import { createReadStream, createWriteStream } from "fs";
// Use type imports to avoid bundling
import type { Storage, File } from "@google-cloud/storage";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

// Evidence file metadata
export interface EvidenceFile {
  id: string;
  userId: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  visibility: "public" | "private";
}

// Abstract interface for evidence storage
export interface IEvidenceStorage {
  getUploadURL(): Promise<string>;
  saveFile(fileURL: string, userId: string, aclPolicy: ObjectAclPolicy): Promise<string>;
  downloadFile(filePath: string, userId: string, res: Response): Promise<void>;
  deleteFile(filePath: string, userId: string): Promise<void>;
  canAccess(filePath: string, userId: string, permission: ObjectPermission): Promise<boolean>;
  handleFileUpload?(fileId: string, fileBuffer: Buffer, mimeType: string): Promise<void>;
  isFilesystemStorage?: boolean;
}

// ============================================
// CLOUD OBJECT STORAGE IMPLEMENTATION
// ============================================
class CloudEvidenceStorage implements IEvidenceStorage {
  private storageClient: Storage | null = null;
  private storageInitialized = false;

  private async initializeStorage(): Promise<Storage> {
    if (this.storageInitialized && this.storageClient) {
      return this.storageClient;
    }
    
    // Dynamic import to prevent bundling when not needed
    const { Storage: GoogleCloudStorage } = await import("@google-cloud/storage");
    
    // Standard Google Cloud Storage initialization
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCS_PROJECT_ID) {
      this.storageClient = new GoogleCloudStorage({
        projectId: process.env.GCS_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
      });
    } else {
      // Use Application Default Credentials
      this.storageClient = new GoogleCloudStorage();
    }
    
    this.storageInitialized = true;
    return this.storageClient;
  }

  private getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error("PRIVATE_OBJECT_DIR not set");
    }
    return dir;
  }

  private parseObjectPath(objectPath: string): { bucketName: string; objectName: string } {
    const parts = objectPath.split("/").filter((p) => p.length > 0);
    if (parts.length < 2) {
      throw new Error(`Invalid object path: ${objectPath}`);
    }
    return { bucketName: parts[0], objectName: parts.slice(1).join("/") };
  }

  async getUploadURL(): Promise<string> {
    const storageClient = await this.initializeStorage();
    const privateDir = this.getPrivateObjectDir();
    const objectPath = `${privateDir}/${randomUUID()}`;
    const { bucketName, objectName } = this.parseObjectPath(objectPath);
    
    const bucket = storageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    // Generate a signed URL for PUT upload with 15-minute TTL
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });
    
    return url;
  }

  async saveFile(fileURL: string, userId: string, aclPolicy: ObjectAclPolicy): Promise<string> {
    const storageClient = await this.initializeStorage();
    const objectPath = new URL(fileURL).pathname;
    const { bucketName, objectName } = this.parseObjectPath(objectPath);
    const bucket = storageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    await setObjectAclPolicy(file, aclPolicy);
    return objectPath;
  }

  async downloadFile(filePath: string, userId: string, res: Response): Promise<void> {
    const storageClient = await this.initializeStorage();
    const { bucketName, objectName } = this.parseObjectPath(filePath);
    const bucket = storageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    const [exists] = await file.exists();
    if (!exists) {
      throw new EvidenceNotFoundError();
    }

    // Verify access
    const canAccess = await this.canAccess(filePath, userId, ObjectPermission.READ);
    if (!canAccess) {
      throw new AccessDeniedError();
    }

    // Get metadata and stream file
    const [metadata] = await file.getMetadata();
    const aclPolicy = await getObjectAclPolicy(file);
    const isPublic = aclPolicy?.visibility === "public";

    res.set({
      "Content-Type": metadata.contentType || "application/octet-stream",
      "Content-Length": metadata.size,
      "Cache-Control": `${isPublic ? "public" : "private"}, max-age=3600`,
    });

    const stream = file.createReadStream();
    stream.on("error", (err) => {
      console.error("Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error streaming file" });
      }
    });
    stream.pipe(res);
  }

  async deleteFile(filePath: string, userId: string): Promise<void> {
    const storageClient = await this.initializeStorage();
    const { bucketName, objectName } = this.parseObjectPath(filePath);
    const bucket = storageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    const [exists] = await file.exists();
    if (!exists) {
      throw new EvidenceNotFoundError();
    }

    const canDelete = await this.canAccess(filePath, userId, ObjectPermission.WRITE);
    if (!canDelete) {
      throw new AccessDeniedError();
    }

    await file.delete();
  }

  async canAccess(filePath: string, userId: string, permission: ObjectPermission): Promise<boolean> {
    const storageClient = await this.initializeStorage();
    const { bucketName, objectName } = this.parseObjectPath(filePath);
    const bucket = storageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    const [exists] = await file.exists();
    if (!exists) {
      return false;
    }

    return await canAccessObject({ objectFile: file, userId, requestedPermission: permission });
  }
}

// ============================================
// FILESYSTEM STORAGE IMPLEMENTATION (Railway, etc.)
// ============================================
class FilesystemEvidenceStorage implements IEvidenceStorage {
  public isFilesystemStorage = true;
  private storageDir: string;
  private metadataMap: Map<string, { userId: string; visibility: string; mimeType: string; size: number }>;

  constructor() {
    this.storageDir = process.env.EVIDENCE_STORAGE_DIR || path.join(process.cwd(), "evidence_files");
    this.metadataMap = new Map();
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      console.log(`✓ Filesystem evidence storage initialized at: ${this.storageDir}`);
    } catch (error) {
      console.error("Failed to initialize filesystem storage:", error);
    }
  }

  /**
   * Sanitize fileId to prevent path traversal attacks
   * Only allows alphanumeric, hyphens, underscores (UUID-safe)
   */
  private sanitizeFileId(fileId: string): string {
    // Remove any path separators and whitelist safe characters
    const sanitized = fileId.replace(/[^a-zA-Z0-9_-]/g, '');
    
    if (!sanitized || sanitized.length === 0) {
      throw new Error('Invalid file ID');
    }
    
    if (sanitized.length > 255) {
      throw new Error('File ID too long');
    }
    
    return sanitized;
  }

  private getFilePath(fileId: string): string {
    const safe = this.sanitizeFileId(fileId);
    const fullPath = path.join(this.storageDir, safe);
    
    // Verify path is within storage directory (prevent escaping via symlinks)
    const resolvedPath = path.resolve(fullPath);
    const resolvedStorageDir = path.resolve(this.storageDir);
    
    if (!resolvedPath.startsWith(resolvedStorageDir)) {
      throw new Error('Invalid file path - security violation');
    }
    
    return fullPath;
  }

  private getMetadataPath(fileId: string): string {
    const safe = this.sanitizeFileId(fileId);
    const fullPath = path.join(this.storageDir, `${safe}.meta.json`);
    
    // Verify path is within storage directory
    const resolvedPath = path.resolve(fullPath);
    const resolvedStorageDir = path.resolve(this.storageDir);
    
    if (!resolvedPath.startsWith(resolvedStorageDir)) {
      throw new Error('Invalid file path - security violation');
    }
    
    return fullPath;
  }

  async getUploadURL(): Promise<string> {
    const fileId = randomUUID();
    // Return our backend endpoint for filesystem upload
    return `/api/evidence/filesystem-upload?fileId=${fileId}`;
  }

  async saveFile(fileURL: string, userId: string, aclPolicy: ObjectAclPolicy): Promise<string> {
    // Extract fileId from URL (handles both /api/evidence/filesystem-upload?fileId=xxx and filesystem://xxx formats)
    let fileId: string;
    if (fileURL.includes('fileId=')) {
      const url = new URL(fileURL, 'http://localhost');
      fileId = url.searchParams.get('fileId') || randomUUID();
    } else if (fileURL.startsWith('filesystem://')) {
      fileId = fileURL.replace("filesystem://", "");
    } else {
      // Already uploaded, fileURL is the path
      return fileURL;
    }
    
    // Save metadata
    const metadata = {
      userId,
      visibility: aclPolicy.visibility,
      owner: aclPolicy.owner,
      uploadedAt: new Date().toISOString(),
    };

    const metadataPath = this.getMetadataPath(fileId);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    this.metadataMap.set(fileId, {
      userId: aclPolicy.owner,
      visibility: aclPolicy.visibility,
      mimeType: "application/octet-stream",
      size: 0,
    });

    return `/evidence/${fileId}`;
  }

  // Handle multipart file upload for filesystem storage
  async handleFileUpload(fileId: string, fileBuffer: Buffer, mimeType: string): Promise<void> {
    const filePath = this.getFilePath(fileId);
    await fs.writeFile(filePath, fileBuffer);
  }

  async downloadFile(filePath: string, userId: string, res: Response): Promise<void> {
    // Normalize path: remove all prefixes to get just the fileId
    const fileId = filePath
      .replace(/^\/objects\//, "")
      .replace(/^\/evidence\//, "")
      .replace(/^evidence\//, "");
    
    const fullPath = this.getFilePath(fileId);

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      throw new EvidenceNotFoundError();
    }

    // Verify access
    const canAccess = await this.canAccess(fileId, userId, ObjectPermission.READ);
    if (!canAccess) {
      throw new AccessDeniedError();
    }

    // Get metadata
    const metadataPath = this.getMetadataPath(fileId);
    let metadata = { visibility: "private", mimeType: "application/octet-stream" };
    
    try {
      const metadataContent = await fs.readFile(metadataPath, "utf-8");
      metadata = JSON.parse(metadataContent);
    } catch {
      // Use defaults if metadata doesn't exist
    }

    // Get file stats
    const stats = await fs.stat(fullPath);

    res.set({
      "Content-Type": metadata.mimeType || "application/octet-stream",
      "Content-Length": stats.size,
      "Cache-Control": `${metadata.visibility === "public" ? "public" : "private"}, max-age=3600`,
    });

    const stream = createReadStream(fullPath);
    stream.on("error", (err) => {
      console.error("Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error streaming file" });
      }
    });
    stream.pipe(res);
  }

  async deleteFile(filePath: string, userId: string): Promise<void> {
    // Normalize path: remove all prefixes to get just the fileId
    const fileId = filePath
      .replace(/^\/objects\//, "")
      .replace(/^\/evidence\//, "")
      .replace(/^evidence\//, "");
    
    const fullPath = this.getFilePath(fileId);
    const metadataPath = this.getMetadataPath(fileId);

    // Check if file exists first
    try {
      await fs.access(fullPath);
    } catch {
      throw new EvidenceNotFoundError();
    }

    const canDelete = await this.canAccess(fileId, userId, ObjectPermission.WRITE);
    if (!canDelete) {
      throw new AccessDeniedError();
    }

    // Delete file and metadata
    await fs.unlink(fullPath);
    await fs.unlink(metadataPath).catch(() => {}); // Ignore if metadata doesn't exist
    this.metadataMap.delete(fileId);
  }

  async canAccess(filePath: string, userId: string, permission: ObjectPermission): Promise<boolean> {
    // Normalize path: remove all prefixes to get just the fileId
    const fileId = filePath
      .replace(/^\/objects\//, "")
      .replace(/^\/evidence\//, "")
      .replace(/^evidence\//, "");
    
    const metadataPath = this.getMetadataPath(fileId);

    try {
      const metadataContent = await fs.readFile(metadataPath, "utf-8");
      const metadata = JSON.parse(metadataContent);

      // Public files are readable by anyone
      if (permission === ObjectPermission.READ && metadata.visibility === "public") {
        return true;
      }

      // Owner has full access
      if (metadata.owner === userId) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================
export function createEvidenceStorage(): IEvidenceStorage {
  // Use cloud object storage if available
  if (process.env.PRIVATE_OBJECT_DIR && (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCS_PROJECT_ID)) {
    console.log("✓ Using Cloud Object Storage for evidence files");
    return new CloudEvidenceStorage();
  }

  // Fall back to filesystem storage
  console.log("✓ Using Filesystem Storage for evidence files (Platform-agnostic)");
  return new FilesystemEvidenceStorage();
}

// Singleton instance
export const evidenceStorage = createEvidenceStorage();

// Error classes
export class EvidenceNotFoundError extends Error {
  constructor() {
    super("Evidence file not found");
    this.name = "EvidenceNotFoundError";
  }
}

export class AccessDeniedError extends Error {
  constructor() {
    super("Access denied to evidence file");
    this.name = "AccessDeniedError";
  }
}
