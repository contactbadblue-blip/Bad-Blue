#!/usr/bin/env node

// Test script to verify email configuration with contact.badblue@gmail.com
import nodemailer from 'nodemailer';

console.log('=== BadBlue Email Configuration Test ===');
console.log('Testing with contact.badblue@gmail.com account');
console.log('');

// Check environment variables
const user = process.env.GWSMTP_USER;
const password = process.env.GWSMTP_PASSWORD;
const host = process.env.GWSMTP_HOST || 'smtp.gmail.com';

console.log('📧 Configuration:');
console.log(`  Host: ${host}`);
console.log(`  Port: 465 (secure)`);
console.log(`  User: ${user || '❌ NOT SET'}`);
console.log(`  Password: ${password ? '✅ SET (App Password)' : '❌ NOT SET'}`);
console.log('');

if (!user || !password) {
  console.error('❌ Missing credentials!');
  console.error('Please ensure GWSMTP_USER and GWSMTP_PASSWORD are set');
  process.exit(1);
}

// Verify the user is contact.badblue@gmail.com
if (user !== 'contact.badblue@gmail.com') {
  console.error(`⚠️ Warning: GWSMTP_USER is "${user}" but should be "contact.badblue@gmail.com"`);
  console.error('Please update the GWSMTP_USER secret in Replit');
}

// Remove spaces from App Password
const cleanPassword = password.replace(/\s/g, '');
console.log(`📝 App Password format: ${password.includes(' ') ? 'Contains spaces (will be removed)' : 'No spaces'}`);

// Create transporter with Gmail settings
const transporter = nodemailer.createTransporter({
  host: host,
  port: 465,
  secure: true, // Use SSL/TLS
  auth: {
    user: user,
    pass: cleanPassword,
  },
});

// Verify the connection
console.log('\n🔌 Testing SMTP connection...');
try {
  await transporter.verify();
  console.log('✅ SMTP connection successful!');
  console.log(`✅ Ready to send emails from: ${user}`);
  
  // Send a test email
  console.log('\n📮 Sending test email...');
  const info = await transporter.sendMail({
    from: `BadBlue <${user}>`,
    to: user, // Send to self
    subject: 'BadBlue Email Test - Configuration Verified',
    text: 'This is a test email from BadBlue to verify the email configuration is working correctly with contact.badblue@gmail.com.',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>✅ Email Configuration Test Successful</h2>
        <p>This test email confirms that BadBlue can successfully send emails using:</p>
        <ul>
          <li><strong>Email:</strong> ${user}</li>
          <li><strong>Server:</strong> ${host}:465</li>
          <li><strong>Security:</strong> SSL/TLS</li>
          <li><strong>Authentication:</strong> App Password</li>
        </ul>
        <p style="color: #666; margin-top: 20px;">
          Test performed at: ${new Date().toLocaleString()}
        </p>
      </div>
    `
  });
  
  console.log(`✅ Test email sent successfully!`);
  console.log(`   Message ID: ${info.messageId}`);
  console.log(`   Check ${user} inbox for the test email`);
  
  console.log('\n🎉 All email tests passed! BadBlue email service is configured correctly.');
  
} catch (error) {
  console.error('\n❌ SMTP connection failed!');
  console.error('Error details:', error.message);
  
  if (error.code === 'EAUTH') {
    console.error('\n⚠️ Authentication error - possible causes:');
    console.error('1. App Password is incorrect');
    console.error('2. Less secure app access is disabled');
    console.error('3. 2-factor authentication is not set up correctly');
    console.error('\nPlease verify:');
    console.error('- The App Password in GWSMTP_PASSWORD is correct');
    console.error('- You are using an App Password, not the regular Gmail password');
    console.error('- The App Password was generated for contact.badblue@gmail.com');
  }
  
  process.exit(1);
}