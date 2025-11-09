/**
 * Export Replit Environment Variables to .env File
 * 
 * This script extracts all environment variables from the running Replit environment
 * and creates a .env file for migration to other platforms.
 * 
 * Usage: node export-secrets.js
 */

import fs from 'fs';
import path from 'path';

console.log('🔐 Exporting Replit environment variables to .env file...\n');

// List of known secrets for BadBlue (in order of importance)
const knownSecrets = [
  // Database
  'DATABASE_URL',
  'PGHOST',
  'PGPORT',
  'PGUSER',
  'PGPASSWORD',
  'PGDATABASE',
  
  // AI Services
  'GEMINI_API_KEY',
  'GROQ_API_KEY',
  'OPENAI_API_KEY',
  
  // Payment
  'STRIPE_SECRET_KEY',
  'VITE_STRIPE_PUBLIC_KEY',
  'TESTING_STRIPE_SECRET_KEY',
  'TESTING_VITE_STRIPE_PUBLIC_KEY',
  
  // Email
  'GWSMTP_USER',
  'GWSMTP_PASS',
  
  // Session
  'SESSION_SECRET',
  
  // Object Storage
  'DEFAULT_OBJECT_STORAGE_BUCKET_ID',
  'PUBLIC_OBJECT_SEARCH_PATHS',
  'PRIVATE_OBJECT_DIR',
  
  // Additional databases
  'SUPABASE_DATABASE_URL',
];

// Additional environment variables to include
const additionalEnvVars = [
  'NODE_ENV',
  'PORT',
  'REPL_ID',
  'REPL_OWNER',
  'REPLIT_DEV_DOMAIN',
];

let envContent = [];

// Add header
envContent.push('# BadBlue Environment Variables');
envContent.push('# Generated from Replit Secrets');
envContent.push(`# Export Date: ${new Date().toISOString()}`);
envContent.push('');

// Export Database Configuration
envContent.push('# ═══════════════════════════════════════════════════════');
envContent.push('# DATABASE CONFIGURATION (PostgreSQL)');
envContent.push('# ═══════════════════════════════════════════════════════');
envContent.push('');

const dbVars = ['DATABASE_URL', 'PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'];
dbVars.forEach(key => {
  const value = process.env[key];
  if (value) {
    envContent.push(`${key}=${value}`);
    console.log(`✓ Exported: ${key}`);
  } else {
    envContent.push(`# ${key}=`);
    console.log(`⚠ Missing: ${key}`);
  }
});
envContent.push('');

// Export AI Service Keys
envContent.push('# ═══════════════════════════════════════════════════════');
envContent.push('# AI SERVICE API KEYS');
envContent.push('# ═══════════════════════════════════════════════════════');
envContent.push('');

const aiVars = ['GEMINI_API_KEY', 'GROQ_API_KEY', 'OPENAI_API_KEY'];
aiVars.forEach(key => {
  const value = process.env[key];
  if (value) {
    envContent.push(`${key}=${value}`);
    console.log(`✓ Exported: ${key}`);
  } else {
    envContent.push(`# ${key}=`);
    console.log(`⚠ Missing: ${key}`);
  }
});
envContent.push('');

// Export Payment Configuration
envContent.push('# ═══════════════════════════════════════════════════════');
envContent.push('# STRIPE PAYMENT CONFIGURATION');
envContent.push('# ═══════════════════════════════════════════════════════');
envContent.push('');

const stripeVars = [
  'STRIPE_SECRET_KEY',
  'VITE_STRIPE_PUBLIC_KEY',
  'TESTING_STRIPE_SECRET_KEY',
  'TESTING_VITE_STRIPE_PUBLIC_KEY'
];
stripeVars.forEach(key => {
  const value = process.env[key];
  if (value) {
    envContent.push(`${key}=${value}`);
    console.log(`✓ Exported: ${key}`);
  } else {
    envContent.push(`# ${key}=`);
    console.log(`⚠ Missing: ${key}`);
  }
});
envContent.push('');

