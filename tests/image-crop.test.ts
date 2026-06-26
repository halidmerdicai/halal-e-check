import assert from "node:assert/strict";
import test from "node:test";
import { getSourceCropRect, getSourceCropRectFromPercent } from "../src/lib/image-crop";

test("maps a portrait preview crop to the original label pixels", () => {
  assert.deepEqual(
    getSourceCropRect(3024, 4032, 360, 480, { x: 18, y: 24, width: 324, height: 432 }),
    { x: 151, y: 202, width: 2722, height: 3629 }
  );
});

test("maps a landscape preview crop to the original label pixels", () => {
  assert.deepEqual(
    getSourceCropRect(1600, 1200, 800, 600, { x: 80, y: 120, width: 640, height: 360 }),
    { x: 160, y: 240, width: 1280, height: 720 }
  );
});

test("clamps a crop to the source image bounds", () => {
  assert.deepEqual(
    getSourceCropRect(1200, 1600, 300, 400, { x: 280, y: 380, width: 80, height: 80 }),
    { x: 1120, y: 1520, width: 80, height: 80 }
  );
});

test("rejects unavailable rendered dimensions", () => {
  assert.throws(
    () => getSourceCropRect(1600, 1200, 0, 600, { x: 0, y: 0, width: 100, height: 100 }),
    /positive/
  );
});

test("maps a percent crop directly to original image pixels", () => {
  assert.deepEqual(
    getSourceCropRectFromPercent(3024, 4032, { x: 5, y: 10, width: 90, height: 40 }),
    { x: 151, y: 403, width: 2722, height: 1613 }
  );
});

test("clamps a percent crop to the source image bounds", () => {
  assert.deepEqual(
    getSourceCropRectFromPercent(1600, 1200, { x: 95, y: 90, width: 20, height: 20 }),
    { x: 1520, y: 1080, width: 80, height: 120 }
  );
});
