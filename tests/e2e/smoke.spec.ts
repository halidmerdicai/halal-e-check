import { test, expect } from "@playwright/test";
import { monitorResources } from "./resources";

test("home, exact search and ingredient check hydrate with working resources", async ({ page }) => {
  const assertHealthy = monitorResources(page);
  await page.goto("./", { waitUntil: "networkidle" });
  const search = page.getByRole("textbox", { name: "Search E-numbers" });
  await search.fill("E9999");
  await expect(page.getByText("No matching additive yet.", { exact: false })).toBeVisible();
  await search.press("Enter");
  await expect(search).toBeVisible();
  await search.fill("E471");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/e\/471\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Mono");
  await expect(page.getByText("Expert review pending.", { exact: false }).first()).toBeVisible();
  await page.goto("check/", { waitUntil: "networkidle" });
  await page.getByLabel("Ingredients label").fill("E9999, E5009, E471z");
  await expect(page.getByText("0 known matches, 3 unknown codes")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Unknown E-numbers" })).toBeVisible();
  assertHealthy();
});