// Export Email Configuration
envContent.push('# ═══════════════════════════════════════════════════════');
envContent.push('# EMAIL CONFIGURATION (SMTP)');
envContent.push('# ═══════════════════════════════════════════════════════');
envContent.push('');

const emailVars = ['GWSMTP_USER', 'GWSMTP_PASS'];
emailVars.forEach(key => {
  const value = process.env[key];
  if (value) {
    envContent.push(`${key}=${value}`);
    console.log(`✓ Exported: ${key}`);
  } else {
    envContent.push(`# ${key}=`);
    console.log(`⚠ Missing: ${key}`);
  }
});
envContent.push('');

// Export Session Secret
envContent.push('# ═══════════════════════════════════════════════════════');
envContent.push('# SESSION MANAGEMENT');
envContent.push('# ═══════════════════════════════════════════════════════');
envContent.push('');

const sessionValue = process.env.SESSION_SECRET;
if (sessionValue) {
  envContent.push(`SESSION_SECRET=${sessionValue}`);
  console.log(`✓ Exported: SESSION_SECRET`);
} else {
  envContent.push(`# SESSION_SECRET=`);
  console.log(`⚠ Missing: SESSION_SECRET`);
}
envContent.push('');

// Export Object Storage
envContent.push('# ═══════════════════════════════════════════════════════');
envContent.push('# OBJECT STORAGE CONFIGURATION');
envContent.push('# ═══════════════════════════════════════════════════════');
envContent.push('');

const storageVars = [
  'DEFAULT_OBJECT_STORAGE_BUCKET_ID',
  'PUBLIC_OBJECT_SEARCH_PATHS',
  'PRIVATE_OBJECT_DIR'
];
storageVars.forEach(key => {
  const value = process.env[key];
  if (value) {
    envContent.push(`${key}=${value}`);
    console.log(`✓ Exported: ${key}`);
  } else {
    envContent.push(`# ${key}=`);
    console.log(`⚠ Missing: ${key}`);
  }
});
envContent.push('');

// Export Additional Databases
envContent.push('# ═══════════════════════════════════════════════════════');
envContent.push('# ADDITIONAL DATABASES (Optional)');
envContent.push('# ═══════════════════════════════════════════════════════');
envContent.push('');

const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
if (supabaseUrl) {
  envContent.push(`SUPABASE_DATABASE_URL=${supabaseUrl}`);
  console.log(`✓ Exported: SUPABASE_DATABASE_URL`);
} else {
  envContent.push(`# SUPABASE_DATABASE_URL=`);
  console.log(`⚠ Missing: SUPABASE_DATABASE_URL`);
}
envContent.push('');

// Export Runtime Configuration
envContent.push('# ═══════════════════════════════════════════════════════');
envContent.push('# RUNTIME CONFIGURATION');
envContent.push('# ═══════════════════════════════════════════════════════');
envContent.push('');

envContent.push(`NODE_ENV=production`);
envContent.push(`PORT=5000`);
console.log(`✓ Added: NODE_ENV=production`);
console.log(`✓ Added: PORT=5000`);
envContent.push('');

// Write to .env file
const envFilePath = path.join(process.cwd(), '.env');
fs.writeFileSync(envFilePath, envContent.join('\n'), 'utf-8');

console.log('\n✅ Successfully created .env file');
console.log(`📂 Location: ${envFilePath}`);
console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
console.log('   1. The .env file contains sensitive credentials');
console.log('   2. Never commit this file to version control');
console.log('   3. Add .env to your .gitignore file');
console.log('   4. Keep this file secure on your new platform');
console.log('\n🔒 Next Steps:');
console.log('   1. Download the .env file from Replit');
console.log('   2. Upload to your new hosting platform');
console.log('   3. Delete the .env file from Replit after migration');
console.log('   4. Verify all secrets work on the new platform\n');
