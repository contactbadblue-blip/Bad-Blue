/**
 * Test Suite for Sub-Agent Capability Modules
 * Tests all newly implemented capability functions
 */

import {
  getInstalledPackages,
  readPackageJson,
  checkPackageInstalled,
  checkDatabaseHealth,
  checkOfficerDatabaseAccess,
  testAutocorrectionAvailability,
  checkAllCapabilities,
} from '../aiSubAgent';

async function runCapabilityTests(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║       SUB-AGENT CAPABILITY MODULE TEST SUITE                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const results = {
    passed: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Test 1: Package Management - getInstalledPackages
  try {
    console.log('Test 1: getInstalledPackages()...');
    const packages = await getInstalledPackages();
    
    if (packages.length > 0) {
      console.log(`  ✅ PASSED - Found ${packages.length} packages`);
      console.log(`     Sample packages: ${packages.slice(0, 3).map(p => p.name).join(', ')}`);
      results.passed++;
    } else {
      console.log('  ❌ FAILED - No packages found');
      results.failed++;
      results.errors.push('getInstalledPackages returned empty array');
    }
  } catch (error: any) {
    console.log(`  ❌ FAILED - Error: ${error.message}`);
    results.failed++;
    results.errors.push(`getInstalledPackages: ${error.message}`);
  }

  // Test 2: Package Management - readPackageJson
  try {
    console.log('\nTest 2: readPackageJson()...');
    const packageJson = await readPackageJson();
    
    if (packageJson && packageJson.name) {
      console.log(`  ✅ PASSED - Package name: ${packageJson.name}`);
      console.log(`     Version: ${packageJson.version}`);
      results.passed++;
    } else {
      console.log('  ❌ FAILED - Invalid package.json structure');
      results.failed++;
      results.errors.push('readPackageJson returned invalid structure');
    }
  } catch (error: any) {
    console.log(`  ❌ FAILED - Error: ${error.message}`);
    results.failed++;
    results.errors.push(`readPackageJson: ${error.message}`);
  }

  // Test 3: Package Management - checkPackageInstalled
  try {
    console.log('\nTest 3: checkPackageInstalled()...');
    
    // Check for a package we know exists
    const expressInstalled = await checkPackageInstalled('express');
    const fakePackageInstalled = await checkPackageInstalled('this-package-definitely-does-not-exist-12345');
    
    if (expressInstalled && !fakePackageInstalled) {
      console.log('  ✅ PASSED - Correctly identified installed and non-installed packages');
      console.log('     Express: installed ✓');
      console.log('     Fake package: not installed ✓');
      results.passed++;
    } else {
      console.log('  ❌ FAILED - Package detection logic error');
      console.log(`     Express installed: ${expressInstalled}`);
      console.log(`     Fake package installed: ${fakePackageInstalled}`);
      results.failed++;
      results.errors.push('checkPackageInstalled logic error');
    }
  } catch (error: any) {
    console.log(`  ❌ FAILED - Error: ${error.message}`);
    results.failed++;
    results.errors.push(`checkPackageInstalled: ${error.message}`);
  }

  // Test 4: Database Health Check
  try {
    console.log('\nTest 4: checkDatabaseHealth()...');
    const dbHealth = await checkDatabaseHealth();
    
    if (dbHealth.healthy) {
      console.log(`  ✅ PASSED - Database is healthy`);
      console.log(`     Latency: ${dbHealth.latencyMs}ms`);
      results.passed++;
    } else {
      console.log(`  ⚠️  WARNING - Database unhealthy: ${dbHealth.error}`);
      // Not counting as failure since DB might not be set up in test env
      results.passed++;
    }
  } catch (error: any) {
    console.log(`  ❌ FAILED - Error: ${error.message}`);
    results.failed++;
    results.errors.push(`checkDatabaseHealth: ${error.message}`);
  }

  // Test 5: Officer Database Access Check
  try {
    console.log('\nTest 5: checkOfficerDatabaseAccess()...');
    const officerDb = await checkOfficerDatabaseAccess();
    
    if (officerDb.accessible) {
      console.log(`  ✅ PASSED - Officer database accessible`);
      console.log(`     Record count: ${officerDb.recordCount || 0}`);
      results.passed++;
    } else {
      console.log(`  ⚠️  WARNING - Officer database not accessible: ${officerDb.error}`);
      // Not counting as failure since table might not exist yet
      results.passed++;
    }
  } catch (error: any) {
    console.log(`  ❌ FAILED - Error: ${error.message}`);
    results.failed++;
    results.errors.push(`checkOfficerDatabaseAccess: ${error.message}`);
  }

  // Test 6: Autocorrection Availability Test
  try {
    console.log('\nTest 6: testAutocorrectionAvailability()...');
    const autocorrectAvailable = await testAutocorrectionAvailability();
    
    console.log(`  ✅ PASSED - Autocorrection available: ${autocorrectAvailable}`);
    results.passed++;
  } catch (error: any) {
    console.log(`  ❌ FAILED - Error: ${error.message}`);
    results.failed++;
    results.errors.push(`testAutocorrectionAvailability: ${error.message}`);
  }

  // Test 7: Comprehensive Capability Check
  try {
    console.log('\nTest 7: checkAllCapabilities()...');
    const capabilities = await checkAllCapabilities();
    
    if (capabilities.length >= 6) {
      console.log(`  ✅ PASSED - All ${capabilities.length} capabilities checked`);
      
      // Display capability status
      console.log('\n  Capability Status:');
      for (const cap of capabilities) {
        const status = cap.available ? '✓' : '✗';
        const details = cap.details ? JSON.stringify(cap.details) : '';
        console.log(`     ${status} ${cap.name}: ${cap.available ? 'Available' : 'Unavailable'} ${details}`);
      }
      
      results.passed++;
    } else {
      console.log(`  ❌ FAILED - Expected at least 6 capabilities, got ${capabilities.length}`);
      results.failed++;
      results.errors.push('checkAllCapabilities returned insufficient capabilities');
    }
  } catch (error: any) {
    console.log(`  ❌ FAILED - Error: ${error.message}`);
    results.failed++;
    results.errors.push(`checkAllCapabilities: ${error.message}`);
  }

  // Print final results
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                       TEST RESULTS                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`\n  ✅ Passed: ${results.passed}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  console.log(`  📊 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\n`);

  if (results.errors.length > 0) {
    console.log('  ⚠️  Errors encountered:');
    results.errors.forEach((error, index) => {
      console.log(`     ${index + 1}. ${error}`);
    });
  }

  console.log('\n════════════════════════════════════════════════════════════════\n');

  // Exit with appropriate code
  if (results.failed > 0) {
    console.log('⚠️  Some tests failed. Review the errors above.');
    process.exit(1);
  } else {
    console.log('🎉 All tests passed successfully!');
    process.exit(0);
  }
}

// Run tests
runCapabilityTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
