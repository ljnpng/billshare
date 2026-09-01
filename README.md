# AA / split the bill

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

AI-powered receipt splitting application built with Next.js 14.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fljnpng%2Fsplitbill&env=OPENAI_COMPATIBLE_BASE_URL,OPENAI_COMPATIBLE_API_KEY,OPENAI_COMPATIBLE_MODEL,STORAGE_PROVIDER,CLOUDFLARE_ACCOUNT_ID,CLOUDFLARE_KV_NAMESPACE_ID,CLOUDFLARE_API_TOKEN,REDIS_HOST,REDIS_PORT,REDIS_PASSWORD&envDescription=Configure%20your%20AI%20endpoint%20and%20storage%20backend&envLink=https%3A%2F%2Fgithub.com%2Fljnpng%2Fsplitbill%23environment-variables)

## Features

- AI receipt recognition through an OpenAI-compatible vision endpoint
- Image format support: JPG, PNG, GIF, WebP, HEIC/HEIF
- Proportional tax/tip distribution based on item prices
- Multi-person item sharing with automatic cost splitting
- Multi-receipt processing and bill consolidation
- i18n support (English/Chinese)

## Installation

Requirements:

- Node.js 18+
- An OpenAI-compatible vision API endpoint, key, and model
- A storage backend: local memory (default), Cloudflare KV, or Redis

```bash
git clone https://github.com/ljnpng/splitbill.git
cd splitbill
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

```bash
OPENAI_COMPATIBLE_BASE_URL=https://api.groq.com/openai/v1
OPENAI_COMPATIBLE_API_KEY=sk-...
OPENAI_COMPATIBLE_MODEL=qwen/qwen3.6-27b
STORAGE_PROVIDER=memory       # memory (default), cloudflare, or redis

# Required for Cloudflare KV
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_KV_NAMESPACE_ID=your-kv-namespace-id
CLOUDFLARE_API_TOKEN=your-api-token

# Required for Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

API Keys:

- Groq: https://console.groq.com/keys
- Redis: Railway, Upstash, Redis Cloud, or self-hosted

## Development

```bash
npm run dev         # Start dev server (auto-opens http://localhost:3000)
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
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
