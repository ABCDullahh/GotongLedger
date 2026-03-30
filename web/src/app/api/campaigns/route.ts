import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    const campaigns = await prisma.campaignMetadata.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, campaigns });
  } catch (error) {
    console.error("Failed to get campaigns:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Rate limit: 20 writes per minute per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const { allowed } = checkRateLimit(ip, 20, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { chainId, contractAddress, campaignId, title, description, location, coverImage, category } = body;

    if (!chainId || !contractAddress || !campaignId || !title) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaignMetadata.upsert({
      where: {
        chainId_contractAddress_campaignId: {
          chainId: Number(chainId),
          contractAddress,
          campaignId: Number(campaignId),
        },
      },
      update: {
        title,
        description: description || "",
        category: category || "Other",
        location: location || null,
        coverImage: coverImage || null,
      },
      create: {
        chainId: Number(chainId),
        contractAddress,
        campaignId: Number(campaignId),
        title,
        description: description || "",
        category: category || "Other",
        location: location || null,
        coverImage: coverImage || null,
      },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("Failed to save campaign:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save campaign" },
      { status: 500 }
    );
  }
}
