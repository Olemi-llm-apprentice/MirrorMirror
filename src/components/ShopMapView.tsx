"use client";

import type { Shop, Location } from "@/types";

interface ShopMapViewProps {
  shops: Shop[];
  userLocation: Location | null;
  onBack: () => void;
}

export function ShopMapView({ shops, userLocation, onBack }: ShopMapViewProps) {
  const openMaps = (shop: Shop) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`;
    window.open(url, "_blank");
  };

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
        <h2 className="font-display text-3xl text-gradient mb-2">NEARBY SHOPS</h2>
        <p className="text-white/60 text-sm">
          {shops.length}店舗が見つかりました
        </p>
      </div>

      {/* Map Placeholder */}
      <div className="px-6 mb-6">
        <div className="relative rounded-2xl overflow-hidden h-48 glass">
          {/* Map Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary to-primary-light" />
          
          {/* Grid Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Shop Markers */}
          {shops.slice(0, 5).map((shop, i) => (
            <div
              key={shop.shop_id}
              className="absolute"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 20}%`,
              }}
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-accent-rose flex items-center justify-center shadow-lg animate-bounce"
                     style={{ animationDelay: `${i * 100}ms` }}>
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-accent-rose transform rotate-45 -mt-1" />
              </div>
            </div>
          ))}

          {/* User Location */}
          {userLocation && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-4 h-4 rounded-full bg-accent-cyan border-2 border-white shadow-lg">
                <div className="absolute inset-0 rounded-full bg-accent-cyan animate-ping opacity-50" />
              </div>
            </div>
          )}

          {/* Open in Maps Button */}
          <button
            onClick={() => shops[0] && openMaps(shops[0])}
            className="absolute bottom-4 right-4 glass px-4 py-2 rounded-xl text-sm text-white flex items-center gap-2 hover:bg-white/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            地図アプリで開く
          </button>
        </div>
      </div>

      {/* Shop List */}
      <div className="flex-1 px-6 overflow-y-auto">
        <h3 className="text-white/60 text-sm mb-4 uppercase tracking-wider">
          店舗一覧
        </h3>
        <div className="space-y-4">
          {shops.map((shop, index) => (
            <button
              key={shop.shop_id}
              onClick={() => openMaps(shop)}
              className="w-full card-interactive animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                {/* Number Badge */}
                <div className="w-10 h-10 rounded-xl bg-accent-rose/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-lg text-accent-rose">{index + 1}</span>
                </div>

                {/* Shop Info */}
                <div className="flex-1 text-left">
                  <p className="font-medium text-white">{shop.name}</p>
                  <p className="text-white/60 text-sm mt-1">{shop.address}</p>
                  {shop.openingHours && (
                    <p className="text-white/40 text-xs mt-1">
                      営業時間: {shop.openingHours}
                    </p>
                  )}
                </div>

                {/* Distance */}
                <div className="text-right flex-shrink-0">
                  {shop.walkingMinutes && (
                    <div className="flex items-center gap-1 text-accent-cyan">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span className="text-sm font-medium">徒歩{shop.walkingMinutes}分</span>
                    </div>
                  )}
                  {shop.distance && (
                    <p className="text-white/40 text-xs mt-1">
                      約{shop.distance}km
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Voice Hint */}
      <div className="px-6 mt-6">
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-white/60 text-xs">
            🎤 「戻って」で前の画面に戻ります
          </p>
        </div>
      </div>
    </div>
  );
}

