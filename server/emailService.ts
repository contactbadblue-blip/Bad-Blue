// Email service for BadBlue - SMTP only
// Add GWSMTP_USER and GWSMTP_PASS in Replit Secrets

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { db } from './db';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { sendMail as sendViaSMTP } from './mailer';
import { getBaseURL } from './platformConfig';

// Lazy initialize transporter
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    // Use App Password (GWSMTP_PASSWORD) if available, removing spaces
    // Fall back to regular password (GWSMTP_PASS) if App Password not set
    const password = process.env.GWSMTP_PASSWORD 
      ? process.env.GWSMTP_PASSWORD.replace(/\s/g, '') // Remove spaces from App Password
      : process.env.GWSMTP_PASS;
    
    if (!password) {
      throw new Error('GWSMTP_PASSWORD or GWSMTP_PASS environment variable must be set');
    }

    const businessEmail = process.env.GWSMTP_USER || 'contact.badblue@gmail.com';
    
    transporter = nodemailer.createTransporter({
      host: process.env.GWSMTP_HOST || 'smtp.gmail.com',
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: businessEmail,
        pass: password,
      },
    });
  }
  return transporter;
}

// Export transporter getter for external use
export const emailTransporter = {
  verify: async () => {
    const tp = getTransporter();
    return tp.verify();
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

    // Always use contact.badblue@gmail.com as primary sender
    return {
      fromEmail: 'contact.badblue@gmail.com',
      fromName: 'BadBlue',
    };
  } catch (error: any) {
    console.error('[EMAIL] Error loading email settings from database, using default:', error.message || error);
    // Always use contact.badblue@gmail.com as primary sender
    return {
      fromEmail: 'contact.badblue@gmail.com',
      fromName: 'BadBlue',
    };
  }
}

export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  // Check SMTP credentials with detailed logging
  const hasUser = !!process.env.GWSMTP_USER;
  // Check for App Password first, then fall back to regular password
  const hasPass = !!process.env.GWSMTP_PASSWORD || !!process.env.GWSMTP_PASS;
  
  if (!hasUser || !hasPass) {
    console.error('[EMAIL] ✗ SMTP credentials check failed:');
    console.error('[EMAIL]   - GWSMTP_USER present:', hasUser);
    console.error('[EMAIL]   - GWSMTP_PASSWORD present:', !!process.env.GWSMTP_PASSWORD);
    console.error('[EMAIL]   - GWSMTP_PASS present:', !!process.env.GWSMTP_PASS);
    console.error('[EMAIL] Please verify these secrets are set in environment variables');
    return false;
  }
  
  console.log('[EMAIL] ✓ SMTP credentials verified - proceeding to send email');

  // Load settings from database if from address not provided
  if (!from) {
    const settings = await getEmailSettings();
    from = `${settings.fromName} <${settings.fromEmail}>`;
  }

  // Use the existing sendViaSMTP function for sending
  const success = await sendViaSMTP(to, subject, html, undefined, from);

  if (success) {
    console.log(`[EMAIL] ✓ Email sent to ${to}`);
  } else {
    console.error(`[EMAIL] ✗ Failed to send email to ${to}`);
  }

  return success;
}


interface WelcomeEmailData {
  firstName: string;
  email: string;
}

interface PurchaseConfirmationData {
  firstName: string;
  email: string;
  type: 'complaint' | 'lawsuit' | 'full_access' | 'petition' | 'foia';
  amount: number;
  officerName?: string;
  incidentDate?: string;
  state?: string;
  document?: string; // The generated document text (lawsuit, petition, FOIA, etc.)
  submissionVenue?: string;
  submissionEmail?: string;
  submissionAddress?: string;
  filingInstructions?: string; // For user-filed lawsuits
  serviceName?: string; // Human-readable service name
}

