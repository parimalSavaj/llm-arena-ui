"use client";

import { useState, useCallback, useEffect } from "react";
import { PromptInput } from "@/components/PromptInput";
import { WorkerCard } from "@/components/WorkerCard";
import { FinalAnswer } from "@/components/FinalAnswer";
import { Header } from "@/components/Header";
import { StatusIndicator } from "@/components/StatusIndicator";
import { WORKER_DISPLAY } from "@/lib/model-display";

interface WorkerState {
  model: string;
  content: string;
  error?: string;
  status: "pending" | "streaming" | "done" | "error";
}

type AppState = "idle" | "workers" | "evaluating" | "done" | "error";

const API_BASE = "/api";

function getFormattedTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}.${month}.${day}_${hours}:${minutes}:${seconds}`;
}

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [prompt, setPrompt] = useState("");
  const [workers, setWorkers] = useState<WorkerState[]>([]);
  const [finalAnswer, setFinalAnswer] = useState("");
  const [evaluatorModel, setEvaluatorModel] = useState("");
  const [error, setError] = useState("");
  const [isEvalStreaming, setIsEvalStreaming] = useState(false);
  const [theme, setTheme] = useState("green");
  const [systemTime, setSystemTime] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("arena-theme") || "green";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    setSystemTime(getFormattedTime());
    const interval = setInterval(() => {
      setSystemTime(getFormattedTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSetTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("arena-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleSubmit = useCallback(async (userPrompt: string) => {
    setPrompt(userPrompt);
    setWorkers([]);
    setFinalAnswer("");
    setError("");
    setState("workers");
    setIsEvalStreaming(false);
    setEvaluatorModel("");

    try {
      const response = await fetch(`${API_BASE}/arena`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt, stream: true }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);

          if (data === "[DONE]") {
            setState("done");
            setIsEvalStreaming(false);
            break;
          }

          try {
            const parsed = JSON.parse(data);

            switch (parsed.type) {
              case "worker_start":
                setWorkers((prev) => [
                  ...prev,
                  { model: parsed.model, content: "", status: "streaming" },
                ]);
                break;

              case "worker_chunk":
                setWorkers((prev) =>
                  prev.map((w) =>
                    w.model === parsed.model
                      ? { ...w, content: w.content + parsed.content }
                      : w
                  )
                );
                break;

              case "worker_done":
                setWorkers((prev) =>
                  prev.map((w) =>
                    w.model === parsed.model
                      ? { ...w, content: parsed.content, status: "done" }
                      : w
                  )
                );
                break;

              case "worker_error":
                setWorkers((prev) =>
                  prev.map((w) =>
                    w.model === parsed.model
                      ? { ...w, error: parsed.error, status: "error" }
                      : w
                  )
                );
                break;

              case "eval_start":
                setState("evaluating");
                setIsEvalStreaming(true);
                setEvaluatorModel(parsed.model);
                break;

              case "eval_chunk":
                setFinalAnswer((prev) => prev + parsed.content);
                break;

              case "eval_done":
                setState("done");
                setIsEvalStreaming(false);
                break;

              case "error":
                throw new Error(parsed.message);
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }

      setState("done");
      setIsEvalStreaming(false);
      window.dispatchEvent(new Event("usage-updated"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setState("error");
      setIsEvalStreaming(false);
    }
  }, []);

  const handleSubmitNonStreaming = useCallback(async (userPrompt: string) => {
    setPrompt(userPrompt);
    setWorkers([]);
    setFinalAnswer("");
    setError("");
    setState("workers");
    setEvaluatorModel("");

    try {
      const response = await fetch(`${API_BASE}/arena`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt, stream: false }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setWorkers(
        data.workerResponses.map((r: { model: string; content: string; error?: string }) => ({
          ...r,
          status: r.error ? "error" : "done",
        }))
      );
      setState("evaluating");

      await new Promise((r) => setTimeout(r, 300));
      setFinalAnswer(data.finalAnswer);
      setEvaluatorModel(data.evaluatorModel);
      setState("done");
      window.dispatchEvent(new Event("usage-updated"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setState("error");
    }
  }, []);

  function handleReset() {
    setState("idle");
    setPrompt("");
    setWorkers([]);
    setFinalAnswer("");
    setError("");
    setEvaluatorModel("");
    setIsEvalStreaming(false);
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 min-h-screen flex flex-col justify-between">
      <div>
        <Header theme={theme} setTheme={handleSetTheme} />

        <div className="mt-8">
          <PromptInput
            onSubmit={handleSubmit}
            onSubmitNonStreaming={handleSubmitNonStreaming}
            disabled={state === "workers" || state === "evaluating"}
          />
        </div>

        {state !== "idle" && (
          <div className="mt-6">
            <StatusIndicator state={state} error={error} onReset={handleReset} />
          </div>
        )}

        {workers.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xs font-bold mb-3 text-muted tracking-widest uppercase font-mono">
              &gt; DETECTED_MODEL_NODES: {workers.length} ACTIVE
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {workers.map((worker, i) => (
                <WorkerCard
                  key={worker.model}
                  worker={worker}
                  display={WORKER_DISPLAY[i % WORKER_DISPLAY.length]}
                />
              ))}
            </div>
          </div>
        )}

        {(finalAnswer || state === "evaluating") && (
          <div className="mt-8">
            <FinalAnswer
              answer={finalAnswer}
              model={evaluatorModel}
              isStreaming={isEvalStreaming}
            />
          </div>
        )}
      </div>

      <footer className="mt-12 text-center text-[10px] text-muted tracking-widest uppercase font-mono">
        SYSTEM_LOCAL_TIME: {systemTime || "SYNCHRONIZING..."} // END_OF_SESSION
      </footer>
    </main>
  );
}
