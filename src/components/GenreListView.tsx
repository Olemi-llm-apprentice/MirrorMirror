"use client";

import { useRef } from "react";
import type { GenrePreview, GenreId } from "@/types";

interface GenreListViewProps {
  genres: GenrePreview[];
  onSelectGenre: (genreId: GenreId) => void;
  onBack: () => void;
}

const GENRE_COLORS: Record<GenreId, { from: string; to: string }> = {
  casual: { from: "from-sky-500", to: "to-blue-600" },
  business: { from: "from-slate-600", to: "to-slate-800" },
  street: { from: "from-red-500", to: "to-orange-600" },
  mode: { from: "from-gray-800", to: "to-black" },
  elegant: { from: "from-purple-500", to: "to-indigo-600" },
};

const GENRE_ICONS: Record<GenreId, string> = {
  casual: "👕",
  business: "💼",
  street: "🛹",
  mode: "🎨",
  elegant: "💎",
};

export function GenreListView({ genres, onSelectGenre, onBack }: GenreListViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen flex flex-col pb-32">
      {/* Header */}
      <div className="pt-8 pb-4 px-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>戻る</span>
        </button>
      </div>

      {/* Title */}
      <div className="text-center px-6 mb-6">
        <h2 className="font-display text-3xl text-gradient mb-2">SELECT YOUR STYLE</h2>
        <p className="text-white/60 text-sm">5つのスタイルからお選びください</p>
      </div>

      {/* Genre Carousel */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          className="flex gap-4 px-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {genres.map((genre, index) => {
            const colors = GENRE_COLORS[genre.genre_id] || GENRE_COLORS.casual;
            const icon = GENRE_ICONS[genre.genre_id] || "✨";

            return (
              <button
                key={genre.genre_id}
                onClick={() => onSelectGenre(genre.genre_id)}
                className="flex-shrink-0 w-72 snap-center group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative rounded-3xl overflow-hidden shadow-2xl animate-slide-up group-hover:scale-[1.02] transition-transform duration-300">
                  {/* Background Image */}
                  <div className="aspect-[3/4] relative">
                    <img
                      src={genre.preview_image_url}
                      alt={genre.genre_name}
                      className="w-full h-full object-cover"
                    />
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${colors.from} ${colors.to} opacity-60`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    {/* Icon Badge */}
                    <div className="absolute top-4 right-4 w-12 h-12 rounded-2xl glass flex items-center justify-center text-2xl">
                      {icon}
                    </div>

                    {/* Genre Info */}
                    <div className="space-y-2">
                      <h3 className="font-display text-4xl text-white tracking-wide">
                        {genre.genre_name}
                      </h3>
                      <p className="text-white/80 text-sm line-clamp-2">
                        {genre.tagline}
                      </p>
                    </div>

                    {/* CTA */}
                    <div className="mt-4 flex items-center gap-2 text-white/60 group-hover:text-white transition-colors">
                      <span className="text-sm">詳細を見る</span>
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="flex justify-center gap-2 mt-4 px-6">
        {genres.map((genre, i) => (
          <div
            key={genre.genre_id}
            className="w-2 h-2 rounded-full bg-white/20"
          />
        ))}
      </div>

      {/* Voice Hint */}
      <div className="px-6 mt-6">
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-white/60 text-xs">
            🎤 「カジュアルを見せて」などと音声で選択できます
          </p>
        </div>
      </div>
    </div>
  );
}

