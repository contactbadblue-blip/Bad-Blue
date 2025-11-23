#!/bin/bash
# Railway Build - Simple TypeScript compilation without bundling

echo "🚂 Railway Build Starting..."
echo "Node version: $(node --version)"

# Patch vite.config.ts for Node 18
echo "📝 Patching vite.config.ts..."
node scripts/railway-build-patch.js

# Build client with Vite
echo "📦 Building client..."
npx vite build

# Compile server TypeScript to JavaScript (no bundling)
echo "🔧 Compiling server TypeScript..."
npx tsc --project tsconfig.production.json

echo "✅ Build complete!"