import { NextResponse } from "next/server";
import { serverLogger } from "@/lib/server-logger";

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY is not configured" },
      { status: 500 }
    );
  }

  if (!agentId) {
    return NextResponse.json(
      { error: "ELEVENLABS_AGENT_ID is not configured" },
      { status: 500 }
    );
  }

  try {
    // Get signed URL from ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      serverLogger.error("ElevenLabs API error:", error);
      return NextResponse.json(
        { error: "Failed to get signed URL" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (error) {
    serverLogger.error("Signed URL error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

