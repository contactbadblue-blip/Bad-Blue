import { db } from '../db';
import { officerProfiles, departmentUrls, subAgentSearchCycles } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function verifyMigration() {
  console.log('\n[Migration Verification] Starting database table verification...\n');

  try {
    // Test 1: Verify officer_profiles table
    console.log('[Test 1] Testing officer_profiles table...');
    const testOfficer = {
      officerName: 'Test Officer Migration',
      badgeNumber: 'TEST-001',
      department: 'Test Department',
      rank: 'Officer',
      location: 'Test City, TS',
      sources: ['migration-test'],
      dataQualityScore: 100,
    };

    const insertedOfficer = await db.insert(officerProfiles).values(testOfficer).returning();
    console.log('  ✓ Successfully inserted test officer:', insertedOfficer[0].id);

    const queriedOfficer = await db
      .select()
      .from(officerProfiles)
      .where(eq(officerProfiles.id, insertedOfficer[0].id))
      .limit(1);
    console.log('  ✓ Successfully queried officer:', queriedOfficer[0].officerName);

    await db.delete(officerProfiles).where(eq(officerProfiles.id, insertedOfficer[0].id));
    console.log('  ✓ Successfully cleaned up test officer\n');

    // Test 2: Verify department_urls table
    console.log('[Test 2] Testing department_urls table...');
    const testDepartment = {
      departmentName: 'Test Police Department',
      url: 'https://test-pd.example.com',
      location: 'Test City, TS',
      state: 'TS',
      departmentType: 'police',
      verified: false,
    };

    const insertedDept = await db.insert(departmentUrls).values(testDepartment).returning();
    console.log('  ✓ Successfully inserted test department:', insertedDept[0].id);

    const queriedDept = await db
      .select()
      .from(departmentUrls)
      .where(eq(departmentUrls.id, insertedDept[0].id))
      .limit(1);
    console.log('  ✓ Successfully queried department:', queriedDept[0].departmentName);

    await db.delete(departmentUrls).where(eq(departmentUrls.id, insertedDept[0].id));
    console.log('  ✓ Successfully cleaned up test department\n');

    // Test 3: Verify sub_agent_search_cycles table
    console.log('[Test 3] Testing sub_agent_search_cycles table...');
    const testCycle = {
      currentCycle: 'officer',
      searchState: 'not_running',
      isPaused: false,
      cycleCount: 0,
    };

    const insertedCycle = await db.insert(subAgentSearchCycles).values(testCycle).returning();
    console.log('  ✓ Successfully inserted test search cycle:', insertedCycle[0].id);

    const queriedCycle = await db
      .select()
      .from(subAgentSearchCycles)
      .where(eq(subAgentSearchCycles.id, insertedCycle[0].id))
      .limit(1);
    console.log('  ✓ Successfully queried search cycle:', queriedCycle[0].currentCycle);

    await db.delete(subAgentSearchCycles).where(eq(subAgentSearchCycles.id, insertedCycle[0].id));
    console.log('  ✓ Successfully cleaned up test search cycle\n');

    console.log('[Migration Verification] ✅ ALL TESTS PASSED!\n');
    console.log('Summary:');
    console.log('  ✅ officer_profiles table: Fully functional');
    console.log('  ✅ department_urls table: Fully functional');
    console.log('  ✅ sub_agent_search_cycles table: Fully functional\n');
    console.log('Officer search can now store profiles successfully!\n');

    return true;
  } catch (error) {
    console.error('[Migration Verification] ❌ TESTS FAILED:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyMigration()
    .then(() => {
      console.log('Verification complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}
