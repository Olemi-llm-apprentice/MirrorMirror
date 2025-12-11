"use client";

import type { Coordinate, Item } from "@/types";

interface ItemDetailsViewProps {
  coordinate: Coordinate;
  items: Item[];
  onShowShopMap: (itemId: string) => void;
  onBack: () => void;
}

export function ItemDetailsView({
  coordinate,
  items,
  onShowShopMap,
  onBack,
}: ItemDetailsViewProps) {
  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

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

      {/* Coordinate Preview */}
      <div className="px-6 mb-6">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
          <div className="aspect-[4/3]">
            <img
              src={coordinate.image_url}
              alt={coordinate.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          </div>
          
          {/* Coordinate Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="font-display text-2xl text-white mb-2">{coordinate.name}</h2>
            <p className="text-white/70 text-sm">{coordinate.description}</p>
          </div>
        </div>
      </div>

      {/* Price Summary */}
      <div className="px-6 mb-6">
        <div className="glass rounded-2xl p-4 flex justify-between items-center">
          <div>
            <p className="text-white/60 text-sm">合計金額</p>
            <p className="text-2xl font-bold text-gradient">
              ¥{totalPrice.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-sm">アイテム数</p>
            <p className="text-xl font-medium text-white">{items.length}点</p>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 px-6 overflow-y-auto">
        <h3 className="text-white/60 text-sm mb-4 uppercase tracking-wider">
          アイテム一覧
        </h3>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.item_id}
              className="card-interactive flex gap-4 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Item Image */}
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `/api/placeholder/${item.category}`;
                  }}
                />
              </div>

              {/* Item Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-accent-cyan mb-1">{item.brand}</p>
                <p className="font-medium text-white truncate">{item.name}</p>
                <p className="text-white/60 text-xs mt-1">{item.category}</p>
                <p className="text-accent-gold font-medium mt-2">
                  ¥{item.price.toLocaleString()}
                </p>
              </div>

              {/* Shop Button */}
              <button
                onClick={() => onShowShopMap(item.item_id)}
                className="flex-shrink-0 w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Voice Hint */}
      <div className="px-6 mt-6">
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-white/60 text-xs">
            🎤 「店舗を探して」で近くの取扱店を検索できます
          </p>
        </div>
      </div>
    </div>
  );
}

