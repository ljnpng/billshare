# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server and auto-open browser at http://localhost:3000
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks
- `npm run test:ai` - Test AI service connection (supports AI_PROVIDER=claude|groq)

### Testing AI Services
```bash
# Test default (Claude) service
npm run test:ai

# Test Groq service
AI_PROVIDER=groq npm run test:ai
```

## Architecture Overview

AAPay is a Next.js 14 full-stack application for AI-powered receipt splitting. It uses AI vision models to parse receipt images and intelligently calculates proportional tax/tip distribution.

### Core Flow
1. **Image Processing**: Upload → compression (client) → HEIC conversion (server) → AI recognition
2. **AI Recognition**: Claude 3.5 Haiku (high accuracy) or Groq Llama Vision (high speed)
3. **Bill Processing**: Parse items → assign to people → calculate proportional tax/tip → generate individual bills

### Key Directories
- `src/app/api/` - API routes for AI services
  - `claude/recognize/route.ts` - Claude API endpoint
  - `groq/recognize/route.ts` - Groq API endpoint
- `src/lib/` - Core business logic
  - `aiService.ts` - Client-side AI service calls and image preprocessing
  - `dataProcessor.ts` - Bill calculation algorithms (tax/tip distribution, multi-person sharing)
  - `config.ts` - Environment variables and AI provider configuration
- `src/store/index.ts` - Zustand global state management
- `src/components/` - Step-based UI components (SetupStep, InputStep, AssignStep, SummaryStep)

### Critical Files for AI Processing
- `src/lib/prompts.ts` - Contains AI prompts in both Chinese and English
- `src/app/api/*/route.ts` - Server-side AI API handlers with HEIC conversion
- `src/lib/imageUtils.ts` - Image compression and format validation (if exists)

### State Management
Uses Zustand with the following key state:
- `people: Person[]` - List of people splitting the bill
- `receipts: Receipt[]` - Array of receipt data with items
- `currentStep` - Multi-step wizard progress
- `isAiProcessing` - AI recognition status

### Environment Variables
- `AI_PROVIDER` - Choose between "claude" (default) or "groq"
- `CLAUDE_API_KEY` - Required when using Claude
- `GROQ_API_KEY` - Required when using Groq

### Bill Calculation Logic
The `dataProcessor.ts` implements:
- **Proportional Tax/Tip Distribution**: Each item gets tax/tip based on `(item.originalPrice / subtotal) * (tax + tip)`
- **Multi-person Item Sharing**: When multiple people share an item, costs are divided equally
- **Multi-receipt Aggregation**: Supports processing multiple receipts and generating consolidated bills

### Internationalization
- Uses `next-intl` with middleware-based locale detection
- Language files in `src/messages/` (en.json, zh.json)
- AI prompts automatically switch based on detected locale
- Supports URL-based locale routing (`/en/`, `/zh/`)

### Image Processing Pipeline
1. Client compression using `browser-image-compression`
2. HEIC/HEIF format detection and server-side conversion
3. Format validation for supported types
4. AI processing via configured provider

### Testing
- Use `test-receipts/` directory for sample images
- Test script validates API connectivity and basic recognition
- Check both AI providers work with different image formats