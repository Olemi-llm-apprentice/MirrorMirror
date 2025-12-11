"use client";

import { useEffect, useRef } from "react";

export interface LogEntry {
  timestamp: Date;
  type: "info" | "error" | "action" | "api" | "voice";
  message: string;
  data?: unknown;
}

interface DebugPanelProps {
  logs: LogEntry[];
  isVisible: boolean;
  onToggle: () => void;
}

const TYPE_COLORS: Record<LogEntry["type"], string> = {
  info: "text-blue-400",
  error: "text-red-400",
  action: "text-green-400",
  api: "text-yellow-400",
  voice: "text-purple-400",
};

const TYPE_ICONS: Record<LogEntry["type"], string> = {
  info: "ℹ️",
  error: "❌",
  action: "👆",
  api: "🌐",
  voice: "🎤",
};

export function DebugPanel({ logs, isVisible, onToggle }: DebugPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed top-4 right-4 z-[100] w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
      >
        🐛
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="fixed top-16 right-4 left-4 bottom-36 z-[100] bg-black/90 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <span className="text-white/80 text-sm font-medium">
              Debug Logs ({logs.length})
            </span>
            <button
              onClick={onToggle}
              className="text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Logs */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-2 space-y-1 text-xs font-mono"
          >
            {logs.length === 0 ? (
              <div className="text-white/40 text-center py-4">
                ログがありません
              </div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className="flex gap-2 p-2 rounded bg-white/5 hover:bg-white/10"
                >
                  <span className="flex-shrink-0">{TYPE_ICONS[log.type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <span className={TYPE_COLORS[log.type]}>
                        [{log.type.toUpperCase()}]
                      </span>
                    </div>
                    <p className="text-white/90 break-all">{log.message}</p>
                    {log.data !== undefined && log.data !== null && (
                      <pre className="text-white/50 text-[10px] mt-1 overflow-x-auto">
                        {typeof log.data === "string" ? log.data : JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Logger utility
export function createLogger(addLog: (log: LogEntry) => void) {
  return {
    info: (message: string, data?: unknown) =>
      addLog({ timestamp: new Date(), type: "info", message, data }),
    error: (message: string, data?: unknown) =>
      addLog({ timestamp: new Date(), type: "error", message, data }),
    action: (message: string, data?: unknown) =>
      addLog({ timestamp: new Date(), type: "action", message, data }),
    api: (message: string, data?: unknown) =>
      addLog({ timestamp: new Date(), type: "api", message, data }),
    voice: (message: string, data?: unknown) =>
      addLog({ timestamp: new Date(), type: "voice", message, data }),
  };
}

