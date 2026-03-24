import { test as base, expect, Page, BrowserContext } from "@playwright/test";

/**
 * GotongLedger E2E Test Fixtures
 * Shared utilities and page object models for testing
 */

// Test data constants
export const TEST_WALLET_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
export const TEST_TREASURY_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
export const CHAIN_ID = 31337;

// Service URLs
export const SERVICES = {
  web: "http://localhost:3000",
  rpc: "http://127.0.0.1:8545",
  ipfsApi: "http://127.0.0.1:5001",
  ipfsGateway: "http://127.0.0.1:8080",
};

// Page routes
export const ROUTES = {
  home: "/",
  admin: "/admin",
  howItWorks: "/how-it-works",
  health: "/health",
  campaign: (id: number | string) => `/campaign/${id}`,
  report: (id: number | string) => `/campaign/${id}/report`,
  explorer: (hash: string) => `/explorer/tx/${hash}`,
};

// Test categories for expenses
export const EXPENSE_CATEGORIES = [
  "Logistics",
  "Food",
  "Medical",
  "Education",
  "Shelter",
  "Equipment",
  "Personnel",
  "Other",
];

/**
 * Helper to wait for page to be fully loaded
 * Note: We don't use "networkidle" as the app has continuous polling
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  // Give React time to hydrate
  await page.waitForTimeout(500);
}

/**
 * Helper to check if element is visible
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);
  return await element.isVisible().catch(() => false);
}

/**
 * Helper to get text content safely
 */
export async function getTextContent(page: Page, selector: string): Promise<string> {
  const element = page.locator(selector);
  return (await element.textContent()) || "";
}

/**
 * Helper to count elements
 */
export async function countElements(page: Page, selector: string): Promise<number> {
  return await page.locator(selector).count();
}

/**
 * Helper to check API health
 */
export async function checkApiHealth(page: Page): Promise<boolean> {
  try {
    const response = await page.request.get("/api/health");
    const data = await response.json();
    return data.overall === "healthy";
  } catch {
    return false;
  }
}

/**
 * Helper to verify navigation
 */
export async function verifyNavigation(page: Page, expectedPath: string) {
  await expect(page).toHaveURL(new RegExp(expectedPath));
  await waitForPageLoad(page);
}

/**
 * Helper to click and wait for navigation
 */
export async function clickAndNavigate(page: Page, selector: string, expectedPath?: string) {
  await page.locator(selector).click();
  if (expectedPath) {
    await verifyNavigation(page, expectedPath);
  }
}

/**
 * Page Object: Navbar
 */
export class NavbarPage {
  constructor(private page: Page) {}

  async getLogo() {
    return this.page.locator('[data-testid="navbar-logo"], a:has-text("GL")').first();
  }

  async getNavLinks() {
    return this.page.locator('nav a, [role="navigation"] a');
  }

  async getThemeToggle() {
    // Theme toggle button contains Sun and Moon SVG icons from lucide-react
    return this.page.locator('button:has(svg.lucide-sun), button:has(svg.lucide-moon), button:has(.sr-only:text("Toggle theme"))').first();
  }

  async getWalletButton() {
    return this.page.locator('button:has-text("Connect"), button:has-text("0x"), [data-testid="wallet-button"]').first();
  }

  async getMobileMenuButton() {
    return this.page.locator('[data-testid="mobile-menu"], button:has([class*="menu"])').first();
  }

  async navigateTo(linkText: string) {
    // Target the link specifically within the navigation element (not footer)
    const link = this.page.getByRole('navigation').getByRole('link', { name: linkText });
    await link.click();
    await waitForPageLoad(this.page);
  }
}

/**
 * Page Object: Home Page
 */
export class HomePage {
  constructor(private page: Page) {}

  async getHero() {
    return this.page.locator('[data-testid="hero"], section:first-child');
  }

  async getStatsCards() {
    return this.page.locator('[data-testid="stats"] > div, .grid > [class*="card"]');
  }

  async getCampaignCards() {
    return this.page.locator('[data-testid="campaign-card"], a[href^="/campaign/"]');
  }

  async getSearchInput() {
    return this.page.locator('input[placeholder*="Search"], input[type="search"], [data-testid="search-input"]').first();
  }

