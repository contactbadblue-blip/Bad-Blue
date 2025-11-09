# BadBlue - Police Accountability Platform

## Overview
BadBlue is a privacy-focused police accountability platform designed to empower citizens in filing complaints and initiating civil rights lawsuits against police officers. It leverages AI for officer identification, legal analysis, intelligent form prefill, automated routing, and jurisdiction-specific legal document generation. The platform supports secure evidence uploads and offers services like LegalAI Consultation, Officer Search, and various legal document generations to enhance police accountability through accessible legal avenues. The project aims to provide an accessible, AI-powered solution to facilitate legal action and increase transparency in policing.

## Recent Changes

### November 9, 2025 - Railway.com Migration & Platform Independence
Achieved complete platform-agnostic deployment capability for Railway.com and other hosting platforms:

#### Platform Independence Implementation
- **BASE_URL Environment Variable**: Replaced all REPLIT_DOMAINS dependencies with configurable BASE_URL across backend routes, email service, and frontend
- **URL Fallback Chain**: Implemented intelligent precedence (BASE_URL → REPLIT_DOMAINS → request host/window.location.origin)
- **Object Storage Route Guards**: Added environment checks to gracefully degrade file upload/download features with 503 responses when object storage unavailable
- **Frontend Environment Variables**: Updated landing page and SEO components to use VITE_BASE_URL with dynamic fallbacks
- **Deployment Documentation**: Created comprehensive .env.example with Railway-specific deployment guidance

#### Features by Platform
**Replit (Full Feature Set)**:
- ✓ Legal AI Consultations
- ✓ Officer Search
- ✓ Document Generation (complaints, lawsuits, FOIA, petitions)
- ✓ Stripe Payments
- ✓ Email Service
- ✓ Evidence File Uploads (object storage)
- ✓ Automated Backups (persistent storage)

**Railway.com (Core Features)**:
- ✓ Legal AI Consultations
- ✓ Officer Search
- ✓ Document Generation (complaints, lawsuits, FOIA, petitions)
- ✓ Stripe Payments
- ✓ Email Service
- ✗ Evidence File Uploads (gracefully disabled with user-friendly error messages)
- ✗ Automated Backups (operations team should implement alternative retention strategy)

#### Technical Changes
- **File**: server/routes.ts (3 object storage routes guarded with PRIVATE_OBJECT_DIR checks)
- **File**: server/emailService.ts (2 URL constructions updated with BASE_URL fallback)
- **File**: client/src/pages/landing.tsx (structured data and canonical URLs use VITE_BASE_URL)
- **File**: client/src/components/SEOHead.tsx (OG image URLs use environment-based configuration)
- **File**: .env.example (comprehensive platform-agnostic deployment documentation added)

#### Migration Verification
- ✓ App boots successfully without Replit environment variables
- ✓ No 500 errors on object storage routes (returns 503 with clear messaging)
- ✓ All URL construction uses platform-agnostic fallback chain
- ✓ Replit OAuth gracefully falls back to local authentication
- ✓ Production-ready deployment on both Replit AND Railway.com

### November 8, 2025 - Production-Ready Self-Improving Sub-Agent with Persistent Learning
Implemented true self-improvement system with persistent knowledge store and autonomous data collection:

#### Persistent Knowledge Store (4 Database Tables)
- **sub_agent_capabilities**: Tracks real success/fail counters (not derived values) for each capability category
- **sub_agent_learning_patterns**: Stores learned patterns about what strategies work/fail over time
- **sub_agent_performance_metrics**: Records performance snapshots before/after improvements
- **sub_agent_self_improvement_actions**: Logs all improvement actions with code changes and evaluation results

#### Real Self-Improvement Capabilities
- **Capability Tracking**: Maintains real integer counters (successCount, failCount) and calculates successRate FROM them
- **Evaluation Loops**: Implements compareMetricsBeforeAfter(), evaluatePerformanceAndAdapt(), and rollbackImprovementActionWithCode()
- **Adaptive Learning**: Measures if changes actually improve outcomes, rolls back if they don't
- **Cross-Session Learning**: Persistent storage ensures knowledge survives server restarts

