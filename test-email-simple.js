// Simple test to check environment variables
console.log('=== Email Environment Variables Check ===');
console.log('GWSMTP_USER:', process.env.GWSMTP_USER || 'NOT SET');
console.log('GWSMTP_PASSWORD:', process.env.GWSMTP_PASSWORD ? 'SET (length: ' + process.env.GWSMTP_PASSWORD.length + ')' : 'NOT SET');
console.log('GWSMTP_HOST:', process.env.GWSMTP_HOST || 'NOT SET');
console.log('GWSMTP_PASS (old):', process.env.GWSMTP_PASS ? 'SET' : 'NOT SET');

if (process.env.GWSMTP_USER !== 'contact.badblue@gmail.com') {
  console.log('\n⚠️ WARNING: GWSMTP_USER is not set to contact.badblue@gmail.com');
  console.log('Current value:', process.env.GWSMTP_USER);
  console.log('Expected value: contact.badblue@gmail.com');
  console.log('\nThe user needs to update the GWSMTP_USER secret in Replit Secrets panel.');
}