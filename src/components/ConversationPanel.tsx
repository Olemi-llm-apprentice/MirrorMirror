"use client";

import Image from "next/image";
import type { Gender } from "@/types";

interface ConversationPanelProps {
  gender: Gender | null;
  onSelectGender: (gender: Gender) => void;
  messages: Array<{ source: "user" | "ai"; text: string }>;
}

export function ConversationPanel({
  gender,
  onSelectGender,
  messages,
}: ConversationPanelProps) {
  return (
    <div className="min-h-screen flex flex-col pb-32">
      {/* Header */}
      <div className="pt-12 pb-8 px-6 text-center">
        <h1 className="font-display text-5xl tracking-wider text-gray-800 mb-2">
          MIRROR MIRROR
        </h1>
        <p className="text-gray-600 text-sm">AI Fashion Concierge</p>
      </div>

      {/* Gender Selection */}
      <div className="px-6 mb-8">
        <p className="text-center text-gray-700 mb-4 text-sm">
          Please select your style
        </p>
        <div className="flex gap-6 justify-center">
          <button
            onClick={() => onSelectGender("mens")}
            className={`flex-1 max-w-[220px] py-8 rounded-3xl font-medium transition-all duration-300 bg-transparent ${
              gender === "mens"
                ? "border-4 border-blue-500 shadow-lg scale-105 text-gray-800"
                : "border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-white/30"
            }`}
          >
            <div className="relative w-full aspect-square mb-4 px-4">
              <Image
                src="/gender_man.png"
                alt="Men's"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-lg">Men&apos;s</span>
          </button>
          <button
            onClick={() => onSelectGender("ladies")}
            className={`flex-1 max-w-[220px] py-8 rounded-3xl font-medium transition-all duration-300 bg-transparent ${
              gender === "ladies"
                ? "border-4 border-pink-500 shadow-lg scale-105 text-gray-800"
                : "border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-white/30"
            }`}
          >
            <div className="relative w-full aspect-square mb-4 px-4">
              <Image
                src="/gender_woman.png"
                alt="Women's"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-lg">Women&apos;s</span>
          </button>
        </div>
      </div>

      {/* Conversation Display */}
      <div className="flex-1 px-6 space-y-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-float">✨</div>
            <p className="text-gray-600 text-sm">
              Tap the microphone button
              <br />
              to start conversation
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.source === "user" ? "justify-end" : "justify-start"
              } animate-slide-up`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  msg.source === "user"
                    ? "bg-red-600 text-white rounded-br-sm"
                    : "bg-white/90 text-gray-800 border border-gray-200 rounded-bl-sm"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