interface AdminEmailData {
  to: string;
  subject: string;
  message: string;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(data: {
  email: string;
  firstName: string;
  resetLink: string;
}): Promise<boolean> {
  try {
    const subject = 'Password Reset Request - BadBlue';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 14px; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeebf; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Password Reset Request</h2>
        </div>
        <div class="content">
          <p>Hello ${data.firstName},</p>
          
          <p>We received a request to reset your password for your BadBlue account. If you didn't make this request, you can safely ignore this email.</p>
          
          <p>To reset your password, click the button below:</p>
          
          <div style="text-align: center;">
            <a href="${data.resetLink}" class="button">Reset Your Password</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #3498db; font-size: 14px;">${data.resetLink}</p>
          
          <div class="warning">
            <p style="margin: 0;"><strong>⚠️ Important:</strong></p>
            <ul style="margin: 10px 0;">
              <li>This link will expire in 1 hour for security reasons</li>
              <li>You can only use this link once</li>
              <li>If you didn't request this reset, please ignore this email</li>
            </ul>
          </div>
          
          <p>After resetting your password, you'll be able to log in with your new credentials.</p>
          
          <div class="footer">
            <p><strong>Need help?</strong><br>
            Contact our support team at contact.badblue@gmail.com</p>
            <p style="color: #999; font-size: 12px;">
              BadBlue - Empowering Citizens Through Police Accountability<br>
              © ${new Date().getFullYear()} BadBlue. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the email using the standard email function
    const success = await sendEmail({
      to: data.email,
      subject,
      html,
      from: 'BadBlue <contact.badblue@gmail.com>'
    });

    if (success) {
      console.log(`[EMAIL] Password reset email sent to ${data.email}`);
    } else {
      console.error(`[EMAIL] Failed to send password reset email to ${data.email}`);
    }

    return success;
  } catch (error: any) {
    console.error('[EMAIL] Error sending password reset email:', error);
    return false;
  }
}

/**
 * Get dynamic from address from database settings or environment fallbacks
 */
async function getFromAddress(): Promise<string> {
  try {
    const { sql } = await import('drizzle-orm');

    // Add timeout protection
    const settingsPromise = db.query.appSettings.findMany({
      where: sql`key IN ('support_from_email', 'support_from_name')`,
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 2000)
    );

    const settings = await Promise.race([
      settingsPromise,
      timeoutPromise
    ]) as any[];

    // Always use contact.badblue@gmail.com as primary sender
    return `BadBlue <contact.badblue@gmail.com>`;
  } catch (error: any) {
    console.error('[EMAIL] Error fetching from address settings, using default:', error.message || error);
    // Always use contact.badblue@gmail.com as primary sender
    return `BadBlue <contact.badblue@gmail.com>`;
  }
}

/**
 * Compose welcome email as plain text
 */
function composeWelcomeEmailText(data: WelcomeEmailData): string {
  const baseUrl = getBaseURL();
  return `Hello ${data.firstName},

Welcome to BadBlue! We're honored that you've chosen us as your partner in pursuing police accountability and justice.

BadBlue is more than just a platform—it's a movement toward transparency, fairness, and constitutional rights protection. Our mission is to make the complaint and lawsuit filing process accessible, affordable, and effective for every citizen.

SERVICES WE PROVIDE:

1. LegalAI Consultation (FREE for signed-in users)
   Access our AI-powered legal research assistant to analyze your case, review applicable laws, and assess the strength of your claims before taking action.

2. Officer Search (FREE for signed-in users)
   Our advanced AI system helps you identify and gather public information about police officers involved in your incident.

3. Police Complaint Filing ($39.75)
   File formal complaints against officers with the appropriate department or oversight agency. We handle routing, formatting, and submission.

4. Civil Rights Petitions ($27.98)
   Initiate petitions to demand policy changes, accountability measures, or public awareness campaigns in your community.

5. DIY Lawsuit Assistance ($265.27)
   Receive complete instructions, legal forms, and guidance to file your own civil rights lawsuit in the appropriate court.

6. Full-Service Lawsuit Filing ($503.75)
   We prepare and file your lawsuit on your behalf, handling all paperwork and submission requirements professionally.

7. FOIA Records Requests ($24.65)
   Generate and submit Freedom of Information Act requests to obtain police reports, body camera footage, and other critical evidence.

PROBLEMS WE SOLVE:

- Difficulty navigating complex legal systems without expensive attorneys
- Lack of access to affordable police accountability resources
- Uncertainty about which legal remedies are available for civil rights violations
- Time-consuming paperwork and filing procedures
- Limited knowledge of state-specific laws and requirements

Whether you're seeking accountability for police misconduct, pursuing justice for civil rights violations, or simply exploring your legal options, BadBlue provides the tools and guidance you need.

Log in to your account at any time to access our services: ${baseUrl}

If you have any questions or need assistance, our support team is here to help at contact.badblue@gmail.com.

Sincerely,
BadBlue`;
}

/**
 * Compose purchase confirmation email as plain text
 */
function composeConfirmationEmailText(data: PurchaseConfirmationData): string {
  const baseUrl = getBaseURL();
  let email = `Hello ${data.firstName},

Thank you for your purchase!

`;

  // Service description based on type
  switch (data.type) {
    case 'complaint':
      email += `SERVICE PURCHASED: Police Complaint Filing ($${(data.amount / 100).toFixed(2)})

You have successfully filed a formal complaint against ${data.officerName || 'the officer(s)'} for the incident on ${data.incidentDate || '[date]'}.

SUBMISSION DETAILS:
Venue: ${data.submissionVenue || 'Not specified'}
Email: ${data.submissionEmail || 'Not specified'}
Address: ${data.submissionAddress || 'Not specified'}

Your complaint has been automatically submitted to the appropriate oversight agency. You should receive a case number or acknowledgment within 5-10 business days.

`;
      break;

    case 'petition':
      email += `SERVICE PURCHASED: Civil Rights Petition ($${(data.amount / 100).toFixed(2)})

You have successfully created a petition to demand accountability and policy change.

PETITION TEXT:
${data.document ? '---BEGIN PETITION---\n' + data.document + '\n---END PETITION---\n' : 'Petition text not available'}

This petition will be circulated to gather community support. Share it with others who believe in police accountability and civil rights protection.

`;
      break;

    case 'foia':
      email += `SERVICE PURCHASED: FOIA Records Request ($${(data.amount / 100).toFixed(2)})

Your Freedom of Information Act request has been prepared and is ready for submission.

FOIA REQUEST:
${data.document ? '---BEGIN FOIA REQUEST---\n' + data.document + '\n---END FOIA REQUEST---\n' : 'FOIA request text not available'}

${data.submissionEmail ? `This request has been submitted to: ${data.submissionEmail}\n` : ''}
${data.submissionAddress ? `Mailing address: ${data.submissionAddress}\n` : ''}

The agency has 20 business days to respond to your request. You may receive a tracking number or acknowledgment letter.

`;
      break;

    case 'lawsuit':
      if (data.filingInstructions) {
        // User-filed lawsuit (DIY)
        email += `SERVICE PURCHASED: DIY Lawsuit Assistance ($${(data.amount / 100).toFixed(2)})

You have received complete instructions and documentation to file your own civil rights lawsuit in ${data.state || 'your state'}.

FILING INSTRUCTIONS:
${data.filingInstructions}

YOUR LAWSUIT DOCUMENT:
${data.document ? '---BEGIN LAWSUIT---\n' + data.document + '\n---END LAWSUIT---\n' : 'Lawsuit document not available'}

Please follow the instructions carefully and ensure all documents are filed within the required timeframes. Consider consulting with a local attorney if you have questions about the filing process.

`;
      } else {
        // Full-service lawsuit
        email += `SERVICE PURCHASED: Full-Service Lawsuit Filing ($${(data.amount / 100).toFixed(2)})

Bad Blue has prepared and will file your civil rights lawsuit on your behalf.

YOUR LAWSUIT:
${data.document ? '---BEGIN LAWSUIT---\n' + data.document + '\n---END LAWSUIT---\n' : 'Lawsuit document not available'}

FILING DETAILS:
Court: ${data.submissionVenue || 'Not specified'}
${data.submissionAddress ? `Address: ${data.submissionAddress}\n` : ''}

We will handle all filing procedures and provide you with confirmation once your lawsuit has been submitted to the court. You will receive the case number and further instructions via email.

`;
      }
      break;

    case 'full_access':
      // DEPRECATED: Full access payments are no longer needed - these features are now FREE for all signed-in users
      email += `SERVICE UPDATE: LegalAI Consultation & Officer Search (FREE for signed-in users)

Officer search and legal consultation are now FREE for all signed-in users.

WHAT YOU CAN DO:
- Analyze the legal merits of your case
- Research applicable civil rights laws and precedents
- Review state-specific statutes and regulations
- Assess the viability of various legal remedies
- Generate preliminary legal documents
- Search for officer information

Log in to your account to access these free features: ${baseUrl}

`;
      break;
  }

  email += `
WHAT'S NEXT:
${data.type === 'complaint' ? '- Monitor your email for acknowledgment from the oversight agency\n- Keep records of all communications\n- Follow up if you don\'t hear back within 10 business days' : ''}${data.type === 'petition' ? '- Share your petition with community members and advocacy groups\n- Track signatures and support\n- Consider organizing public awareness campaigns' : ''}${data.type === 'foia' ? '- Wait for agency response (typically 20 business days)\n- Review provided documents carefully\n- Submit follow-up requests if needed' : ''}${data.type === 'lawsuit' && data.filingInstructions ? '- Review all filing instructions carefully\n- Gather required documents and fees\n- File within applicable statute of limitations\n- Consider consulting a local attorney' : ''}${data.type === 'lawsuit' && !data.filingInstructions ? '- Await filing confirmation from Bad Blue\n- Expect case number within 5-7 business days\n- Prepare for potential court proceedings' : ''}${data.type === 'full_access' ? '- Log in to access free LegalAI tools and Officer Search\n- Analyze your case using our AI consultation\n- Search for officer information\n- Consider our paid services for complaints and lawsuits if needed' : ''}

If you have any questions or need further assistance, please contact our support team.

Sincerely,
Bad Blue`;

  return email;
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    const fromAddress = await getFromAddress();
    const textContent = composeWelcomeEmailText(data);

    const success = await sendViaSMTP(
      data.email,
      'Welcome to Bad Blue - Police Accountability Platform',
      undefined, // No HTML
      textContent,
      fromAddress
    );

    if (success) {
      console.log(`[EMAIL] Welcome email sent to ${data.email}`);
    } else {
      console.error(`[EMAIL] Failed to send welcome email to ${data.email}`);
    }

    return success;
  } catch (error) {
    console.error('[EMAIL] Error in sendWelcomeEmail:', error);
    return false;
  }
}

