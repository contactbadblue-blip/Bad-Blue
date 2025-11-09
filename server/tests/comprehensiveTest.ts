/**
 * Comprehensive Test Suite
 * Task 5 & 6: 3-Minute Data Collection Test + System Diagnostics
 */

import { db } from '../db';
import { officerProfiles } from '@shared/schema';
import { desc, sql } from 'drizzle-orm';
import { searchOfficerInformation } from '../officerSearch';
import { compileOfficerData } from '../officerDataCollector';
import { runFullDiagnostics } from '../systemDiagnostics';
import { runComprehensiveDiagnostic } from '../aiSubAgent';

interface TestResults {
  part1: {
    profilesAttempted: number;
    profilesStored: number;
    duplicatesPrevented: number;
    dataQuality: string;
    errors: string[];
    sources: string[];
    testDuration: number;
  };
  part2: {
    systemsChecked: string[];
    systemStatus: Record<string, string>;
    criticalIssues: string[];
    overallHealth: 'healthy' | 'needs_attention' | 'critical';
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * PART 1: 3-Minute Data Collection Test
 */
async function runDataCollectionTest(): Promise<TestResults['part1']> {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('PART 1: 3-MINUTE DATA COLLECTION TEST');
  console.log('═══════════════════════════════════════════════════════\n');

  const startTime = Date.now();
  const results: TestResults['part1'] = {
    profilesAttempted: 0,
    profilesStored: 0,
    duplicatesPrevented: 0,
    dataQuality: 'unknown',
    errors: [],
    sources: [],
    testDuration: 0,
  };

  // Get baseline count of officer profiles
  const baselineCount = await db.select({ count: sql<number>`count(*)` })
    .from(officerProfiles);
  const initialCount = Number(baselineCount[0].count);
  
  console.log(`[Test] Initial officer_profiles count: ${initialCount}`);
  console.log(`[Test] Starting 3-minute data collection test...`);
  console.log(`[Test] Start time: ${new Date().toISOString()}\n`);

  // Test officers to search for
  const testOfficers = [
    { name: 'Derek Chauvin', city: 'Minneapolis', state: 'MN', department: 'Minneapolis Police Department' },
    { name: 'Mark Warburton', city: 'Cedar Rapids', state: 'IA', department: 'Cedar Rapids Police Department' },
  ];

  const searchPromises: Promise<any>[] = [];

  // Trigger searches
  for (const officer of testOfficers) {
    results.profilesAttempted++;
    console.log(`[Test] Triggering search ${results.profilesAttempted}: ${officer.name} (${officer.city}, ${officer.state})`);
    
    const searchPromise = (async () => {
      try {
        const searchResult = await searchOfficerInformation({
          officerName: officer.name,
          city: officer.city,
          state: officer.state,
          officerType: 'police',
          badgeData: null,
          bypassCache: false
        }, `test_${Date.now()}_${Math.random()}`);

        console.log(`[Test] ✓ Search completed for ${officer.name}`);
        console.log(`[Test]   Sources: ${searchResult.sources?.length || 0}`);
        
        if (searchResult.sources) {
          results.sources.push(...searchResult.sources);
        }

        // Try to compile full profile
        try {
          const profile = await compileOfficerData(
            officer.name,
            officer.department,
            `${officer.city}, ${officer.state}`
          );

          if (profile) {
            console.log(`[Test] ✓ Profile compiled for ${officer.name}`);
            console.log(`[Test]   Data quality score: ${profile.dataQualityScore}/100`);
            console.log(`[Test]   Badge: ${profile.badgeNumber || 'Not found'}`);
            console.log(`[Test]   Rank: ${profile.rank || 'Not found'}`);
          }
        } catch (error: any) {
          console.log(`[Test] ⚠ Profile compilation failed for ${officer.name}:`, error.message);
          results.errors.push(`Profile compilation: ${error.message}`);
        }

        return searchResult;
      } catch (error: any) {
        console.error(`[Test] ✗ Search failed for ${officer.name}:`, error.message);
        results.errors.push(`Search ${officer.name}: ${error.message}`);
        return null;
      }
    })();

    searchPromises.push(searchPromise);
  }

  // Wait for all searches to complete or timeout at 3 minutes
  console.log('\n[Test] Waiting for searches to complete (max 3 minutes)...\n');
  
  const THREE_MINUTES = 180 * 1000;
  const timeoutPromise = sleep(THREE_MINUTES).then(() => 'TIMEOUT');
  const allSearches = Promise.all(searchPromises).then(() => 'COMPLETED');

  const result = await Promise.race([allSearches, timeoutPromise]);
  
  const elapsed = Date.now() - startTime;
  results.testDuration = elapsed;

  console.log(`\n[Test] Data collection ${result === 'TIMEOUT' ? 'timed out' : 'completed'} after ${(elapsed / 1000).toFixed(1)} seconds`);

  // Check database for new profiles
  const finalCount = await db.select({ count: sql<number>`count(*)` })
    .from(officerProfiles);
  const endCount = Number(finalCount[0].count);

  results.profilesStored = endCount - initialCount;

  console.log(`\n[Test] Final officer_profiles count: ${endCount}`);
  console.log(`[Test] New profiles created: ${results.profilesStored}`);

  // Get recently created profiles
  if (results.profilesStored > 0) {
    const recentProfiles = await db.select()
      .from(officerProfiles)
      .orderBy(desc(officerProfiles.createdAt))
      .limit(results.profilesStored);

    console.log('\n[Test] Recently created profiles:');
    for (const profile of recentProfiles) {
      console.log(`  - ${profile.officerName} (${profile.department})`);
      console.log(`    Badge: ${profile.badgeNumber || 'N/A'}, Rank: ${profile.rank || 'N/A'}`);
      console.log(`    Quality Score: ${profile.dataQualityScore}/100`);
      console.log(`    Sources: ${profile.sources?.length || 0}`);
    }

    // Calculate average quality score
    const avgQuality = recentProfiles.reduce((sum, p) => sum + (p.dataQualityScore || 0), 0) / recentProfiles.length;
    results.dataQuality = `${avgQuality.toFixed(1)}/100 (${avgQuality >= 70 ? 'Good' : avgQuality >= 50 ? 'Fair' : 'Poor'})`;

    // Check for duplicates
    const uniqueOfficers = new Set(recentProfiles.map(p => 
      `${p.officerName.toLowerCase()}|${p.department?.toLowerCase() || ''}`
    ));
    results.duplicatesPrevented = recentProfiles.length - uniqueOfficers.size;
    
    if (results.duplicatesPrevented > 0) {
      console.log(`\n[Test] ⚠ Detected ${results.duplicatesPrevented} potential duplicate(s)`);
    } else {
      console.log(`\n[Test] ✓ No duplicates detected`);
    }
  }

  // Unique sources
  const uniqueSources = [...new Set(results.sources)];
  console.log(`\n[Test] Unique data sources used: ${uniqueSources.length}`);
  if (uniqueSources.length > 0) {
    console.log('[Test] Sample sources:');
    uniqueSources.slice(0, 5).forEach(source => {
      console.log(`  - ${source.substring(0, 80)}${source.length > 80 ? '...' : ''}`);
    });
  }

  return results;
}

/**
 * PART 2: Comprehensive System Diagnostics
 */
async function runSystemDiagnostics(): Promise<TestResults['part2']> {
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('PART 2: COMPREHENSIVE SYSTEM DIAGNOSTICS');
  console.log('═══════════════════════════════════════════════════════\n');

  const results: TestResults['part2'] = {
    systemsChecked: [],
    systemStatus: {},
    criticalIssues: [],
    overallHealth: 'healthy',
  };

  // 1. Run full system diagnostics
  console.log('[Diagnostics] Running full system diagnostics...\n');
  const fullDiag = await runFullDiagnostics();

  results.systemsChecked.push('Database', 'AI Services', 'Stripe', 'Email', 'Object Storage', 'Authentication', 'Environment');

  // Analyze results
  const categoryStatus: Record<string, { pass: number; fail: number; skip: number }> = {};

  for (const result of fullDiag.results) {
    if (!categoryStatus[result.category]) {
      categoryStatus[result.category] = { pass: 0, fail: 0, skip: 0 };
    }

    if (result.status === 'PASS') categoryStatus[result.category].pass++;
    else if (result.status === 'FAIL') categoryStatus[result.category].fail++;
    else categoryStatus[result.category].skip++;

    // Track critical issues
    if (result.status === 'FAIL') {
      const issue = `${result.category} - ${result.test}: ${result.message}`;
      results.criticalIssues.push(issue);
    }
  }

  // Display category summaries
  console.log('═══════════════════════════════════════════════════════');
  console.log('SYSTEM DIAGNOSTICS SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  for (const [category, stats] of Object.entries(categoryStatus)) {
    const total = stats.pass + stats.fail + stats.skip;
    const status = stats.fail === 0 ? '✓ PASS' : stats.fail < stats.pass ? '⚠ PARTIAL' : '✗ FAIL';
    
    console.log(`${status.padEnd(10)} ${category}`);
    console.log(`           ${stats.pass} passed, ${stats.fail} failed, ${stats.skip} skipped`);
    
    results.systemStatus[category] = status;
  }

  console.log(`\nOverall: ${fullDiag.summary.passed}/${fullDiag.summary.total} tests passed`);

  // 2. Run AI Sub-Agent diagnostic
  console.log('\n[Diagnostics] Running AI Sub-Agent diagnostic...\n');
  try {
    const subAgentDiag = await runComprehensiveDiagnostic(false);
    results.systemsChecked.push('AI Sub-Agent');
    
    if (subAgentDiag.overallStatus === 'healthy') {
      results.systemStatus['AI Sub-Agent'] = '✓ PASS';
      console.log('✓ PASS     AI Sub-Agent');
    } else {
      results.systemStatus['AI Sub-Agent'] = '⚠ PARTIAL';
      console.log('⚠ PARTIAL  AI Sub-Agent');
    }

    console.log(`           Capabilities: ${subAgentDiag.capabilitiesHealthy}/${subAgentDiag.totalCapabilities} healthy`);
    console.log(`           Knowledge entries: ${subAgentDiag.knowledgeEntries}`);
    console.log(`           Performance tracking: ${subAgentDiag.performanceTracking ? 'Active' : 'Inactive'}`);
  } catch (error: any) {
    results.systemStatus['AI Sub-Agent'] = '✗ FAIL';
    results.criticalIssues.push(`AI Sub-Agent: ${error.message}`);
    console.log(`✗ FAIL     AI Sub-Agent: ${error.message}`);
  }

  // Determine overall health
  const failedSystems = Object.values(results.systemStatus).filter(s => s.includes('FAIL')).length;
  const partialSystems = Object.values(results.systemStatus).filter(s => s.includes('PARTIAL')).length;

  if (failedSystems > 2 || results.criticalIssues.length > 5) {
    results.overallHealth = 'critical';
  } else if (failedSystems > 0 || partialSystems > 2) {
    results.overallHealth = 'needs_attention';
  } else {
    results.overallHealth = 'healthy';
  }

  return results;
}

/**
 * Main test runner
 */
async function main() {
  const startTime = Date.now();

  console.log('═══════════════════════════════════════════════════════');
  console.log('COMPREHENSIVE TEST SUITE');
  console.log('Task 5 & 6: Data Collection + System Diagnostics');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Started: ${new Date().toISOString()}\n`);

  try {
    // Run Part 1: Data Collection Test
    const part1Results = await runDataCollectionTest();

    // Run Part 2: System Diagnostics
    const part2Results = await runSystemDiagnostics();

    // Final Summary
    const totalTime = (Date.now() - startTime) / 1000;

    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('FINAL SUMMARY');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('PART 1: DATA COLLECTION TEST');
    console.log(`- Profiles attempted: ${part1Results.profilesAttempted}`);
    console.log(`- Profiles stored: ${part1Results.profilesStored}`);
    console.log(`- Duplicates prevented: ${part1Results.duplicatesPrevented}`);
    console.log(`- Data quality: ${part1Results.dataQuality}`);
    console.log(`- Errors: ${part1Results.errors.length}`);
    console.log(`- Test duration: ${(part1Results.testDuration / 1000).toFixed(1)}s\n`);

    console.log('PART 2: SYSTEM DIAGNOSTICS');
    console.log(`- Systems checked: ${part2Results.systemsChecked.length}`);
    console.log(`- Critical issues: ${part2Results.criticalIssues.length}`);
    console.log(`- Overall health: ${part2Results.overallHealth.toUpperCase()}\n`);

    if (part2Results.criticalIssues.length > 0) {
      console.log('Critical Issues:');
      part2Results.criticalIssues.forEach(issue => {
        console.log(`  ✗ ${issue}`);
      });
      console.log();
    }

    console.log(`Total test time: ${totalTime.toFixed(1)}s`);
    console.log(`Completed: ${new Date().toISOString()}`);
    console.log('═══════════════════════════════════════════════════════\n');

    // Write results to file
    const resultsFile = {
      timestamp: new Date().toISOString(),
      totalDuration: totalTime,
      part1: part1Results,
      part2: part2Results,
    };

    await import('fs/promises').then(fs =>
      fs.writeFile(
        'data/test_results.json',
        JSON.stringify(resultsFile, null, 2)
      )
    );

    console.log('✓ Test results saved to data/test_results.json\n');

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Test suite failed:', error);
    process.exit(1);
  }
}

export { main, runDataCollectionTest, runSystemDiagnostics };

// Run if called directly
main();
