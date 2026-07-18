/**
 * Display configuration for worker models.
 * Maps position-based worker slots to their provider branding.
 * Order must match WORKER_MODELS in backend .env
 */

export interface ModelDisplay {
  name: string;
  provider: string;
  icon: string;
  color: "gemini" | "gpt" | "anthropic";
}

/**
 * Worker slots — matches backend WORKER_MODELS order:
 * 1. google/gemini-2.5-flash
 * 2. openai/gpt-4o-mini
 * 3. anthropic/claude-haiku-4.5
 */
export const WORKER_DISPLAY: ModelDisplay[] = [
  {
    name: "GEMINI_2.5",
    provider: "Google",
    icon: "✦",
    color: "gemini",
  },
  {
    name: "GPT_4o",
    provider: "OpenAI",
    icon: "◉",
    color: "gpt",
  },
  {
    name: "CLAUDE_HAIKU",
    provider: "Anthropic",
    icon: "◈",
    color: "anthropic",
  },
];

/**
 * Evaluator display — anthropic/claude-sonnet-4.6
 */
export const EVALUATOR_DISPLAY = {
  name: "CLAUDE_SONNET",
  provider: "Anthropic",
  icon: "◈",
  label: "Final Synthesized Answer",
};
