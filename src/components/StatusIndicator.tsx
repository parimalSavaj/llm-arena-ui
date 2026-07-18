type AppState = "idle" | "workers" | "evaluating" | "done" | "error";

interface StatusIndicatorProps {
  state: AppState;
  error: string;
  onReset: () => void;
}

export function StatusIndicator({ state, error, onReset }: StatusIndicatorProps) {
  if (state === "error") {
    return (
      <div className="border border-error/30 rounded px-3 py-2 text-xs">
        <span className="text-error">[ERROR]</span>{" "}
        <span className="text-foreground">{error}</span>
        <button
          onClick={onReset}
          className="ml-4 text-primary hover:underline"
        >
          [retry]
        </button>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="border border-success/30 rounded px-3 py-2 text-xs flex items-center justify-between">
        <span>
          <span className="text-success">[DONE]</span>{" "}
          <span className="text-muted">Process completed successfully</span>
        </span>
        <button
          onClick={onReset}
          className="text-primary hover:underline"
        >
          [new query]
        </button>
      </div>
    );
  }

  return (
    <div className="border border-card-border rounded px-3 py-2 text-xs">
      {state === "workers" && (
        <span>
          <span className="text-terminal-amber">[WORKERS]</span>{" "}
          <span className="text-muted">Querying models in parallel</span>
          <span className="pulse-dot text-terminal-green ml-1">...</span>
        </span>
      )}
      {state === "evaluating" && (
        <span>
          <span className="text-terminal-cyan">[EVALUATOR]</span>{" "}
          <span className="text-muted">Synthesizing best response</span>
          <span className="pulse-dot text-terminal-green ml-1">...</span>
        </span>
      )}
    </div>
  );
}
