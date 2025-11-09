/**
 * Quick Diagnostic Test
 * Simplified version that works with existing infrastructure
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';
import { runFullDiagnostics } from '../systemDiagnostics';
import { runComprehensiveDiagnostic } from '../aiSubAgent';

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('QUICK DIAGNOSTIC TEST');
  console.log('═══════════════════════════════════════════════════════\n');

  const findings: string[] = [];

  // 1. Check database connection and tables
  console.log('[1/4] Checking database connection and tables...\n');
  
  try {
    await db.execute(sql`SELECT 1`);
    console.log('✓ Database connection successful');
    findings.push('✓ Database: Connected and accessible');
  } catch (error: any) {
    console.log('✗ Database connection failed:', error.message);
    findings.push(`✗ Database: Connection failed - ${error.message}`);
  }

  // Check for officer_profiles table
  try {
    await db.execute(sql`SELECT COUNT(*) FROM officer_profiles`);
    console.log('✓ officer_profiles table exists');
    findings.push('✓ officer_profiles table: Exists');
  } catch (error: any) {
    console.log('✗ officer_profiles table does not exist - THIS IS A CRITICAL ISSUE');
    findings.push('❌ CRITICAL: officer_profiles table missing from database schema');
  }

  // Check other key tables
  const tablesToCheck = [
    'users', 'complaints', 'lawsuit_filings', 'petitions',
    'ai_subagent_logs', 'sessions'
  ];

  for (const table of tablesToCheck) {
    try {
      await db.execute(sql.raw(`SELECT COUNT(*) FROM ${table} LIMIT 1`));
      console.log(`✓ ${table} table exists`);
    } catch (error: any) {
      console.log(`✗ ${table} table missing`);
      findings.push(`❌ Missing table: ${table}`);
    }
  }

  // 2. Run full system diagnostics
  console.log('\n[2/4] Running full system diagnostics...\n');
  
  try {
    const diagResults = await runFullDiagnostics();
    
    console.log(`Total tests: ${diagResults.summary.total}`);
    console.log(`Passed: ${diagResults.summary.passed}`);
    console.log(`Failed: ${diagResults.summary.failed}`);
    console.log(`Skipped: ${diagResults.summary.skipped}\n`);

    const passRate = (diagResults.summary.passed / diagResults.summary.total * 100).toFixed(1);
    findings.push(`System Diagnostics: ${passRate}% pass rate (${diagResults.summary.passed}/${diagResults.summary.total})`);

    // Show failures
    const failures = diagResults.results.filter(r => r.status === 'FAIL');
    if (failures.length > 0) {
      console.log('Failed tests:');
      failures.forEach(f => {
        console.log(`  ✗ ${f.category} - ${f.test}: ${f.message}`);
        findings.push(`⚠ ${f.category}: ${f.test} failed`);
      });
    }
  } catch (error: any) {
    console.log('✗ System diagnostics failed:', error.message);
    findings.push(`✗ System Diagnostics: Failed - ${error.message}`);
  }

  // 3. Run AI Sub-Agent diagnostic
  console.log('\n[3/4] Running AI Sub-Agent diagnostic...\n');
  
  try {
    const subAgentDiag = await runComprehensiveDiagnostic(false);
    
    console.log(`Overall status: ${subAgentDiag.overallStatus}`);
    console.log(`Capabilities: ${subAgentDiag.capabilitiesHealthy}/${subAgentDiag.totalCapabilities} healthy`);
    console.log(`Knowledge entries: ${subAgentDiag.knowledgeEntries}`);
    console.log(`Performance tracking: ${subAgentDiag.performanceTracking ? 'Active' : 'Inactive'}`);
    
    findings.push(`AI Sub-Agent: ${subAgentDiag.capabilitiesHealthy}/${subAgentDiag.totalCapabilities} capabilities healthy`);

    if (subAgentDiag.issues.length > 0) {
      console.log('\nIssues found:');
      subAgentDiag.issues.forEach((issue: string) => {
        console.log(`  ⚠ ${issue}`);
        findings.push(`⚠ Sub-Agent: ${issue}`);
      });
    }
  } catch (error: any) {
    console.log('✗ AI Sub-Agent diagnostic failed:', error.message);
    findings.push(`✗ AI Sub-Agent: Diagnostic failed - ${error.message}`);
  }

  // 4. Test officer search capability (without storing to database)
  console.log('\n[4/4] Testing officer search capability...\n');
  
  try {
    const { searchOfficerInformation } = await import('../officerSearch');
    
    console.log('Attempting quick officer search (Mark Warburton, Cedar Rapids, IA)...');
    const searchResult = await searchOfficerInformation({
      officerName: 'Mark Warburton',
      city: 'Cedar Rapids',
      state: 'IA',
      officerType: 'police',
      badgeData: null,
      bypassCache: false
    }, 'diagnostic_test');

    console.log('✓ Officer search executed successfully');
    console.log(`  Name: ${searchResult.name}`);
    console.log(`  Badge: ${searchResult.badgeNumber || 'Not found'}`);
    console.log(`  Department: ${searchResult.department || 'Not found'}`);
    console.log(`  Sources: ${searchResult.sources?.length || 0}`);
    
    findings.push(`✓ Officer Search: Functional (found ${searchResult.sources?.length || 0} sources)`);
  } catch (error: any) {
    console.log(`✗ Officer search test failed: ${error.message}`);
    findings.push(`✗ Officer Search: Failed - ${error.message}`);
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('DIAGNOSTIC SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  const critical = findings.filter(f => f.includes('❌')).length;
  const warnings = findings.filter(f => f.includes('⚠')).length;
  const success = findings.filter(f => f.includes('✓')).length;

  findings.forEach(f => console.log(f));

  console.log(`\nResults: ${success} ✓ | ${warnings} ⚠ | ${critical} ❌`);

  let overallHealth: string;
  if (critical > 0) {
    overallHealth = '❌ CRITICAL';
  } else if (warnings > 3) {
    overallHealth = '⚠ NEEDS ATTENTION';
  } else {
    overallHealth = '✓ HEALTHY';
  }

  console.log(`\nOverall System Health: ${overallHealth}`);
  console.log('\n═══════════════════════════════════════════════════════\n');

  // Write to file
  const report = {
    timestamp: new Date().toISOString(),
    findings,
    summary: {
      success,
      warnings,
      critical,
      overallHealth
    }
  };

  await import('fs/promises').then(fs =>
    fs.writeFile('data/quick_diagnostic.json', JSON.stringify(report, null, 2))
  );

  console.log('✓ Diagnostic report saved to data/quick_diagnostic.json\n');

  process.exit(critical > 0 ? 1 : 0);
}

main();
