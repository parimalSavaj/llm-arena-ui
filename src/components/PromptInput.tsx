"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  onSubmitNonStreaming: (prompt: string) => void;
  disabled: boolean;
}

export function PromptInput({ onSubmit, onSubmitNonStreaming, disabled }: PromptInputProps) {
  const [input, setInput] = useState("");
  const [useStreaming, setUseStreaming] = useState(true);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || disabled) return;

    if (useStreaming) {
      onSubmit(input.trim());
    } else {
      onSubmitNonStreaming(input.trim());
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-terminal-green mt-2 select-none">❯</span>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your prompt..."
          disabled={disabled}
          rows={2}
          className="flex-1 px-3 py-2 bg-accent border border-card-border rounded text-foreground placeholder:text-muted/50 resize-none focus:outline-none focus:border-primary transition font-mono text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Enter your question"
        />
      </div>

      <div className="flex items-center justify-between pl-5">
        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={useStreaming}
            onChange={(e) => setUseStreaming(e.target.checked)}
            className="rounded-sm border-card-border accent-terminal-green"
          />
          <span className="text-terminal-cyan">--stream</span>
        </label>

        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="px-4 py-1.5 rounded border border-terminal-green/50 text-terminal-green text-xs font-medium hover:bg-terminal-green/10 transition disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-terminal-green/50"
        >
          {disabled ? (
            <span className="flex items-center gap-2">
              <span className="pulse-dot">●</span> running...
            </span>
          ) : (
            "⏎ execute"
          )}
        </button>
      </div>
    </form>
  );
}
