# Repository Guidelines

## Project Structure & Module Organization

BillShare is a Next.js 14 application written in TypeScript. Keep user-facing routes and API handlers in `src/app/`; locale-aware pages use the `[locale]` route segment and API endpoints live under `src/app/api/`. Reusable UI belongs in `src/components/`, shared business and integration logic in `src/lib/`, global Zustand state in `src/store/`, and shared types in `src/types/`. Translation resources are in `src/messages/en.json` and `src/messages/zh.json`. Static assets belong in `public/`; sample receipt images for manual checks are in `test-receipts/`.

## Build, Test, and Development Commands

Install dependencies with `npm ci` (or `npm install` while developing). Use:

```bash
npm run dev       # Start Next.js locally and open http://localhost:3000
npm run lint      # Run Next.js ESLint checks
npm run build     # Create the production build
npm run start     # Serve the production build locally
npm test          # Run Node's test runner (currently no checked-in test files)
```

AI recognition requires a configured OpenAI-compatible vision endpoint. Set `OPENAI_COMPATIBLE_BASE_URL`, `OPENAI_COMPATIBLE_API_KEY`, and optionally `OPENAI_COMPATIBLE_MODEL` in `.env`. Storage defaults to process-local memory; use `STORAGE_PROVIDER=cloudflare` with Cloudflare KV credentials or `STORAGE_PROVIDER=redis` with Redis settings for shared persistence. Never commit `.env` or credentials.

## Coding Style & Naming Conventions

Follow the existing ESLint configuration (`next/core-web-vitals`) and strict TypeScript settings. Use two-space indentation, semicolons, and single quotes where consistent with the surrounding file. Name React components and types in `PascalCase`, functions and variables in `camelCase`, and route folders/files according to Next.js conventions. Use the `@/*` alias for imports from `src`.

## Testing Guidelines

Before submitting changes, run `npm run lint` and `npm run build`. Exercise receipt upload and splitting flows manually with files from `test-receipts/`; when changing AI integration, verify the selected provider and relevant image formats. Add tests with Node's built-in test runner and name them `*.test.js` or `*.test.ts` when introducing test coverage.

## Commit & Pull Request Guidelines

Use short, imperative Conventional Commit-style subjects such as `feat:`, `fix:`, `style:`, `chore:`, or `chron:` (for example, `fix: validate receipt totals`). Keep commits focused. Pull requests should explain the user-visible or operational impact, link the relevant issue when one exists, list validation commands run, and include screenshots or a short recording for UI changes. Ensure lint passes; changes targeting `main` also participate in the repository's Vercel preview/production workflow.

## Security & Configuration Tips

Keep Claude/Groq and Redis credentials in environment variables only. Review API route changes for accidental secret exposure, validate uploaded image types and sizes, and avoid logging receipt contents or authorization material.
