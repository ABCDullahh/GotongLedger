import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { CampaignLedger } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("CampaignLedger", function () {
  async function deployFixture() {
    const [admin, treasury, donor, operator, otherUser] = await ethers.getSigners();

    const CampaignLedgerFactory = await ethers.getContractFactory("CampaignLedger");
    const campaignLedger = await CampaignLedgerFactory.deploy(admin.address);
    await campaignLedger.waitForDeployment();

    // Grant operator role to operator
    const OPERATOR_ROLE = await campaignLedger.OPERATOR_ROLE();
    await campaignLedger.connect(admin).grantRole(OPERATOR_ROLE, operator.address);

    return { campaignLedger, admin, treasury, donor, operator, otherUser, OPERATOR_ROLE };
  }

  describe("Deployment", function () {
    it("Should set the admin as default admin and operator", async function () {
      const { campaignLedger, admin, OPERATOR_ROLE } = await loadFixture(deployFixture);

      const DEFAULT_ADMIN_ROLE = await campaignLedger.DEFAULT_ADMIN_ROLE();

      expect(await campaignLedger.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await campaignLedger.hasRole(OPERATOR_ROLE, admin.address)).to.be.true;
    });

    it("Should start with 0 campaigns", async function () {
      const { campaignLedger } = await loadFixture(deployFixture);

      expect(await campaignLedger.getCampaignCount()).to.equal(0);
    });
  });

  describe("createCampaign", function () {
    it("Should create a campaign and emit CampaignCreated event", async function () {
      const { campaignLedger, admin, treasury } = await loadFixture(deployFixture);

      await expect(campaignLedger.connect(admin).createCampaign(treasury.address))
        .to.emit(campaignLedger, "CampaignCreated")
        .withArgs(
          1,
          admin.address,
          treasury.address,
          (value: bigint) => value > 0n // createdAt timestamp
        );

      const campaign = await campaignLedger.getCampaign(1);
      expect(campaign.id).to.equal(1);
      expect(campaign.owner).to.equal(admin.address);
      expect(campaign.treasury).to.equal(treasury.address);
      expect(campaign.active).to.be.true;
    });

    it("Should increment campaign counter", async function () {
      const { campaignLedger, admin, treasury } = await loadFixture(deployFixture);

      await campaignLedger.connect(admin).createCampaign(treasury.address);
      expect(await campaignLedger.getCampaignCount()).to.equal(1);

      await campaignLedger.connect(admin).createCampaign(treasury.address);
      expect(await campaignLedger.getCampaignCount()).to.equal(2);
    });

    it("Should revert with InvalidTreasury for zero address", async function () {
      const { campaignLedger, admin } = await loadFixture(deployFixture);

      await expect(
        campaignLedger.connect(admin).createCampaign(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(campaignLedger, "InvalidTreasury");
    });
  });

  describe("donate", function () {
    async function createCampaignFixture() {
      const fixture = await deployFixture();
      await fixture.campaignLedger.connect(fixture.admin).createCampaign(fixture.treasury.address);
      return fixture;
    }

    it("Should emit DonationReceived event and forward funds to treasury", async function () {
      const { campaignLedger, treasury, donor } = await loadFixture(createCampaignFixture);

      const donationAmount = ethers.parseEther("1.0");
      const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);

      await expect(campaignLedger.connect(donor).donate(1, { value: donationAmount }))
        .to.emit(campaignLedger, "DonationReceived")
        .withArgs(
          1,
          donor.address,
          donationAmount,
          (timestamp: bigint) => timestamp > 0n,
          (txHash: string) => txHash.length === 66 // bytes32
        );

      const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(donationAmount);
    });

    it("Should update campaign donation total", async function () {
      const { campaignLedger, donor } = await loadFixture(createCampaignFixture);

      const donationAmount = ethers.parseEther("1.5");
      await campaignLedger.connect(donor).donate(1, { value: donationAmount });

      const [totalDonations] = await campaignLedger.getCampaignStats(1);
      expect(totalDonations).to.equal(donationAmount);
    });

    it("Should revert for inactive campaign", async function () {
      const { campaignLedger, admin, donor } = await loadFixture(createCampaignFixture);

      await campaignLedger.connect(admin).setCampaignActive(1, false);

      await expect(
        campaignLedger.connect(donor).donate(1, { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(campaignLedger, "CampaignNotActive");
    });

    it("Should revert for non-existent campaign", async function () {
      const { campaignLedger, donor } = await loadFixture(createCampaignFixture);

      await expect(
        campaignLedger.connect(donor).donate(999, { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(campaignLedger, "CampaignDoesNotExist");
    });

    it("Should revert for zero donation amount", async function () {
      const { campaignLedger, donor } = await loadFixture(createCampaignFixture);

      await expect(
        campaignLedger.connect(donor).donate(1, { value: 0 })
      ).to.be.revertedWithCustomError(campaignLedger, "InvalidDonationAmount");
    });
  });

  describe("recordExpense", function () {
    async function createCampaignFixture() {
      const fixture = await deployFixture();
      await fixture.campaignLedger.connect(fixture.admin).createCampaign(fixture.treasury.address);
      return fixture;
    }

    it("Should emit ExpenseRecorded event when called by owner", async function () {
      const { campaignLedger, admin } = await loadFixture(createCampaignFixture);

      const amount = ethers.parseEther("0.5");
      const category = "Logistics";
      const cid = "QmTest123456789";
      const note = "Transport costs";

      await expect(campaignLedger.connect(admin).recordExpense(1, amount, category, cid, note))
        .to.emit(campaignLedger, "ExpenseRecorded")
        .withArgs(
          1,
          admin.address,
          amount,
          category,
          cid,
          note,
          (timestamp: bigint) => timestamp > 0n,
          (txHash: string) => txHash.length === 66
        );
    });

    it("Should emit ExpenseRecorded event when called by operator", async function () {
      const { campaignLedger, operator } = await loadFixture(createCampaignFixture);

      const amount = ethers.parseEther("0.3");

      await expect(
        campaignLedger.connect(operator).recordExpense(1, amount, "Food", "QmTest789", "Meals")
      ).to.emit(campaignLedger, "ExpenseRecorded");
    });

    it("Should update campaign expense total", async function () {
      const { campaignLedger, admin } = await loadFixture(createCampaignFixture);

      const amount1 = ethers.parseEther("0.5");
      const amount2 = ethers.parseEther("0.3");

      await campaignLedger.connect(admin).recordExpense(1, amount1, "Logistics", "Qm1", "Note1");
      await campaignLedger.connect(admin).recordExpense(1, amount2, "Food", "Qm2", "Note2");

      const [, totalExpenses] = await campaignLedger.getCampaignStats(1);
      expect(totalExpenses).to.equal(amount1 + amount2);
    });

    it("Should revert when called by unauthorized user", async function () {
      const { campaignLedger, otherUser } = await loadFixture(createCampaignFixture);

      await expect(
        campaignLedger.connect(otherUser).recordExpense(
          1,
          ethers.parseEther("0.1"),
          "Food",
          "QmTest",
          "Note"
        )
      ).to.be.revertedWithCustomError(campaignLedger, "UnauthorizedOperator");
    });

    it("Should revert for empty CID", async function () {
      const { campaignLedger, admin } = await loadFixture(createCampaignFixture);

      await expect(
        campaignLedger.connect(admin).recordExpense(
          1,
          ethers.parseEther("0.1"),
          "Food",
          "",
          "Note"
        )
      ).to.be.revertedWithCustomError(campaignLedger, "EmptyCID");
    });

    it("Should revert for empty category", async function () {
      const { campaignLedger, admin } = await loadFixture(createCampaignFixture);

      await expect(
        campaignLedger.connect(admin).recordExpense(
          1,
          ethers.parseEther("0.1"),
          "",
          "QmTest",
          "Note"
        )
      ).to.be.revertedWithCustomError(campaignLedger, "EmptyCategory");
    });

    it("Should revert for inactive campaign", async function () {
      const { campaignLedger, admin } = await loadFixture(createCampaignFixture);

      await campaignLedger.connect(admin).setCampaignActive(1, false);

      await expect(
        campaignLedger.connect(admin).recordExpense(
          1,
          ethers.parseEther("0.1"),
          "Food",
          "QmTest",
          "Note"
        )
      ).to.be.revertedWithCustomError(campaignLedger, "CampaignNotActive");
    });
  });

  describe("setCampaignActive", function () {
    async function createCampaignFixture() {
      const fixture = await deployFixture();
      await fixture.campaignLedger.connect(fixture.admin).createCampaign(fixture.treasury.address);
      return fixture;
    }

    it("Should allow owner to set campaign active status", async function () {
      const { campaignLedger, admin } = await loadFixture(createCampaignFixture);

      await expect(campaignLedger.connect(admin).setCampaignActive(1, false))
        .to.emit(campaignLedger, "CampaignStatusChanged")
        .withArgs(1, false);

      const campaign = await campaignLedger.getCampaign(1);
      expect(campaign.active).to.be.false;
    });

    it("Should revert when called by non-owner/non-admin", async function () {
      const { campaignLedger, otherUser } = await loadFixture(createCampaignFixture);

      await expect(
        campaignLedger.connect(otherUser).setCampaignActive(1, false)
      ).to.be.revertedWithCustomError(campaignLedger, "UnauthorizedOperator");
    });
  });

  describe("View functions", function () {
    it("Should return correct campaign stats", async function () {
      const { campaignLedger, admin, treasury, donor } = await loadFixture(deployFixture);

      await campaignLedger.connect(admin).createCampaign(treasury.address);

      // Donate
      const donationAmount = ethers.parseEther("2");
      await campaignLedger.connect(donor).donate(1, { value: donationAmount });

      // Record expense
      const expenseAmount = ethers.parseEther("0.5");
      await campaignLedger.connect(admin).recordExpense(1, expenseAmount, "Food", "QmTest", "Note");

      const [totalDonations, totalExpenses] = await campaignLedger.getCampaignStats(1);
      expect(totalDonations).to.equal(donationAmount);
      expect(totalExpenses).to.equal(expenseAmount);
    });
  });
});
