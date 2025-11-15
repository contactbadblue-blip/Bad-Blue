// Bundle analyzer - identifies large dependencies being loaded
export function analyzeBundleSize() {
  if (typeof window === 'undefined' || !window.performance) return;

  // Wait for page to fully load
  if (document.readyState !== 'complete') {
    window.addEventListener('load', analyzeBundleSize);
    return;
  }

  const resources = window.performance.getEntriesByType('resource');
  const jsFiles = resources.filter(r => 
    r.name.endsWith('.js') || r.name.includes('.js?')
  );

  // Group by chunk/module
  const chunks: Map<string, any> = new Map();
  
  jsFiles.forEach((resource: any) => {
    const url = new URL(resource.name);
    const filename = url.pathname.split('/').pop() || 'unknown';
    
    // Extract chunk name from filename
    let chunkName = filename;
    if (filename.includes('-')) {
      chunkName = filename.split('-')[0];
    }
    
    chunks.set(chunkName, {
      name: chunkName,
      size: resource.transferSize || 0,
      duration: resource.duration || 0,
      url: resource.name,
      cached: resource.transferSize === 0 && resource.duration < 10
    });
  });

  // Sort by size
  const sortedChunks = Array.from(chunks.values())
    .sort((a, b) => b.size - a.size);

  // Log analysis
  console.log('[Bundle Analysis] JavaScript chunks loaded:');
  console.table(sortedChunks.map(chunk => ({
    'Chunk': chunk.name,
    'Size (KB)': (chunk.size / 1024).toFixed(2),
    'Load Time (ms)': chunk.duration.toFixed(2),
    'Cached': chunk.cached ? 'Yes' : 'No'
  })));

  // Identify potentially problematic chunks
  const largeChunks = sortedChunks.filter(chunk => chunk.size > 200 * 1024); // > 200KB
  if (largeChunks.length > 0) {
    console.warn('[Bundle Analysis] Large chunks detected (>200KB):');
    largeChunks.forEach(chunk => {
      console.warn(`  - ${chunk.name}: ${(chunk.size / 1024).toFixed(2)}KB`);
    });
  }

  // Check for common large dependencies
  const potentiallyLargeDeps = [
    'moment', 'lodash', 'three', 'd3', 'chart', 'editor', 
    'monaco', 'pdf', 'xlsx', 'quill', 'tinymce'
  ];
  
  const detectedLargeDeps = sortedChunks.filter(chunk => 
    potentiallyLargeDeps.some(dep => chunk.name.toLowerCase().includes(dep))
  );

  if (detectedLargeDeps.length > 0) {
    console.warn('[Bundle Analysis] Large dependencies detected:');
    detectedLargeDeps.forEach(chunk => {
      console.warn(`  - ${chunk.name}: ${(chunk.size / 1024).toFixed(2)}KB`);
    });
  }

  // Total bundle size
  const totalSize = sortedChunks.reduce((acc, chunk) => acc + chunk.size, 0);
  const totalDuration = Math.max(...sortedChunks.map(c => c.duration));
  
  console.log('[Bundle Analysis] Summary:');
  console.log(`  Total JS Size: ${(totalSize / 1024).toFixed(2)}KB`);
  console.log(`  Number of Chunks: ${sortedChunks.length}`);
  console.log(`  Longest Load Time: ${totalDuration.toFixed(2)}ms`);
  
  return {
    chunks: sortedChunks,
    totalSize,
    totalDuration,
    largeChunks,
    detectedLargeDeps
  };
}

// Auto-run analysis after page load
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    setTimeout(analyzeBundleSize, 2000);
  } else {
    window.addEventListener('load', () => {
      setTimeout(analyzeBundleSize, 2000);
    });
  }
}