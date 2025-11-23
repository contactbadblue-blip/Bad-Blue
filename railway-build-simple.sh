#!/bin/bash
# Railway Build Script - Simple approach without esbuild bundling
# Builds client only, server runs with tsx directly

echo "🚂 Railway Build Process Starting..."
echo "Node version: $(node --version)"

# Patch vite.config.ts for Node 18 compatibility
echo "📝 Patching vite.config.ts for Node 18..."
node scripts/railway-build-patch.js

# Build ONLY the client with Vite
echo "📦 Building client with Vite..."
npx vite build

# Copy server files to dist (no bundling, no transpilation)
echo "📁 Copying server files to dist..."
mkdir -p dist/server
mkdir -p dist/shared
cp -r server/* dist/server/
cp -r shared/* dist/shared/

echo "✅ Railway build completed!"
echo "Client built to dist/public/"
echo "Server files copied to dist/ (will run with tsx)"