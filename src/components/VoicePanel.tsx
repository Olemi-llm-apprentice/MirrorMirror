"use client";

import { useState, useEffect } from "react";

interface VoicePanelProps {
  isConnected: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  onStart: () => void;
  onEnd: () => void;
}

export function VoicePanel({
  isConnected,
  isSpeaking,
  isListening,
  onStart,
  onEnd,
}: VoicePanelProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isSpeaking || isListening) {
      setIsAnimating(true);
    } else {
      const timeout = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isSpeaking, isListening]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="glass-dark py-4 px-6">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {/* Status Display */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  isConnected
                    ? isSpeaking
                      ? "bg-accent-rose animate-pulse"
                      : isListening
                      ? "bg-accent-cyan animate-pulse"
                      : "bg-green-400"
                    : "bg-gray-500"
                }`}
              />
              {isAnimating && (
                <div
                  className={`absolute inset-0 rounded-full animate-ping ${
                    isSpeaking ? "bg-accent-rose" : "bg-accent-cyan"
                  } opacity-50`}
                />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white/90">
                {!isConnected
                  ? "タップで開始"
                  : isSpeaking
                  ? "AIが話しています..."
                  : isListening
                  ? "聞いています..."
                  : "準備完了"}
              </span>
              <span className="text-xs text-white/50">
                {isConnected ? "音声認識中" : "MirrorMirror AI"}
              </span>
            </div>
          </div>

          {/* Microphone Button */}
          <button
            onClick={isConnected ? onEnd : onStart}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              isConnected
                ? "bg-gradient-to-br from-accent-rose to-pink-700 animate-pulse-glow"
                : "bg-gradient-to-br from-accent-cyan to-blue-600 hover:scale-105"
            } shadow-xl hover:shadow-2xl active:scale-95`}
          >
            {/* Outer Ring Animation */}
            {isConnected && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" />
                <div className="absolute inset-[-4px] rounded-full border border-white/20 animate-pulse" />
              </>
            )}

            {/* Icon */}
            <svg
              className="w-8 h-8 text-white relative z-10"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {isConnected ? (
                // Stop icon
                <rect x="6" y="6" width="12" height="12" rx="2" />
              ) : (
                // Microphone icon
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              )}
            </svg>
          </button>
        </div>

        {/* Waveform Visualization */}
        {isConnected && (
          <div className="flex justify-center gap-1 mt-3">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isSpeaking
                    ? "bg-accent-rose"
                    : isListening
                    ? "bg-accent-cyan"
                    : "bg-white/30"
                }`}
                style={{
                  height: isAnimating
                    ? `${Math.random() * 20 + 4}px`
                    : "4px",
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

