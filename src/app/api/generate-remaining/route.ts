import { NextRequest, NextResponse } from "next/server";
import type { Coordinate, GenreId, Item } from "@/types";
import { serverLogger } from "@/lib/server-logger";

// Mock data for demonstration - in production, this would use actual AI generation
const MOCK_ITEMS: Record<string, Item[]> = {
  casual: [
    { item_id: "item-1", name: "オーバーサイズTシャツ", brand: "UNIQLO", price: 1990, image_url: "/items/tshirt.jpg", category: "トップス" },
    { item_id: "item-2", name: "デニムパンツ", brand: "Levi's", price: 12000, image_url: "/items/denim.jpg", category: "ボトムス" },
    { item_id: "item-3", name: "スニーカー", brand: "New Balance", price: 15000, image_url: "/items/sneakers.jpg", category: "シューズ" },
    { item_id: "item-4", name: "キャップ", brand: "Nike", price: 4500, image_url: "/items/cap.jpg", category: "アクセサリー" },
  ],
  business: [
    { item_id: "item-5", name: "テーラードジャケット", brand: "Theory", price: 45000, image_url: "/items/jacket.jpg", category: "アウター" },
    { item_id: "item-6", name: "ドレスシャツ", brand: "鎌倉シャツ", price: 8000, image_url: "/items/shirt.jpg", category: "トップス" },
    { item_id: "item-7", name: "スラックス", brand: "ZARA", price: 7990, image_url: "/items/slacks.jpg", category: "ボトムス" },
    { item_id: "item-8", name: "レザーシューズ", brand: "REGAL", price: 25000, image_url: "/items/leather-shoes.jpg", category: "シューズ" },
  ],
  street: [
    { item_id: "item-9", name: "パーカー", brand: "Supreme", price: 28000, image_url: "/items/hoodie.jpg", category: "トップス" },
    { item_id: "item-10", name: "カーゴパンツ", brand: "Carhartt WIP", price: 18000, image_url: "/items/cargo.jpg", category: "ボトムス" },
    { item_id: "item-11", name: "ハイカットスニーカー", brand: "Jordan", price: 22000, image_url: "/items/jordans.jpg", category: "シューズ" },
    { item_id: "item-12", name: "ビーニー", brand: "Stussy", price: 5500, image_url: "/items/beanie.jpg", category: "アクセサリー" },
  ],
  mode: [
    { item_id: "item-13", name: "オーバーサイズコート", brand: "COMME des GARÇONS", price: 120000, image_url: "/items/coat.jpg", category: "アウター" },
    { item_id: "item-14", name: "アシンメトリーシャツ", brand: "Yohji Yamamoto", price: 45000, image_url: "/items/mode-shirt.jpg", category: "トップス" },
    { item_id: "item-15", name: "ワイドパンツ", brand: "Issey Miyake", price: 55000, image_url: "/items/wide-pants.jpg", category: "ボトムス" },
    { item_id: "item-16", name: "プラットフォームシューズ", brand: "Rick Owens", price: 150000, image_url: "/items/platform.jpg", category: "シューズ" },
  ],
  elegant: [
    { item_id: "item-17", name: "カシミアニット", brand: "LORO PIANA", price: 180000, image_url: "/items/cashmere.jpg", category: "トップス" },
    { item_id: "item-18", name: "テーパードパンツ", brand: "MaxMara", price: 65000, image_url: "/items/tapered.jpg", category: "ボトムス" },
    { item_id: "item-19", name: "レザーハンドバッグ", brand: "Bottega Veneta", price: 350000, image_url: "/items/bag.jpg", category: "バッグ" },
    { item_id: "item-20", name: "ポインテッドトゥパンプス", brand: "Jimmy Choo", price: 95000, image_url: "/items/pumps.jpg", category: "シューズ" },
  ],
};

const COORDINATE_NAMES = [
  "デイリーリラックス",
  "ウィークエンドモード",
  "アクティブデイ",
  "シティウォーク",
  "スペシャルアウト",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { genre_id } = body as {
      genre_id: GenreId;
      image_id: string;
      gender: string;
    };

    // Generate 5 coordinate variations for the selected genre
    const items = MOCK_ITEMS[genre_id] || MOCK_ITEMS.casual;
    
    const coordinates: Coordinate[] = COORDINATE_NAMES.map((name, index) => ({
      coordinate_id: `coord-${genre_id}-${index}-${Date.now()}`,
      name: `${name} #${index + 1}`,
      genre_id,
      image_url: `/api/placeholder/${genre_id}/${index}`,
      items: items.map((item, i) => ({
        ...item,
        item_id: `${item.item_id}-${index}`,
        // Slightly vary prices for different coordinates
        price: Math.round(item.price * (0.9 + Math.random() * 0.2)),
      })),
      description: `${genre_id === "casual" ? "カジュアル" : 
                     genre_id === "business" ? "ビジネス" : 
                     genre_id === "street" ? "ストリート" : 
                     genre_id === "mode" ? "モード" : "キレイめ"}スタイルのコーディネート #${index + 1}`,
    }));

    return NextResponse.json({
      success: true,
      coordinates,
    });
  } catch (error) {
    serverLogger.error("Generate remaining error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate coordinates" },
      { status: 500 }
    );
  }
}

