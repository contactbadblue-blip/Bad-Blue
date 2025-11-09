import { WorkerTestSuite } from './workerTests';
import { SubAgentTestSuite } from './subAgentTests';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * MASTER TEST RUNNER
 * 
 * Executes comprehensive test suites for BadBlue Worker and AI Sub-Agent
 * Generates detailed reports with performance metrics and security validation
 */

export interface ComprehensiveTestReport {
  timestamp: string;
  totalDuration: number;
  workerResults: {
    passed: number;
    total: number;
    successRate: number;
    tests: any[];
  };
  subAgentResults: {
    passed: number;
    total: number;
    successRate: number;
    securityRate: number;
    tests: any[];
  };
  overallStatus: 'PASS' | 'FAIL';
  recommendations: string[];
}

export class MasterTestRunner {
  private readonly REPORTS_DIR = path.join(process.cwd(), 'data', 'test_reports');

  async runComprehensiveTests(): Promise<ComprehensiveTestReport> {
    const startTime = Date.now();

    console.log('\n╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║           BADBLUE COMPREHENSIVE SYSTEM TEST SUITE                             ║');
    console.log('║           Worker Automation + AI Sub-Agent Validation                         ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');

    // Execute Worker Test Suite
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PART 1: BADBLUE WORKER AUTOMATION TESTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const workerSuite = new WorkerTestSuite();
    const workerResults = await workerSuite.runAllTests();

    // Execute AI Sub-Agent Test Suite
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PART 2: AI SUB-AGENT CAPABILITY & SECURITY TESTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const subAgentSuite = new SubAgentTestSuite();
    const subAgentResults = await subAgentSuite.runAllTests();

    // Calculate metrics
    const workerPassed = workerResults.filter(r => r.passed).length;
    const workerTotal = workerResults.length;
    const workerSuccessRate = (workerPassed / workerTotal) * 100;

    const subAgentPassed = subAgentResults.filter(r => r.passed).length;
    const subAgentTotal = subAgentResults.length;
    const subAgentSuccessRate = (subAgentPassed / subAgentTotal) * 100;

    const securityTests = subAgentResults.filter(r => r.securityStatus);
    const secureTests = securityTests.filter(r => r.securityStatus === 'PROTECTED').length;
    const securityRate = securityTests.length > 0 
      ? (secureTests / securityTests.length) * 100 
      : 0;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (workerSuccessRate < 100) {
      const failedWorkerTests = workerResults.filter(r => !r.passed);
      recommendations.push(`Worker: Review ${failedWorkerTests.length} failed tests - ${failedWorkerTests.map(t => t.testName).join(', ')}`);
    }
    
    if (subAgentSuccessRate < 100) {
      const failedSubAgentTests = subAgentResults.filter(r => !r.passed);
      recommendations.push(`Sub-Agent: Review ${failedSubAgentTests.length} failed tests - ${failedSubAgentTests.map(t => t.testName).join(', ')}`);
    }

    if (securityRate < 100) {
      recommendations.push(`Security: ${securityTests.length - secureTests} security tests failed - immediate review required`);
    }

    if (recommendations.length === 0) {
      recommendations.push('All systems operational - no action required');
    }

    // Create comprehensive report
    const report: ComprehensiveTestReport = {
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - startTime,
      workerResults: {
        passed: workerPassed,
        total: workerTotal,
        successRate: workerSuccessRate,
        tests: workerResults,
      },
      subAgentResults: {
        passed: subAgentPassed,
        total: subAgentTotal,
        successRate: subAgentSuccessRate,
        securityRate,
        tests: subAgentResults,
      },
      overallStatus: (workerSuccessRate === 100 && subAgentSuccessRate === 100 && securityRate === 100) 
        ? 'PASS' 
        : 'FAIL',
      recommendations,
    };

    // Print final summary
    console.log('\n╔═══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                        COMPREHENSIVE TEST SUMMARY                             ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');
    console.log(`Overall Status: ${report.overallStatus === 'PASS' ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Total Duration: ${report.totalDuration}ms\n`);
    
    console.log('Worker Automation:');
    console.log(`  Tests: ${workerPassed}/${workerTotal} passed (${workerSuccessRate.toFixed(1)}%)`);
    console.log();
    
    console.log('AI Sub-Agent:');
    console.log(`  Tests: ${subAgentPassed}/${subAgentTotal} passed (${subAgentSuccessRate.toFixed(1)}%)`);
    console.log(`  Security: ${secureTests}/${securityTests.length} protections verified (${securityRate.toFixed(1)}%)`);
    console.log();
    
    console.log('Recommendations:');
    recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
    console.log();
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    // Save report
    await this.saveReport(report);

    return report;
  }

  private async saveReport(report: ComprehensiveTestReport): Promise<void> {
    try {
      await fs.mkdir(this.REPORTS_DIR, { recursive: true });
      
      const filename = `test_report_${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.json`;
      const filepath = path.join(this.REPORTS_DIR, filename);
      
      await fs.writeFile(filepath, JSON.stringify(report, null, 2));
      console.log(`[Master Test Runner] Report saved to: ${filepath}`);
    } catch (error) {
      console.error('[Master Test Runner] Error saving report:', error);
    }
  }

  async getLatestReport(): Promise<ComprehensiveTestReport | null> {
    try {
      const files = await fs.readdir(this.REPORTS_DIR);
      const reportFiles = files.filter(f => f.startsWith('test_report_') && f.endsWith('.json'));
      
      if (reportFiles.length === 0) return null;

      // Get most recent
      reportFiles.sort().reverse();
      const latestFile = path.join(this.REPORTS_DIR, reportFiles[0]);
      
      const content = await fs.readFile(latestFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('[Master Test Runner] Error reading reports:', error);
      return null;
    }
  }
}
