import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cid = searchParams.get("cid");

  if (!cid) {
    return NextResponse.json(
      { verified: false, error: "No CID provided" },
      { status: 400 }
    );
  }

  // Validate CID format to prevent path traversal
  if (!/^[a-zA-Z0-9]+$/.test(cid)) {
    return NextResponse.json(
      { verified: false, error: "Invalid CID format" },
      { status: 400 }
    );
  }

  try {
    // Try to fetch from local IPFS gateway
    const gatewayUrl = process.env.IPFS_GATEWAY_URL || "http://127.0.0.1:8080";
    const response = await fetch(`${gatewayUrl}/ipfs/${cid}`, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    return NextResponse.json({
      verified: response.ok,
      status: response.status,
      contentType: response.headers.get("content-type"),
      contentLength: response.headers.get("content-length"),
      gateway: gatewayUrl,
    });
  } catch {
    return NextResponse.json({
      verified: false,
      error: "IPFS gateway unreachable",
    });
  }
}
