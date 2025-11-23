// Supabase Storage Adapter - Evidence file storage migration

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdapter } from './supabaseAdapter';
import { randomUUID } from 'crypto';
import type { Response } from 'express';
import {
  ObjectAclPolicy,
  ObjectPermission,
} from "./objectAcl";

// Evidence storage interface (matching existing)
export interface ISupabaseStorage {
  getUploadURL(): Promise<string>;
  saveFile(fileURL: string, userId: string, aclPolicy: ObjectAclPolicy): Promise<string>;
  downloadFile(filePath: string, userId: string, res: Response): Promise<void>;
  deleteFile(filePath: string, userId: string): Promise<void>;
  canAccess(filePath: string, userId: string, permission: ObjectPermission): Promise<boolean>;
  handleFileUpload?(fileId: string, fileBuffer: Buffer, mimeType: string): Promise<void>;
}

class SupabaseStorageAdapter implements ISupabaseStorage {
  private client: SupabaseClient | null = null;
  private bucketName = 'evidence-files';
  
  constructor() {
    this.client = supabaseAdapter.getClient();
    this.initializeBucket();
  }
  
  private async initializeBucket() {
    if (!this.client || !supabaseAdapter.useSupabaseStorage()) {
      return;
    }
    
    try {
      // Check if bucket exists
      const { data: buckets } = await this.client.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === this.bucketName);
      
      if (!bucketExists) {
        // Create private bucket for evidence files
        const { error } = await this.client.storage.createBucket(this.bucketName, {
          public: false,
          allowedMimeTypes: ['image/*', 'video/*', 'application/pdf', 'audio/*'],
          fileSizeLimit: 100 * 1024 * 1024 // 100MB limit
        });
        
        if (error) {
          console.error('[SupabaseStorage] Failed to create bucket:', error);
        } else {
          console.log('[SupabaseStorage] Evidence bucket created successfully');
        }
      }
    } catch (error) {
      console.error('[SupabaseStorage] Bucket initialization error:', error);
    }
  }
  
  async getUploadURL(): Promise<string> {
    if (!this.client || !supabaseAdapter.useSupabaseStorage()) {
      throw new Error('Supabase Storage not configured');
    }
    
    const fileId = randomUUID();
    
    // Create a signed upload URL that expires in 5 minutes
    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .createSignedUploadUrl(fileId);
    
    if (error || !data) {
      throw new Error(`Failed to create upload URL: ${error?.message}`);
    }
    
    // Return the signed URL
    return data.signedUrl;
  }
  
  async saveFile(
    fileURL: string, 
    userId: string, 
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    // Extract file ID from URL
    const urlParts = fileURL.split('/');
    const fileId = urlParts[urlParts.length - 1].split('?')[0];
    
    // Store metadata in database (using existing storage layer)
    const { storage } = await import('./storage');
    
    // Create public evidence record if needed
    if (aclPolicy.visibility === 'public') {
      await storage.createPublicEvidence({
        userId,
        fileUrl: `/evidence/${fileId}`,
        fileName: fileId,
        fileType: 'application/octet-stream',
        description: null,
        officerName: null,
        department: null,
        location: null,
        incidentDate: null
      });
    }
    
    return `/evidence/${fileId}`;
  }
  
  async downloadFile(filePath: string, userId: string, res: Response): Promise<void> {
    if (!this.client || !supabaseAdapter.useSupabaseStorage()) {
      throw new Error('Supabase Storage not configured');
    }
    
    // Extract file ID from path
    const fileId = filePath
      .replace(/^\/objects\//, '')
      .replace(/^\/evidence\//, '')
      .replace(/^evidence\//, '');
    
    // Check access permissions
    const hasAccess = await this.canAccess(filePath, userId, 'read');
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    // Create signed URL for download (expires in 60 seconds)
    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .createSignedUrl(fileId, 60);
    
    if (error || !data) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    
    // Redirect to signed URL
    res.redirect(data.signedUrl);
  }
  
  async deleteFile(filePath: string, userId: string): Promise<void> {
    if (!this.client || !supabaseAdapter.useSupabaseStorage()) {
      throw new Error('Supabase Storage not configured');
    }
    
    // Extract file ID
    const fileId = filePath
      .replace(/^\/objects\//, '')
      .replace(/^\/evidence\//, '')
      .replace(/^evidence\//, '');
    
    // Check if user has delete permission
    const hasAccess = await this.canAccess(filePath, userId, 'delete');
    if (!hasAccess) {
      throw new Error('Permission denied');
    }
    
    // Delete from Supabase Storage
    const { error } = await this.client.storage
      .from(this.bucketName)
      .remove([fileId]);
    
    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
    
    // Remove from database if it was public evidence
    const { storage } = await import('./storage');
    const publicEvidence = await storage.getPublicEvidence();
    const evidence = publicEvidence.find(e => e.fileUrl === `/evidence/${fileId}`);
    
    if (evidence) {
      await storage.deletePublicEvidence(evidence.id);
    }
  }
  
  async canAccess(
    filePath: string, 
    userId: string, 
    permission: ObjectPermission
  ): Promise<boolean> {
    // For Supabase Storage, check database records for access control
    const { storage } = await import('./storage');
    
    // Admin bypass always has access
    if (userId === 'admin-bypass') {
      return true;
    }
    
    // Extract file ID
    const fileId = filePath
      .replace(/^\/objects\//, '')
      .replace(/^\/evidence\//, '')
      .replace(/^evidence\//, '');
    
    // Check if it's public evidence
    const publicEvidence = await storage.getPublicEvidence();
    const isPublic = publicEvidence.some(e => e.fileUrl === `/evidence/${fileId}`);
    
    if (isPublic && permission === 'read') {
      return true; // Public files can be read by anyone
    }
    
    // For write/delete, check if user owns the file
    const evidence = publicEvidence.find(e => e.fileUrl === `/evidence/${fileId}`);
    if (evidence && evidence.userId === userId) {
      return true; // Owner has full access
    }
    
    return false;
  }
  
  async handleFileUpload(fileId: string, fileBuffer: Buffer, mimeType: string): Promise<void> {
    if (!this.client || !supabaseAdapter.useSupabaseStorage()) {
      throw new Error('Supabase Storage not configured');
    }
    
    // Upload file to Supabase Storage
    const { error } = await this.client.storage
      .from(this.bucketName)
      .upload(fileId, fileBuffer, {
        contentType: mimeType,
        upsert: true
      });
    
    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }
}

// Export singleton instance
export const supabaseStorage = new SupabaseStorageAdapter();

// Factory function to get storage implementation
export function createSupabaseStorage(): ISupabaseStorage | null {
  if (supabaseAdapter.useSupabaseStorage()) {
    return supabaseStorage;
  }
  return null;
}