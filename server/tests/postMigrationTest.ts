/**
 * Post-Migration Verification Test
 * Verifies all 7 tables exist and officer search stores data
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';
import { officerProfiles, departmentUrls } from '@shared/schema';
import { searchOfficerInformation } from '../officerSearch';
import { compileOfficerData } from '../officerDataCollector';
import { runFullDiagnostics } from '../systemDiagnostics';

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('POST-MIGRATION VERIFICATION TEST');
  console.log('Date:', new Date().toISOString());
  console.log('═══════════════════════════════════════════════════════\n');

  const results = {
    part1: {
      tablesVerified: [] as string[],
      insertTests: [] as any[],
      officerSearches: [] as any[]
    },
    part2: {
      systemDiagnostics: null as any,
      passRate: '0%',
      criticalIssues: [] as string[]
    }
  };

  // PART 1: Verify Tables and Data Storage
  console.log('PART 1: DATABASE TABLES AND DATA STORAGE');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1.1: Check all 7 tables exist
  console.log('[1/5] Verifying all 7 database tables...\n');
  
  const tablesToCheck = [
    'officer_profiles',
    'department_urls',
    'sub_agent_search_cycles',
    'subagent_capabilities',
    'subagent_learning_patterns',
    'subagent_performance_metrics',
    'subagent_self_improvement_actions'
  ];

  for (const table of tablesToCheck) {
    try {
      await db.execute(sql.raw(`SELECT 1 FROM ${table} LIMIT 1`));
      console.log(`✓ ${table}`);
      results.part1.tablesVerified.push(table);
    } catch (error: any) {
      console.log(`✗ ${table} - MISSING`);
    }
  }

  console.log(`\nTables verified: ${results.part1.tablesVerified.length}/7\n`);

  // 1.2: Test INSERT into officer_profiles
  console.log('[2/5] Testing INSERT into officer_profiles...\n');
  
  try {
    const inserted = await db.insert(officerProfiles).values({
      officerName: 'Verification Test Officer',
      department: 'Test Department',
      rank: 'Sergeant',
      badgeNumber: 'VERIFY-001',
      jurisdiction: 'Test City, TS',
      dataQualityScore: 98,
      sources: ['verification_test'],
      lastVerified: new Date()
    }).returning();

    console.log(`✓ INSERT successful (ID: ${inserted[0].id})`);
    results.part1.insertTests.push({ table: 'officer_profiles', status: 'SUCCESS' });

    // Cleanup
    await db.delete(officerProfiles).where(sql`id = ${inserted[0].id}`);
    console.log(`✓ Test data cleaned up\n`);
  } catch (error: any) {
    console.log(`✗ INSERT failed: ${error.message}\n`);
    results.part1.insertTests.push({ table: 'officer_profiles', status: 'FAILED', error: error.message });
  }

  // 1.3: Test INSERT into department_urls
  console.log('[3/5] Testing INSERT into department_urls...\n');
  
  try {
    const inserted = await db.insert(departmentUrls).values({
      departmentName: 'Verification Test PD',
      state: 'TS',
      city: 'Test City',
      officialWebsite: 'https://verify.test.example.com',
      lastVerified: new Date()
    }).returning();

    console.log(`✓ INSERT successful (ID: ${inserted[0].id})`);
    results.part1.insertTests.push({ table: 'department_urls', status: 'SUCCESS' });

    // Cleanup
    await db.delete(departmentUrls).where(sql`id = ${inserted[0].id}`);
    console.log(`✓ Test data cleaned up\n`);
  } catch (error: any) {
    console.log(`✗ INSERT failed: ${error.message}\n`);
    results.part1.insertTests.push({ table: 'department_urls', status: 'FAILED', error: error.message });
  }

  // 1.4: Test Officer Search with Storage
  console.log('[4/5] Testing officer search with database storage...\n');

  const beforeCount = await db.select({ count: sql<number>`count(*)` }).from(officerProfiles);
  const initialCount = Number(beforeCount[0].count);
  console.log(`Initial officer_profiles count: ${initialCount}`);

  const testOfficers = [
    { name: 'Derek Chauvin', city: 'Minneapolis', state: 'MN', dept: 'Minneapolis Police Department' },
  ];

  for (const officer of testOfficers) {
    try {
      console.log(`\nSearching for: ${officer.name}, ${officer.city}, ${officer.state}...`);
      
      const searchResult = await searchOfficerInformation({
        officerName: officer.name,
        city: officer.city,
        state: officer.state,
        officerType: 'police',
        badgeData: null,
        bypassCache: true
      }, `verification_${Date.now()}`);

      console.log(`✓ Search completed - Sources: ${searchResult.sources?.length || 0}`);

      // Try to compile profile
      try {
        const profile = await compileOfficerData(
          officer.name,
          officer.dept,
          `${officer.city}, ${officer.state}`
        );

        console.log(`✓ Profile compiled - Quality: ${profile?.dataQualityScore}/100`);

        results.part1.officerSearches.push({
          name: officer.name,
          sources: searchResult.sources?.length || 0,
          quality: profile?.dataQualityScore,
          status: 'SUCCESS'
        });
      } catch (error: any) {
        console.log(`⚠ Profile compilation: ${error.message}`);
        results.part1.officerSearches.push({
          name: officer.name,
          sources: searchResult.sources?.length || 0,
          status: 'SEARCH_ONLY'
        });
      }
    } catch (error: any) {
      console.log(`✗ Search failed: ${error.message}`);
      results.part1.officerSearches.push({
        name: officer.name,
        status: 'FAILED',
        error: error.message
      });
    }
  }

  const afterCount = await db.select({ count: sql<number>`count(*)` }).from(officerProfiles);
  const finalCount = Number(afterCount[0].count);
  const newProfiles = finalCount - initialCount;

  console.log(`\nFinal officer_profiles count: ${finalCount}`);
  console.log(`New profiles stored: ${newProfiles}`);

  if (newProfiles > 0) {
    console.log(`\n✅ SUCCESS: ${newProfiles} new profile(s) stored in database!`);
  }

  // 1.5: Show recent profiles
  console.log('\n[5/5] Recent profiles in database...\n');
  
  const recentProfiles = await db.select().from(officerProfiles)
    .orderBy(sql`created_at DESC`)
    .limit(3);

  recentProfiles.forEach((p, i) => {
    console.log(`Profile ${i + 1}:`);
    console.log(`  Name: ${p.officerName}`);
    console.log(`  Department: ${p.department}`);
    console.log(`  Badge: ${p.badgeNumber || 'N/A'}, Rank: ${p.rank || 'N/A'}`);
    console.log(`  Quality: ${p.dataQualityScore}/100`);
    console.log(`  Sources: ${p.sources?.length || 0}`);
    console.log(`  Created: ${p.createdAt}\n`);
  });

  // PART 2: System Diagnostics
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('PART 2: COMPREHENSIVE SYSTEM DIAGNOSTICS');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Running full system diagnostics...\n');
  
  try {
    const diagResults = await runFullDiagnostics();
    results.part2.systemDiagnostics = diagResults;

    console.log(`Total tests: ${diagResults.summary.total}`);
    console.log(`Passed: ${diagResults.summary.passed}`);
    console.log(`Failed: ${diagResults.summary.failed}`);
    console.log(`Skipped: ${diagResults.summary.skipped}`);

    const passRate = ((diagResults.summary.passed / diagResults.summary.total) * 100).toFixed(1);
    results.part2.passRate = `${passRate}%`;

    console.log(`\nPass Rate: ${passRate}%\n`);

    const failures = diagResults.results.filter(r => r.status === 'FAIL');
    if (failures.length > 0) {
      console.log('Failed tests:');
      failures.forEach(f => {
        console.log(`  ✗ ${f.category} - ${f.test}: ${f.message}`);
        results.part2.criticalIssues.push(`${f.category}: ${f.test}`);
      });
    } else {
      console.log('✓ All tests passed!');
    }
  } catch (error: any) {
    console.log(`✗ System diagnostics failed: ${error.message}`);
  }

  // FINAL SUMMARY
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('FINAL SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('PART 1: Database Tables & Storage');
  console.log(`  ✓ Tables verified: ${results.part1.tablesVerified.length}/7`);
  console.log(`  ✓ INSERT tests: ${results.part1.insertTests.filter(t => t.status === 'SUCCESS').length}/2 passed`);
  console.log(`  ✓ Officer searches: ${results.part1.officerSearches.length} completed`);
  console.log(`  ✓ New profiles stored: ${newProfiles}`);

  console.log('\nPART 2: System Diagnostics');
  console.log(`  ✓ Pass rate: ${results.part2.passRate}`);
  console.log(`  ✗ Critical issues: ${results.part2.criticalIssues.length}`);

  const overallSuccess = 
    results.part1.tablesVerified.length === 7 &&
    results.part1.insertTests.every(t => t.status === 'SUCCESS') &&
    newProfiles > 0;

  console.log(`\nOverall Status: ${overallSuccess ? '✅ OPERATIONAL' : '⚠ NEEDS ATTENTION'}`);

  // Write results
  await import('fs/promises').then(fs =>
    fs.writeFile('data/post_migration_results.json', JSON.stringify(results, null, 2))
  );

  console.log('\n✓ Results saved to data/post_migration_results.json\n');

  process.exit(0);
}

main();
