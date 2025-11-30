# ODRA-EVM Universal Contract Engine

## Recent Changes (November 30, 2025)

- Fixed API response parsing across all mutation functions (editor, security, bridge, staking pages)
- Added null safety checks to CompilationOutput component for errors, warnings, and nested gasEstimates
- All core features now fully functional and tested:
  - Contract compilation (Solidity to Wasm)
  - AI-powered security analysis
  - Staking interface with yield calculator
  - Cross-chain bridge visualizer
  - Dashboard with activity tracking

## Overview

ODRA-EVM is a blockchain development platform that enables developers to compile Solidity smart contracts to WebAssembly (Wasm) and deploy them to the Casper blockchain. The platform features AI-powered security analysis, real-time compilation feedback, staking mechanisms, and cross-chain bridging capabilities. It provides a comprehensive developer tool for Ethereum Virtual Machine (EVM) to Casper ecosystem migration.

**Core Purpose:** Streamline the process of converting Solidity contracts to Wasm format while providing security auditing, deployment management, and blockchain interaction tools.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React 18+ with TypeScript, using functional components and hooks pattern.

**Routing:** wouter (lightweight client-side routing) for navigation between dashboard, editor, security analysis, staking, bridge, metrics, and settings pages.

**State Management:** 
- @tanstack/react-query for server state management and API data caching
- React hooks (useState, useEffect) for local component state
- No global state management library; relies on query cache and prop drilling

**UI Component System:**
- shadcn/ui components built on Radix UI primitives
- Tailwind CSS for styling with custom design system (New York style variant)
- Typography: Inter font for UI elements, JetBrains Mono for code/technical content
- Theme: Dark/light mode support with system preference detection via ThemeProvider
- Custom CSS variables for consistent theming across light/dark modes

**Build System:**
- Vite for development server and production builds
- esbuild for server bundling
- Hot Module Replacement (HMR) in development
- Client code located in `client/` directory, builds to `dist/public/`

### Backend Architecture

**Framework:** Express.js server with TypeScript

**API Structure:**
- RESTful API endpoints under `/api` prefix
- Routes defined in `server/routes.ts`
- Key endpoints:
  - `/api/compile` - Solidity to Wasm compilation
  - `/api/analyze` - AI-powered security analysis
  - `/api/dashboard/stats` - Dashboard metrics
  - `/api/stake` - Staking position management
  - `/api/bridge` - Cross-chain bridge transactions

**Data Storage:**
- In-memory storage pattern via `server/storage.ts` interface (IStorage)
- Designed for potential database integration (Drizzle ORM configured for PostgreSQL)
- Schema definitions in `shared/schema.ts` using Zod for runtime validation
- Current implementation: Mock/in-memory data structures

**Server Architecture Decisions:**
- Middleware: JSON body parsing with raw body preservation for webhooks
- Static file serving for production builds via `server/static.ts`
- Development mode: Vite middleware integration for HMR
- Production mode: Pre-built static files served from `dist/public/`
- Request/response logging with timestamp formatting

### Data Storage Solutions

**Database Schema (Drizzle ORM):**
- Configured for PostgreSQL via `@neondatabase/serverless` driver
- Schema location: `shared/schema.ts`
- Migrations output: `./migrations` directory
- Connection: Environment variable `DATABASE_URL` required

**Key Data Models:**
- **Contracts:** Source code, bytecode, Wasm code, ABI, deployment info, verification status
- **Compilations:** Compilation results with timing, errors, warnings, gas estimates
- **Deployments:** Network deployment tracking with transaction hashes and status
- **SecurityAnalysis:** Vulnerability detection, risk scores, AI-generated recommendations
- **StakingPositions:** User staking data with APY, duration, rewards tracking
- **BridgeTransactions:** Cross-chain transfer tracking with source/destination chains
- **Metrics:** Compilation statistics, performance data, activity logs

**Validation:**
- Zod schemas for runtime type validation and API request/response validation
- Schema located in `shared/schema.ts`
- Integration with drizzle-zod for ORM schema validation

### Authentication and Authorization

**Current Implementation:** No authentication system present in codebase

