"use client";

import type { Coordinate, GenreId } from "@/types";

interface CoordinateListViewProps {
  coordinates: Coordinate[];
  genreId: GenreId;
  onSelectCoordinate: (index: number) => void;
  onBack: () => void;
}

const GENRE_NAMES: Record<GenreId, string> = {
  casual: "カジュアル",
  business: "ビジネス",
  street: "ストリート",
  mode: "モード",
  elegant: "キレイめ",
};

export function CoordinateListView({
  coordinates,
  genreId,
  onSelectCoordinate,
  onBack,
}: CoordinateListViewProps) {
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
        <h2 className="font-display text-3xl text-gradient mb-2">
          {GENRE_NAMES[genreId]} STYLE
        </h2>
        <p className="text-white/60 text-sm">
          {coordinates.length}つのコーディネートからお選びください
        </p>
      </div>

      {/* Coordinate Grid */}
      <div className="flex-1 px-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          {coordinates.map((coord, index) => {
            const totalPrice = coord.items.reduce((sum, item) => sum + item.price, 0);

            return (
              <button
                key={coord.coordinate_id}
                onClick={() => onSelectCoordinate(index)}
                className="relative group animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl group-hover:scale-[1.02] transition-all duration-300">
                  {/* Image */}
                  <div className="aspect-[3/4]">
                    <img
                      src={coord.image_url}
                      alt={coord.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>

                  {/* Number Badge */}
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="font-display text-lg text-white">{index + 1}</span>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-medium text-sm truncate">
                      {coord.name}
                    </p>
                    <p className="text-white/60 text-xs mt-1">
                      ¥{totalPrice.toLocaleString()}〜
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-white/50 text-xs">
                      <span>{coord.items.length}点</span>
                      <span>•</span>
                      <span>詳細を見る</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Hint */}
      <div className="px-6 mt-6">
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-white/60 text-xs">
            🎤 「1番目を見せて」などと音声で選択できます
          </p>
        </div>
      </div>
    </div>
  );
}

