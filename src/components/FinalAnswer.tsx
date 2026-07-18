import { EVALUATOR_DISPLAY } from "@/lib/model-display";

interface FinalAnswerProps {
  answer: string;
  model: string;
  isStreaming: boolean;
}

export function FinalAnswer({ answer, model, isStreaming }: FinalAnswerProps) {
  return (
    <div className="border border-anthropic/40 rounded overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-card-border bg-anthropic/5">
        <div className="flex items-center gap-2">
          <span className="text-anthropic text-sm">{EVALUATOR_DISPLAY.icon}</span>
          <span className="text-xs font-bold text-anthropic">{EVALUATOR_DISPLAY.label}</span>
        </div>
        {model && (
          <span className="text-xs text-muted">
            engine: {model}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-3 py-3 bg-anthropic/5">
        <div className="text-xs text-muted mb-2">
          <span className="text-anthropic">{EVALUATOR_DISPLAY.icon}</span>{" "}
          {EVALUATOR_DISPLAY.name} ({EVALUATOR_DISPLAY.provider}) — synthesized output:
        </div>

        {!answer && isStreaming && (
          <div className="text-xs text-muted">
            <span className="pulse-dot text-terminal-amber">●</span>{" "}
            analyzing model responses and generating synthesis...
          </div>
        )}

        {answer && (
          <div
            className={`text-sm text-foreground whitespace-pre-wrap leading-relaxed ${
              isStreaming ? "cursor-blink" : ""
            }`}
          >
            {answer}
          </div>
        )}
      </div>
    </div>
  );
}
