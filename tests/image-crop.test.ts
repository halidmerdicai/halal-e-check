import assert from "node:assert/strict";
import test from "node:test";
import { getSourceCropRect } from "../src/lib/image-crop";

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
