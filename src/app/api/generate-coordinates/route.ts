import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GenrePreview, GenreId, Gender } from "@/types";

const GENRES: { id: GenreId; name: string; tagline: string }[] = [
  { id: "casual", name: "カジュアル", tagline: "リラックスしたおしゃれスタイル" },
  { id: "business", name: "ビジネス", tagline: "できる大人の洗練スタイル" },
  { id: "street", name: "ストリート", tagline: "個性を表現するアーバンスタイル" },
  { id: "mode", name: "モード", tagline: "最先端のファッショントレンド" },
  { id: "elegant", name: "キレイめ", tagline: "上品で洗練された大人スタイル" },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gender, image_base64, mime_type } = body as {
      gender: Gender;
      image_id: string;
      image_base64: string;
      mime_type: string;
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "API key not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const genre_previews: GenrePreview[] = [];

    // Generate one representative coordinate for each genre
    for (const genre of GENRES) {
      const prompt = `あなたはファッションスタイリストです。
この写真の人物に似合う${gender === "mens" ? "メンズ" : "レディース"}の${genre.name}スタイルのコーディネートを考え、
その人物がそのコーディネートを着用しているイメージを生成してください。

重要な指示:
- 写真の人物の顔と体型を維持
- ${genre.name}スタイルに合った服装に変更
- 背景はおしゃれなファッション撮影風に
- 全身が見えるポーズで
- 高品質でリアルな画像

スタイルの特徴: ${genre.tagline}`;

      try {
        // Use Gemini's image generation capability
        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: mime_type,
              data: image_base64,
            },
          },
          { text: prompt },
        ]);

        const response = await result.response;
        const text = response.text();

        // For now, generate a placeholder since Gemini 2.0 Flash doesn't generate images directly
        // In production, you would use Imagen or another image generation API
        const coordinate_id = `coord-${genre.id}-${Date.now()}`;
        
        genre_previews.push({
          genre_id: genre.id,
          genre_name: genre.name,
          coordinate_id,
          cover_image: `/api/placeholder/${genre.id}`,
          preview_image_url: `/api/placeholder/${genre.id}`,
          tagline: text.slice(0, 100) || genre.tagline,
        });
      } catch (genError) {
        console.error(`Error generating ${genre.name}:`, genError);
        // Add placeholder on error
        genre_previews.push({
          genre_id: genre.id,
          genre_name: genre.name,
          coordinate_id: `coord-${genre.id}-${Date.now()}`,
          cover_image: `/api/placeholder/${genre.id}`,
          preview_image_url: `/api/placeholder/${genre.id}`,
          tagline: genre.tagline,
        });
      }
    }

    return NextResponse.json({
      success: true,
      genre_previews,
    });
  } catch (error) {
    console.error("Generate coordinates error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate coordinates" },
      { status: 500 }
    );
  }
}

