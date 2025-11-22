// Email service for BadBlue using Resend API
// This replaces the old GWSMTP/SMTP email implementation

import { Resend } from 'resend';
import { db } from './db';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';

// Initialize Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable must be set');
    }
    
    resendClient = new Resend(apiKey);
  }
  
  return resendClient;
}

// Export for external verification
export const emailTransporter = {
  verify: async () => {
    try {
      const client = getResendClient();
      // Test the API key by attempting to retrieve domains (lightweight check)
      const response = await client.domains.list();
      console.log('[RESEND] ✓ Email service verified - API key is valid');
      return true;
    } catch (error: any) {
      console.error('[RESEND] ✗ Email service verification failed:', error.message);
      return false;
    }
  }
};

async function getEmailSettings() {
  try {
    // Add timeout to prevent hanging on database connection issues
    const settingsPromise = Promise.all([
      db.select()
        .from(schema.appSettings)
        .where(eq(schema.appSettings.key, 'support_from_email'))
        .limit(1),
      db.select()
        .from(schema.appSettings)
        .where(eq(schema.appSettings.key, 'support_from_name'))
        .limit(1)
    ]);

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 2000)
    );

    const [fromEmailResults, fromNameResults] = await Promise.race([
      settingsPromise,
      timeoutPromise
    ]) as any[];

    const fromEmailSetting = fromEmailResults?.[0];
    const fromNameSetting = fromNameResults?.[0];

    // Use settings from database or defaults
    return {
      fromEmail: fromEmailSetting?.value || process.env.RESEND_FROM_EMAIL || 'support@bad-blue.com',
      fromName: fromNameSetting?.value || 'BadBlue',
    };
  } catch (error: any) {
    console.error('[RESEND] Error loading email settings from database, using default:', error.message || error);
    return {
      fromEmail: process.env.RESEND_FROM_EMAIL || 'support@bad-blue.com',
      fromName: 'BadBlue',
    };
  }
}

/**
 * Send email using Resend API
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
  attachments,
}: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}) {
  try {
    // Check for API key
    if (!process.env.RESEND_API_KEY) {
      console.error('[RESEND] ✗ RESEND_API_KEY not set in environment variables');
      console.error('[RESEND] Please add your Resend API key to continue');
      return false;
    }
    
    console.log('[RESEND] ✓ API key verified - proceeding to send email');
    
    // Get Resend client
    const client = getResendClient();
    
    // Load settings from database if from address not provided
    if (!from) {
      const settings = await getEmailSettings();
      from = `${settings.fromName} <${settings.fromEmail}>`;
    }
    
    // Prepare email data
    const emailData: any = {
      from: from || 'BadBlue <support@bad-blue.com>',
      to: Array.isArray(to) ? to : [to],
      subject,
    };
    
    // Add content (prefer HTML over text)
    if (html) {
      emailData.html = html;
    } else if (text) {
      emailData.text = text;
    } else {
      console.error('[RESEND] ✗ No email content provided (neither html nor text)');
      return false;
    }
    
    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailData.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        content_type: att.contentType,
      }));
    }
    
    // Send email
    const response = await client.emails.send(emailData);
    
    if (response.data?.id) {
      console.log(`[RESEND] ✓ Email sent successfully`);
      console.log(`[RESEND]   - To: ${Array.isArray(to) ? to.join(', ') : to}`);
      console.log(`[RESEND]   - Subject: ${subject}`);
      console.log(`[RESEND]   - Email ID: ${response.data.id}`);
      return true;
    } else {
      console.error('[RESEND] ✗ Email sending failed - no email ID returned');
      console.error('[RESEND]   Response:', response);
      return false;
    }
    
  } catch (error: any) {
    console.error(`[RESEND] ✗ Failed to send email:`, error.message);
    
    // Log detailed error information for debugging
    if (error.statusCode === 401) {
      console.error('[RESEND] Authentication failed - check RESEND_API_KEY');
    } else if (error.statusCode === 403) {
      console.error('[RESEND] Forbidden - check domain verification or API permissions');
    } else if (error.statusCode === 422) {
      console.error('[RESEND] Invalid request - check email addresses and content');
      console.error('[RESEND] Error details:', error.response?.data);
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('[RESEND] Network error - check internet connection');
    } else {
      console.error('[RESEND] Error details:', error);
    }
    
    return false;
  }
}

/**
 * Send email via Resend (compatibility function for existing code)
 * @deprecated Use sendEmail instead
 */
