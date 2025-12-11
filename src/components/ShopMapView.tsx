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
        <h2 className="font-display text-3xl text-gray-800 mb-2">NEARBY SHOPS</h2>
        <p className="text-gray-600 text-sm">
          {shops.length} shops found
        </p>
      </div>

      {/* Map Placeholder */}
      <div className="px-6 mb-6">
        <div className="relative rounded-2xl overflow-hidden h-48 bg-gradient-to-br from-blue-100 to-green-100 shadow">
          {/* Grid Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5" />
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
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg animate-bounce"
                     style={{ animationDelay: `${i * 100}ms` }}>
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 transform rotate-45 -mt-1" />
              </div>
            </div>
          ))}

          {/* User Location */}
          {userLocation && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg">
                <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-50" />
              </div>
            </div>
          )}

          {/* Open in Maps Button */}
          <button
            onClick={() => shops[0] && openMaps(shops[0])}
            className="absolute bottom-4 right-4 bg-white/90 px-4 py-2 rounded-xl text-sm text-gray-800 flex items-center gap-2 hover:bg-white transition-colors shadow"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in Maps
          </button>
        </div>
      </div>

      {/* Shop List */}
      <div className="flex-1 px-6 overflow-y-auto">
        <h3 className="text-gray-600 text-sm mb-4 uppercase tracking-wider">
          Shop List
        </h3>
        <div className="space-y-4">
          {shops.map((shop, index) => (
            <button
              key={shop.shop_id}
              onClick={() => openMaps(shop)}
              className="w-full bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow hover:shadow-lg transition-shadow animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                {/* Number Badge */}
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-lg text-red-600">{index + 1}</span>
                </div>

                {/* Shop Info */}
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-800">{shop.name}</p>
                  <p className="text-gray-600 text-sm mt-1">{shop.address}</p>
                  {shop.openingHours && (
                    <p className="text-gray-500 text-xs mt-1">
                      Hours: {shop.openingHours}
                    </p>
                  )}
                </div>

                {/* Distance */}
                <div className="text-right flex-shrink-0">
                  {shop.walkingMinutes && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span className="text-sm font-medium">{shop.walkingMinutes} min walk</span>
                    </div>
                  )}
                  {shop.distance && (
                    <p className="text-gray-500 text-xs mt-1">
                      ~{shop.distance}km
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
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow">
          <p className="text-gray-600 text-xs">
            🎤 Say "Go back" to return to the previous screen
          </p>
        </div>
      </div>
    </div>
  );
}
