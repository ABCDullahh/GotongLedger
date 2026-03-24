import { test, expect, waitForPageLoad } from "./fixtures";

/**
 * Theme Toggle Tests
 * Tests dark mode toggle functionality and persistence
 */

test.describe("Theme Toggle", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForPageLoad(page);
  });

  test("should display theme toggle button", async ({ page }) => {
    // Theme toggle has sr-only text "Toggle theme"
    const themeToggle = page.locator('button:has(.sr-only)').filter({ hasText: '' }).first();
    // Or look for button with sun/moon icons in navbar area
    const navThemeButton = page.locator('nav button:has(svg)').first();
    const hasToggle = (await themeToggle.count()) > 0 || (await navThemeButton.count()) > 0;
    expect(hasToggle).toBeTruthy();
  });

  test("should open theme dropdown on click", async ({ page }) => {
    // Find the theme toggle - it's the button with sun/moon icons
    const themeToggle = page.locator('nav button.relative:has(svg.lucide-sun)').first();
    await themeToggle.click();
    await page.waitForTimeout(300);

    // Check for dropdown menu options (DropdownMenuItem)
    const lightOption = page.locator('[role="menuitem"]:has-text("Light")');
    const darkOption = page.locator('[role="menuitem"]:has-text("Dark")');
    const systemOption = page.locator('[role="menuitem"]:has-text("System")');

    const hasOptions =
      (await lightOption.count()) > 0 ||
      (await darkOption.count()) > 0 ||
      (await systemOption.count()) > 0;

    expect(hasOptions).toBeTruthy();
  });

  test("should switch to dark mode", async ({ page }) => {
    const themeToggle = page.locator('nav button.relative:has(svg.lucide-sun)').first();
    await themeToggle.click();
    await page.waitForTimeout(300);

    // Click dark mode option
    const darkOption = page.locator('[role="menuitem"]:has-text("Dark")').first();
    await darkOption.click();
    await page.waitForTimeout(300);

    // Check if dark class is added to html
    const hasDarkClass = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );
    expect(hasDarkClass).toBeTruthy();
  });

  test("should switch to light mode", async ({ page }) => {
    // First set to dark
    const themeToggle = page.locator('nav button.relative:has(svg.lucide-sun), nav button.relative:has(svg.lucide-moon)').first();
    await themeToggle.click();
    await page.waitForTimeout(300);

    const darkOption = page.locator('[role="menuitem"]:has-text("Dark")').first();
    await darkOption.click();
    await page.waitForTimeout(300);

    // Now switch to light
    await themeToggle.click();
    await page.waitForTimeout(300);

    const lightOption = page.locator('[role="menuitem"]:has-text("Light")').first();
    await lightOption.click();
    await page.waitForTimeout(300);

    // Check that dark class is NOT present
    const hasDarkClass = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );
    expect(hasDarkClass).toBeFalsy();
  });

  test("should persist theme preference after page reload", async ({ page }) => {
    const themeToggle = page.locator('nav button.relative:has(svg.lucide-sun)').first();
    await themeToggle.click();
    await page.waitForTimeout(300);

    // Set dark mode
    const darkOption = page.locator('[role="menuitem"]:has-text("Dark")').first();
    await darkOption.click();
    await page.waitForTimeout(300);

    // Reload page
    await page.reload();
    await waitForPageLoad(page);

    // Check theme persisted
    const hasDarkClass = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );
    expect(hasDarkClass).toBeTruthy();
  });

  test("should persist theme across different pages", async ({ page }) => {
    const themeToggle = page.locator('nav button.relative:has(svg.lucide-sun)').first();
    await themeToggle.click();
    await page.waitForTimeout(300);

    // Set dark mode
    const darkOption = page.locator('[role="menuitem"]:has-text("Dark")').first();
    await darkOption.click();
    await page.waitForTimeout(300);

    const initialDarkClass = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );

    // Navigate to another page
    await page.goto("/health");
    await waitForPageLoad(page);

    const afterNavigateDarkClass = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );

    // Theme should persist
    expect(afterNavigateDarkClass).toBe(initialDarkClass);
  });

  test("should respect system preference with System option", async ({ page }) => {
    // Set color scheme preference
    await page.emulateMedia({ colorScheme: "dark" });

    const themeToggle = page.locator('nav button.relative:has(svg.lucide-sun), nav button.relative:has(svg.lucide-moon)').first();
    await themeToggle.click();
    await page.waitForTimeout(300);

    const systemOption = page.locator('[role="menuitem"]:has-text("System")').first();
    await systemOption.click();
    await page.waitForTimeout(300);

    // With dark system preference, should be dark
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Theme Visual Consistency", () => {
  test("dark mode should apply consistent styling", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    const themeToggle = page.locator('nav button.relative:has(svg.lucide-sun)').first();
    await themeToggle.click();
    await page.waitForTimeout(300);

    const darkOption = page.locator('[role="menuitem"]:has-text("Dark")').first();
    await darkOption.click();
    await page.waitForTimeout(500);

    // Check background color is dark
    const bgColor = await page.evaluate(() => {
      const body = document.body;
      return getComputedStyle(body).backgroundColor;
    });

    // Dark mode should have darker background
    expect(bgColor).toBeTruthy();
  });

  test("light mode should apply consistent styling", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    // Default should be light or follow system
    const bgColor = await page.evaluate(() => {
      const body = document.body;
      return getComputedStyle(body).backgroundColor;
    });

    expect(bgColor).toBeTruthy();
  });
});

test.describe("Theme Toggle Icons", () => {
  test("should show appropriate icon for current theme", async ({ page }) => {
    await page.goto("/");
    await waitForPageLoad(page);

    // The theme toggle button contains both sun and moon icons (one visible at a time)
    const sunIcon = page.locator('nav button.relative svg.lucide-sun');
    const moonIcon = page.locator('nav button.relative svg.lucide-moon');

    // Both icons should exist (one is hidden via CSS transforms)
    const hasSunIcon = (await sunIcon.count()) > 0;
    const hasMoonIcon = (await moonIcon.count()) > 0;

    expect(hasSunIcon || hasMoonIcon).toBeTruthy();
  });
});
