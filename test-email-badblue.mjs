// Test email with contact.badblue@gmail.com credentials
import * as nodemailer from 'nodemailer';

console.log('Testing Email Service for contact.badblue@gmail.com...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('  GWSMTP_USER:', process.env.GWSMTP_USER);
console.log('  GWSMTP_HOST:', process.env.GWSMTP_HOST);
console.log('  GWSMTP_PASSWORD exists:', !!process.env.GWSMTP_PASSWORD);
console.log('  GWSMTP_PASS exists:', !!process.env.GWSMTP_PASS);

// Use the App Password provided for contact.badblue@gmail.com
const testUser = 'contact.badblue@gmail.com';
const testPassword = 'kjbqdrpmcfwcacnr'; // App Password without spaces

console.log('\nTesting with:');
console.log('  Email:', testUser);
console.log('  Using App Password (16 chars)');

try {
  const transporter = nodemailer.default.createTransporter({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: testUser,
      pass: testPassword,
    },
  });
  
  console.log('\nVerifying SMTP connection...');
  await transporter.verify();
  
  console.log('\n✅ SUCCESS! Email service is working with contact.badblue@gmail.com!');
  console.log('The App Password authentication is successful.');
  
  // Try sending a test email
  console.log('\nSending test email...');
  const info = await transporter.sendMail({
    from: '"BadBlue Test" <contact.badblue@gmail.com>',
    to: 'contact.badblue@gmail.com',
    subject: 'BadBlue Email Test - Success',
    text: 'This is a test email confirming that the BadBlue email service is working correctly.',
    html: '<b>This is a test email confirming that the BadBlue email service is working correctly.</b>',
  });
  
  console.log('✅ Test email sent successfully!');
  console.log('Message ID:', info.messageId);
  
} catch (error) {
  console.log('\n❌ Error:', error.message);
  if (error.message.includes('Username and Password not accepted')) {
    console.log('\nPossible issues:');
    console.log('1. The App Password may be incorrect');
    console.log('2. 2-Step Verification may not be enabled for contact.badblue@gmail.com');
    console.log('3. The App Password may need to be regenerated');
  }
}