/**
 * Send purchase confirmation email
 */
export async function sendPurchaseConfirmationEmail(data: PurchaseConfirmationData): Promise<boolean> {
  try {
    const fromAddress = await getFromAddress();
    const textContent = composeConfirmationEmailText(data);

    const subject = `Purchase Confirmation - ${
      data.type === 'complaint' ? 'Police Complaint' :
      data.type === 'petition' ? 'Civil Rights Petition' :
      data.type === 'foia' ? 'FOIA Records Request' :
      data.type === 'lawsuit' ? (data.filingInstructions ? 'DIY Lawsuit Assistance' : 'Full-Service Lawsuit') :
      'LegalAI Access'
    }`;

    const success = await sendViaSMTP(
      data.email,
      subject,
      undefined, // No HTML
      textContent,
      fromAddress
    );

    if (success) {
      console.log(`[EMAIL] Confirmation email sent to ${data.email} for ${data.type}`);
    } else {
      console.error(`[EMAIL] Failed to send confirmation email to ${data.email}`);
    }

    return success;
  } catch (error) {
    console.error('[EMAIL] Error in sendPurchaseConfirmationEmail:', error);
    return false;
  }
}

/**
 * Send admin-composed email to user
 */
export async function sendAdminEmail(data: AdminEmailData): Promise<boolean> {
  try {
    const fromAddress = await getFromAddress();

    const success = await sendViaSMTP(
      data.to,
      data.subject,
      undefined, // No HTML
      data.message,
      fromAddress
    );

    if (success) {
      console.log(`[EMAIL] Admin email sent to ${data.to}`);
    } else {
      console.error(`[EMAIL] Failed to send admin email to ${data.to}`);
    }

    return success;
  } catch (error) {
    console.error('[EMAIL] Error in sendAdminEmail:', error);
    return false;
  }
}