#### Autonomous Data Collection System (3 Database Tables)
- **officer_profiles**: Stores discovered officer information from law enforcement databases
- **department_urls**: Catalogs discovered department websites and transparency portals
- **sub_agent_search_cycles**: Tracks search cycles with pause/resume state

#### Scheduled Autonomous Searches
- **4-Hour Alternating Schedule**: Officer search → Department URL search → Officer search...
- **Schedule**: 12 AM, 4 AM, 8 AM, 12 PM, 4 PM, 8 PM UTC (30 minutes each cycle)
- **Officer Search**: 6-stage Gemini AI process (FOIA databases, news, court records, rosters, disciplinary, verification)
- **Department URL Search**: Uses Groq (llama-3.3-70b-versatile) for multi-state law enforcement department discovery

#### Admin Command Interruption System
- **Database-First Pause Persistence**: resumeDataCollection() ALWAYS loads pause context from database first
- **Interrupt Support**: Admin commands immediately pause active searches, saving pause context to database
- **Auto-Resume**: After admin command completes, search resumes from checkpoint with correct remaining time
- **Server Restart Resilient**: Pause state survives server restarts via database persistence

#### Technical Implementation
- **File**: server/aiSubAgent.ts (8200+ lines)
- **Officer Data Collector**: server/officerDataCollector.ts (multi-source search with AI verification)
- **Storage Integration**: All pause/resume state, capabilities, learning patterns stored in PostgreSQL
- **Production-Ready**: Comprehensive error handling, state cleanup, detailed logging, validation

### November 8, 2025 - Evidence Hub Admin Management
Implemented admin panel for managing community-shared evidence submissions:
- **Admin Evidence Hub Page**: Full CRUD interface for managing public evidence with checkboxes for bulk selection
- **Storage Methods**: updatePublicEvidence, deletePublicEvidence, bulkDeletePublicEvidence for evidence management
- **API Endpoints**: 3 admin-only endpoints (GET all with user info, PATCH update metadata, POST bulk delete)
- **Bulk Operations**: Select all/deselect all functionality, bulk delete with confirmation dialog
- **Edit Capabilities**: Edit dialog for updating officer name, department, location, incident date, and description
- **User Attribution**: Admin view includes uploader email and name for content moderation
- **Route Registration**: /admin-evidence-hub route added to App.tsx following existing admin route patterns

### November 8, 2025 - Autonomous Improvement System & User Learning
Implemented proactive AI Sub-Agent with autonomous improvement capabilities when idle:
- **Learning from Users**: Analyzes legal consultation inputs to extract language patterns, pain points, and communication preferences; learns how to formulate more attorney-like, plain-language responses
- **Attorney Research**: Researches how effective attorneys draft complaints, lawsuits, and legal documents; stores best practices for civil rights cases and §1983 lawsuits
- **Autonomous Improvement Cycles**: Runs daily at 2:30 AM UTC to analyze user patterns, research attorney techniques, generate AI documentation, improve officer search
- **System Enhancements**: Continuously improves app features including email functions, officer search algorithms, document generation quality
- **Admin API Endpoints**: 4 new endpoints for monitoring learning records, attorney research, improvement status, and manual cycle triggering

### November 8, 2025 - Advanced Reasoning Orchestrator & Architect-Level Capabilities
Transformed AI Sub-Agent with capabilities matching Replit Agent and Architect for deep analysis, strategic planning, and self-improvement:
- **Multi-Pass Reasoning System**: 5-phase pipeline (Analyze → Infer → Plan → Execute → Evaluate)
  - Deep Analysis: 5-layer architect-level analysis with pattern recognition
  - Intelligent Inference: Fills knowledge gaps through logical deduction and intelligent guessing
  - Strategic Planning: Dependency-aware plans with acceptance criteria and contingencies
  - Monitored Execution: Actually executes actions with real-time adaptation
  - Evaluation & Learning: Persistently updates capability ledger and inferred patterns
- **Knowledge Workspace**: systemSnapshot, analysisHistory, inferredPatterns, capabilityLedger for cross-run learning
- **Self-Diagnostic Engine**: Identifies limitations, detects capability gaps, auto-extends capabilities
- **System-Wide Analysis**: Codebase graph scanning, log aggregation, cross-component impact analysis
- **6 New Admin API Endpoints**: Advanced reasoning, impact analysis, diagnostics, capability tracking