export async function sendMail(
  to: string,
  subject: string,
  html: string | undefined,
  text?: string,
  from?: string,
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>
): Promise<boolean> {
  return sendEmail({
    to,
    subject,
    html,
    text,
    from,
    attachments,
  });
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(userEmail: string, userName?: string) {
  const subject = 'Welcome to BadBlue - Your Police Accountability Platform';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">Welcome to BadBlue</h1>
        <p style="margin-top: 10px; color: #cccccc;">Your Professional Police Accountability Platform</p>
      </div>
      
      <div style="padding: 30px; background-color: #f5f5f5;">
        <h2 style="color: #333;">Hello ${userName || 'there'}!</h2>
        
        <p style="color: #666; line-height: 1.6;">
          Thank you for joining BadBlue. We're committed to helping you protect your civil rights and hold law enforcement accountable.
        </p>
        
        <h3 style="color: #333; margin-top: 30px;">What You Can Do Now:</h3>
        <ul style="color: #666; line-height: 1.8;">
          <li><strong>File Police Complaints:</strong> Report misconduct with professional documentation</li>
          <li><strong>Submit FOIA Requests:</strong> Access police records and body camera footage</li>
          <li><strong>File Section 1983 Lawsuits:</strong> Sue for constitutional violations</li>
          <li><strong>Research Officers:</strong> Access our comprehensive officer database</li>
          <li><strong>Store Evidence:</strong> Securely manage your documentation</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://bad-blue.com/dashboard" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Get Started
          </a>
        </div>
        
        <p style="color: #999; font-size: 14px; margin-top: 30px;">
          If you have any questions, feel free to contact our support team at support@bad-blue.com
        </p>
      </div>
      
      <div style="padding: 20px; background-color: #333; color: #999; text-align: center; font-size: 12px;">
        <p style="margin: 0;">© 2025 BadBlue. All rights reserved.</p>
        <p style="margin: 5px 0;">Professional Police Accountability Platform</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: userEmail,
    subject,
    html,
  });
}

/**
 * Send confirmation email for complaints, lawsuits, etc.
 */
