// SMTP Email Service using Nodemailer with Google Workspace SMTP Relay
// Alternative to Resend API - uses only SMTP credentials (no API keys)

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

// Create SMTP transporter (lazily initialized)
let transporter: Transporter | null = null;

/**
 * Get or create SMTP transporter configured for Google Workspace SMTP relay
 */
function getTransporter(): Transporter {
  if (!transporter) {
    const smtpUser = process.env.GWSMTP_USER;
    // Use App Password (GWSMTP_PASSWORD) if available, removing spaces
    // Fall back to regular password (GWSMTP_PASS) if App Password not set
    const smtpPass = process.env.GWSMTP_PASSWORD 
      ? process.env.GWSMTP_PASSWORD.replace(/\s/g, '') // Remove spaces from App Password
      : process.env.GWSMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.error('[SMTP] ✗ Missing credentials - GWSMTP_USER:', !!smtpUser, 'GWSMTP_PASSWORD:', !!process.env.GWSMTP_PASSWORD, 'GWSMTP_PASS:', !!process.env.GWSMTP_PASS);
      throw new Error('GWSMTP_USER and either GWSMTP_PASSWORD or GWSMTP_PASS environment variables must be set');
    }

    transporter = nodemailer.createTransport({
      host: process.env.GWSMTP_HOST || 'smtp.gmail.com',
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    console.log('[SMTP] ✓ Transporter initialized for smtp.gmail.com:465');
    console.log('[SMTP] ✓ Using credentials for user:', smtpUser);
  }

  return transporter;
}

/**
 * Send email via SMTP using Google Workspace SMTP relay
 * 
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param html - HTML body content
 * @param text - Optional plain text content (fallback)
 * @param from - Optional from address (defaults to "BadBlue <contact.badblue@gmail.com>")
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
    const transporter = getTransporter();

    const mailOptions: any = {
      from: from || 'BadBlue <contact.badblue@gmail.com>',
      to,
      subject,
      text: text || undefined,
    };

    // Only add HTML if provided
    if (html) {
      mailOptions.html = html;
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64'),
        contentType: att.contentType,
      }));
    }

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[SMTP] Email sent to ${to} - MessageID: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`[SMTP] Failed to send email to ${to}:`, error.message);
    
    // Log detailed error information for debugging
    if (error.code === 'EAUTH') {
      console.error('[SMTP] Authentication failed - check GWSMTP_USER and GWSMTP_PASS credentials');
    } else if (error.code === 'ECONNECTION') {
      console.error('[SMTP] Connection failed - check network or SMTP server availability');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('[SMTP] Connection timeout - SMTP server not responding');
    } else {
      console.error('[SMTP] Error details:', error);
    }
    
    return false;
  }
}

/**
 * Verify SMTP connection is working
 * Useful for testing configuration
 */
export async function verifySMTPConnection(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('[SMTP] Connection verified successfully');
    return true;
  } catch (error: any) {
    console.error('[SMTP] Connection verification failed:', error.message);
    return false;
  }
}