  async getSortSelect() {
    // shadcn Select uses a button trigger, not native select
    return this.page.locator('[data-testid="sort-select"], button[role="combobox"], button:has-text("Newest"), button:has-text("Sort")').first();
  }

  async getFilterButton() {
    // Filter button uses SlidersHorizontal icon
    return this.page.locator('[data-testid="filter-button"], button:has(svg.lucide-sliders-horizontal), button:has-text("Filter")').first();
  }

  async searchCampaigns(query: string) {
    const searchInput = await this.getSearchInput();
    await searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  async clickCampaign(index: number = 0) {
    const cards = await this.getCampaignCards();
    await cards.nth(index).click();
    await waitForPageLoad(this.page);
  }
}

/**
 * Page Object: Admin Page
 */
export class AdminPage {
  constructor(private page: Page) {}

  async getCreateCampaignTab() {
    return this.page.locator('button:has-text("Create Campaign"), [role="tab"]:has-text("Create")').first();
  }

  async getRecordExpenseTab() {
    return this.page.locator('button:has-text("Record Expense"), [role="tab"]:has-text("Expense")').first();
  }

  async getTitleInput() {
    return this.page.locator('input[name="title"], input[placeholder*="title"]').first();
  }

  async getDescriptionInput() {
    return this.page.locator('textarea[name="description"], textarea[placeholder*="description"]').first();
  }

  async getTreasuryInput() {
    return this.page.locator('input[name="treasury"], input[placeholder*="0x"]').first();
  }

  async getSubmitButton() {
    return this.page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Submit")').first();
  }

  async getFileUploadZone() {
    return this.page.locator('[data-testid="file-upload"], input[type="file"]').first();
  }

  async getAmountInput() {
    return this.page.locator('input[name="amount"], input[placeholder*="ETH"]').first();
  }

  async getCategorySelect() {
    return this.page.locator('select[name="category"], [data-testid="category-select"]').first();
  }

  async getNoteInput() {
    return this.page.locator('textarea[name="note"], textarea[placeholder*="note"]').first();
  }

  async fillCampaignForm(title: string, description: string, treasury: string) {
    await (await this.getTitleInput()).fill(title);
    await (await this.getDescriptionInput()).fill(description);
    await (await this.getTreasuryInput()).fill(treasury);
  }
}

/**
 * Page Object: Campaign Detail Page
 */
export class CampaignDetailPage {
  constructor(private page: Page) {}

  async getCampaignTitle() {
    return this.page.locator('h1, [data-testid="campaign-title"]').first();
  }

  async getStatsCards() {
    return this.page.locator('[data-testid="stats-card"], .grid > [class*="card"]');
  }

  async getDonationsTab() {
    return this.page.locator('[role="tab"]:has-text("Donations"), button:has-text("Donations")').first();
  }

  async getExpensesTab() {
    return this.page.locator('[role="tab"]:has-text("Expenses"), button:has-text("Expenses")').first();
  }

  async getChartTab() {
    return this.page.locator('[role="tab"]:has-text("Chart"), button:has-text("Chart")').first();
  }

  async getDonateForm() {
    return this.page.locator('[data-testid="donate-form"], form:has(input[placeholder*="ETH"])');
  }

  async getDonateAmountInput() {
    return this.page.locator('input[placeholder*="ETH"], input[name="amount"]').first();
  }

  async getDonateButton() {
    return this.page.locator('button:has-text("Donate"), [data-testid="donate-button"]').first();
  }

  async getShareButton() {
    return this.page.locator('button:has-text("Share"), [data-testid="share-button"]').first();
  }

  async getViewReportButton() {
    return this.page.locator('a:has-text("Report"), [data-testid="view-report"]').first();
  }

  async getQuickAmountButtons() {
    return this.page.locator('[data-testid="quick-amount"], button:has-text("0.01"), button:has-text("0.05")');
  }
}

/**
 * Page Object: Report Page
 */
export class ReportPage {
  constructor(private page: Page) {}

  async getSummaryCards() {
    return this.page.locator('[data-testid="summary-card"], .grid > [class*="card"]');
  }

