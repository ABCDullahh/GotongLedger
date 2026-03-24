import { NextRequest, NextResponse } from "next/server";
import { getDonationLogs, getExpenseLogs, getCampaignCreatedLogs } from "@/lib/blockchain";
import { formatEther } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

function escapeCSV(value: string): string {
  // Escape double quotes and wrap in quotes if contains comma, quote, or newline
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Validate campaign ID is a valid number
    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid campaign ID" },
        { status: 400 }
      );
    }

    const campaignId = BigInt(id);
    const type = request.nextUrl.searchParams.get("type") || "all";

    // Validate export type
    if (!["all", "donations", "expenses"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid export type. Must be 'all', 'donations', or 'expenses'" },
        { status: 400 }
      );
    }

    // Fetch campaign data
    const [campaigns, donations, expenses] = await Promise.all([
      getCampaignCreatedLogs(),
      getDonationLogs(campaignId),
      getExpenseLogs(campaignId),
    ]);

    const campaign = campaigns.find((c) => c.campaignId === campaignId);

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Fetch metadata
    const baseUrl = request.nextUrl.origin;
    const metaRes = await fetch(`${baseUrl}/api/campaigns`);
    const metaData = await metaRes.json();
    const meta = metaData.campaigns?.find(
      (c: { campaignId: number }) => c.campaignId === Number(campaignId)
    );

    const campaignTitle = meta?.title || `Campaign #${id}`;
    const now = new Date().toISOString().split("T")[0];

    let csvContent = "";
    let filename = "";

    if (type === "donations" || type === "all") {
      // Donations CSV
      const donationsCSV = [
        ["Donor Address", "Amount (ETH)", "Amount (Wei)", "Timestamp", "Block Number", "Transaction Hash"].join(","),
        ...donations.map((d) =>
          [
            d.from,
            formatEther(d.amountWei),
            d.amountWei.toString(),
            formatTimestamp(Number(d.timestamp)),
            d.blockNumber.toString(),
            d.transactionHash,
          ]
            .map(escapeCSV)
            .join(",")
        ),
      ].join("\n");

      if (type === "donations") {
        csvContent = donationsCSV;
        filename = `${campaignTitle.replace(/[^a-zA-Z0-9]/g, "_")}_donations_${now}.csv`;
      } else {
        csvContent += `# DONATIONS\n${donationsCSV}\n\n`;
      }
    }

    if (type === "expenses" || type === "all") {
      // Expenses CSV
      const expensesCSV = [
        ["Spender Address", "Amount (ETH)", "Amount (Wei)", "Category", "Note", "Proof CID", "Timestamp", "Block Number", "Transaction Hash"].join(","),
        ...expenses.map((e) =>
          [
            e.spender,
            formatEther(e.amountWei),
            e.amountWei.toString(),
            e.category,
            e.note,
            e.cid,
            formatTimestamp(Number(e.timestamp)),
            e.blockNumber.toString(),
            e.transactionHash,
          ]
            .map(escapeCSV)
            .join(",")
        ),
      ].join("\n");

      if (type === "expenses") {
        csvContent = expensesCSV;
        filename = `${campaignTitle.replace(/[^a-zA-Z0-9]/g, "_")}_expenses_${now}.csv`;
      } else {
        csvContent += `# EXPENSES\n${expensesCSV}\n\n`;
      }
    }

    if (type === "all") {
      // Full report
      const totalDonations = donations.reduce((sum, d) => sum + d.amountWei, 0n);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amountWei, 0n);
      const balance = totalDonations - totalExpenses;

      const summaryCSV = [
        `# CAMPAIGN AUDIT REPORT`,
        `# Generated: ${new Date().toISOString()}`,
        `# Campaign: ${campaignTitle}`,
        `# Campaign ID: ${id}`,
        `# Owner: ${campaign.owner}`,
        `# Treasury: ${campaign.treasury}`,
        `# Created: ${formatTimestamp(Number(campaign.createdAt))}`,
        ``,
        `# SUMMARY`,
        `Total Donations,${formatEther(totalDonations)} ETH`,
        `Total Expenses,${formatEther(totalExpenses)} ETH`,
        `Net Balance,${formatEther(balance)} ETH`,
        `Donation Count,${donations.length}`,
        `Expense Count,${expenses.length}`,
        ``,
      ].join("\n");

      csvContent = summaryCSV + csvContent;
      filename = `${campaignTitle.replace(/[^a-zA-Z0-9]/g, "_")}_audit_report_${now}.csv`;
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
