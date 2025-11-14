// Migration runner script
// Run with: npm run migrations or tsx server/runMigrations.ts

import { runFreeAccessMigration } from './migrations/freeAccessForAll';

async function runAllMigrations() {
  console.log('='.repeat(60));
  console.log('Running database migrations...');
  console.log('='.repeat(60));
  
  try {
    // Run free access migration
    console.log('\nMigration: Free Access for All Users');
    console.log('-'.repeat(40));
    const freeAccessResult = await runFreeAccessMigration();
    
    if (!freeAccessResult.success) {
      throw new Error(`Free access migration failed: ${freeAccessResult.message}`);
    }
    
    console.log(`✓ ${freeAccessResult.message}`);
    
    // Add future migrations here
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ All migrations completed successfully');
    console.log('='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('✗ Migration failed:', error);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

// Run migrations
runAllMigrations();