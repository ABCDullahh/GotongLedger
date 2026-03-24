import { ethers } from "hardhat";

async function main() {
  console.log("🌱 Seeding demo data...\n");

  const signers = await ethers.getSigners();
  const admin = signers[0];
  const donor1 = signers[1];
  const donor2 = signers[2];
  const donor3 = signers[3];

  // Get deployed contract
  const contractAddress = "0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE";
  const CampaignLedger = await ethers.getContractFactory("CampaignLedger");
  const ledger = CampaignLedger.attach(contractAddress);

  // === Create 3 Campaigns ===
  console.log("📋 Creating campaigns...");

  const tx1 = await ledger.connect(admin).createCampaign(admin.address);
  await tx1.wait();
  console.log("  ✅ Campaign #1: Clean Water Initiative Jakarta");

  const tx2 = await ledger.connect(admin).createCampaign(admin.address);
  await tx2.wait();
  console.log("  ✅ Campaign #2: Solar Grid Initiative");

  const tx3 = await ledger.connect(admin).createCampaign(admin.address);
  await tx3.wait();
  console.log("  ✅ Campaign #3: Education for All");

  // === Set Goals & Milestones ===
  console.log("\n🎯 Setting goals & milestones...");

  await (await ledger.connect(admin).setCampaignGoal(1, ethers.parseEther("10"))).wait();
  await (await ledger.connect(admin).setMilestone(1, 25, "25% - Equipment ordered")).wait();
  await (await ledger.connect(admin).setMilestone(1, 50, "50% - Installation started")).wait();
  await (await ledger.connect(admin).setMilestone(1, 100, "100% - Project complete")).wait();
  console.log("  ✅ Campaign #1: Goal 10 ETH, 3 milestones");

  await (await ledger.connect(admin).setCampaignGoal(2, ethers.parseEther("5"))).wait();
  await (await ledger.connect(admin).setMilestone(2, 50, "50% - Panels purchased")).wait();
  await (await ledger.connect(admin).setMilestone(2, 100, "100% - Grid operational")).wait();
  console.log("  ✅ Campaign #2: Goal 5 ETH, 2 milestones");

  await (await ledger.connect(admin).setCampaignGoal(3, ethers.parseEther("3"))).wait();
  console.log("  ✅ Campaign #3: Goal 3 ETH");

  // === Donations ===
  console.log("\n💰 Making donations...");

  await (await ledger.connect(donor1).donate(1, { value: ethers.parseEther("2.5") })).wait();
  console.log("  ✅ Donor1 → Campaign #1: 2.5 ETH");

  await (await ledger.connect(donor2).donate(1, { value: ethers.parseEther("1.0") })).wait();
  console.log("  ✅ Donor2 → Campaign #1: 1.0 ETH (milestone 25% reached!)");

  await (await ledger.connect(donor3).donate(1, { value: ethers.parseEther("0.5") })).wait();
  console.log("  ✅ Donor3 → Campaign #1: 0.5 ETH");

  await (await ledger.connect(donor1).donate(2, { value: ethers.parseEther("3.0") })).wait();
  console.log("  ✅ Donor1 → Campaign #2: 3.0 ETH (milestone 50% reached!)");

  await (await ledger.connect(donor2).donate(2, { value: ethers.parseEther("1.5") })).wait();
  console.log("  ✅ Donor2 → Campaign #2: 1.5 ETH");

  await (await ledger.connect(donor1).donate(3, { value: ethers.parseEther("1.0") })).wait();
  console.log("  ✅ Donor1 → Campaign #3: 1.0 ETH");

  await (await ledger.connect(donor3).donate(3, { value: ethers.parseEther("0.25") })).wait();
  console.log("  ✅ Donor3 → Campaign #3: 0.25 ETH");

  // === Record Expenses ===
  console.log("\n📝 Recording expenses...");

  await (await ledger.connect(admin).recordExpense(
    1, ethers.parseEther("1.2"), "Equipment", "QmFakeHash1234567890abcdef", "Water filtration units x5"
  )).wait();
  console.log("  ✅ Campaign #1 expense: 1.2 ETH (Equipment)");

  await (await ledger.connect(admin).recordExpense(
    1, ethers.parseEther("0.8"), "Logistics", "QmFakeHash2345678901bcdefg", "Transport to Jakarta"
  )).wait();
  console.log("  ✅ Campaign #1 expense: 0.8 ETH (Logistics)");

  await (await ledger.connect(admin).recordExpense(
    2, ethers.parseEther("2.0"), "Equipment", "QmFakeHash3456789012cdefgh", "Solar panels x10"
  )).wait();
  console.log("  ✅ Campaign #2 expense: 2.0 ETH (Equipment)");

  await (await ledger.connect(admin).recordExpense(
    2, ethers.parseEther("0.5"), "Personnel", "QmFakeHash4567890123defghi", "Installation crew"
  )).wait();
  console.log("  ✅ Campaign #2 expense: 0.5 ETH (Personnel)");

  // === Save metadata to API ===
  console.log("\n📄 Saving campaign metadata...");

  const campaigns = [
    { campaignId: 1, title: "Clean Water Initiative Jakarta", description: "Deploying modular atmospheric water generators to provide sustainable drinking water for 500+ families in North Jakarta.", category: "Health" },
    { campaignId: 2, title: "Solar Grid Initiative #4", description: "Funding off-grid solar solutions for high-altitude community centers in the Andean regions.", category: "Environment" },
    { campaignId: 3, title: "Education for All", description: "Providing learning materials and internet access for rural schools in Southeast Asia.", category: "Education" },
  ];

  for (const c of campaigns) {
    try {
      const res = await fetch("http://localhost:3939/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chainId: 31337,
          contractAddress: contractAddress,
          ...c,
        }),
      });
      const data = await res.json();
      console.log(`  ✅ Metadata saved: ${c.title} (${data.success ? 'ok' : 'fail'})`);
    } catch (e) {
      console.log(`  ⚠️ Metadata API not available for: ${c.title} (will save manually)`);
    }
  }

  // === Summary ===
  console.log("\n🎉 Demo data seeded successfully!");
  console.log("   3 campaigns created");
  console.log("   7 donations made (total: 9.75 ETH)");
  console.log("   4 expenses recorded (total: 4.5 ETH)");
  console.log("   Milestones configured & some triggered");
  console.log("\n   Open http://localhost:3939 to see the data!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
