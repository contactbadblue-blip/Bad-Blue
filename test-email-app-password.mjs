// Test script to verify email service with App Password
// This tests the email service after fixing GWSMTP_PASSWORD usage

import { createTransport } from 'nodemailer';

// Check which password environment variable is available
console.log('Testing email service with App Password fix...');
console.log('GWSMTP_USER present:', !!process.env.GWSMTP_USER);
console.log('GWSMTP_PASSWORD present:', !!process.env.GWSMTP_PASSWORD);
console.log('GWSMTP_PASS present:', !!process.env.GWSMTP_PASS);

// Use App Password (GWSMTP_PASSWORD) if available, removing spaces
// Fall back to regular password (GWSMTP_PASS) if App Password not set
const password = process.env.GWSMTP_PASSWORD 
  ? process.env.GWSMTP_PASSWORD.replace(/\s/g, '') // Remove spaces from App Password
  : process.env.GWSMTP_PASS;

console.log('\nUsing password from:', process.env.GWSMTP_PASSWORD ? 'GWSMTP_PASSWORD (App Password)' : 'GWSMTP_PASS');
console.log('Password processed (spaces removed):', password ? '✓ Set' : '✗ Not set');

// Create transporter with the correct password
const transporter = createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GWSMTP_USER,
    pass: password,
  },
});

// Test the connection
console.log('\n[TEST] Verifying SMTP connection...');
try {
  await transporter.verify();
  console.log('[TEST] ✅ SMTP connection successful!');
  console.log('[TEST] Email service is working correctly with App Password');
  
  // Try sending a test email
  console.log('\n[TEST] Attempting to send test email...');
  const info = await transporter.sendMail({
    from: 'BadBlue <contact.badblue@gmail.com>',
    to: 'badgecheck@gmail.com', // Admin email for testing
    subject: 'Test Email - App Password Fix Verification',
    text: `This is a test email to verify the App Password fix is working.

App Password (GWSMTP_PASSWORD) is now being used correctly with spaces removed.

Test performed at: ${new Date().toLocaleString()}

If you received this email, the email service is functioning properly with the App Password.`,
    html: `<p>This is a test email to verify the App Password fix is working.</p>
    <p><strong>App Password (GWSMTP_PASSWORD)</strong> is now being used correctly with spaces removed.</p>
    <p>Test performed at: ${new Date().toLocaleString()}</p>
    <p>If you received this email, the email service is functioning properly with the App Password.</p>`
  });
  
  console.log('[TEST] ✅ Test email sent successfully!');
  console.log('[TEST] Message ID:', info.messageId);
  console.log('[TEST] Response:', info.response);
  
} catch (error) {
  console.error('[TEST] ❌ SMTP connection failed:', error.message);
  if (error.code === 'EAUTH') {
    console.error('[TEST] Authentication error - App Password may still have issues');
  }
  console.error('[TEST] Full error:', error);
  process.exit(1);
}

console.log('\n[SUMMARY] Email service successfully fixed to use App Password!');
console.log('[SUMMARY] The service now:');
console.log('  1. Checks for GWSMTP_PASSWORD first (App Password)');
console.log('  2. Removes spaces from the App Password automatically');
console.log('  3. Falls back to GWSMTP_PASS if App Password not available');
process.exit(0);