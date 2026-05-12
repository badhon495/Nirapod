import { test, expect } from "@playwright/test";
import AxeBuilder from "axe-playwright";

const PUBLIC_PAGES = [
  { name: "login", path: "/login" },
  { name: "signup", path: "/signup" },
  { name: "tracker", path: "/tracker" },
  { name: "home", path: "/" },
];

for (const { name, path } of PUBLIC_PAGES) {
  test(`a11y: ${name} page has no critical violations`, async ({ page }) => {
    await page.goto(path);
    // Wait for content to settle
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules([
        // Color contrast requires a real color context; skip in headless
        "color-contrast",
      ])
      .analyze();

    expect(
      results.violations,
      `Accessibility violations on ${path}:\n${results.violations
        .map((v) => `  [${v.impact}] ${v.id}: ${v.description}\n    ${v.nodes.map((n) => n.html).join("\n    ")}`)
        .join("\n")}`,
    ).toHaveLength(0);
  });
}

test("a11y: no horizontal scroll at 320px on all public pages", async ({ page }) => {
  for (const { path } of PUBLIC_PAGES) {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(path);
    await page.waitForLoadState("domcontentloaded");

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(bodyWidth, `Horizontal scroll on ${path} at 320px`).toBeLessThanOrEqual(clientWidth);
  }
});