/**
 * Send test email (for admin testing)
 */
export async function sendTestEmail(toEmail: string): Promise<boolean> {
  try {
    const fromAddress = await getFromAddress();
    const testMessage = `This is a test email from Bad Blue.

This email confirms that your SMTP configuration is working correctly.

System Information:
- SMTP Server: smtp-relay.gmail.com:587
- From Address: ${fromAddress}
- Sent: ${new Date().toLocaleString()}

If you received this email, your email system is functioning properly.

Sincerely,
Bad Blue`;

    const success = await sendViaSMTP(
      toEmail,
      'Bad Blue - Test Email',
      undefined, // No HTML
      testMessage,
      fromAddress
    );

    if (success) {
      console.log(`[EMAIL] Test email sent to ${toEmail}`);
    } else {
      console.error(`[EMAIL] Failed to send test email to ${toEmail}`);
    }

    return success;
  } catch (error) {
    console.error('[EMAIL] Error in sendTestEmail:', error);
    return false;
  }
}

// Alias for backward compatibility
export const sendAdminTestEmail = sendTestEmail;

/**
 * Send contact form submission to support email
 */
export async function sendContactFormEmail(data: {
  type: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<boolean> {
  try {
    console.log('[EMAIL] Preparing to send contact form email...');

    // Check SMTP credentials
    if (!process.env.GWSMTP_USER || !process.env.GWSMTP_PASS) {
      console.error('[EMAIL] SMTP credentials not configured (GWSMTP_USER or GWSMTP_PASS missing)');
      return false;
    }

    const fromAddress = await getFromAddress();
    console.log('[EMAIL] Using from address:', fromAddress);

    const messageText = `Contact Form Submission

Type: ${data.type}
Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}

---
Sent from Bad Blue Contact Form
${new Date().toLocaleString()}`;

    // Send to support email (admin)
    const supportEmail = process.env.ADMIN_EMAIL || 'badgecheck@gmail.com';
    console.log('[EMAIL] Sending to support email:', supportEmail);

    const success = await sendViaSMTP(
      supportEmail,
      `Contact Form: ${data.subject}`,
      undefined,
      messageText,
      fromAddress
    );

    if (success) {
      console.log(`[EMAIL] ✓ Contact form sent successfully from ${data.email}`);
    } else {
      console.error(`[EMAIL] ✗ Failed to send contact form from ${data.email}`);
    }

    return success;
  } catch (error: any) {
    console.error('[EMAIL] Error in sendContactFormEmail:', error.message || error);
    return false;
  }
}

/**
 * Send complaint to oversight venue
 */
export async function sendComplaintToVenue(data: {
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
  submitterName: string;
  submitterEmail: string;
}): Promise<boolean> {
  try {
    const fromAddress = await getFromAddress();
    const complaintText = `FORMAL COMPLAINT

Complaint Type: ${data.complaintType}
Date of Incident: ${data.incidentDate}
Location: ${data.city}, ${data.state}${data.county ? ` (${data.county} County)` : ''}

SUBJECT OFFICER:
Name: ${data.officerName}
Badge Number: ${data.officerBadge}
Department: ${data.department}

COMPLAINANT INFORMATION:
Name: ${data.submitterName}
Email: ${data.submitterEmail}

DESCRIPTION OF INCIDENT:
${data.description}

---
This complaint was filed through Bad Blue (badblue.com), a police accountability platform.
Please provide a case number and acknowledgment of receipt to the complainant at ${data.submitterEmail}.

Submitted: ${new Date().toLocaleString()}`;

    const success = await sendViaSMTP(
      data.venueEmail,
      `Formal Complaint - ${data.officerName} - ${data.incidentDate}`,
      undefined,
      complaintText,
      fromAddress
    );

    if (success) {
      console.log(`[EMAIL] Complaint sent to ${data.venueEmail}`);
    } else {
      console.error(`[EMAIL] Failed to send complaint to ${data.venueEmail}`);
    }

    return success;
  } catch (error) {
    console.error('[EMAIL] Error in sendComplaintToVenue:', error);
    return false;
  }
}

/**
 * Send tort notice to agency
 */
export async function sendTortNoticeToAgency(data: {
  agencyEmail: string;
  agencyName: string;
  state: string;
  claimantName: string;
  claimantEmail: string;
  tortNoticeDocument: string;
}): Promise<boolean> {
  try {
    const fromAddress = await getFromAddress();
    const noticeText = `TORT CLAIM NOTICE

TO: ${data.agencyName}
FROM: ${data.claimantName}
RE: Notice of Tort Claim pursuant to ${data.state} law

${data.tortNoticeDocument}

---
Claimant Contact Information:
${data.claimantName}
${data.claimantEmail}

This notice was prepared and submitted through Bad Blue (badblue.com).
Please acknowledge receipt to the claimant at ${data.claimantEmail}.

Submitted: ${new Date().toLocaleString()}`;

    const success = await sendViaSMTP(
      data.agencyEmail,
      `Tort Claim Notice - ${data.claimantName}`,
      undefined,
      noticeText,
      fromAddress
    );

    if (success) {
      console.log(`[EMAIL] Tort notice sent to ${data.agencyEmail}`);
    } else {
      console.error(`[EMAIL] Failed to send tort notice to ${data.agencyEmail}`);
    }

    return success;
  } catch (error) {
    console.error('[EMAIL] Error in sendTortNoticeToAgency:', error);
    return false;
  }
}

/**
 * Send petition ZIP file to user
 */
export async function sendPetitionZipEmail(
  email: string,
  petitionTitle: string,
  zipBuffer: Buffer,
  zipFilename: string
): Promise<boolean> {
  try {
    const fromAddress = await getFromAddress();
    const messageText = `Your petition materials for "${petitionTitle}" are attached.

The ZIP file contains:
- Petition document (PDF)
- Signature collection sheets
- Distribution instructions

Please review all materials before circulating your petition.

If you have any questions, please contact our support team.

Sincerely,
Bad Blue`;

    // Convert ZIP buffer to base64
    const attachment = {
      filename: zipFilename,
      content: zipBuffer.toString('base64'),
      contentType: 'application/zip',
    };

    const success = await sendViaSMTP(
      email,
      `Your Petition Materials - ${petitionTitle}`,
      undefined,
      messageText,
      fromAddress,
      [attachment]
    );

    if (success) {
      console.log(`[EMAIL] Petition ZIP sent to ${email}`);
    } else {
      console.error(`[EMAIL] Failed to send petition ZIP to ${email}`);
    }

    return success;
  } catch (error) {
    console.error('[EMAIL] Error in sendPetitionZipEmail:', error);
    return false;
  }
}

/**
 * Send custom email to user with attachments
 */
export async function sendUserEmail(
  toEmail: string,
  subject: string,
  message: string,
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>
): Promise<boolean> {
  try {
    const fromAddress = await getFromAddress();

    // Convert attachments to base64 format if provided
    const formattedAttachments = attachments?.map(att => ({
      filename: att.filename,
      content: att.content.toString('base64'),
      contentType: att.contentType,
    })) || [];

    const success = await sendViaSMTP(
      toEmail,
      subject,
      undefined,
      message,
      fromAddress,
      formattedAttachments
    );

    if (success) {
      console.log(`[EMAIL] Custom email sent to ${toEmail}`);
    } else {
      console.error(`[EMAIL] Failed to send custom email to ${toEmail}`);
    }

    return success;
  } catch (error) {
    console.error('[EMAIL] Error in sendUserEmail:', error);
    return false;
  }
}