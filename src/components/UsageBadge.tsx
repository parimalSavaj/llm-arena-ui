"use client";

import { useEffect, useState } from "react";

interface UsageData {
  limit: number;
  used: number;
  remaining: number;
}

export function UsageBadge() {
  const [usage, setUsage] = useState<UsageData | null>(null);

  async function fetchUsage() {
    try {
      const res = await fetch("/api/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    fetchUsage();
  }, []);

  // Re-fetch after page becomes visible (user comes back)
  useEffect(() => {
    const visHandler = () => {
      if (document.visibilityState === "visible") fetchUsage();
    };
    const updateHandler = () => fetchUsage();
    document.addEventListener("visibilitychange", visHandler);
    window.addEventListener("usage-updated", updateHandler);
    return () => {
      document.removeEventListener("visibilitychange", visHandler);
      window.removeEventListener("usage-updated", updateHandler);
    };
  }, []);

  if (!usage) return null;

  const isLow = usage.remaining <= 1;
  const isExhausted = usage.remaining === 0;

  return (
    <div
      className={`text-xs px-2 py-1 rounded border ${
        isExhausted
          ? "border-error/50 text-error"
          : isLow
          ? "border-terminal-amber/50 text-terminal-amber"
          : "border-card-border text-muted"
      }`}
    >
      <span className="text-foreground font-medium">{usage.remaining}</span>
      /{usage.limit} remaining
    </div>
  );
}

/**
 * Call this after a successful request to update the badge without refetching
 */
export function useRefreshUsage() {
  return async () => {
    // Dispatch a custom event that UsageBadge listens to
    window.dispatchEvent(new Event("usage-updated"));
  };
}
