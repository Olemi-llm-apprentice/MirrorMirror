import { NextRequest, NextResponse } from "next/server";
import type { GenrePreview, GenreId, Gender } from "@/types";
import { serverLogger } from "@/lib/server-logger";

// Test images mapping - 5枚のテスト画像を各ジャンルに割り当て
const TEST_IMAGES = [
  "1762129948_1000.png",
  "1762530288_1000.png", 
  "1763547925_1000.png",
  "1763638039_1000.png",
  "406ac5fc-0cfc-4351-bee5-c03c7f640085.jpg",
];

const GENRES: { id: GenreId; name: string; tagline: string; testImageIndex: number }[] = [
  { id: "casual", name: "カジュアル", tagline: "リラックスしたおしゃれスタイル", testImageIndex: 0 },
  { id: "business", name: "ビジネス", tagline: "できる大人の洗練スタイル", testImageIndex: 1 },
  { id: "street", name: "ストリート", tagline: "個性を表現するアーバンスタイル", testImageIndex: 2 },
  { id: "mode", name: "モード", tagline: "最先端のファッショントレンド", testImageIndex: 3 },
  { id: "elegant", name: "キレイめ", tagline: "上品で洗練された大人スタイル", testImageIndex: 4 },
];

// Phase 1: Return original test images immediately (for fast initial display)
// Image generation will be triggered separately via /api/generate-single-image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gender } = body as {
      gender: Gender;
      image_id: string;
      image_base64: string;
      mime_type: string;
    };

    serverLogger.info(`Generating coordinates for ${gender}...`);

    const genre_previews: GenrePreview[] = [];

    // Return original test images immediately - AI generation will happen in frontend
    for (const genre of GENRES) {
      const testImageFilename = TEST_IMAGES[genre.testImageIndex];
      const originalImageUrl = `/test-images/${testImageFilename}`;
      const coordinate_id = `coord-${genre.id}-${Date.now()}`;

      genre_previews.push({
        genre_id: genre.id,
        genre_name: genre.name,
        coordinate_id,
        cover_image: originalImageUrl,
        preview_image_url: originalImageUrl,
        tagline: genre.tagline,
        // Progressive loading fields
        original_image_url: originalImageUrl,
        generated_image_url: undefined, // Will be filled after AI generation
        is_generating: true, // Mark as generating - frontend will trigger generation
      });
    }

    serverLogger.info(`Returning ${genre_previews.length} genre previews with original images`);

    return NextResponse.json({
      success: true,
      genre_previews,
    });
  } catch (error) {
    serverLogger.error("Generate coordinates error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate coordinates" },
      { status: 500 }
    );
  }
}

