// Performance monitoring utility
class PerformanceMonitor {
  private startTime: number;
  private marks: Map<string, number> = new Map();
  
  constructor() {
    this.startTime = performance.now();
    
    // Log navigation timing if available
    if (typeof window !== 'undefined' && window.performance) {
      // Wait for page load to complete before logging navigation timing
      if (document.readyState === 'complete') {
        this.logNavigationTiming();
      } else {
        window.addEventListener('load', () => this.logNavigationTiming());
      }
    }
  }
  
  mark(name: string) {
    const time = performance.now();
    this.marks.set(name, time);
    const elapsed = (time - this.startTime).toFixed(2);
    console.log(`[Performance] ${name}: ${elapsed}ms from start`);
    return time;
  }
  
  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark) || this.startTime;
    const end = endMark ? this.marks.get(endMark) : performance.now();
    
    if (end && start) {
      const duration = (end - start).toFixed(2);
      console.log(`[Performance] ${name}: ${duration}ms`);
      return parseFloat(duration);
    }
    return 0;
  }
  
  private logNavigationTiming() {
    const timing = window.performance.timing;
    if (!timing) return;
    
    // Calculate various performance metrics
    const metrics = {
      'DNS Lookup': timing.domainLookupEnd - timing.domainLookupStart,
      'TCP Connection': timing.connectEnd - timing.connectStart,
      'Request Time': timing.responseStart - timing.requestStart,
      'Response Time': timing.responseEnd - timing.responseStart,
      'DOM Processing': timing.domComplete - timing.domLoading,
      'Page Load Total': timing.loadEventEnd - timing.navigationStart,
      'Time to First Byte': timing.responseStart - timing.navigationStart,
      'DOM Content Loaded': timing.domContentLoadedEventEnd - timing.navigationStart,
    };
    
    console.log('[Performance] Navigation Timing Metrics:');
    Object.entries(metrics).forEach(([key, value]) => {
      if (value > 0) {
        console.log(`  ${key}: ${value}ms`);
      }
    });
  }
  
  // Log bundle sizes (approximate based on resource timing)
  logResourceSizes() {
    if (!window.performance || !window.performance.getEntriesByType) return;
    
    const resources = window.performance.getEntriesByType('resource');
    const jsResources = resources.filter(r => r.name.endsWith('.js') || r.name.includes('.js?'));
    const cssResources = resources.filter(r => r.name.endsWith('.css'));
    
    const totalJSSize = jsResources.reduce((acc, r: any) => acc + (r.transferSize || 0), 0);
    const totalCSSSize = cssResources.reduce((acc, r: any) => acc + (r.transferSize || 0), 0);
    
    console.log('[Performance] Resource Sizes:');
    console.log(`  JS Resources: ${jsResources.length} files, ~${(totalJSSize / 1024).toFixed(2)}KB transferred`);
    console.log(`  CSS Resources: ${cssResources.length} files, ~${(totalCSSSize / 1024).toFixed(2)}KB transferred`);
    
    // Log largest JS bundles
    const largestJS = jsResources
      .filter((r: any) => r.transferSize)
      .sort((a: any, b: any) => b.transferSize - a.transferSize)
      .slice(0, 3);
    
    if (largestJS.length > 0) {
      console.log('  Largest JS bundles:');
      largestJS.forEach((r: any) => {
        const name = r.name.split('/').pop();
        console.log(`    ${name}: ~${(r.transferSize / 1024).toFixed(2)}KB`);
      });
    }
  }
  
  // Create a performance report
  generateReport() {
    const report = {
      marks: Object.fromEntries(this.marks),
      totalTime: performance.now() - this.startTime,
      timestamp: new Date().toISOString()
    };
    
    console.log('[Performance] Final Report:', report);
    return report;
  }
}

// Create singleton instance
export const perfMonitor = typeof window !== 'undefined' ? new PerformanceMonitor() : null;

// Export convenience functions
export const markPerformance = (name: string) => perfMonitor?.mark(name);
export const measurePerformance = (name: string, startMark: string, endMark?: string) => 
  perfMonitor?.measure(name, startMark, endMark);
export const logResourceSizes = () => perfMonitor?.logResourceSizes();
export const generatePerformanceReport = () => perfMonitor?.generateReport();