  async getAnomalyAlerts() {
    return this.page.locator('[data-testid="anomaly-alert"], [role="alert"]');
  }

  async getPieChart() {
    return this.page.locator('[data-testid="pie-chart"], .recharts-pie');
  }

  async getBarChart() {
    return this.page.locator('[data-testid="bar-chart"], .recharts-bar');
  }

  async getExportButton() {
    return this.page.locator('button:has-text("Export"), [data-testid="export-csv"]').first();
  }

  async getPrintButton() {
    return this.page.locator('button:has-text("Print"), [data-testid="print-button"]').first();
  }

  async getCategoryTable() {
    return this.page.locator('table, [data-testid="category-table"]').first();
  }

  async getDonationsTable() {
    return this.page.locator('table:has-text("Donor"), [data-testid="donations-table"]');
  }

  async getExpensesTable() {
    return this.page.locator('table:has-text("Category"), [data-testid="expenses-table"]');
  }
}

/**
 * Page Object: How It Works Page
 */
export class HowItWorksPage {
  constructor(private page: Page) {}

  async getHero() {
    return this.page.locator('[data-testid="hero"], section:first-child');
  }

  async getArchitectureTabs() {
    return this.page.locator('[role="tab"], button:has-text("On-Chain"), button:has-text("IPFS")');
  }

  async getOnChainTab() {
    return this.page.locator('[role="tab"]:has-text("On-Chain"), button:has-text("On-Chain")').first();
  }

  async getIPFSTab() {
    return this.page.locator('[role="tab"]:has-text("IPFS"), button:has-text("IPFS")').first();
  }

  async getOffChainTab() {
    return this.page.locator('[role="tab"]:has-text("Off-Chain"), button:has-text("Off-Chain")').first();
  }

  async getTrustModelCards() {
    return this.page.locator('[data-testid="trust-card"], .grid > [class*="card"]');
  }

  async getContractInfo() {
    return this.page.locator('[data-testid="contract-info"], :text("Contract Address")');
  }

  async getCopyAddressButton() {
    return this.page.locator('button:has-text("Copy"), [data-testid="copy-address"]').first();
  }
}

/**
 * Page Object: Health Page
 */
export class HealthPage {
  constructor(private page: Page) {}

  async getOverallStatus() {
    return this.page.locator('[data-testid="overall-status"], :text("Overall Status")').first();
  }

  async getServiceCards() {
    return this.page.locator('[data-testid="service-card"], .grid > [class*="card"]');
  }

  async getHardhatStatus() {
    return this.page.locator(':text("Hardhat"), :text("RPC")').first();
  }

  async getIPFSAPIStatus() {
    return this.page.locator(':text("IPFS API")').first();
  }

  async getIPFSGatewayStatus() {
    return this.page.locator(':text("IPFS Gateway"), :text("Gateway")').first();
  }

  async getContractStatus() {
    return this.page.locator('[data-testid="contract-status"], :text("Contract")').first();
  }

  async getRecheckButton() {
    return this.page.locator('button:has-text("Recheck"), button:has-text("Refresh"), [data-testid="recheck"]').first();
  }

  async getTroubleshootingSection() {
    return this.page.locator('[data-testid="troubleshooting"], :text("Troubleshooting")');
  }
}

/**
 * Extended test with page objects
 */
export const test = base.extend<{
  navbar: NavbarPage;
  homePage: HomePage;
  adminPage: AdminPage;
  campaignPage: CampaignDetailPage;
  reportPage: ReportPage;
  howItWorksPage: HowItWorksPage;
  healthPage: HealthPage;
}>({
  navbar: async ({ page }, use) => {
    await use(new NavbarPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  adminPage: async ({ page }, use) => {
    await use(new AdminPage(page));
  },
  campaignPage: async ({ page }, use) => {
    await use(new CampaignDetailPage(page));
  },
  reportPage: async ({ page }, use) => {
    await use(new ReportPage(page));
  },
  howItWorksPage: async ({ page }, use) => {
    await use(new HowItWorksPage(page));
  },
  healthPage: async ({ page }, use) => {
    await use(new HealthPage(page));
  },
});

export { expect };
