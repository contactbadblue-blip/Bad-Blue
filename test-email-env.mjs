// Check what passwords are available
console.log('Environment Variables Check:');
console.log('GWSMTP_USER:', process.env.GWSMTP_USER);
console.log('GWSMTP_HOST:', process.env.GWSMTP_HOST);
console.log('GWSMTP_PASS exists:', !!process.env.GWSMTP_PASS);
console.log('GWSMTP_PASSWORD exists:', !!process.env.GWSMTP_PASSWORD);

if (process.env.GWSMTP_PASSWORD) {
  console.log('\nApp Password (GWSMTP_PASSWORD):', process.env.GWSMTP_PASSWORD);
  console.log('App Password cleaned:', process.env.GWSMTP_PASSWORD.replace(/\s/g, ''));
}

if (process.env.GWSMTP_PASS) {
  console.log('\nRegular Password (GWSMTP_PASS):', process.env.GWSMTP_PASS);
}

console.log('\nThe code should use GWSMTP_PASSWORD (App Password) if it exists.');
