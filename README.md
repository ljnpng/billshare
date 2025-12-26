# BillShare

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

AI-powered receipt splitting application built with Next.js 14.

Demo: https://billshare.amoy.day

## Features

- AI receipt recognition (Claude 3.5 Haiku / Groq Llama Vision)
- Image format support: JPG, PNG, GIF, WebP, HEIC/HEIF
- Proportional tax/tip distribution based on item prices
- Multi-person item sharing with automatic cost splitting
- Multi-receipt processing and bill consolidation
- i18n support (English/Chinese)


## Installation

Requirements:
- Node.js 18+
- Claude API key or Groq API key
- Redis instance

```bash
git clone https://github.com/ljnpng/billshare.git
cd billshare
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

```bash
AI_PROVIDER=claude              # or groq (default: claude)
CLAUDE_API_KEY=sk-ant-...       # required if using claude
GROQ_API_KEY=gsk_...            # required if using groq
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

API Keys:
- Claude: https://console.anthropic.com/
- Groq: https://console.groq.com/
- Redis: Railway, Upstash, Redis Cloud, or self-hosted

## Development

```bash
npm run dev         # Start dev server (auto-opens http://localhost:3000)
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
npm run test:ai     # Test AI service (supports AI_PROVIDER=claude|groq)
```

## Deployment

### Vercel

1. Fork this repository
2. Import to Vercel Dashboard
3. Configure environment variables (see above)
4. Deploy

Pushing to `main` triggers production deployment. Other branches create preview deployments.

### Self-hosted

Ensure Redis is accessible from your deployment environment:
- Allow external connections (modify `bind` config)
- Open firewall ports
- Use strong passwords
- Consider SSL/TLS for Redis 6.0+

## License

MIT
