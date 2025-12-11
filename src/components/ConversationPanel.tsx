"use client";

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
        <h1 className="font-display text-5xl tracking-wider text-gradient mb-2">
          MIRROR MIRROR
        </h1>
        <p className="text-white/60 text-sm">AI ファッションコンシェルジュ</p>
      </div>

      {/* Gender Selection */}
      <div className="px-6 mb-8">
        <p className="text-center text-white/80 mb-4 text-sm">
          スタイルを選択してください
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => onSelectGender("mens")}
            className={`flex-1 max-w-[160px] py-4 rounded-2xl font-medium transition-all duration-300 ${
              gender === "mens"
                ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30 scale-105"
                : "glass hover:bg-white/10 text-white/80"
            }`}
          >
            <div className="text-3xl mb-2">👔</div>
            <span>メンズ</span>
          </button>
          <button
            onClick={() => onSelectGender("ladies")}
            className={`flex-1 max-w-[160px] py-4 rounded-2xl font-medium transition-all duration-300 ${
              gender === "ladies"
                ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/30 scale-105"
                : "glass hover:bg-white/10 text-white/80"
            }`}
          >
            <div className="text-3xl mb-2">👗</div>
            <span>レディース</span>
          </button>
        </div>
      </div>

      {/* Conversation Display */}
      <div className="flex-1 px-6 space-y-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-float">✨</div>
            <p className="text-white/60 text-sm">
              マイクボタンをタップして
              <br />
              会話を始めましょう
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
                    ? "bg-accent-rose/80 text-white rounded-br-sm"
                    : "glass text-white/90 rounded-bl-sm"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-accent-rose/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-10 w-40 h-40 bg-accent-cyan/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-1/2 w-60 h-60 bg-secondary-light/20 rounded-full blur-3xl" />
      </div>
    </div>
  );
}

