import { type ModelDisplay } from "@/lib/model-display";

interface WorkerState {
  model: string;
  content: string;
  error?: string;
  status: "pending" | "streaming" | "done" | "error";
}

interface WorkerCardProps {
  worker: WorkerState;
  display: ModelDisplay;
}

export function WorkerCard({ worker, display }: WorkerCardProps) {
  const colorMap = {
    gemini: { text: "text-gemini", border: "border-gemini/30", bg: "bg-gemini/5" },
    gpt: { text: "text-gpt", border: "border-gpt/30", bg: "bg-gpt/5" },
    anthropic: { text: "text-anthropic", border: "border-anthropic/30", bg: "bg-anthropic/5" },
  }[display.color] ?? { text: "text-muted", border: "border-card-border", bg: "bg-card" };

  const statusText = {
    pending: <span className="text-muted">waiting</span>,
    streaming: <span className="text-terminal-green pulse-dot">streaming</span>,
    done: <span className="text-success">done ✓</span>,
    error: <span className="text-error">failed ✗</span>,
  }[worker.status];

  return (
    <div className={`border ${colorMap.border} rounded ${colorMap.bg} overflow-hidden`}>
      {/* Terminal title bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-card-border bg-accent/50">
        <div className="flex items-center gap-2">
          <span className={`text-xs ${colorMap.text}`}>{display.icon}</span>
          <span className={`text-xs font-bold ${colorMap.text}`}>{display.name}</span>
          <span className="text-xs text-muted">({display.provider})</span>
        </div>
        <span className="text-xs">{statusText}</span>
      </div>

      {/* Terminal body */}
      <div className="px-3 py-2 min-h-[80px]">


        {/* Content */}
        {worker.error ? (
          <div className="text-xs text-error">
            stderr: {worker.error}
          </div>
        ) : worker.status === "pending" ? (
          <div className="text-xs text-muted italic">
            # awaiting response...
          </div>
        ) : (
          <div
            className={`text-xs text-foreground max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed ${
              worker.status === "streaming" ? "cursor-blink" : ""
            }`}
          >
            {worker.content || (
              <span className="text-muted">...</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
