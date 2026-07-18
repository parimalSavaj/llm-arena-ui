import { currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export const maxDuration = 60; // Vercel Pro: 60s, Hobby: 10s

const DAILY_LIMIT = 5;

const WORKER_SYSTEM_PROMPT = `You are a helpful assistant. Answer questions in a simple, clear, and short way that anyone can understand.

Rules:
- Keep your answer short and to the point (2-4 sentences for simple questions, more only if needed)
- Use plain everyday language, avoid jargon or technical terms
- Do not format your answer like a developer or AI assistant
- Do not use bullet points or numbered lists unless the question specifically asks for steps
- Answer like a knowledgeable friend explaining something simply
- If it's a factual question, just give the fact directly
- Do not add disclaimers, caveats, or "let me know if you need more"
- Do not repeat the question back`;

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function getProvider() {
  const apiKey = process.env.OPENAI_API_KEY || "";
  const baseURL = process.env.OPENAI_BASE_URL || undefined;
  return createOpenAI({ ...(baseURL && { baseURL }), apiKey });
}

function getWorkerModels(): string[] {
  return (process.env.WORKER_MODELS || "gpt-4o-mini").split(",").map((m) => m.trim());
}

function getEvaluatorModel(): string {
  return process.env.EVALUATOR_MODEL || "gpt-4o";
}

export async function POST(req: NextRequest) {
  // 1. Auth check
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Rate limit check
  const metadata = (user.publicMetadata as Record<string, unknown>) || {};
  const todayKey = getTodayKey();
  const usageData = (metadata.usage as Record<string, number>) || {};
  const todayCount = usageData[todayKey] || 0;

  if (todayCount >= DAILY_LIMIT) {
    return NextResponse.json(
      { error: `Daily limit reached (${DAILY_LIMIT} questions/day). Try again tomorrow.` },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { prompt } = body;

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const provider = getProvider();
  const workerModels = getWorkerModels();
  const evaluatorModel = getEvaluatorModel();

  // 3. Stream everything — workers then evaluator
  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function send(data: string) {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }

      try {
        // Phase 1: Stream all workers in parallel
        interface WorkerResult { model: string; content: string; error?: string; }
        const completedWorkers: WorkerResult[] = [];

        const workerPromises = workerModels.map((model) => {
          send(JSON.stringify({ type: "worker_start", model }));

          return (async () => {
            try {
              const result = streamText({
                model: provider.chat(model),
                system: WORKER_SYSTEM_PROMPT,
                prompt,
                maxOutputTokens: 512,
              });

              let fullContent = "";
              for await (const chunk of result.textStream) {
                fullContent += chunk;
                send(JSON.stringify({ type: "worker_chunk", model, content: chunk }));
              }

              completedWorkers.push({ model, content: fullContent });
              send(JSON.stringify({ type: "worker_done", model, content: fullContent }));
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : "Unknown error";
              completedWorkers.push({ model, content: "", error: message });
              send(JSON.stringify({ type: "worker_error", model, error: message }));
            }
          })();
        });

        await Promise.all(workerPromises);

        // Check if any succeeded
        const successful = completedWorkers.filter((r) => !r.error);
        if (successful.length === 0) {
          send(JSON.stringify({ type: "error", message: "All worker models failed" }));
          send("[DONE]");
          controller.close();
          return;
        }

        // Phase 2: Stream evaluator
        send(JSON.stringify({ type: "eval_start", model: evaluatorModel }));

        const modelAnswers = successful
          .map((r, i) => `### Model ${i + 1}: ${r.model}\n${r.content}`)
          .join("\n\n---\n\n");

        const evaluatorPrompt = `You are an expert evaluator. A user asked the following question, and multiple AI models provided their answers.

## User's Question
${prompt}

## Model Responses
${modelAnswers}

## Your Task
1. Analyze each model's response for accuracy, completeness, and clarity.
2. Identify the strongest parts from each response.
3. Generate the BEST possible final answer by synthesizing the best elements.
4. Do NOT simply copy one response. Create a refined, superior answer.
5. If models disagree, use your judgment to determine the most accurate information.
6. Write your answer in simple, clear language that any person can understand.
7. Keep it concise but complete — don't be overly verbose.
8. Do NOT add meta-commentary like "Based on the responses..." — just give the final answer directly.

## Final Synthesized Answer:`;

        const evalResult = streamText({
          model: provider.chat(evaluatorModel),
          prompt: evaluatorPrompt,
          maxOutputTokens: 4096,
        });

        for await (const chunk of evalResult.textStream) {
          send(JSON.stringify({ type: "eval_chunk", content: chunk }));
        }

        send(JSON.stringify({ type: "eval_done" }));

        // Increment usage after success
        const newUsage = { ...usageData, [todayKey]: todayCount + 1 };
        const client = await clerkClient();
        await client.users.updateUserMetadata(user.id, {
          publicMetadata: { usage: newUsage },
        });

        send("[DONE]");
        controller.close();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal error";
        send(JSON.stringify({ type: "error", message }));
        send("[DONE]");
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
