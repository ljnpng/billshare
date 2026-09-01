# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server and auto-open browser at http://localhost:3000
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks
- `npm test` - Run the Node test suite

## Architecture Overview

BillShare is a Next.js 14 full-stack application for AI-powered receipt splitting. It uses AI vision models to parse receipt images and intelligently calculates proportional tax/tip distribution.

### Core Flow
1. **Image Processing**: Upload → compression (client) → HEIC conversion (server) → AI recognition
2. **AI Recognition**: Configured OpenAI-compatible vision endpoint
3. **Bill Processing**: Parse items → assign to people → calculate proportional tax/tip → generate individual bills

### Key Directories
- `src/app/api/` - API routes for AI services and share sessions
  - `recognize/route.ts` - Configured vision-provider endpoint
  - `session/` - Create and retrieve shared bill snapshots
- `src/lib/` - Core business logic
  - `aiService.ts` - Client-side AI service calls and image preprocessing
  - `dataProcessor.ts` - Bill calculation algorithms (tax/tip distribution, multi-person sharing)
  - `config.ts` - Image format, size, and compression configuration
- `src/store/index.ts` - Zustand global state management
- `src/components/` - Step-based UI components (InputStep, AssignStep, SummaryStep) and shared editor UI

### Critical Files for AI Processing
- `src/lib/prompts.ts` - Contains AI prompts in both Chinese and English
- `src/app/api/recognize/route.ts` - Server-side vision API handler with HEIC conversion
- `src/lib/imageUtils.ts` - Image compression and format validation

### State Management
Uses Zustand with the following key state:
- `people: Person[]` - List of people splitting the bill
- `receipts: Receipt[]` - Array of receipt data with items
- `currentStep` - Multi-step wizard progress
- `isAiProcessing` - AI recognition status

### Environment Variables
- `OPENAI_COMPATIBLE_BASE_URL` - OpenAI-compatible vision API base URL
- `OPENAI_COMPATIBLE_API_KEY` - API credential for the configured endpoint
- `OPENAI_COMPATIBLE_MODEL` - Vision model name
- `STORAGE_PROVIDER` - `memory` (default), `cloudflare`, or `redis`

### Bill Calculation Logic
The `dataProcessor.ts` implements:
- **Proportional Tax/Tip Distribution**: Each item gets tax/tip based on `(item.originalPrice / subtotal) * (tax + tip)`
- **Multi-person Item Sharing**: When multiple people share an item, costs are divided equally
- **Multi-receipt Aggregation**: Supports processing multiple receipts and generating consolidated bills

### Internationalization
- Uses `next-intl` with middleware-based locale detection
- Language files in `src/messages/` (en.json, zh.json)
- AI prompts automatically switch based on detected locale
- Uses browser-language locale detection without exposing `/en` or `/zh` prefixes in public URLs

### Image Processing Pipeline
1. Client compression using `browser-image-compression`
2. HEIC/HEIF format detection and server-side conversion
3. Format validation for supported types
4. AI processing via configured provider

### Testing
- Use `test-receipts/` directory for sample images
- Run `npm run lint`, `npm run build`, and `npm test` before submitting changes
- Exercise receipt recognition manually with supported image formats when credentials are configured