export async function sendConfirmationEmail(
  userEmail: string,
  type: 'complaint' | 'lawsuit' | 'foia' | 'petition',
  referenceNumber: string
) {
  const typeLabels = {
    complaint: 'Police Complaint',
    lawsuit: 'Section 1983 Lawsuit',
    foia: 'FOIA Request',
    petition: 'Petition',
  };
  
  const subject = `${typeLabels[type]} Confirmed - Reference #${referenceNumber}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">Submission Confirmed</h1>
        <p style="margin-top: 10px; color: #cccccc;">Your ${typeLabels[type]} has been received</p>
      </div>
      
      <div style="padding: 30px; background-color: #f5f5f5;">
        <div style="background-color: #d4f4dd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p style="margin: 0; color: #2d6a3d;">
            <strong>✓ Successfully Submitted</strong><br>
            Reference Number: <strong>${referenceNumber}</strong>
          </p>
        </div>
        
        <h3 style="color: #333;">What Happens Next:</h3>
        <ol style="color: #666; line-height: 1.8;">
          <li>Your submission has been logged in our system</li>
          <li>Documents are being generated and processed</li>
          <li>We will route your submission to the appropriate authorities</li>
          <li>You can track the status in your dashboard</li>
        </ol>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://bad-blue.com/dashboard" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View in Dashboard
          </a>
        </div>
        
        <p style="color: #999; font-size: 14px; margin-top: 30px;">
          Keep this reference number for your records: <strong>${referenceNumber}</strong>
        </p>
      </div>
      
      <div style="padding: 20px; background-color: #333; color: #999; text-align: center; font-size: 12px;">
        <p style="margin: 0;">© 2025 BadBlue. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: userEmail,
    subject,
    html,
  });
}

/**
 * Send purchase confirmation email
 */
export async function sendPurchaseConfirmationEmail(details: {
  firstName: string;
  email: string;
  type: 'complaint' | 'lawsuit' | 'foia' | 'petition';
  amount: number;
  officerName: string;
  incidentDate: string;
  state: string;
  document: string;
  submissionVenue: string;
  submissionEmail: string;
}) {
  const typeLabels = {
    complaint: 'Police Complaint',
    lawsuit: 'Section 1983 Lawsuit',
    foia: 'FOIA Request',
    petition: 'Petition',
  };
  
  const subject = `${typeLabels[details.type]} Purchase Confirmation`;
  const amountFormatted = (details.amount / 100).toFixed(2);
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">Purchase Confirmation</h1>
        <p style="margin-top: 10px; color: #cccccc;">${typeLabels[details.type]}</p>
      </div>
      
      <div style="padding: 30px; background-color: #f5f5f5;">
        <p style="color: #666;">Dear ${details.firstName},</p>
        
        <div style="background-color: #d4f4dd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #2d6a3d;">
            <strong>✓ Payment Successful - $${amountFormatted}</strong>
          </p>
        </div>
        
        <h3 style="color: #333;">Details:</h3>
        <ul style="color: #666;">
          <li>Type: ${typeLabels[details.type]}</li>
          <li>Officer: ${details.officerName}</li>
          <li>Incident Date: ${details.incidentDate}</li>
          <li>State: ${details.state}</li>
          <li>Submission Venue: ${details.submissionVenue}</li>
        </ul>
        
        <p style="color: #666;">${details.document}</p>
      </div>
      
      <div style="padding: 20px; background-color: #333; color: #999; text-align: center; font-size: 12px;">
        <p style="margin: 0;">© 2025 BadBlue. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: details.email,
    subject,
    html,
  });
}

/**
 * Send contact form email
 */
export async function sendContactFormEmail(details: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || ['admin@bad-blue.com'];
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #0066cc; color: white; padding: 15px;">
        <h2 style="margin: 0;">New Contact Form Submission</h2>
      </div>
      
      <div style="padding: 20px; background-color: #f5f5f5;">
        <h3>${details.subject}</h3>
        
        <p><strong>From:</strong> ${details.name} (${details.email})</p>
        
        <div style="padding: 15px; background-color: white; border: 1px solid #ddd; margin: 20px 0;">
          <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${details.message}</pre>
        </div>
        
        <p style="color: #999; font-size: 12px;">
          Timestamp: ${new Date().toISOString()}
        </p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: adminEmails,
    subject: `[BadBlue Contact] ${details.subject}`,
    html,
    from: 'BadBlue Contact Form <contact@bad-blue.com>',
  });
}

/**
 * Send complaint to venue
 */
export async function sendComplaintToVenue(details: {
  venueEmail: string;
  complaintType: string;
  officerName: string;
  officerBadge: string;
  department: string;
  state: string;
  city: string;
  county?: string;
  incidentDate: string;
  description: string;
  attachment?: Buffer;
}) {
  const subject = `Police Misconduct Complaint - Officer ${details.officerName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">Formal Police Misconduct Complaint</h1>
      </div>
      
      <div style="padding: 30px; background-color: #f5f5f5;">
        <h3 style="color: #333;">Complaint Details:</h3>
        <ul style="color: #666;">
          <li><strong>Officer Name:</strong> ${details.officerName}</li>
          <li><strong>Badge Number:</strong> ${details.officerBadge || 'Not provided'}</li>
          <li><strong>Department:</strong> ${details.department}</li>
          <li><strong>State:</strong> ${details.state}</li>
          <li><strong>City:</strong> ${details.city}</li>
          ${details.county ? `<li><strong>County:</strong> ${details.county}</li>` : ''}
          <li><strong>Incident Date:</strong> ${details.incidentDate}</li>
          <li><strong>Complaint Type:</strong> ${details.complaintType}</li>
        </ul>
        
        <h3 style="color: #333;">Description of Incident:</h3>
        <div style="padding: 15px; background-color: white; border: 1px solid #ddd;">
          <p style="color: #666; white-space: pre-wrap;">${details.description}</p>
        </div>
        
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          This complaint has been filed through BadBlue Police Accountability Platform<br>
          Submitted on: ${new Date().toISOString()}
        </p>
      </div>
    </div>
  `;
  
  const attachments = details.attachment ? [{
    filename: `complaint_${details.officerName.replace(/\s+/g, '_')}_${details.incidentDate}.pdf`,
    content: details.attachment,
    contentType: 'application/pdf',
  }] : undefined;
  
  return sendEmail({
    to: details.venueEmail,
    subject,
    html,
    from: 'BadBlue Complaints <complaints@bad-blue.com>',
    attachments,
  });
}

/**
 * Send tort notice to agency
 */
export async function sendTortNoticeToAgency(details: {
  agencyEmail: string;
  agencyName: string;
  state: string;
  claimantName: string;
  incidentDate: string;
  description: string;
  amount: number;
  attachment?: Buffer;
}) {
  const subject = `Tort Claim Notice - ${details.claimantName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #8b0000; color: #ffffff; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">FORMAL TORT CLAIM NOTICE</h1>
        <p style="margin-top: 10px;">Pursuant to State Tort Claims Act</p>
      </div>
      
      <div style="padding: 30px; background-color: #f5f5f5;">
        <p><strong>TO:</strong> ${details.agencyName}</p>
        <p><strong>RE:</strong> Notice of Tort Claim</p>
        
        <div style="background-color: #fff3cd; padding: 15px; border: 2px solid #ffc107; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>IMPORTANT LEGAL NOTICE</strong><br>
            This constitutes formal notice of a tort claim against your agency.
          </p>
        </div>
        
        <h3 style="color: #333;">Claim Information:</h3>
        <ul style="color: #666;">
          <li><strong>Claimant:</strong> ${details.claimantName}</li>
          <li><strong>Incident Date:</strong> ${details.incidentDate}</li>
          <li><strong>State:</strong> ${details.state}</li>
          <li><strong>Claim Amount:</strong> $${details.amount.toLocaleString()}</li>
        </ul>
        
        <h3 style="color: #333;">Description of Claim:</h3>
        <div style="padding: 15px; background-color: white; border: 1px solid #ddd;">
          <p style="color: #666; white-space: pre-wrap;">${details.description}</p>
        </div>
        
        <p style="color: #666; margin-top: 20px;">
          <strong>RESPONSE REQUIRED:</strong> Please acknowledge receipt of this notice and respond within the statutory timeframe as required by law.
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Filed through BadBlue Legal Services<br>
          Date: ${new Date().toISOString()}
        </p>
      </div>
    </div>
  `;
  
  const attachments = details.attachment ? [{
    filename: `tort_claim_${details.claimantName.replace(/\s+/g, '_')}_${details.incidentDate}.pdf`,
    content: details.attachment,
    contentType: 'application/pdf',
  }] : undefined;
  
  return sendEmail({
    to: details.agencyEmail,
    subject,
    html,
    from: 'BadBlue Legal Services <legal@bad-blue.com>',
    attachments,
  });
}

/**
 * Send petition zip email
 */
export async function sendPetitionZipEmail(
  email: string,
  petitionTitle: string,
  zipBuffer: Buffer,
  zipFilename: string
) {
  const subject = `Your Petition Signatures: ${petitionTitle}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">Petition Signatures Export</h1>
        <p style="margin-top: 10px; color: #cccccc;">${petitionTitle}</p>
      </div>
      
      <div style="padding: 30px; background-color: #f5f5f5;">
        <p style="color: #666;">
          Your petition signatures have been compiled and are attached to this email as a ZIP file.
        </p>
        
        <h3 style="color: #333;">File Contents:</h3>
        <ul style="color: #666;">
          <li>CSV file with all signature data</li>
          <li>PDF summary report</li>
          <li>Export timestamp and metadata</li>
        </ul>
        
        <p style="color: #666; margin-top: 20px;">
          <strong>Note:</strong> This file contains sensitive personal information. Please handle it securely and in accordance with privacy regulations.
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Export generated: ${new Date().toISOString()}
        </p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    html,
    attachments: [{
      filename: zipFilename,
      content: zipBuffer,
      contentType: 'application/zip',
    }],
  });
}

