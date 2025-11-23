#!/bin/bash
# Railway Build Script - Patches vite.config.ts for Node 18 compatibility

echo "🚂 Railway Build Process Starting..."
echo "Node version: $(node --version)"

# Run the patch script
echo "📝 Patching vite.config.ts for Node 18 compatibility..."
node scripts/railway-build-patch.js

# Run the normal build process
echo "📦 Running standard build process..."
npm run build

echo "✅ Railway build completed successfully!"