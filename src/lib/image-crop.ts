export type PixelCropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function getSourceCropRect(
  naturalWidth: number,
  naturalHeight: number,
  renderedWidth: number,
  renderedHeight: number,
  crop: PixelCropRect
) {
  if (naturalWidth <= 0 || naturalHeight <= 0 || renderedWidth <= 0 || renderedHeight <= 0) {
    throw new Error("Image dimensions must be positive.");
  }

  const scaleX = naturalWidth / renderedWidth;
  const scaleY = naturalHeight / renderedHeight;
  const x = Math.max(0, Math.min(Math.round(crop.x * scaleX), naturalWidth - 1));
  const y = Math.max(0, Math.min(Math.round(crop.y * scaleY), naturalHeight - 1));

  return {
    x,
    y,
    width: Math.max(1, Math.min(Math.round(crop.width * scaleX), naturalWidth - x)),
    height: Math.max(1, Math.min(Math.round(crop.height * scaleY), naturalHeight - y))
  };
}
