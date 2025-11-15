// Direct test of Gmail authentication with contact.badblue@gmail.com
import nodemailer from 'nodemailer';

async function testGmailAuth() {
  console.log('Testing Gmail authentication for contact.badblue@gmail.com\n');
  console.log('Environment:');
  console.log('  GWSMTP_USER:', process.env.GWSMTP_USER);
  console.log('  GWSMTP_PASSWORD:', process.env.GWSMTP_PASSWORD);
  console.log('  GWSMTP_HOST:', process.env.GWSMTP_HOST);
  
  // Test with the App Password, removing spaces
  const email = process.env.GWSMTP_USER || 'contact.badblue@gmail.com';
  const appPassword = (process.env.GWSMTP_PASSWORD || 'kjbq drpm cfwc acnr').replace(/\s/g, '');
  
  console.log('\n📧 Testing configuration:');
  console.log('  Email:', email);
  console.log('  Password: ****' + appPassword.slice(-4));
  console.log('  Host: smtp.gmail.com');
  console.log('  Port: 465 (SSL)');
  
  try {
    const transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: email,
        pass: appPassword,
      },
    });
    
    console.log('\n🔄 Verifying SMTP connection...');
    await transporter.verify();
    
    console.log('\n✅ SUCCESS! Gmail authentication successful!');
    console.log('The email service is now working with contact.badblue@gmail.com');
    
    // Try sending a test email
    console.log('\n📨 Sending test email...');
    const info = await transporter.sendMail({
      from: '"BadBlue System" <contact.badblue@gmail.com>',
      to: 'contact.badblue@gmail.com',
      subject: 'BadBlue Email Service - Test Successful',
      text: 'This confirms that the BadBlue email service is working correctly with contact.badblue@gmail.com',
      html: '<h3>BadBlue Email Service Test</h3><p>This confirms that the BadBlue email service is working correctly with <b>contact.badblue@gmail.com</b></p>',
    });
    
    console.log('✅ Test email sent! Message ID:', info.messageId);
    console.log('\n🎉 Email service is fully operational!');
    
  } catch (error: any) {
    console.log('\n❌ Authentication failed:', error.message);
    
    if (error.message.includes('Username and Password not accepted')) {
      console.log('\n🔍 Troubleshooting:');
      console.log('1. Ensure 2-Step Verification is enabled for contact.badblue@gmail.com');
      console.log('2. The App Password might need to be regenerated');
      console.log('3. Visit: https://myaccount.google.com/apppasswords');
      console.log('4. Create a new App Password and update GWSMTP_PASSWORD');
    }
  }
}

testGmailAuth();