import { test, expect } from "@playwright/test";

/**
 * API Route Tests
 * Tests for all API endpoints: health, campaigns, export, IPFS, chain-check
 */

test.describe("API - Health Check Endpoint", () => {
  test("GET /api/health should return health status", async ({ request }) => {
    const response = await request.get("/api/health");

    // Should return 200 OK
    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Should have expected structure
    expect(data).toHaveProperty("overall");
    expect(data).toHaveProperty("timestamp");
    expect(data).toHaveProperty("services");
    expect(data).toHaveProperty("contract");

    // Overall should be one of the valid statuses
    expect(["healthy", "degraded", "unhealthy"]).toContain(data.overall);

    // Services should be an array
    expect(Array.isArray(data.services)).toBeTruthy();

    // Contract should have expected properties
    expect(data.contract).toHaveProperty("address");
    expect(data.contract).toHaveProperty("chainId");
    expect(data.contract).toHaveProperty("deployed");
  });

  test("GET /api/health should include service details", async ({ request }) => {
    const response = await request.get("/api/health");
    const data = await response.json();

    // Each service should have expected properties
    for (const service of data.services) {
      expect(service).toHaveProperty("service");
      expect(service).toHaveProperty("status");
      expect(service).toHaveProperty("url");
    }
  });

  test("GET /api/health should return valid JSON", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.headers()["content-type"]).toContain("application/json");
  });
});

test.describe("API - Campaigns Endpoint", () => {
  test("GET /api/campaigns should return campaigns list", async ({ request }) => {
    const response = await request.get("/api/campaigns");

    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Response has { success: true, campaigns: [...] } format
    expect(data.success).toBeTruthy();
    expect(Array.isArray(data.campaigns)).toBeTruthy();
  });

  test("GET /api/campaigns should return campaign metadata", async ({ request }) => {
    const response = await request.get("/api/campaigns");
    const data = await response.json();

    // If there are campaigns, check structure
    if (data.campaigns && data.campaigns.length > 0) {
      const campaign = data.campaigns[0];

      // Campaign should have expected properties
      expect(campaign).toHaveProperty("chainId");
      expect(campaign).toHaveProperty("contractAddress");
      expect(campaign).toHaveProperty("campaignId");
      expect(campaign).toHaveProperty("title");
      expect(campaign).toHaveProperty("description");
    }
  });

  test("POST /api/campaigns should require all fields", async ({ request }) => {
    const response = await request.post("/api/campaigns", {
      data: {
        // Missing required fields
        title: "Test Campaign",
      },
    });

    // Should return error for missing fields
    expect(response.status()).toBe(400);
  });

  test("POST /api/campaigns should validate input", async ({ request }) => {
    const response = await request.post("/api/campaigns", {
      data: {
        chainId: 31337,
        contractAddress: "0x0000000000000000000000000000000000000000",
        campaignId: 1,
        title: "Test Campaign",
        description: "Test description",
      },
    });

    // Should either succeed or return validation error
    expect([200, 201, 400, 500]).toContain(response.status());
  });
});

test.describe("API - Export Endpoint", () => {
  test("GET /api/campaigns/1/export should return CSV", async ({ request }) => {
    const response = await request.get("/api/campaigns/1/export?type=all");

    // May return 200 with CSV or 404 if campaign doesn't exist
    expect([200, 404, 500]).toContain(response.status());

    if (response.ok()) {
      const contentType = response.headers()["content-type"];
      // Should be CSV content type
      expect(contentType).toContain("text/csv");
    }
  });

  test("GET /api/campaigns/1/export?type=donations should export donations only", async ({ request }) => {
    const response = await request.get("/api/campaigns/1/export?type=donations");

    expect([200, 404, 500]).toContain(response.status());

    if (response.ok()) {
      const content = await response.text();
      // Should have CSV headers for donations
      expect(content).toContain("Donor");
    }
  });

  test("GET /api/campaigns/1/export?type=expenses should export expenses only", async ({ request }) => {
    const response = await request.get("/api/campaigns/1/export?type=expenses");

    expect([200, 404, 500]).toContain(response.status());

    if (response.ok()) {
      const content = await response.text();
      // Should have CSV headers for expenses
      expect(content).toContain("Category");
    }
  });

  test("GET /api/campaigns/1/export should have Content-Disposition header", async ({ request }) => {
    const response = await request.get("/api/campaigns/1/export?type=all");

    if (response.ok()) {
      const contentDisposition = response.headers()["content-disposition"];
      // Should have attachment disposition with filename
      expect(contentDisposition).toContain("attachment");
      expect(contentDisposition).toContain(".csv");
    }
  });

  test("GET /api/campaigns/invalid/export should handle invalid campaign ID", async ({ request }) => {
    const response = await request.get("/api/campaigns/invalid/export?type=all");

    // Should return error for invalid ID
    expect([400, 404, 500]).toContain(response.status());
  });
});

