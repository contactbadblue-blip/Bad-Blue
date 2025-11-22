// API Routes - BadBlue
import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import multer from "multer";
import { z } from "zod";
import passport from "passport";
import crypto from 'crypto';
import archiver from 'archiver';
import { eq, and, sql, desc, asc } from 'drizzle-orm';

// Internal imports
import { storage } from "./storage";
import { db } from './db';
import * as schema from '@shared/schema';
import { 
  petitions, 
  petitionSignatures, 
  lawsuitFilings, 
  type User, 
  aiSubAgentLogs, 
  foiaRequests, 
  foiaStateStatutes, 
  savedProgress, 
  insertSavedProgressSchema, 
  appSettings, 
  adminSettingsAudit, 
  users, 
  subscriptionTiers, 
  userSubscriptions, 
  insertSubscriptionTierSchema, 
  insertUserSubscriptionSchema, 
  trialConsultations, 
  insertTrialConsultationSchema, 
  publicEvidence,
  insertComplaintSchema,
  insertLawsuitFilingSchema,
  insertContactMessageSchema,
  COMPLAINT_PRICING_CENTS,
  LAWSUIT_PRICING_CENTS,
  LAWSUIT_DIY_PRICING,
  LAWSUIT_DIY_PRICING_CENTS,
  LAWSUIT_FULL_SERVICE_PRICING,
  LAWSUIT_FULL_SERVICE_PRICING_CENTS,
  FULL_ACCESS_PRICING_CENTS,
  insertPetitionSchema,
  PETITION_PRICING_CENTS,
  insertFoiaRequestSchema,
  FOIA_REQUEST_PRICING_CENTS,
} from '@shared/schema';

// Email Service imports
import {
  sendAdminEmail,
  sendPurchaseConfirmationEmail,
  sendContactFormEmail,
  sendComplaintToVenue,
  sendTortNoticeToAgency,
  sendAdminTestEmail,
} from "./emailService";

// AI Services imports
import {
  analyzeBadgeImage,
  lookupOfficerInfo,
} from "./gemini";

import {
  generateLegalDocument,
  searchPublicRecords,
  analyzePatternsAndLearn,
  analyzeActionability,
  analyzeLegalIssue,
  searchLawsuitFormsAndRules,
  chatWithFormAssistant,
  researchRelevantStatutes,
  analyzeLocalDistrictRules,
  analyzeCaseLaw,
  redraftOffenseDescription,
} from "./legalAI";

// Officer Search imports
import { searchOfficer, searchOfficerInformation, searchProgressEmitter, type SearchProgress } from "./officerSearch";

// Evidence Storage imports  
import { evidenceStorage, EvidenceNotFoundError, AccessDeniedError } from "./evidenceStorage";
import { ObjectPermission } from "./objectAcl";

// AI Sub-Agent imports
import { 
  processSubAgentCommand, 
  trackUsage, 
  runComprehensiveDiagnostic, 
  undoLastSubAgentChange, 
  getLastSubAgentChange, 
  setAutonomousExecution, 
  getAutonomousExecutionStatus, 
  resetRateLimiter, 
  applyTrainingToSubAgent 
} from "./aiSubAgent";

// System Management imports
import { 
  runAutomatedCleanup, 
  getCleanupLogs, 
  getCleanupStats, 
  deleteOldErrorLogs, 
  getErrorLogCleanupHistory, 
  getErrorLogCleanupStats 
} from "./dataCleanup";

import { runFullDiagnostics } from "./systemDiagnostics";

// Rate Limiting imports
import {
  apiRateLimit,
  strictRateLimit,
  authRateLimit,
  paymentRateLimit,
  subAgentRateLimit,
  autosaveRateLimit,
} from "./rateLimit";

// Platform Configuration imports
import { getBaseURL } from "./platformConfig";

// Auth imports
import { setupAuth, isAuthenticated } from "./auth";
import { errorHandler, notFoundHandler, asyncHandler, ErrorTypes } from "./errorHandler";

// Lazy initialization for Stripe client
let stripe: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20" as any,
    });
  }
  return stripe;
}

// Multer setup for file uploads (in-memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin: Send custom email to any address
  app.post('/api/admin/send-custom-email', isAuthenticated, async (req, res) => {
    try {
      // Check admin access
      const user = (req as any).user;
      if (!user?.isAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Admin access required' 
        });
      }

      // Validate request body
      const schema = z.object({
        to: z.string().email(),
        subject: z.string().min(1),
        message: z.string().min(1),
      });

      const data = schema.parse(req.body);

      // Send email using existing Resend integration
      const success = await sendAdminEmail({
        to: data.to,
        subject: data.subject,
        message: data.message,
      });

      if (success) {
        res.json({ 
          success: true, 
          message: `Email sent successfully to ${data.to}` 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to send email. Please check Resend configuration.' 
        });
      }
    } catch (error: any) {
      console.error('[API] Error sending custom email:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid request data. Please check all fields.' 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: error.message || 'Failed to send email' 
        });
      }
    }
  });

  // Continue with rest of routes...
  // This is a placeholder - we'll need to copy the rest of the routes from the original file
  
  const httpServer = createServer(app);
  return httpServer;
}