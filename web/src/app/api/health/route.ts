import { NextResponse } from "next/server";
import { CAMPAIGN_LEDGER_ADDRESS, CHAIN_ID } from "@/lib/contracts";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";
const IPFS_API_URL = process.env.IPFS_API_URL || "http://127.0.0.1:5001";
const IPFS_GATEWAY_URL = process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || "http://127.0.0.1:8080";

interface HealthStatus {
  service: string;
  status: "healthy" | "unhealthy" | "unknown";
  latency?: number;
  message?: string;
  url?: string;
}

interface HealthResponse {
  overall: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: HealthStatus[];
  contract: {
    address: string;
    chainId: number;
    deployed: boolean;
  };
}

async function checkService(
  name: string,
  url: string,
  timeout = 5000
): Promise<HealthStatus> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Determine if we need POST (for JSON-RPC calls)
    const needsPost = name === "IPFS API" || name === "Hardhat RPC";

    const response = await fetch(url, {
      method: needsPost ? "POST" : "GET",
      signal: controller.signal,
      ...(name === "IPFS API" && {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: 1, jsonrpc: "2.0", method: "id", params: [] }),
      }),
      ...(name === "Hardhat RPC" && {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "eth_chainId",
          params: [],
        }),
      }),
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - start;

    if (response.ok) {
      return {
        service: name,
        status: "healthy",
        latency,
        url,
        message: `Responding in ${latency}ms`,
      };
    } else {
      return {
        service: name,
        status: "unhealthy",
        latency,
        url,
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    const latency = Date.now() - start;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("abort")) {
      return {
        service: name,
        status: "unhealthy",
        latency,
        url,
        message: `Timeout after ${timeout}ms`,
      };
    }

    return {
      service: name,
      status: "unhealthy",
      latency,
      url,
      message: errorMessage.includes("ECONNREFUSED")
        ? "Connection refused - service not running"
        : errorMessage,
    };
  }
}

async function checkContract(): Promise<boolean> {
  try {
    const response = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "eth_getCode",
        params: [CAMPAIGN_LEDGER_ADDRESS, "latest"],
      }),
    });

    const data = await response.json();
    // Check if contract has bytecode (not just "0x")
    return data.result && data.result !== "0x" && data.result.length > 2;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const [rpcStatus, ipfsApiStatus, ipfsGatewayStatus, contractDeployed] =
      await Promise.all([
        checkService("Hardhat RPC", RPC_URL),
        checkService("IPFS API", `${IPFS_API_URL}/api/v0/id`),
        checkService(
          "IPFS Gateway",
          `${IPFS_GATEWAY_URL}/ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn`
        ),
        checkContract(),
      ]);

    const services = [rpcStatus, ipfsApiStatus, ipfsGatewayStatus];

    // Determine overall status
    const healthyCount = services.filter((s) => s.status === "healthy").length;
    let overall: "healthy" | "degraded" | "unhealthy";

    if (healthyCount === services.length && contractDeployed) {
      overall = "healthy";
    } else if (healthyCount > 0) {
      overall = "degraded";
    } else {
      overall = "unhealthy";
    }

    const response: HealthResponse = {
      overall,
      timestamp: new Date().toISOString(),
      services,
      contract: {
        address: CAMPAIGN_LEDGER_ADDRESS,
        chainId: CHAIN_ID,
        deployed: contractDeployed,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        overall: "unhealthy",
        timestamp: new Date().toISOString(),
        services: [],
        contract: {
          address: CAMPAIGN_LEDGER_ADDRESS,
          chainId: CHAIN_ID,
          deployed: false,
        },
        error: "Health check failed",
      },
      { status: 500 }
    );
  }
}