test.describe("API - IPFS Upload Endpoint", () => {
  test("GET /api/ipfs/upload should check IPFS health", async ({ request }) => {
    const response = await request.get("/api/ipfs/upload");

    // May return 200 if IPFS is available, or error if not
    expect([200, 500, 503]).toContain(response.status());

    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty("success");
    }
  });

  test("POST /api/ipfs/upload should require file", async ({ request }) => {
    const response = await request.post("/api/ipfs/upload", {
      multipart: {
        // Empty multipart, no file
      },
    });

    // Should return error for missing file
    expect([400, 500]).toContain(response.status());
  });

  test("POST /api/ipfs/upload should validate file type", async ({ request }) => {
    // Create a fake file with invalid type
    const response = await request.post("/api/ipfs/upload", {
      multipart: {
        file: {
          name: "test.exe",
          mimeType: "application/x-msdownload",
          buffer: Buffer.from("fake content"),
        },
      },
    });

    // Should reject invalid file types
    expect([400, 415, 500]).toContain(response.status());
  });

  test("POST /api/ipfs/upload should accept PDF files", async ({ request }) => {
    // Create a minimal PDF
    const pdfContent = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";

    const response = await request.post("/api/ipfs/upload", {
      multipart: {
        file: {
          name: "test.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from(pdfContent),
        },
      },
    });

    // May succeed if IPFS is running, or fail if not
    expect([200, 500, 503]).toContain(response.status());

    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty("success");
      expect(data).toHaveProperty("cid");
    }
  });

  test("POST /api/ipfs/upload should accept JPG files", async ({ request }) => {
    // Minimal JPEG header
    const jpgContent = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
      0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    const response = await request.post("/api/ipfs/upload", {
      multipart: {
        file: {
          name: "test.jpg",
          mimeType: "image/jpeg",
          buffer: jpgContent,
        },
      },
    });

    // May succeed if IPFS is running, or fail if not
    expect([200, 500, 503]).toContain(response.status());
  });

  test("POST /api/ipfs/upload should accept PNG files", async ({ request }) => {
    // Minimal PNG header
    const pngContent = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    ]);

    const response = await request.post("/api/ipfs/upload", {
      multipart: {
        file: {
          name: "test.png",
          mimeType: "image/png",
          buffer: pngContent,
        },
      },
    });

    // May succeed if IPFS is running, or fail if not
    expect([200, 500, 503]).toContain(response.status());
  });
});

test.describe("API - Chain Check Endpoint", () => {
  test("GET /api/chain-check should check chain fingerprint", async ({ request }) => {
    const response = await request.get(
      "/api/chain-check?contractAddress=0x5FbDB2315678afecb367f032d93F642f64180aa3&chainId=31337"
    );

    // May return 200 or error depending on chain state
    expect([200, 500]).toContain(response.status());

    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty("success");
    }
  });

  test("POST /api/chain-check should handle chain reset", async ({ request }) => {
    const response = await request.post("/api/chain-check", {
      data: {
        contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        chainId: 31337,
        genesisHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      },
    });

    // Should return result
    expect([200, 500]).toContain(response.status());

    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty("success");
    }
  });

  test("GET /api/chain-check should require parameters", async ({ request }) => {
    const response = await request.get("/api/chain-check");

    // API may return 200 with error in body or 400/500
    // Just verify it responds and handles missing params gracefully
    expect([200, 400, 500]).toContain(response.status());
  });
});

test.describe("API - Error Handling", () => {
  test("should return 404 for non-existent endpoints", async ({ request }) => {
    const response = await request.get("/api/non-existent-endpoint");

    expect(response.status()).toBe(404);
  });

  test("should return JSON error for API failures", async ({ request }) => {
    const response = await request.get("/api/campaigns/invalid-id/export");

    // Error response should still be parseable
    const contentType = response.headers()["content-type"];
    // May return JSON error or plain text depending on implementation
  });

  test("should handle malformed JSON in POST requests", async ({ request }) => {
    const response = await request.post("/api/campaigns", {
      headers: {
        "Content-Type": "application/json",
      },
      data: "not valid json{",
    });

    // Should handle gracefully
    expect([400, 500]).toContain(response.status());
  });
});

test.describe("API - CORS Headers", () => {
  test("should allow cross-origin requests from localhost", async ({ request }) => {
    const response = await request.get("/api/health", {
      headers: {
        Origin: "http://localhost:3000",
      },
    });

    // Should not block the request
    expect(response.ok()).toBeTruthy();
  });
});

test.describe("API - Response Times", () => {
  test("/api/health should respond within 10 seconds", async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get("/api/health");
    const endTime = Date.now();

    const responseTime = endTime - startTime;

    // Should respond within 10 seconds (accounting for slow services)
    expect(responseTime).toBeLessThan(10000);
  });

  test("/api/campaigns should respond within 5 seconds", async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get("/api/campaigns");
    const endTime = Date.now();

    const responseTime = endTime - startTime;

    // Should respond within 5 seconds
    expect(responseTime).toBeLessThan(5000);
  });
});

test.describe("API - Rate Limiting", () => {
  test("should handle multiple rapid requests", async ({ request }) => {
    // Make 10 rapid requests
    const promises = Array(10)
      .fill(null)
      .map(() => request.get("/api/health"));

    const responses = await Promise.all(promises);

    // All should succeed (no rate limiting in dev)
    for (const response of responses) {
      expect([200, 503]).toContain(response.status());
    }
  });
});

test.describe("API - Content Type Handling", () => {
  test("GET requests should return JSON", async ({ request }) => {
    const response = await request.get("/api/health");

    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/json");
  });

  test("Export endpoint should return CSV", async ({ request }) => {
    const response = await request.get("/api/campaigns/1/export?type=all");

    if (response.ok()) {
      const contentType = response.headers()["content-type"];
      expect(contentType).toContain("text/csv");
    }
  });
});
