// Comprehensive email configuration test
const nodemailer = require('nodemailer');

console.log('=== BadBlue Email Configuration Test ===');
console.log('Expected Configuration:');
console.log('  Email: contact.badblue@gmail.com');
console.log('  App Password: kjbq drpm cfwc acnr (will remove spaces)');
console.log('  SMTP Host: smtp.gmail.com');
console.log('  Port: 465 (secure)');
console.log('');

console.log('Current Environment Variables:');
console.log('  GWSMTP_USER:', process.env.GWSMTP_USER || 'NOT SET');
console.log('  GWSMTP_PASSWORD:', process.env.GWSMTP_PASSWORD || 'NOT SET');
console.log('  GWSMTP_HOST:', process.env.GWSMTP_HOST || 'NOT SET');
console.log('  GWSMTP_PASS (old):', process.env.GWSMTP_PASS ? 'SET' : 'NOT SET');
console.log('');

// Check if values match expected
const expectedUser = 'contact.badblue@gmail.com';
const expectedPassword = 'kjbqdrpmcfwcacnr'; // App password without spaces
const expectedHost = 'smtp.gmail.com';

const actualUser = process.env.GWSMTP_USER;
const actualPassword = process.env.GWSMTP_PASSWORD ? process.env.GWSMTP_PASSWORD.replace(/\s/g, '') : '';
const actualHost = process.env.GWSMTP_HOST || 'smtp.gmail.com';

console.log('Configuration Status:');
if (actualUser === expectedUser) {
  console.log('  ✅ GWSMTP_USER is correct');
} else {
  console.log(`  ❌ GWSMTP_USER is incorrect`);
  console.log(`     Current: ${actualUser}`);
  console.log(`     Expected: ${expectedUser}`);
}

if (actualPassword === expectedPassword) {
  console.log('  ✅ GWSMTP_PASSWORD is correct');
} else if (process.env.GWSMTP_PASSWORD) {
  console.log(`  ⚠️ GWSMTP_PASSWORD is set but may not match expected value`);
  console.log(`     Length: ${actualPassword.length} (expected: 16)`);
} else {
  console.log('  ❌ GWSMTP_PASSWORD is not set');
}

if (actualHost === expectedHost) {
  console.log('  ✅ GWSMTP_HOST is correct');
} else {
  console.log(`  ❌ GWSMTP_HOST is incorrect`);
  console.log(`     Current: ${actualHost}`);
  console.log(`     Expected: ${expectedHost}`);
}

console.log('');
console.log('=== Instructions to Fix ===');
if (actualUser !== expectedUser || !process.env.GWSMTP_PASSWORD) {
  console.log('The environment variables need to be updated in Replit Secrets:');
  console.log('');
  console.log('1. Click the "Secrets" tab in the Replit Tools panel (🔑 icon)');
  console.log('2. Update or add these secrets:');
  console.log('   - Key: GWSMTP_USER');
  console.log('     Value: contact.badblue@gmail.com');
  console.log('');
  console.log('   - Key: GWSMTP_PASSWORD');
  console.log('     Value: kjbq drpm cfwc acnr');
  console.log('     (The spaces will be removed automatically by the code)');
  console.log('');
  console.log('   - Key: GWSMTP_HOST');
  console.log('     Value: smtp.gmail.com');
  console.log('');
  console.log('3. After updating the secrets, restart the application');
  console.log('');
  console.log('Note: The .env file has been renamed to .env.backup to prevent');
  console.log('it from overriding the secrets.');
} else {
  console.log('✅ All email configuration variables are correctly set!');
  
  // Test the connection
  console.log('');
  console.log('Testing SMTP connection...');
  
  const transporter = nodemailer.createTransporter({
    host: actualHost,
    port: 465,
    secure: true,
    auth: {
      user: actualUser,
      pass: actualPassword
    }
  });
  
  transporter.verify((error, success) => {
    if (error) {
      console.log('❌ SMTP connection failed:', error.message);
    } else {
      console.log('✅ SMTP connection successful!');
      console.log('✅ Ready to send emails from contact.badblue@gmail.com');
    }
  });
}