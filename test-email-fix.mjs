// Test email with correct Gmail App Password
import nodemailer from 'nodemailer';

console.log('Testing Email Service with App Password...\n');

// Gmail App Password (remove spaces)
const appPassword = 'kjbqdrpmcfwcacnr';  // App password without spaces
const emailUser = 'brclink1985@gmail.com';

console.log('Configuration:');
console.log('  Email:', emailUser);
console.log('  Using App Password:', appPassword ? 'Yes' : 'No');

try {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: emailUser,
      pass: appPassword,  // Using App Password without spaces
    },
  });
  
  console.log('\nVerifying SMTP connection...');
  await transporter.verify();
  
  console.log('✅ SUCCESS! Email service is now working!');
  console.log('   Authentication successful with Gmail App Password');
  console.log('\nThe correct GWSMTP_PASS value should be: kjbqdrpmcfwcacnr');
  console.log('(App password without spaces)');
  
} catch (error) {
  console.log('❌ Error:', error.message);
  console.log('\nTroubleshooting:');
  console.log('1. Make sure the App Password is correct');
  console.log('2. Ensure the Gmail account has 2FA enabled');
  console.log('3. Check that the App Password was generated for "Mail"');
}