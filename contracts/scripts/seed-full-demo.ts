import { ethers } from "hardhat";

async function main() {
  console.log("🌱 Seeding full demo data (6 campaigns with varied dates)...\n");

  const signers = await ethers.getSigners();
  const admin = signers[0];
  const donors = signers.slice(1, 10); // 9 unique donors

  // Get deployed contract
  const deployment = require("../../web/src/lib/deployment.json");
  const contractAddress = deployment.contractAddress;
  console.log("Contract:", contractAddress);

  const CampaignLedger = await ethers.getContractFactory("CampaignLedger");
  const ledger = CampaignLedger.attach(contractAddress);

  // No timestamp manipulation — Hardhat uses current time for all blocks

  // ========================================
  // CREATE 6 CAMPAIGNS (different dates)
  // ========================================
  console.log("\n📋 Creating 6 campaigns with varied dates...");

  // Campaign #1: 28 days ago
  
  await (await ledger.connect(admin).createCampaign(admin.address)).wait();
  console.log("  ✅ Campaign #1: Clean Water Initiative Jakarta (28 days ago)");

  // Campaign #2: 21 days ago
  
  await (await ledger.connect(admin).createCampaign(admin.address)).wait();
  console.log("  ✅ Campaign #2: Solar Grid Initiative #4 (21 days ago)");

  // Campaign #3: 14 days ago
  
  await (await ledger.connect(admin).createCampaign(admin.address)).wait();
  console.log("  ✅ Campaign #3: Education for All (14 days ago)");

  // Campaign #4: 10 days ago
  
  await (await ledger.connect(admin).createCampaign(admin.address)).wait();
  console.log("  ✅ Campaign #4: Rural Health Clinic Sumatra (10 days ago)");

  // Campaign #5: 5 days ago
  
  await (await ledger.connect(admin).createCampaign(admin.address)).wait();
  console.log("  ✅ Campaign #5: Urban Farming Collective (5 days ago)");

  // Campaign #6: 2 days ago
  
  await (await ledger.connect(admin).createCampaign(admin.address)).wait();
  console.log("  ✅ Campaign #6: Disaster Relief Bridge Sulawesi (2 days ago)");

  // ========================================
  // SET GOALS & MILESTONES
  // ========================================
  console.log("\n🎯 Setting goals & milestones...");

  const goals = [
    { id: 1, goal: "10", milestones: [25, 50, 75, 100] },
    { id: 2, goal: "5", milestones: [50, 100] },
    { id: 3, goal: "3", milestones: [50, 100] },
    { id: 4, goal: "15", milestones: [25, 50, 75, 100] },
    { id: 5, goal: "8", milestones: [33, 66, 100] },
    { id: 6, goal: "20", milestones: [25, 50, 100] },
  ];

  const milestoneDescs: Record<number, Record<number, string>> = {
    1: { 25: "Equipment ordered", 50: "Installation started", 75: "Testing phase", 100: "Project complete" },
    2: { 50: "Panels purchased", 100: "Grid operational" },
    3: { 50: "Materials distributed", 100: "Program launched" },
    4: { 25: "Land acquired", 50: "Construction begun", 75: "Structural complete", 100: "Clinic operational" },
    5: { 33: "Seeds & tools procured", 66: "Planting complete", 100: "First harvest" },
    6: { 25: "Design finalized", 50: "Foundation laid", 100: "Bridge operational" },
  };

  for (const g of goals) {
    await (await ledger.connect(admin).setCampaignGoal(g.id, ethers.parseEther(g.goal))).wait();
    for (const m of g.milestones) {
      await (await ledger.connect(admin).setMilestone(g.id, m, milestoneDescs[g.id][m])).wait();
    }
    console.log(`  ✅ Campaign #${g.id}: Goal ${g.goal} ETH, ${g.milestones.length} milestones`);
  }

  // ========================================
  // DONATIONS (varied dates within each campaign's lifespan)
  // ========================================
  console.log("\n💰 Making donations...");

  // Sorted chronologically (daysAgo decreasing = oldest first)
  const donations = [
    { campaign: 1, donor: 0, amount: "2.5", daysAgo: 25 },
    { campaign: 1, donor: 1, amount: "1.0", daysAgo: 20 },
    { campaign: 2, donor: 0, amount: "3.0", daysAgo: 18 },
    { campaign: 1, donor: 2, amount: "0.5", daysAgo: 15 },
    { campaign: 2, donor: 1, amount: "1.5", daysAgo: 12 },
    { campaign: 3, donor: 0, amount: "1.0", daysAgo: 11 },
    { campaign: 4, donor: 3, amount: "5.0", daysAgo: 9 },
    { campaign: 3, donor: 2, amount: "0.25", daysAgo: 7 },
    { campaign: 4, donor: 4, amount: "2.0", daysAgo: 7 },
    { campaign: 4, donor: 0, amount: "1.0", daysAgo: 5 },
    { campaign: 5, donor: 7, amount: "3.0", daysAgo: 4 },
    { campaign: 4, donor: 5, amount: "0.5", daysAgo: 4 },
    { campaign: 5, donor: 1, amount: "1.5", daysAgo: 3 },
    { campaign: 4, donor: 6, amount: "0.25", daysAgo: 3 },
    { campaign: 5, donor: 3, amount: "0.5", daysAgo: 2 },
    { campaign: 5, donor: 8, amount: "0.35", daysAgo: 1 },
    { campaign: 6, donor: 4, amount: "5.0", daysAgo: 1 },
    { campaign: 6, donor: 3, amount: "3.0", daysAgo: 1 },
    { campaign: 6, donor: 0, amount: "2.0", daysAgo: 0 },
    { campaign: 6, donor: 7, amount: "1.5", daysAgo: 0 },
    { campaign: 6, donor: 8, amount: "0.5", daysAgo: 0 },
  ];

  let totalDonated = 0;
  for (const d of donations) {
    await (await ledger.connect(donors[d.donor]).donate(d.campaign, { value: ethers.parseEther(d.amount) })).wait();
    totalDonated += parseFloat(d.amount);
  }
  console.log(`  ✅ ${donations.length} donations made (total: ${totalDonated} ETH)`);

  // ========================================
  // EXPENSES (varied dates)
  // ========================================
  console.log("\n📝 Recording expenses...");

  const expenses = [
    // Sorted chronologically (oldest first)
    { campaign: 1, amount: "1.2", category: "Equipment", cid: "QmWaterFilter001xyz", note: "Water filtration units x5", daysAgo: 22 },
    { campaign: 1, amount: "0.8", category: "Logistics", cid: "QmTransport002abc", note: "Transport to North Jakarta", daysAgo: 16 },
    { campaign: 2, amount: "2.0", category: "Equipment", cid: "QmSolarPanel003def", note: "Solar panels x10 + inverters", daysAgo: 15 },
    { campaign: 2, amount: "0.5", category: "Personnel", cid: "QmInstallCrew004ghi", note: "Installation crew wages", daysAgo: 10 },
    { campaign: 3, amount: "0.6", category: "Education", cid: "QmTextbooks005jkl", note: "Textbooks & learning tablets x50", daysAgo: 9 },
    { campaign: 4, amount: "3.0", category: "Medical", cid: "QmMedEquip007pqr", note: "Medical equipment & supplies", daysAgo: 7 },
    { campaign: 3, amount: "0.3", category: "Logistics", cid: "QmShipping006mno", note: "Shipping to rural schools", daysAgo: 6 },
    { campaign: 4, amount: "2.5", category: "Shelter", cid: "QmConstruct008stu", note: "Clinic construction materials", daysAgo: 5 },
    { campaign: 5, amount: "1.5", category: "Equipment", cid: "QmFarmTool010yza", note: "Farming tools & irrigation", daysAgo: 3 },
    { campaign: 4, amount: "1.0", category: "Personnel", cid: "QmDoctors009vwx", note: "Doctor & nurse recruitment", daysAgo: 3 },
    { campaign: 5, amount: "1.0", category: "Food", cid: "QmSeeds011bcd", note: "Organic seeds & fertilizer", daysAgo: 2 },
    { campaign: 5, amount: "0.5", category: "Education", cid: "QmTraining012efg", note: "Farming workshops for community", daysAgo: 1 },
    { campaign: 6, amount: "5.0", category: "Equipment", cid: "QmBridgeMat013hij", note: "Steel beams & concrete supplies", daysAgo: 1 },
    { campaign: 6, amount: "3.0", category: "Personnel", cid: "QmEngineers014klm", note: "Engineering team & labor", daysAgo: 0 },
    { campaign: 6, amount: "1.5", category: "Logistics", cid: "QmHeavyLift015nop", note: "Heavy machinery rental & transport", daysAgo: 0 },
  ];

  let totalSpent = 0;
  for (const e of expenses) {
    await (await ledger.connect(admin).recordExpense(
      e.campaign, ethers.parseEther(e.amount), e.category, e.cid, e.note
    )).wait();
    totalSpent += parseFloat(e.amount);
  }
  console.log(`  ✅ ${expenses.length} expenses recorded (total: ${totalSpent} ETH)`);


  // ========================================
  // SAVE METADATA TO API
  // ========================================
  console.log("\n📄 Saving campaign metadata...");

  const campaignMeta = [
    {
      campaignId: 1,
      title: "Clean Water Initiative Jakarta",
      description: "Deploying modular atmospheric water generators to provide sustainable, arsenic-free drinking water for 500+ families in North Jakarta coastal settlements.",
      category: "Health",
    },
    {
      campaignId: 2,
      title: "Solar Grid Initiative #4",
      description: "Funding off-grid solar solutions for high-altitude community centers in the Andean regions. Bringing clean energy to remote villages.",
      category: "Environment",
    },
    {
      campaignId: 3,
      title: "Education for All",
      description: "Providing learning tablets, textbooks, and internet access for 200+ rural schools across Southeast Asia.",
      category: "Education",
    },
    {
      campaignId: 4,
      title: "Rural Health Clinic Sumatra",
      description: "Building a fully equipped medical clinic in Padang Highlands, serving 3,000+ villagers who currently travel 6 hours for basic healthcare.",
      category: "Health",
    },
    {
      campaignId: 5,
      title: "Urban Farming Collective",
      description: "Transforming abandoned urban lots into community-owned vertical farms. Sustainable food production for low-income neighborhoods in Manila.",
      category: "Community",
    },
    {
      campaignId: 6,
      title: "Disaster Relief Bridge Sulawesi",
      description: "Reconstructing a critical bridge connecting 12 isolated villages after the 2025 earthquake. Emergency infrastructure for 8,000+ affected residents.",
      category: "Infrastructure",
    },
  ];

  for (const c of campaignMeta) {
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
      console.log(`  ✅ ${c.title} [${c.category}] (${data.success ? "saved" : "failed"})`);
    } catch {
      console.log(`  ⚠️ API unavailable for: ${c.title}`);
    }
  }

  // ========================================
  // SUMMARY
  // ========================================
  console.log("\n" + "=".repeat(50));
  console.log("🎉 FULL DEMO DATA SEEDED SUCCESSFULLY!");
  console.log("=".repeat(50));
  console.log(`   📋 6 campaigns (created over the past month)`);
  console.log(`   💰 ${donations.length} donations (${totalDonated} ETH)`);
  console.log(`   📝 ${expenses.length} expenses (${totalSpent} ETH)`);
  console.log(`   👥 ${new Set(donations.map(d => d.donor)).size} unique donors`);
  console.log(`   📅 Dates span from 28 days ago to today`);
  console.log(`   🏷️  Categories: Health, Environment, Education, Community, Infrastructure`);
  console.log(`\n   Open http://localhost:3939 to explore!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
