// Platform-agnostic evidence storage system
import { Response } from "express";
import { randomUUID } from "crypto";
import * as fs from "fs/promises";
import * as path from "path";
import { createReadStream, createWriteStream } from "fs";
import { Storage, File } from "@google-cloud/storage";
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
// REPLIT OBJECT STORAGE IMPLEMENTATION
// ============================================
class ReplitEvidenceStorage implements IEvidenceStorage {
  private storageClient: Storage;
  private sidecarEndpoint: string;

  constructor() {
    this.sidecarEndpoint = process.env.REPLIT_SIDECAR_ENDPOINT || "http://127.0.0.1:1106";
    
    this.storageClient = new Storage({
      credentials: {
        audience: "replit",
        subject_token_type: "access_token",
        token_url: `${this.sidecarEndpoint}/token`,
        type: "external_account",
        credential_source: {
          url: `${this.sidecarEndpoint}/credential`,
          format: {
            type: "json",
            subject_token_field_name: "access_token",
          },
        },
        universe_domain: "googleapis.com",
      },
      projectId: "",
    });
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
    const privateDir = this.getPrivateObjectDir();
    const objectPath = `${privateDir}/${randomUUID()}`;
    
    const response = await fetch(
      `${this.sidecarEndpoint}/object-storage/signed-object-url`,
      {
        method: "POST",
        body: JSON.stringify({
          bucket: this.parseObjectPath(objectPath).bucketName,
          name: this.parseObjectPath(objectPath).objectName,
          method: "PUT",
        }),
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url as string;
  }

  async saveFile(fileURL: string, userId: string, aclPolicy: ObjectAclPolicy): Promise<string> {
    const objectPath = new URL(fileURL).pathname;
    const { bucketName, objectName } = this.parseObjectPath(objectPath);
    const bucket = this.storageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    await setObjectAclPolicy(file, aclPolicy);
    return objectPath;
  }

  async downloadFile(filePath: string, userId: string, res: Response): Promise<void> {
    const { bucketName, objectName } = this.parseObjectPath(filePath);
    const bucket = this.storageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    const [exists] = await file.exists();
    if (!exists) {
      throw new Error("File not found");
    }

    // Verify access
    const canAccess = await this.canAccess(filePath, userId, ObjectPermission.READ);
    if (!canAccess) {
      throw new Error("Access denied");
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
    const { bucketName, objectName } = this.parseObjectPath(filePath);
    const bucket = this.storageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    const canDelete = await this.canAccess(filePath, userId, ObjectPermission.WRITE);
    if (!canDelete) {
      throw new Error("Access denied");
    }

    await file.delete();
  }

  async canAccess(filePath: string, userId: string, permission: ObjectPermission): Promise<boolean> {
    const { bucketName, objectName } = this.parseObjectPath(filePath);
    const bucket = this.storageClient.bucket(bucketName);
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

  private getFilePath(fileId: string): string {
    return path.join(this.storageDir, fileId);
  }

  private getMetadataPath(fileId: string): string {
    return path.join(this.storageDir, `${fileId}.meta.json`);
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
    const fileId = filePath.replace("/evidence/", "").replace("/objects/evidence/", "");
    const fullPath = this.getFilePath(fileId);

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      throw new Error("File not found");
    }

    // Verify access
    const canAccess = await this.canAccess(filePath, userId, ObjectPermission.READ);
    if (!canAccess) {
      throw new Error("Access denied");
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
    const fileId = filePath.replace("/evidence/", "").replace("/objects/evidence/", "");
    const fullPath = this.getFilePath(fileId);
    const metadataPath = this.getMetadataPath(fileId);

    const canDelete = await this.canAccess(filePath, userId, ObjectPermission.WRITE);
    if (!canDelete) {
      throw new Error("Access denied");
    }

    // Delete file and metadata
    await fs.unlink(fullPath);
    await fs.unlink(metadataPath).catch(() => {}); // Ignore if metadata doesn't exist
    this.metadataMap.delete(fileId);
  }

  async canAccess(filePath: string, userId: string, permission: ObjectPermission): Promise<boolean> {
    const fileId = filePath.replace("/evidence/", "").replace("/objects/evidence/", "");
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
  // Use Replit object storage if available
  if (process.env.PRIVATE_OBJECT_DIR && process.env.REPLIT_SIDECAR_ENDPOINT !== "disabled") {
    console.log("✓ Using Replit Object Storage for evidence files");
    return new ReplitEvidenceStorage();
  }

  // Fall back to filesystem storage
  console.log("✓ Using Filesystem Storage for evidence files (Railway/Platform-agnostic)");
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