**Prepared Infrastructure:**
- Session management dependencies installed (express-session, connect-pg-simple)
- Passport.js and passport-local available but not configured
- JWT support available via jsonwebtoken package

### Blockchain Integration Strategy

**Compilation Pipeline:**
- Accepts Solidity source code input
- Validates pragma directives
- Generates EVM bytecode
- Transpiles to WebAssembly (Wasm) format
- Produces ABI (Application Binary Interface)
- Calculates gas estimates
- Provides source maps for debugging

**Deployment System:**
- Target network: Casper Testnet (configurable)
- Multi-network support architecture (Casper, Sepolia/Ethereum testnet)
- Deployment tracking: transaction hashes, contract addresses, confirmation status
- Real-time status updates (pending → confirmed → failed states)

**Security Analysis:**
- AI-powered vulnerability detection
- Risk scoring system (0-100 scale)
- Severity classification (Critical, High, Medium, Low)
- Automated fix suggestions
- Pattern detection for common vulnerabilities (reentrancy, access control, integer overflow)

**Staking Mechanism:**
- Support for multiple staking positions per user
- APY (Annual Percentage Yield) calculation
- Lock period tracking
- Rewards accumulation
- Unstaking process with cooldown periods

**Cross-Chain Bridge:**
- Asset transfer between Casper and EVM chains
- Transaction status tracking (initiated → locked → released → completed)
- Fee estimation
- Source/destination chain validation

## External Dependencies

### Third-Party Services

**AI/ML Services:**
- OpenAI API (via `openai` package) - For AI-powered security analysis and code recommendations
- Google Generative AI (via `@google/generative-ai`) - Alternative AI provider

**Blockchain Infrastructure:**
- Casper Blockchain Testnet - Primary deployment target
- EVM-compatible networks (Sepolia) - Bridge support
- Web3 providers for blockchain interaction

**Email Services:**
- Nodemailer - Email notifications for compilation, deployment, security alerts

**Payment Processing:**
- Stripe - Potential integration for premium features or staking-related payments

### External APIs and Libraries

**Blockchain/Crypto:**
- Casper SDK (implementation needed) - Smart contract deployment
- Web3.js or ethers.js (not explicitly imported) - EVM interactions

**Database:**
- Neon Database Serverless (@neondatabase/serverless) - PostgreSQL hosting
- Drizzle ORM - Database query builder and schema management

**UI Components:**
- Radix UI - Headless component primitives (25+ components installed)
- Lucide React - Icon library
- Recharts - Data visualization and charts
- Embla Carousel - Carousel/slider components
- cmdk - Command palette component

**Utilities:**
- date-fns - Date manipulation and formatting
- zod - Runtime type validation
- class-variance-authority - Variant-based component styling
- tailwind-merge & clsx - Classname management

**Development Tools:**
- Vite plugins: runtime error overlay, cartographer (Replit-specific), dev banner
- TypeScript - Type safety across frontend and backend
- ESBuild - Fast JavaScript bundling

**File Handling:**
- Multer - File upload middleware
- XLSX - Spreadsheet parsing/generation

**Rate Limiting & Security:**
- express-rate-limit - API rate limiting
- CORS - Cross-origin resource sharing
- Helmet (not installed but recommended for production)

### Configuration Requirements

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string (required for Drizzle)
- `NODE_ENV` - Environment mode (development/production)
- `OPENAI_API_KEY` - OpenAI API authentication (for security analysis)
- Casper wallet/network configurations (implementation specific)

**Build Configuration:**
- TypeScript: ES modules with Bundler resolution, strict mode enabled
- Tailwind: New York style variant, neutral base color, CSS variables enabled
- Vite: Custom aliases (@/, @shared/, @assets/), HMR configuration

**Design System:**
- Reference design: Linear, VS Code, Vercel, GitHub aesthetic
- Focus on developer tool clarity and technical precision
- Spacing system: Tailwind units (2, 4, 6, 8, 12, 16)
- Component elevation via subtle shadows and borders
- Responsive breakpoints: Mobile-first with tablet/desktop adaptations