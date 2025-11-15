// Test script to run diagnostics
import { runComprehensiveDiagnostics } from './server/testDiagnostics.ts';

async function test() {
  console.log('Running comprehensive diagnostics...\n');
  
  try {
    const results = await runComprehensiveDiagnostics();
    
    console.log('=== DIAGNOSTIC RESULTS ===\n');
    console.log(`Timestamp: ${results.timestamp}`);
    console.log(`\nSummary:`);
    console.log(`  Total services: ${results.summary.total}`);
    console.log(`  ✓ Passed: ${results.summary.passed}`);
    console.log(`  ✗ Failed: ${results.summary.failed}`);
    console.log(`  ⚠ Warnings: ${results.summary.warnings}`);
    
    console.log(`\n=== SERVICE STATUS ===\n`);
    
    for (const service of results.services) {
      console.log(`${service.status} ${service.service}`);
      console.log(`  Message: ${service.message}`);
      if (service.error) {
        console.log(`  Error: ${service.error}`);
      }
      if (service.responseTime) {
        console.log(`  Response time: ${service.responseTime}ms`);
      }
      if (service.details) {
        console.log(`  Details:`, JSON.stringify(service.details, null, 2));
      }
      console.log('');
    }
    
    if (results.recommendations.length > 0) {
      console.log('=== RECOMMENDATIONS ===\n');
      for (const rec of results.recommendations) {
        console.log(`• ${rec}`);
      }
    }
    
    // Check specific services we fixed
    const emailService = results.services.find(s => s.service === 'Email Service (SMTP)');
    const geminiService = results.services.find(s => s.service === 'Google Gemini AI');
    
    console.log('\n=== FIXED SERVICES STATUS ===\n');
    console.log(`Email Service (SMTP): ${emailService ? emailService.status : 'NOT FOUND'} - ${emailService?.message || 'Service not tested'}`);
    console.log(`Google Gemini AI: ${geminiService ? geminiService.status : 'NOT FOUND'} - ${geminiService?.message || 'Service not tested'}`);
    
  } catch (error) {
    console.error('Error running diagnostics:', error);
  }
}

test();