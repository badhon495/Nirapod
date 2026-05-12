import { test, expect } from "@playwright/test";

test.describe("Public complaint feed", () => {
  test("home page loads without auth", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Nirapod/i);
  });

  test("tracker page accepts tracking ID", async ({ page }) => {
    await page.goto("/tracker");
    await page.getByRole("textbox").fill("1001");
    await page.getByRole("button", { name: /track|search/i }).click();
    // Either shows complaint or "not found" — both are valid outcomes for this test
    await expect(
      page.getByText(/#1001|not found|no complaint/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("no horizontal scroll at 320px on home", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(bodyWidth).toBeLessThanOrEqual(clientWidth);
  });
});

test.describe("Authenticated complaint submission", () => {
  test.use({ storageState: "e2e/.auth/citizen.json" });

  test.skip("citizen can submit complaint", async ({ page }) => {
    // Skipped until auth state fixture is set up via e2e/global-setup.ts
    // Steps: navigate to /create-complaint, fill form, submit, assert redirect
  });
});
