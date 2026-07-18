# LLM Arena — UI

Terminal-themed web app. Ask one question, 3 AI models answer, best response synthesized.

## Quick Setup

```bash
npm install
cp .env.example .env.local
# Add your Clerk + OpenRouter keys in .env.local
npm run dev
```

App runs on `http://localhost:3000`

## Environment

```env
# Clerk (clerk.com → your project → API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxx
CLERK_SECRET_KEY=sk_test_xxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# OpenRouter (openrouter.ai/keys)
OPENAI_API_KEY=sk-or-v1-xxxx
OPENAI_BASE_URL=https://openrouter.ai/api/v1
WORKER_MODELS=google/gemini-2.5-flash,openai/gpt-4o-mini,anthropic/claude-haiku-4.5
EVALUATOR_MODEL=anthropic/claude-sonnet-4.6
```

## Features

- Terminal/hacker UI with theme switcher (green, amber, cyan)
- Clerk authentication (sign-in required)
- 5 requests/day per user (stored in Clerk metadata, no DB)
- Real-time streaming from all models
- Responsive design

## How It Works

```
User asks question
    ↓
Auth + rate limit check (Clerk)
    ↓
3 models stream answers in parallel (Gemini, GPT, Claude Haiku)
    ↓
Evaluator (Claude Sonnet) synthesizes the best answer
    ↓
Final answer streamed to user
```

## Deploy to Vercel

```bash
vercel
```

Set the same env vars in Vercel dashboard.

## Tech Stack

- Next.js 16 (App Router)
- Vercel AI SDK
- Clerk (auth + rate limiting)
- Tailwind CSS
- TypeScript
