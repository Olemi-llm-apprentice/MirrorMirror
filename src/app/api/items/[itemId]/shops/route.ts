import { NextRequest, NextResponse } from "next/server";
import type { Shop } from "@/types";
import { serverLogger } from "@/lib/server-logger";

// Mock shop data - in production, this would query a real database
const MOCK_SHOPS: Shop[] = [
  {
    shop_id: "shop-1",
    name: "BEAMS 渋谷",
    address: "東京都渋谷区神宮前3-24-7",
    lat: 35.6706,
    lng: 139.7047,
    openingHours: "11:00-20:00",
  },
  {
    shop_id: "shop-2",
    name: "UNITED ARROWS 新宿",
    address: "東京都新宿区新宿3-14-1",
    lat: 35.6898,
    lng: 139.7006,
    openingHours: "11:00-21:00",
  },
  {
    shop_id: "shop-3",
    name: "SHIPS 銀座",
    address: "東京都中央区銀座6-9-5",
    lat: 35.6710,
    lng: 139.7641,
    openingHours: "11:00-20:00",
  },
  {
    shop_id: "shop-4",
    name: "JOURNAL STANDARD 表参道",
    address: "東京都港区北青山3-5-25",
    lat: 35.6656,
    lng: 139.7121,
    openingHours: "11:00-20:00",
  },
  {
    shop_id: "shop-5",
    name: "TOMORROWLAND 丸の内",
    address: "東京都千代田区丸の内2-7-2",
    lat: 35.6803,
    lng: 139.7634,
    openingHours: "11:00-20:00",
  },
];

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function calculateWalkingMinutes(distanceKm: number): number {
  // Assume walking speed of 4.5 km/h
  return Math.round((distanceKm / 4.5) * 60);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "35.658034");
    const lng = parseFloat(searchParams.get("lng") || "139.701636");
    
    await params; // Await the params promise

    // Calculate distance and walking time for each shop
    const shopsWithDistance: Shop[] = MOCK_SHOPS.map(shop => {
      const distance = calculateDistance(lat, lng, shop.lat, shop.lng);
      return {
        ...shop,
        distance: Math.round(distance * 100) / 100,
        walkingMinutes: calculateWalkingMinutes(distance),
      };
    });

    // Sort by distance
    shopsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return NextResponse.json({
      success: true,
      shops: shopsWithDistance,
    });
  } catch (error) {
    serverLogger.error("Get shops error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get shops" },
      { status: 500 }
    );
  }
}

