import { test, expect } from "@playwright/test";
import { monitorResources } from "./resources";

test("longest name and negation survive the complete checker UI", async ({ page }) => {
  await page.goto("check/");
  await page.getByLabel("Ingredients label").fill("gelatin-free candy, calcium stearoyl lactylate");
  await expect(page.getByText("1 known match", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "E482 · Calcium stearoyl lactylate", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /^E481 ·|^E441 ·/ })).toHaveCount(0);
});

test("resource monitor rejects a broken production chunk", async ({ page }) => {
  const assertHealthy = monitorResources(page);
  await page.route("**/_next/static/**/*.js", (route) => route.fulfill({ status: 404, body: "Missing deployment asset" }));
  await page.goto("./", { waitUntil: "networkidle" });
  expect(assertHealthy).toThrow();
});

test("real crop, OCR preview and explicit correction preserve unaccepted codes", async ({ page }) => {
  // Only the external OCR service is substituted. Image loading, crop geometry,
  // canvas pixels, preview, React state and ingredient matching are real.
  await page.route("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js", (route) => route.fulfill({
    contentType: "text/javascript",
    body: `window.Tesseract = { recognize: async (blob) => {
      const image = await createImageBitmap(blob);
      if (Math.abs(image.width - 360) > 2 || Math.abs(image.height - 180) > 2) throw new Error('Wrong OCR crop dimensions');
      return { data: { text: 'E4O7, E250i, E9999', confidence: 92 } };
    }};`
  }));
  await page.goto("check/");
  await page.getByLabel("Upload photo").setInputFiles({
    name: "crop-fixture.svg", mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="red"/><rect x="20" y="10" width="360" height="180" fill="#00ff00"/></svg>')
  });
  await page.getByRole("button", { name: "Preview crop", exact: true }).click();
  const preview = page.getByAltText("Preview of the selected crop before OCR scanning");
  await expect(preview).toBeVisible();
  await expect.poll(() => preview.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const pixels = await preview.evaluate((element) => {
    const image = element as HTMLImageElement;
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    return { width: canvas.width, height: canvas.height, corner: Array.from(context.getImageData(2, 2, 1, 1).data) };
  });
  expect(Math.abs(pixels.width - 360)).toBeLessThanOrEqual(2);
  expect(Math.abs(pixels.height - 180)).toBeLessThanOrEqual(2);
  expect(pixels.corner).toEqual([0, 255, 0, 255]);
  await page.getByRole("button", { name: "Scan selection", exact: true }).click();
  const review = page.getByRole("textbox", { name: "OCR text", exact: true });
  await expect(review).toHaveValue("E4O7, E250i, E9999");
  await expect(page.getByLabel("Ingredients label")).toHaveValue("");
  await review.fill("E4O7999, E250i, E9999");
  await page.getByRole("button", { name: "E4O7 to E407", exact: true }).click();
  await expect(review).toHaveValue("E4O7999, E250i, E9999");
  await review.fill("E4O7, E250i, E9999");
  await page.getByRole("button", { name: "E4O7 to E407", exact: true }).click();
  await expect(review).toHaveValue("E407, E250i, E9999");
  // Reapplying a stale suggestion must neither append a code nor accept others.
  await page.getByRole("button", { name: "E4O7 to E407", exact: true }).click();
  await expect(review).toHaveValue("E407, E250i, E9999");
  await page.getByRole("button", { name: "Confirm text and check", exact: true }).click();
  await expect(page.getByLabel("Ingredients label")).toHaveValue("E407, E250i, E9999");
  await expect(page.getByText("1 known match, 2 unknown codes")).toBeVisible();
});