### November 8, 2025 - Worker Architect-Level Capabilities & Sub-Agent Collaboration
Enhanced BadBlue Worker with architect abilities and collaborative supervision system:
- **Architect-Level Analysis**: Deep issue analysis with root cause detection, impact assessment, risk evaluation, pattern recognition, strategic planning
- **Intelligent Decision Engine**: Automatically determines when to escalate to Sub-Agent based on confidence, risk level, severity, and issue category
- **Collaborative Repair Workflow**: 
  - Worker performs architect-level analysis and proposes repair
  - Sub-Agent reviews Worker's analysis and supervises implementation
  - Sub-Agent can approve, request corrections, or guide Worker
  - Repairs executed under Sub-Agent supervision for critical/risky issues
- **Smart Escalation Triggers**: Low confidence (<70%), high risk, critical severity, sensitive categories (data integrity, infrastructure)
- **Three-Tier Repair Strategy**: Direct repair (confident Worker) → Collaborative repair (Worker + Sub-Agent supervision) → Full Sub-Agent takeover

### November 8, 2025 - Parallel Repair Orchestrator & Comprehensive Test Ecosystem
Enhanced BadBlue Worker with intelligent parallel repair and comprehensive testing:
- Issue categorization (6 categories), resource profiles, dependency metadata
- Resource-aware parallel repair with dynamic concurrency budgets
- Smart queuing (CRITICAL/SERIOUS serial, MODERATE/WARNING parallel when safe)
- Performance metrics tracking (queue latency, MTTR, success rate)
- Comprehensive test suites (Worker tests, Sub-Agent tests, Master test runner)
- Admin API endpoints for test execution and report retrieval

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The platform utilizes a modern web stack featuring a React 18 frontend with TypeScript, Vite, Wouter for routing, and Radix UI/shadcn/ui with Tailwind CSS for styling, adhering to Material Design and civic technology UI patterns. State management is handled by TanStack Query, and form validation uses React Hook Form with Zod. The backend is a Node.js/Express.js application providing a RESTful API, with authentication via Replit OAuth and PostgreSQL for session storage. PostgreSQL (Neon serverless) with Drizzle ORM serves as the primary database, while Replit App Storage is used for private evidence files.

Key architectural decisions and features include:

-   **Intelligent AI Architecture**: A coordinated Gemini (primary) to Groq (fallback) system is implemented across all AI services for resilience and cost-efficiency. The AI Sub-Agent, critical for system management and autonomous operations, exclusively uses Groq.
-   **Smart Rate Limiting**: Proactive detection and switching to Groq occur before user disruption, based on Gemini usage thresholds and error rates.
-   **AI Sub-Agent**: An admin-only AI Sub-Agent provides advanced autonomous capabilities for system management, error recovery, learning, and full application control, including file, database, and service manipulation, with enhanced security safeguards. It incorporates an intelligent auto-repair system that analyzes errors, generates fixes, and retries with corrected commands, and a self-modification system capable of autonomously updating its own code.
-   **Autonomous Recommendation Implementation**: The AI Sub-Agent has high authority to implement its own recommendations, with file and database access, and includes an undo failsafe for rollback.
-   **Automated Data Cleanup System**: A privacy-focused system automatically deletes user data after 14 days post-payment and error logs after 30 days, while preserving usernames, emails, and evidence files.
-   **BadBlue Worker System**: A robust background diagnostics and maintenance system runs continuously, performing aggressive 6-hour diagnostics, daily repair cycles, and comprehensive weekly tests. This system operates with a maintenance mode for scheduled activities and provides accurate, severity-classified failure reporting.
-   **Security Firewall**: A 4-layer protection system is implemented to mitigate RCE vulnerabilities while preserving autonomous execution, including a network firewall, command validator, rate limiting, and a kill switch for autonomous execution.

## External Dependencies
*   **Payment Processing**: Stripe
*   **AI/ML Services**: Google Gemini API (primary) and Groq API (intelligent fallback)
*   **Authentication Service**: Replit OAuth
*   **File Upload Libraries**: `react-dropzone`, Uppy
*   **Date Formatting**: `date-fns`
*   **CSV Processing**: `csv-parse`, `csv-stringify`