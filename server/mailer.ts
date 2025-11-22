// Email Service using Resend API
// This file maintains compatibility with existing code that imports from mailer.ts

import { sendEmail } from './resendService';

/**
 * Send email via Resend API
 * 
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param html - HTML body content
 * @param text - Optional plain text content (fallback)
 * @param from - Optional from address (defaults to configured sender)
 * @param attachments - Optional email attachments
 * @returns Promise<boolean> - true if sent successfully, false otherwise
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
  try {
    // Use Resend service for sending email
    const result = await sendEmail({
      to,
      subject,
      html,
      text,
      from,
      attachments,
    });
    
    if (result) {
      console.log(`[MAIL] Email sent successfully to ${to}`);
    } else {
      console.error(`[MAIL] Failed to send email to ${to}`);
    }
    
    return result;
  } catch (error: any) {
    console.error(`[MAIL] Error sending email to ${to}:`, error.message);
    return false;
  }
}

/**
 * Verify email service is operational
 */
export async function verifyMailService(): Promise<boolean> {
  try {
    // Attempt to verify Resend API key
    const { emailTransporter } = await import('./resendService');
    const result = await emailTransporter.verify();
    
    if (result) {
      console.log('[MAIL] ✓ Email service verified (Resend)');
    } else {
      console.log('[MAIL] ✗ Email service verification failed');
    }
    
    return result;
  } catch (error: any) {
    console.error('[MAIL] ✗ Verification error:', error.message);
    return false;
  }
}

// Export compatibility aliases
export { sendMail as send };
export default { sendMail, verifyMailService };