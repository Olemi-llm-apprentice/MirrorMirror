"use client";

import { useEffect, useState } from "react";

interface LoadingViewProps {
  message?: string;
}

const LOADING_MESSAGES = [
  "Finding the perfect style for you...",
  "Checking the latest trends...",
  "Generating coordinates...",
  "Almost there...",
  "Found some great styles!",
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
        <div className="absolute inset-0 rounded-full border-4 border-gray-300" />
        
        {/* Spinning Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 animate-spin" 
             style={{ animationDuration: "1.5s" }} />
        
        {/* Middle Ring */}
        <div className="absolute inset-4 rounded-full border-2 border-gray-200" />
        <div className="absolute inset-4 rounded-full border-2 border-transparent border-b-blue-500 animate-spin"
             style={{ animationDuration: "2s", animationDirection: "reverse" }} />
        
        {/* Inner Content */}
        <div className="absolute inset-8 rounded-full bg-white/80 shadow-lg flex items-center justify-center">
          <div className="text-5xl animate-float">✨</div>
        </div>

        {/* Floating Particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-amber-400"
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
        <p className="text-lg text-gray-800 font-medium animate-pulse">
          {message || LOADING_MESSAGES[currentMessage]}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs">
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-gray-500 text-xs mt-2">
          {Math.round(progress)}%
        </p>
      </div>

      {/* Style Cards Animation */}
      <div className="flex gap-2 mt-8">
        {["👔", "👗", "👟", "👜", "🧥"].map((emoji, i) => (
          <div
            key={i}
            className="w-10 h-10 rounded-lg bg-white/80 shadow flex items-center justify-center text-xl animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            {emoji}
          </div>
        ))}
      </div>
    </div>
  );
}
