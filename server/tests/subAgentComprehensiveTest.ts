/**
 * Comprehensive Sub-Agent Capability Test Suite
 * Tests all newly implemented capabilities
 */

import { 
  getInstalledPackages, 
  readPackageJson, 
  checkPackageInstalled,
  checkDatabaseHealth,
  checkOfficerDatabaseAccess,
  testAutocorrectionAvailability,
  checkAllCapabilities
} from '../aiSubAgent';

async function runComprehensiveTests() {
  console.log('\n========================================');
  console.log('SUB-AGENT COMPREHENSIVE TEST SUITE');
  console.log('========================================\n');
  
  const results: any[] = [];
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Package Management
  try {
    totalTests++;
    console.log('TEST 1: Package Management...');
    const packages = await getInstalledPackages();
    const hasPackages = packages.length > 0;
    console.log(`  ✓ Found ${packages.length} packages`);
    
    const packageJson = await readPackageJson();
    console.log(`  ✓ Read package.json: ${packageJson.name}`);
    
    const hasExpress = await checkPackageInstalled('express');
    console.log(`  ✓ Express installed: ${hasExpress}`);
    
    if (hasPackages && packageJson && hasExpress) {
      passedTests++;
      results.push({ name: 'Package Management', status: 'PASS' });
      console.log('  ✅ PASSED\n');
    } else {
      results.push({ name: 'Package Management', status: 'FAIL' });
      console.log('  ❌ FAILED\n');
    }
  } catch (error: any) {
    console.error(`  ❌ FAILED: ${error.message}\n`);
    results.push({ name: 'Package Management', status: 'FAIL', error: error.message });
  }
  
  // Test 2: Database Health
  try {
    totalTests++;
    console.log('TEST 2: Database Health...');
    const dbHealth = await checkDatabaseHealth();
    console.log(`  ✓ Database healthy: ${dbHealth.healthy}`);
    console.log(`  ✓ Latency: ${dbHealth.latencyMs}ms`);
    
    if (dbHealth.healthy) {
      passedTests++;
      results.push({ name: 'Database Health', status: 'PASS', latency: dbHealth.latencyMs });
      console.log('  ✅ PASSED\n');
    } else {
      results.push({ name: 'Database Health', status: 'FAIL', error: dbHealth.error });
      console.log(`  ❌ FAILED: ${dbHealth.error}\n`);
    }
  } catch (error: any) {
    console.error(`  ❌ FAILED: ${error.message}\n`);
    results.push({ name: 'Database Health', status: 'FAIL', error: error.message });
  }
  
  // Test 3: Officer Database Access
  try {
    totalTests++;
    console.log('TEST 3: Officer Database Access...');
    const officerDb = await checkOfficerDatabaseAccess();
    console.log(`  ✓ Officer database accessible: ${officerDb.accessible}`);
    console.log(`  ✓ Officer records: ${officerDb.recordCount || 0}`);
    
    if (officerDb.accessible) {
      passedTests++;
      results.push({ name: 'Officer Database Access', status: 'PASS', records: officerDb.recordCount });
      console.log('  ✅ PASSED\n');
    } else {
      results.push({ name: 'Officer Database Access', status: 'FAIL', error: officerDb.error });
      console.log(`  ❌ FAILED: ${officerDb.error}\n`);
    }
  } catch (error: any) {
    console.error(`  ❌ FAILED: ${error.message}\n`);
    results.push({ name: 'Officer Database Access', status: 'FAIL', error: error.message });
  }
  
  // Test 4: Autocorrection Availability
  try {
    totalTests++;
    console.log('TEST 4: Autocorrection System...');
    const autocorrectAvailable = await testAutocorrectionAvailability();
    console.log(`  ✓ Autocorrection available: ${autocorrectAvailable}`);
    
    if (autocorrectAvailable) {
      passedTests++;
      results.push({ name: 'Autocorrection System', status: 'PASS' });
      console.log('  ✅ PASSED\n');
    } else {
      results.push({ name: 'Autocorrection System', status: 'FAIL' });
      console.log('  ❌ FAILED\n');
    }
  } catch (error: any) {
    console.error(`  ❌ FAILED: ${error.message}\n`);
    results.push({ name: 'Autocorrection System', status: 'FAIL', error: error.message });
  }
  
  // Test 5: All Capabilities Check
  try {
    totalTests++;
    console.log('TEST 5: Comprehensive Capability Check...');
    const capabilities = await checkAllCapabilities();
    const allAvailable = capabilities.every(c => c.available);
    
    console.log('  Capabilities:');
    for (const cap of capabilities) {
      const status = cap.available ? '✓' : '✗';
      console.log(`    ${status} ${cap.name}: ${cap.available}`);
    }
    
    if (allAvailable) {
      passedTests++;
      results.push({ name: 'All Capabilities', status: 'PASS', capabilities: capabilities.length });
      console.log('  ✅ PASSED\n');
    } else {
      const failedCaps = capabilities.filter(c => !c.available).map(c => c.name);
      results.push({ name: 'All Capabilities', status: 'FAIL', failed: failedCaps });
      console.log(`  ❌ FAILED: Missing capabilities: ${failedCaps.join(', ')}\n`);
    }
  } catch (error: any) {
    console.error(`  ❌ FAILED: ${error.message}\n`);
    results.push({ name: 'All Capabilities', status: 'FAIL', error: error.message });
  }
  
  // Final Results
  console.log('========================================');
  console.log('TEST RESULTS SUMMARY');
  console.log('========================================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('========================================\n');
  
  return {
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
    successRate: (passedTests / totalTests) * 100,
    results
  };
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests()
    .then(results => {
      console.log('Test execution complete.');
      process.exit(results.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { runComprehensiveTests };
