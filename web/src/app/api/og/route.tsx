import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // Truncate inputs to prevent abuse
  const title = (searchParams.get("title") || "GotongLedger").slice(0, 100);
  const raised = (searchParams.get("raised") || "0").slice(0, 20);
  const donors = (searchParams.get("donors") || "0").slice(0, 10);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200",
          height: "630",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          backgroundColor: "#131314",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "linear-gradient(rgba(255,179,174,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,179,174,0.04) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Top-left radial gradient accent */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,85,85,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Bottom-right radial gradient accent */}
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            right: "-150px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(174,209,141,0.06) 0%, transparent 70%)",
          }}
        />

        {/* Top section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            position: "relative",
          }}
        >
          {/* Tagline */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#AED18D",
              }}
            />
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase" as const,
                color: "#FFB3AE",
              }}
            >
              RADICAL TRANSPARENCY BY DESIGN
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: title.length > 30 ? "52px" : "64px",
              fontWeight: 900,
              color: "#E5E2E3",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              margin: 0,
              maxWidth: "900px",
            }}
          >
            {title}
          </h1>

          {/* Accent line */}
          <div
            style={{
              display: "flex",
              width: "120px",
              height: "4px",
              background: "linear-gradient(to right, #FF5555, #FFB3AE)",
              borderRadius: "2px",
            }}
          />
        </div>

        {/* Bottom section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            position: "relative",
          }}
        >
          {/* Stats */}
          <div style={{ display: "flex", gap: "60px" }}>
            {/* Raised */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase" as const,
                  color: "#AA8986",
                }}
              >
                TOTAL RAISED
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "42px",
                    fontWeight: 900,
                    color: "#AED18D",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {raised}
                </span>
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: 500,
                    color: "#AA8986",
                  }}
                >
                  ETH
                </span>
              </div>
            </div>

            {/* Donors */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase" as const,
                  color: "#AA8986",
                }}
              >
                DONORS
              </span>
              <span
                style={{
                  fontSize: "42px",
                  fontWeight: 900,
                  color: "#E5E2E3",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {donors}
              </span>
            </div>
          </div>

          {/* Branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {/* Logo mark */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "4px",
                background: "linear-gradient(135deg, #FF5555, #FFB3AE)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "#131314",
                }}
              >
                G
              </span>
            </div>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 900,
                color: "#FFB3AE",
                letterSpacing: "-0.03em",
              }}
            >
              GotongLedger
            </span>
          </div>
        </div>

        {/* Border accent - left edge */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "4px",
            height: "100%",
            background: "linear-gradient(to bottom, #FF5555, transparent, #AED18D)",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
