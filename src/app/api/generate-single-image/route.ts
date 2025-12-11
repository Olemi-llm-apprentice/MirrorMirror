import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";
import type { GenreId, Gender } from "@/types";
import { serverLogger } from "@/lib/server-logger";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

export const maxDuration = 60; // Allow up to 60 seconds for image generation

// Ensure generated images directory exists
const GENERATED_IMAGES_DIR = path.join(process.cwd(), "generated-images");
if (!fs.existsSync(GENERATED_IMAGES_DIR)) {
  fs.mkdirSync(GENERATED_IMAGES_DIR, { recursive: true });
}

// Ensure API requests log directory exists
const API_REQUESTS_DIR = path.join(process.cwd(), "generated-images", "api-requests");
if (!fs.existsSync(API_REQUESTS_DIR)) {
  fs.mkdirSync(API_REQUESTS_DIR, { recursive: true });
}

// Helper function to save API request as JSON for debugging
function saveApiRequest(
  genreId: string,
  requestData: {
    genre_id: string;
    gender: string;
    user_image_provided: boolean;
    user_image_base64_length: number | null;
    user_image_mime_type: string | null;
    user_image_base64_preview: string | null;
    test_image_filename: string;
    test_image_base64_length: number;
    prompt: string;
    contents_structure: Array<{ type: string; mimeType?: string; dataLength?: number }>;
  }
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const uuid = randomUUID().slice(0, 8);
  const filename = `request_${genreId}_${timestamp}_${uuid}.json`;
  const filepath = path.join(API_REQUESTS_DIR, filename);
  
  const fullData = {
    timestamp: new Date().toISOString(),
    ...requestData,
  };
  
  fs.writeFileSync(filepath, JSON.stringify(fullData, null, 2), "utf-8");
  serverLogger.info(`Saved API request log: ${filename}`);
  return filename;
}

// Helper function to save generated image locally
function saveGeneratedImage(base64: string, mimeType: string, genreId: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const uuid = randomUUID().slice(0, 8);
  const extension = mimeType.includes("png") ? "png" : "jpg";
  const filename = `${genreId}_${timestamp}_${uuid}.${extension}`;
  const filepath = path.join(GENERATED_IMAGES_DIR, filename);
  
  const imageBuffer = Buffer.from(base64, "base64");
  fs.writeFileSync(filepath, imageBuffer);
  
  serverLogger.info(`Saved generated image: ${filename}`);
  return filename;
}

// Test images mapping
const TEST_IMAGES: Record<GenreId, string> = {
  casual: "1762129948_1000.png",
  business: "1762530288_1000.png",
  street: "1763547925_1000.png",
  mode: "1763638039_1000.png",
  elegant: "406ac5fc-0cfc-4351-bee5-c03c7f640085.jpg",
};

const GENRE_INFO: Record<GenreId, { name: string; tagline: string }> = {
  casual: { name: "カジュアル", tagline: "リラックスしたおしゃれスタイル" },
  business: { name: "ビジネス", tagline: "できる大人の洗練スタイル" },
  street: { name: "ストリート", tagline: "個性を表現するアーバンスタイル" },
  mode: { name: "モード", tagline: "最先端のファッショントレンド" },
  elegant: { name: "キレイめ", tagline: "上品で洗練された大人スタイル" },
};

interface GenerateSingleImageRequest {
  genre_id: GenreId;
  gender: Gender;
  user_image_base64?: string;
  user_image_mime_type?: string;
}

