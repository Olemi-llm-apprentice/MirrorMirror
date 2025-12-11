"use client";

import { useEffect, useState } from "react";

interface LoadingViewProps {
  message?: string;
}

const LOADING_MESSAGES = [
  "あなたにぴったりのスタイルを探しています...",
  "トレンドをチェック中...",
  "コーディネートを生成しています...",
  "もう少しお待ちください...",
  "素敵なスタイルを見つけました！",
];

export function LoadingView({ message }: LoadingViewProps) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + Math.random() * 15, 95));
    }, 500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-32">
      {/* Main Animation */}
      <div className="relative w-48 h-48 mb-8">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-white/10" />
        
        {/* Spinning Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent-rose animate-spin" 
             style={{ animationDuration: "1.5s" }} />
        
        {/* Middle Ring */}
        <div className="absolute inset-4 rounded-full border-2 border-white/5" />
        <div className="absolute inset-4 rounded-full border-2 border-transparent border-b-accent-cyan animate-spin"
             style={{ animationDuration: "2s", animationDirection: "reverse" }} />
        
        {/* Inner Content */}
        <div className="absolute inset-8 rounded-full glass flex items-center justify-center">
          <div className="text-5xl animate-float">✨</div>
        </div>

        {/* Floating Particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-accent-gold/60"
            style={{
              top: `${20 + Math.random() * 60}%`,
              left: `${20 + Math.random() * 60}%`,
              animation: `float ${2 + Math.random()}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Message */}
      <div className="text-center mb-8">
        <p className="text-lg text-white/90 font-medium animate-pulse">
          {message || LOADING_MESSAGES[currentMessage]}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-rose to-accent-cyan transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-white/40 text-xs mt-2">
          {Math.round(progress)}%
        </p>
      </div>

      {/* Style Cards Animation */}
      <div className="flex gap-2 mt-8">
        {["👔", "👗", "👟", "👜", "🧥"].map((emoji, i) => (
          <div
            key={i}
            className="w-10 h-10 rounded-lg glass flex items-center justify-center text-xl animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            {emoji}
          </div>
        ))}
      </div>
    </div>
  );
}

