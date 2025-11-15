// Test email with the correct App Password
import nodemailer from 'nodemailer';

console.log('Testing Email Service with correct App Password...\n');

// Get the App Password and remove spaces
const appPasswordWithSpaces = process.env.GWSMTP_PASSWORD || 'kjbq drpm cfwc acnr';
const appPassword = appPasswordWithSpaces.replace(/\s/g, '');

console.log('Configuration:');
console.log('  Email:', process.env.GWSMTP_USER);
console.log('  App Password (with spaces):', appPasswordWithSpaces);
console.log('  App Password (cleaned):', appPassword);

try {
  const transporter = nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GWSMTP_USER,
      pass: appPassword,  // Using App Password without spaces
    },
  });
  
  console.log('\nVerifying SMTP connection...');
  await transporter.verify();
  
  console.log('\n✅ SUCCESS! Email service is working!');
  console.log('The App Password authentication is successful.');
  console.log('\nTo fix permanently: Update GWSMTP_PASS to:', appPassword);
  
} catch (error) {
  console.log('\n❌ Error:', error.message);
}