// Helper function to read and encode image
function readTestImage(filename: string): { base64: string; mimeType: string } | null {
  try {
    const imagePath = path.join(process.cwd(), "public", "test-images", filename);
    if (fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64 = imageBuffer.toString("base64");
      const mimeType = filename.endsWith(".png") ? "image/png" : "image/jpeg";
      return { base64, mimeType };
    }
  } catch (error) {
    serverLogger.error(`Error reading test image ${filename}:`, error);
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateSingleImageRequest = await request.json();
    const { genre_id, gender, user_image_base64, user_image_mime_type } = body;

    // Debug: Log received data
    serverLogger.info(`=== API Request for ${genre_id} ===`);
    serverLogger.info(`Gender: ${gender}`);
    serverLogger.info(`User image provided: ${!!user_image_base64}`);
    serverLogger.info(`User image mime type: ${user_image_mime_type || "none"}`);
    if (user_image_base64) {
      serverLogger.info(`User image base64 length: ${user_image_base64.length}`);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const testImageFilename = TEST_IMAGES[genre_id];
    const genreInfo = GENRE_INFO[genre_id];

    if (!testImageFilename || !genreInfo) {
      return NextResponse.json(
        { success: false, error: "Invalid genre_id" },
        { status: 400 }
      );
    }

    // Read the source test image
    const testImage = readTestImage(testImageFilename);
    if (!testImage) {
      return NextResponse.json(
        { success: false, error: "Source image not found" },
        { status: 404 }
      );
    }

    // Use new @google/genai SDK with gemini-2.5-flash-image model
    const client = new GoogleGenAI({ apiKey });

    // Build the prompt based on whether user image is provided
    let prompt: string;
    
    if (user_image_base64 && user_image_mime_type) {
      // Virtual try-on: Apply coordinate outfit to user's body
      prompt = `バーチャル試着画像を生成してください。
【1枚目の画像】ユーザーの写真です。この人物の顔と体型を使用します。
【2枚目の画像】コーディネート参照画像です。この服装をそのまま使用します。
重要な指示:
ユーザーの顔、髪型、体型をそのまま維持してください
コーディネート参照画像の服装（トップス、ボトムス、靴、アクセサリー等）を完全に再現してください
服のデザイン、色、柄、素材感を変えないでください
ユーザーがその服を実際に着ているようなリアルな合成画像を作成してください
全身が見えるポーズで、おしゃれなファッション撮影風の背景にしてください
高品質でリアルな画像を生成してください
服装は絶対に変更せず、ユーザーの体にフィットするように調整してください。
【1枚目の画像】ユーザーの写真です。この人物の顔と体型を必ず保持するようにしてください。`;
    }

    // Build contents array
    const contents: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];

    // Add user image first if provided (for personalization)
    if (user_image_base64 && user_image_mime_type) {
      contents.push({
        inlineData: {
          mimeType: user_image_mime_type,
          data: user_image_base64,
        },
      });
    }

    // Add source/reference image
    contents.push({
      inlineData: {
        mimeType: testImage.mimeType,
        data: testImage.base64,
      },
    });

    contents.push({ text: prompt });

    // Save API request to JSON for debugging
    const contentsStructure = contents.map((item) => {
      if ("text" in item) {
        return { type: "text" };
      } else {
        return {
          type: "inlineData",
          mimeType: item.inlineData.mimeType,
          dataLength: item.inlineData.data.length,
        };
      }
    });

    saveApiRequest(genre_id, {
      genre_id,
      gender,
      user_image_provided: !!(user_image_base64 && user_image_mime_type),
      user_image_base64_length: user_image_base64 ? user_image_base64.length : null,
      user_image_mime_type: user_image_mime_type || null,
      user_image_base64_preview: user_image_base64 ? user_image_base64.slice(0, 200) + "..." : null,
      test_image_filename: testImageFilename,
      test_image_base64_length: testImage.base64.length,
      prompt,
      contents_structure: contentsStructure,
    });

    serverLogger.info(`Generating AI image for ${genreInfo.name} using gemini-2.5-flash-image...`);

    // Call Gemini 2.5 Flash Image model (nanobanana)
    // temperature低めで一貫性を向上
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: contents,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
        temperature: 0.4, // 低めの温度で一貫性を向上
      },
    });

    // Extract generated image from response
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64 = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || "image/png";
          
          // Save generated image locally
          const savedFilename = saveGeneratedImage(base64 || "", mimeType, genre_id);
          
          serverLogger.info(`Successfully generated AI image for ${genreInfo.name}, saved as ${savedFilename}`);
          
          return NextResponse.json({
            success: true,
            genre_id,
            generated_image: {
              base64,
              mime_type: mimeType,
              data_url: `data:${mimeType};base64,${base64}`,
              saved_filename: savedFilename,
            },
          });
        }
      }
    }

    // No image generated - check for text response
    let textContent = "";
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          textContent += part.text;
        }
      }
    }
    
    serverLogger.warn(`No image generated for ${genreInfo.name}, text response:`, textContent);

    return NextResponse.json({
      success: false,
      genre_id,
      error: "画像の生成に失敗しました",
      text_response: textContent,
    });
  } catch (error) {
    serverLogger.error("Generate single image error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate image",
      },
      { status: 500 }
    );
  }
}
