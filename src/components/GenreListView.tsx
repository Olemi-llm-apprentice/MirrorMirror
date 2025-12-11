"use client";

import type { GenrePreview, GenreId } from "@/types";

interface GenreListViewProps {
  genres: GenrePreview[];
  onSelectGenre: (genreId: GenreId) => void;
  onBack: () => void;
}

export function GenreListView({ genres, onSelectGenre, onBack }: GenreListViewProps) {
  return (
    <div className="min-h-screen flex flex-col pb-32">
      {/* Header */}
      <div className="pt-8 pb-4 px-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
      </div>

      {/* Title */}
      <div className="text-center px-6 mb-6">
        <h2 className="font-display text-3xl text-gray-800 mb-2">Recommended Styles</h2>
        <p className="text-gray-600 text-sm">Tap to see item details</p>
      </div>

      {/* Coordinate Grid */}
      <div className="flex-1 px-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          {genres.map((genre, index) => (
            <button
              key={genre.genre_id}
              onClick={() => onSelectGenre(genre.genre_id)}
              className="relative group animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl group-hover:scale-[1.02] transition-all duration-300">
                {/* Image */}
                <div className="aspect-[3/4] relative">
                  <img
                    src={genre.preview_image_url}
                    alt={`Coordinate ${index + 1}`}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${
                      genre.is_generating ? "opacity-70" : "opacity-100"
                    }`}
                  />
                  {/* Subtle shadow overlay at bottom only */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  
                  {/* Loading Indicator for AI Generation */}
                  {genre.is_generating && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/90 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-lg">
                        <div className="w-8 h-8 border-3 border-gray-800 border-t-transparent rounded-full animate-spin" />
                        <span className="text-gray-800 text-xs font-medium">Generating...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Number Badge */}
                <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow">
                  <span className="font-display text-lg text-gray-800">{index + 1}</span>
                </div>

                {/* Tap indicator */}
                <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center group-hover:bg-white transition-colors shadow">
                  <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Voice Hint */}
      <div className="px-6 mt-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow">
          <p className="text-gray-600 text-xs">
            🎤 Say "Show me number 1" to select by voice
          </p>
        </div>
      </div>
    </div>
  );
}
