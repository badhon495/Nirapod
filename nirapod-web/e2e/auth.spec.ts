import { test, expect } from "@playwright/test";

test.describe("Login flow", () => {
  test("shows login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Nirapod/i);
    await expect(page.getByRole("heading", { name: /sign in|log in/i })).toBeVisible();
  });

  test("shows validation error on empty submit", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page.getByText(/required|invalid/i).first()).toBeVisible();
  });

  test("shows error on wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("wrong@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page.getByText(/invalid|incorrect|not found/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("no horizontal scroll at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/login");
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(bodyWidth).toBeLessThanOrEqual(clientWidth);
  });
});
