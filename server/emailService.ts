// Email service for BadBlue - SMTP only
// Add GWSMTP_USER and GWSMTP_PASS in Replit Secrets

import nodemailer from 'nodemailer';
import { db } from './db';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { sendMail as sendViaSMTP } from './mailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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

    return {
      fromEmail: fromEmailSetting?.value || process.env.DEFAULT_FROM_EMAIL || 'contact.badblue@gmail.com',
      fromName: fromNameSetting?.value || process.env.DEFAULT_FROM_NAME || 'Bad Blue',
    };
  } catch (error: any) {
    console.error('[EMAIL] Error loading email settings from database, using environment fallbacks:', error.message || error);
    return {
      fromEmail: process.env.DEFAULT_FROM_EMAIL || 'contact.badblue@gmail.com',
      fromName: process.env.DEFAULT_FROM_NAME || 'Bad Blue',
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
  const hasPass = !!process.env.GWSMTP_PASS;
  
  if (!hasUser || !hasPass) {
    console.error('[EMAIL] ✗ SMTP credentials check failed:');
    console.error('[EMAIL]   - GWSMTP_USER present:', hasUser);
    console.error('[EMAIL]   - GWSMTP_PASS present:', hasPass);
    console.error('[EMAIL] Please verify these secrets are set in Replit Secrets tool');
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

    const fromName = settings.find(s => s.key === 'support_from_name')?.value 
      || process.env.DEFAULT_FROM_NAME 
      || 'Bad Blue';

    const fromEmail = settings.find(s => s.key === 'support_from_email')?.value 
      || process.env.DEFAULT_FROM_EMAIL 
      || 'contact.badblue@gmail.com';

    return `${fromName} <${fromEmail}>`;
  } catch (error: any) {
    console.error('[EMAIL] Error fetching from address settings, using environment fallbacks:', error.message || error);
    // Fallback to environment variables or defaults
    const fromName = process.env.DEFAULT_FROM_NAME || 'Bad Blue';
    const fromEmail = process.env.DEFAULT_FROM_EMAIL || 'contact.badblue@gmail.com';
    return `${fromName} <${fromEmail}>`;
  }
}

/**
 * Compose welcome email as plain text
 */
function composeWelcomeEmailText(data: WelcomeEmailData): string {
  return `Hello ${data.firstName},

Welcome to Bad Blue! We're honored that you've chosen us as your partner in pursuing police accountability and justice.

Bad Blue is more than just a platform—it's a movement toward transparency, fairness, and constitutional rights protection. Our mission is to make the complaint and lawsuit filing process accessible, affordable, and effective for every citizen.

SERVICES WE PROVIDE:

1. LegalAI Consultation ($9.75 for 7-day access)
   Access our AI-powered legal research assistant to analyze your case, review applicable laws, and assess the strength of your claims before taking action.

2. Officer Search (Included with access)
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

Whether you're seeking accountability for police misconduct, pursuing justice for civil rights violations, or simply exploring your legal options, Bad Blue provides the tools and guidance you need.

Log in to your account at any time to access our services: ${process.env.BASE_URL || (process.env.REPLIT_DOMAINS?.split(',')[0] ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://badblue.com')}

If you have any questions or need assistance, our support team is here to help.

Sincerely,
Bad Blue`;
}

/**
 * Compose purchase confirmation email as plain text
 */
function composeConfirmationEmailText(data: PurchaseConfirmationData): string {
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
      email += `SERVICE PURCHASED: LegalAI Consultation (7-Day Access - $${(data.amount / 100).toFixed(2)})

You now have full access to our AI-powered legal research and consultation tools for the next 7 days.

WHAT YOU CAN DO:
- Analyze the legal merits of your case
- Research applicable civil rights laws and precedents
- Review state-specific statutes and regulations
- Assess the viability of various legal remedies
- Generate preliminary legal documents

Log in to your account to access LegalAI: ${process.env.BASE_URL || (process.env.REPLIT_DOMAINS?.split(',')[0] ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://badblue.com')}

Your access will expire on ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}.

`;
      break;
  }

  email += `
WHAT'S NEXT:
${data.type === 'complaint' ? '- Monitor your email for acknowledgment from the oversight agency\n- Keep records of all communications\n- Follow up if you don\'t hear back within 10 business days' : ''}${data.type === 'petition' ? '- Share your petition with community members and advocacy groups\n- Track signatures and support\n- Consider organizing public awareness campaigns' : ''}${data.type === 'foia' ? '- Wait for agency response (typically 20 business days)\n- Review provided documents carefully\n- Submit follow-up requests if needed' : ''}${data.type === 'lawsuit' && data.filingInstructions ? '- Review all filing instructions carefully\n- Gather required documents and fees\n- File within applicable statute of limitations\n- Consider consulting a local attorney' : ''}${data.type === 'lawsuit' && !data.filingInstructions ? '- Await filing confirmation from Bad Blue\n- Expect case number within 5-7 business days\n- Prepare for potential court proceedings' : ''}${data.type === 'full_access' ? '- Log in to access LegalAI tools\n- Analyze your case thoroughly\n- Determine next steps based on AI assessment\n- Consider purchasing additional services if needed' : ''}

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