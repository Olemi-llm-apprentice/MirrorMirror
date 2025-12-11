import { NextRequest, NextResponse } from "next/server";

// Dynamic placeholder image generation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  
  // Generate different colors based on path
  const colors: Record<string, string> = {
    casual: "4A90D9",
    business: "2C3E50",
    street: "E74C3C",
    mode: "1A1A1A",
    elegant: "8E44AD",
  };
  
  const genre = path[0] || "casual";
  const color = colors[genre] || "4A90D9";
  const index = path[1] || "0";
  
  // Redirect to a placeholder service or return SVG
  const svg = `
    <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#${color}88;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" 
            font-family="sans-serif" font-size="24" fill="white" opacity="0.8">
        ${genre.toUpperCase()}
      </text>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" 
            font-family="sans-serif" font-size="18" fill="white" opacity="0.6">
        Style #${parseInt(index) + 1}
      </text>
    </svg>
  `.trim();

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

