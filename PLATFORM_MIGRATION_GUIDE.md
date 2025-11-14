# Platform Migration Guide

This document outlines the steps needed to complete the migration from Replit to other platforms.

## Completed Migration Steps

The following Replit-specific references have been removed or replaced:

### 1. ✅ Authentication System
- Renamed `server/replitAuth.ts` to `server/auth.ts`
- Removed Replit OAuth authentication
- Now using standard local username/password authentication only
- Updated all imports from `./replitAuth` to `./auth`

### 2. ✅ Platform Configuration
- Updated `server/platformConfig.ts` to remove Replit platform detection
- Base URL now uses generic `BASE_URL` environment variable
- Removed all REPL_ID and REPLIT_DEV_DOMAIN references

### 3. ✅ Object Storage
- Updated `server/objectStorage.ts` to use standard Google Cloud Storage
- Updated `server/evidenceStorage.ts`:
  - Renamed `ReplitEvidenceStorage` to `CloudEvidenceStorage`
  - Uses standard GCS authentication instead of Replit sidecar
- Falls back to filesystem storage when cloud storage is unavailable

### 4. ✅ Database Schema
- Updated auth type enum from 'replit' | 'local' to 'oauth' | 'local'
- Removed `replitUserId` references in AI subagent documentation

### 5. ✅ Documentation
- Created platform-agnostic `README.md` from `replit.md`
- Removed all Replit-specific instructions and references
- Updated comments throughout the codebase

### 6. ✅ Error Messages
- Updated email service error messages to reference "environment variables" instead of "Replit Secrets"
- Updated storage service comments for platform-agnostic deployment

## Remaining Manual Steps

Due to project constraints, the following files require manual updates:

### 1. ❗ vite.config.ts (Protected File)
Cannot be automatically modified. To complete migration:

```typescript
// Remove these lines:
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Remove from plugins array:
runtimeErrorOverlay(),

// Replace the conditional Replit plugins with:
plugins: [
  react(),
  // Add any platform-agnostic plugins here
],

// Remove the REPL_ID check:
...(process.env.NODE_ENV !== "production" ? [...] : [])
```

### 2. ❗ package.json (Protected File)
Cannot be automatically modified. To complete migration:

```bash
# Remove Replit-specific packages:
npm uninstall @replit/vite-plugin-cartographer
npm uninstall @replit/vite-plugin-dev-banner
npm uninstall @replit/vite-plugin-runtime-error-modal
```

### 3. ❗ .replit File
The `.replit` configuration file exists but is Replit-specific.
- Can be safely deleted when migrating to other platforms
- Contains Replit deployment and port configurations

### 4. ❗ replit.nix (if exists)
Check for and remove any `replit.nix` file in the project root.

## Environment Variables

Set these environment variables on your new platform:

### Required:
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Application
BASE_URL=https://your-domain.com
PORT=5000

# Email (SMTP)
GWSMTP_USER=your-smtp-user
GWSMTP_PASS=your-smtp-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# AI Services
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key

# Payment
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Session
SESSION_SECRET=your-session-secret
```

### Optional (for cloud storage):
```bash
# Google Cloud Storage
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GCS_PROJECT_ID=your-project-id
PRIVATE_OBJECT_DIR=your-bucket-name/.private
```

## Deployment Options

### Option 1: Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### Option 2: Heroku
```bash
# Create Procfile
echo "web: npm run start" > Procfile

# Deploy
heroku create your-app-name
git push heroku main
```

### Option 3: Docker
```dockerfile
# Create Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Option 4: VPS/Cloud Server
```bash
# Install dependencies
npm install
npm run build

# Use PM2 for process management
npm install -g pm2
pm2 start npm --name "badblue" -- start
```

## Post-Migration Verification

After migrating, verify:

1. ✅ Application starts without Replit environment
2. ✅ Authentication works (local auth)
3. ✅ Database connections are established
4. ✅ File uploads work (filesystem or cloud)
5. ✅ Email sending functions properly
6. ✅ Payment processing works
7. ✅ All API endpoints respond correctly

## Support

For platform-specific deployment issues, consult:
- Railway: https://docs.railway.app
- Heroku: https://devcenter.heroku.com
- Docker: https://docs.docker.com
- Your cloud provider's documentation

## Notes

- The application has been designed to gracefully degrade when certain services are unavailable
- Filesystem storage will be used automatically if cloud storage is not configured
- All Replit-specific code has been replaced with platform-agnostic alternatives