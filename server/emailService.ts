// Email service for BadBlue - Uses Resend API
// This file acts as a bridge to maintain compatibility with existing code

import {
  sendEmail as sendViaResend,
  sendWelcomeEmail,
  sendConfirmationEmail,
  sendAdminNotification,
  emailTransporter as resendTransporter,
} from './resendService';

// Re-export the Resend service functions for compatibility
export const emailTransporter = resendTransporter;

/**
 * Main email sending function - now uses Resend
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
  return sendViaResend({
    to,
    subject,
    html,
    text,
    from,
    attachments,
  });
}

/**
 * Legacy compatibility function for sending email
 * @deprecated Use sendEmail directly
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

// Re-export specialized email functions
export {
  sendWelcomeEmail,
  sendConfirmationEmail,
  sendAdminNotification,
  sendPurchaseConfirmationEmail,
  sendContactFormEmail,
  sendComplaintToVenue,
  sendTortNoticeToAgency,
  sendPetitionZipEmail,
  sendUserEmail,
} from './resendService';

// Verification function for checking email service status
export async function verifyEmailService(): Promise<boolean> {
  try {
    const result = await emailTransporter.verify();
    if (result) {
      console.log('[EMAIL] ✓ Email service operational (Resend)');
    } else {
      console.log('[EMAIL] ✗ Email service not operational');
    }
    return result;
  } catch (error: any) {
    console.error('[EMAIL] ✗ Email service verification failed:', error.message);
    return false;
  }
}

// Helper function for sending simple text emails
export async function sendTextEmail(to: string, subject: string, text: string): Promise<boolean> {
  return sendEmail({
    to,
    subject,
    text,
  });
}

// Helper function for sending HTML emails with fallback text
export async function sendHtmlEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}

// Admin test email function
export async function sendAdminTestEmail(toEmail: string): Promise<boolean> {
  const subject = 'BadBlue Admin Test Email';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">Test Email from BadBlue Admin</h1>
      </div>
      
      <div style="padding: 30px; background-color: #f5f5f5;">
        <h2 style="color: #333;">Email Service Test</h2>
        
        <p style="color: #666; line-height: 1.6;">
          This is a test email from the BadBlue admin panel to verify the email service is working correctly.
        </p>
        
        <div style="background-color: #d4f4dd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #2d6a3d;">
            <strong>✓ Email Service Status: Operational</strong><br>
            Your email configuration is working properly.
          </p>
        </div>
        
        <p style="color: #666;">
          <strong>Service Details:</strong><br>
          • Email Provider: Resend API<br>
          • Timestamp: ${new Date().toISOString()}<br>
          • Recipient: ${toEmail}
        </p>
      </div>
      
      <div style="padding: 20px; background-color: #333; color: #999; text-align: center; font-size: 12px;">
        <p style="margin: 0;">© 2025 BadBlue Admin System</p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: toEmail,
    subject,
    html,
    from: 'BadBlue Admin <admin@bad-blue.com>',
  });
}