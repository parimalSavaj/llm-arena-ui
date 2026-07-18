import { UserButton } from "@clerk/nextjs";
import { UsageBadge } from "./UsageBadge";

interface HeaderProps {
  theme: string;
  setTheme: (theme: string) => void;
}

const THEMES = [
  { id: "green", label: "green", color: "text-terminal-green" },
  { id: "amber", label: "amber", color: "text-terminal-amber" },
  { id: "cyan", label: "cyan", color: "text-terminal-cyan" },
];

export function Header({ theme, setTheme }: HeaderProps) {
  return (
    <header className="border-b border-card-border pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-terminal-green">
          <span className="text-muted">$</span>
          <span className="font-bold">llm-arena</span>
          <span className="text-muted">--mode</span>
          <span>self-consistency</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Usage counter */}
          <UsageBadge />

          {/* Theme switcher */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted">theme:</span>
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`px-1.5 py-0.5 rounded text-xs transition ${
                  theme === t.id
                    ? `${t.color} border border-current`
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* User account */}
          <UserButton />
        </div>
      </div>
      <p className="mt-1 text-muted text-xs">
        ┌ Multi-model orchestration engine • Ask once → 3 models respond → 1 best answer
      </p>
    </header>
  );
}