/**
 * Send user email (admin to user)
 */
export async function sendUserEmail(
  toEmail: string,
  subject: string,
  message: string,
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">BadBlue Admin Message</h1>
      </div>
      
      <div style="padding: 30px; background-color: #f5f5f5;">
        <div style="padding: 15px; background-color: white; border: 1px solid #ddd;">
          <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; color: #333; margin: 0;">${message}</pre>
        </div>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This message was sent from BadBlue Admin<br>
          Date: ${new Date().toISOString()}
        </p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: toEmail,
    subject,
    html,
    from: 'BadBlue Admin <admin@bad-blue.com>',
    attachments,
  });
}

/**
 * Send admin notification email
 */
export async function sendAdminNotification(
  subject: string,
  content: string,
  data?: any
) {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || ['admin@bad-blue.com'];
  
  const html = `
    <div style="font-family: monospace; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #ff6b6b; color: white; padding: 15px;">
        <h2 style="margin: 0;">Admin Notification</h2>
      </div>
      
      <div style="padding: 20px; background-color: #f5f5f5;">
        <h3>${subject}</h3>
        <pre style="white-space: pre-wrap; color: #333;">${content}</pre>
        
        ${data ? `
        <div style="margin-top: 20px; padding: 15px; background-color: white; border: 1px solid #ddd;">
          <h4>Additional Data:</h4>
          <pre style="white-space: pre-wrap; font-size: 12px; color: #666;">${JSON.stringify(data, null, 2)}</pre>
        </div>
        ` : ''}
        
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          Timestamp: ${new Date().toISOString()}
        </p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: adminEmails,
    subject: `[BadBlue Admin] ${subject}`,
    html,
    from: 'BadBlue System <system@bad-blue.com>',
  });
}