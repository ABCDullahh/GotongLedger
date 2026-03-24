import { NextRequest, NextResponse } from "next/server";
import { handleChainReset, checkChainFingerprint } from "@/lib/fingerprint";

export async function POST(request: NextRequest) {
  try {
    // Handle empty body gracefully
    let body;
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }
    const { contractAddress, chainId, genesisHash } = body;

    if (!contractAddress || !chainId || !genesisHash) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate types
    if (typeof contractAddress !== "string" || typeof genesisHash !== "string" || typeof chainId !== "number") {
      return NextResponse.json(
        { success: false, error: "Invalid field types" },
        { status: 400 }
      );
    }

    // Validate Ethereum address format
    if (!/^0x[0-9a-fA-F]{40}$/.test(contractAddress)) {
      return NextResponse.json(
        { success: false, error: "Invalid contract address format" },
        { status: 400 }
      );
    }

    const wasReset = await handleChainReset(contractAddress, chainId, genesisHash);

    return NextResponse.json({
      success: true,
      wasReset,
      message: wasReset
        ? "Chain reset detected - metadata cleared"
        : "Chain fingerprint valid",
    });
  } catch (error) {
    console.error("Chain check failed:", error);
    return NextResponse.json(
      { success: false, error: "Chain check failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get("contractAddress") || "";
    const chainId = Number(searchParams.get("chainId") || "31337");

    const check = await checkChainFingerprint(contractAddress, chainId);

    return NextResponse.json({
      success: true,
      ...check,
    });
  } catch (error) {
    console.error("Chain check failed:", error);
    return NextResponse.json(
      { success: false, error: "Chain check failed" },
      { status: 500 }
    );
  }
}
