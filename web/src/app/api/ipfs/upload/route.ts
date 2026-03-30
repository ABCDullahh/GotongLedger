import { NextRequest, NextResponse } from "next/server";
import { create } from "kubo-rpc-client";
import { checkRateLimit } from "@/lib/rate-limit";

const IPFS_API_URL = process.env.IPFS_API_URL || "http://127.0.0.1:5001";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

interface UploadResponse {
  success: boolean;
  cid?: string;
  size?: number;
  mimeType?: string;
  fileName?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  // Rate limit: 10 uploads per minute per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const { allowed } = checkRateLimit(ip, 10, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Too many uploads. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Allowed: PDF, JPG, PNG. Got: ${file.type}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Create IPFS client
    let client;
    try {
      client = create({ url: IPFS_API_URL });
      // Test connection
      await client.id();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "IPFS node not available. Please run: pnpm ipfs:up",
        },
        { status: 503 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to IPFS
    const result = await client.add(buffer, {
      pin: true,
    });

    // Sanitize filename to prevent path traversal or injection
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    return NextResponse.json({
      success: true,
      cid: result.cid.toString(),
      size: file.size,
      mimeType: file.type,
      fileName: sanitizedFileName,
    });
  } catch (error) {
    console.error("IPFS upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(): Promise<NextResponse> {
  try {
    const client = create({ url: IPFS_API_URL });
    const id = await client.id();

    return NextResponse.json({
      success: true,
      nodeId: id.id.toString(),
      agentVersion: id.agentVersion,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "IPFS node not available",
      },
      { status: 503 }
    );
  }
}
