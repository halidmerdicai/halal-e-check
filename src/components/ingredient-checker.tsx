"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ReactCrop, { convertToPixelCrop, type Crop, type PixelCrop } from "react-image-crop";
import {
  AlertTriangle,
  BookmarkPlus,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  HelpCircle,
  History,
  MessageSquareText,
  PackageCheck,
  ScanText,
  Trash2,
  RotateCcw,
  RotateCw,
  ShieldAlert,
  Upload,
  X,
  ChevronDown
} from "lucide-react";
import { checkIngredients, cleanIngredientCodeText, type IngredientCodeCorrection } from "@/lib/ingredient-check";
import { getRiskGuidance, riskGuidanceCopy, type RiskGuidance } from "@/lib/risk-guidance";
import { getDecisionReason, getManufacturerQuestions } from "@/lib/decision-guide";
import { StatusBadge } from "@/components/status-badge";
import { RiskGuidanceBadge } from "@/components/risk-guidance-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const groups: RiskGuidance[] = ["avoid", "avoid-if-unclear", "verify", "permissible"];
const historyKey = "halal-e-check:recent-checks";
const savedProductsKey = "halal-e-check:saved-products";
const ocrReportsKey = "halal-e-check:ocr-correction-reports";
const maxHistoryItems = 10;
const maxSavedProducts = 50;
const maxOcrReports = 25;

const example =
  "Ingredients: wheat flour, sugar, vegetable oil, emulsifier E471, soy lecithin (E322), color E120, raising agent E500, flavour enhancer E631.";

type OcrState = {
  status: "idle" | "reading" | "success" | "error";
  message: string;
  progress: number;
};

type TesseractLoggerMessage = {
  status?: string;
  progress?: number;
};

type BrowserTesseract = {
  recognize: (
    image: File | Blob,
    language?: string,
    options?: { logger?: (message: TesseractLoggerMessage) => void }
  ) => Promise<{ data: { text: string; confidence?: number } }>;
};

type OcrReview = {
  rawText: string;
  originalText: string;
  text: string;
  confidence: number | null;
  imageUrl: string;
  corrections: IngredientCodeCorrection[];
  suspiciousCodes: string[];
};

type OcrCorrectionReport = {
  id: string;
  createdAt: string;
  originalText: string;
  correctedText: string;
  confidence: number | null;
  suspiciousCodes: string[];
  corrections: IngredientCodeCorrection[];
};

declare global {
  interface Window {
    Tesseract?: BrowserTesseract;
  }
}

function loadTesseract() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OCR is only available in the browser."));
  }

  if (window.Tesseract) return Promise.resolve(window.Tesseract);

  return new Promise<BrowserTesseract>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-halal-e-check-ocr="true"]');

    if (existing) {
      existing.addEventListener("load", () => {
        if (window.Tesseract) resolve(window.Tesseract);
        else reject(new Error("OCR script loaded without Tesseract."));
      });
      existing.addEventListener("error", () => reject(new Error("OCR script failed to load.")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.async = true;
    script.defer = true;
    script.dataset.halalECheckOcr = "true";
    script.onload = () => {
      if (window.Tesseract) resolve(window.Tesseract);
      else reject(new Error("OCR script loaded without Tesseract."));
    };
    script.onerror = () => reject(new Error("OCR script failed to load."));
    document.head.appendChild(script);
  });
}

type PreprocessMode = "enhanced" | "threshold";

const maxOcrImageSide = 2200;
const usefulTextSignals = [
  "ingredient",
  "ingredients",
  "sastojci",
  "sastav",
  "emulsifier",
  "emulgator",
  "lecithin",
  "lecitin",
  "gelatin",
  "zelatin",
  "karmin",
  "carmine",
  "shellac",
  "selak"
];

function loadImageElement(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image could not be loaded."));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Image preprocessing failed."));
      },
      "image/png",
      1
    );
  });
}

function loadImageUrl(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image preview could not be loaded."));
    image.src = url;
  });
}

function defaultCrop(): Crop {
  return { unit: "%", x: 5, y: 5, width: 90, height: 90 };
}

async function createCroppedImageFromVisibleSelection(image: HTMLImageElement, cropRoot: HTMLElement, fileName: string) {
  const selection = cropRoot.querySelector<HTMLElement>(".ReactCrop__crop-selection");
  if (!selection) throw new Error("No crop selection was found.");

  const imageRect = image.getBoundingClientRect();
  const selectionRect = selection.getBoundingClientRect();
  const left = Math.max(selectionRect.left, imageRect.left);
  const top = Math.max(selectionRect.top, imageRect.top);
  const right = Math.min(selectionRect.right, imageRect.right);
  const bottom = Math.min(selectionRect.bottom, imageRect.bottom);

  if (right <= left || bottom <= top || imageRect.width <= 0 || imageRect.height <= 0) {
    throw new Error("The selected crop is outside the image.");
  }

  const scaleX = image.naturalWidth / imageRect.width;
  const scaleY = image.naturalHeight / imageRect.height;
  const sourceX = Math.max(0, Math.round((left - imageRect.left) * scaleX));
  const sourceY = Math.max(0, Math.round((top - imageRect.top) * scaleY));
  const sourceWidth = Math.max(1, Math.min(Math.round((right - left) * scaleX), image.naturalWidth - sourceX));
  const sourceHeight = Math.max(1, Math.min(Math.round((bottom - top) * scaleY), image.naturalHeight - sourceY));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Image cropping is not supported in this browser.");

  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);

  const blob = await canvasToBlob(canvas);
  return new File([blob], fileName.replace(/\.[^.]+$/, "") + "-cropped.png", { type: "image/png" });
}

async function rotateImageUrl(imageUrl: string, fileName: string) {
  const image = await loadImageUrl(imageUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image rotation is not supported in this browser.");

  canvas.width = image.naturalHeight;
  canvas.height = image.naturalWidth;
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(Math.PI / 2);
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  const blob = await canvasToBlob(canvas);
  return { url: URL.createObjectURL(blob), fileName };
}

function findSuspiciousOcrCodes(text: string, corrections: IngredientCodeCorrection[]) {
  const tokens = text.match(/\bE\s*[0-9OIL]{3,4}[A-Z]?\b/gi) ?? [];
  const correctedTokens = corrections.flatMap((correction) => [correction.from, correction.to]);

  return Array.from(
    new Set(
      [...tokens, ...correctedTokens]
        .map((token) => token.replace(/\s+/g, "").toUpperCase())
        .filter(Boolean)
    )
  ).slice(0, 12);
}

function getConfidenceLabel(confidence: number | null) {
  if (confidence === null) return { label: "Unknown confidence", className: "border-amber-300 bg-amber-50 text-amber-950" };
  if (confidence < 70) return { label: "Low confidence", className: "border-red-300 bg-red-50 text-red-950" };
  if (confidence < 85) return { label: "Medium confidence", className: "border-amber-300 bg-amber-50 text-amber-950" };
  return { label: "High confidence", className: "border-emerald-300 bg-emerald-50 text-emerald-950" };
}

function buildFlexibleCodePattern(value: string) {
  return new RegExp(value.trim().split("").map((character) => `${escapeRegExp(character)}[\\s-]*`).join("").replace(/\[\\s-\]\*$/, ""), "gi");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getDetectedOcrCodes(text: string) {
  const result = checkIngredients(text);
  const known = result.matches.map((match) => ({
    code: match.additive.eNumber,
    label: riskGuidanceCopy[getRiskGuidance(match.additive)].label,
    className: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
  }));
  const unknown = result.unknownCodes.map((item) => ({
    code: item.code,
    label: "Unknown",
    className: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
  }));
  const deduped = new Map<string, { code: string; label: string; className: string }>();

  for (const item of [...known, ...unknown]) {
    deduped.set(item.code.toUpperCase(), item);
  }

  return Array.from(deduped.values()).slice(0, 18);
}

async function preprocessOcrImage(file: File, mode: PreprocessMode) {
  const image = await loadImageElement(file);
  const scale = Math.min(1, maxOcrImageSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) throw new Error("Image preprocessing is not supported in this browser.");

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;
  let totalLuminance = 0;

  for (let index = 0; index < data.length; index += 4) {
    const luminance = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    totalLuminance += luminance;
  }

  const averageLuminance = totalLuminance / (data.length / 4);
  const threshold = Math.max(120, Math.min(190, averageLuminance * 0.92));

  for (let index = 0; index < data.length; index += 4) {
    const luminance = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const value =
      mode === "threshold"
        ? luminance > threshold
          ? 255
          : 0
        : Math.max(0, Math.min(255, (luminance - 128) * 1.45 + 142));

    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
    data[index + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
  return canvasToBlob(canvas);
}

function scoreOcrText(text: string) {
  const normalized = text.toLowerCase();
  const eNumberMatches = normalized.match(/\be[\s-]?\d{3,4}[a-z]?\b/g)?.length ?? 0;
  const signalMatches = usefulTextSignals.filter((signal) => normalized.includes(signal)).length;
  const alphaNumericCount = normalized.replace(/[^a-z0-9]/g, "").length;

  return alphaNumericCount + eNumberMatches * 60 + signalMatches * 35;
}

function looksLikeUsefulOcrText(text: string) {
  const normalized = text.toLowerCase();
  const compactLength = normalized.replace(/\s+/g, "").length;

  if (compactLength >= 80) return true;
  if (/\be[\s-]?\d{3,4}[a-z]?\b/.test(normalized)) return true;
  return compactLength >= 24 && usefulTextSignals.some((signal) => normalized.includes(signal));
}

type GuidanceCounts = Record<RiskGuidance, number>;

type RecentCheck = {
  id: string;
  input: string;
  preview: string;
  checkedAt: string;
  verdict: RiskGuidance;
  counts: GuidanceCounts;
  knownCount: number;
  unknownCount: number;
};

type SavedProductDecision = "none" | "safe-for-me" | "avoid";

type SavedProduct = {
  id: string;
  name: string;
  brand: string;
  note: string;
  decision: SavedProductDecision;
  input: string;
  preview: string;
  savedAt: string;
  updatedAt: string;
  verdict: RiskGuidance;
  counts: GuidanceCounts;
  knownCount: number;
  unknownCount: number;
};

const verdictMeta = {
  avoid: {
    title: "Avoid",
    action: "This label includes an additive that is strongly avoided. Choose a halal-certified alternative unless a trusted halal authority explicitly accepts this product.",
    icon: ShieldAlert,
    className: "border-red-200 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
  },
  "avoid-if-unclear": {
    title: "Avoid if source is unclear",
    action: "This label includes source-dependent additives. Verify plant, vegan, manufacturer-confirmed, or halal-certified source before relying on it.",
    icon: AlertTriangle,
    className: "border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100"
  },
  verify: {
    title: "Verify source",
    action: "No strict avoid additive was detected, but some additives still need source, carrier, or certification checks.",
    icon: HelpCircle,
    className: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100"
  },
  permissible: {
    title: "No major additive concerns found",
    action: "The detected additives are generally low concern. Still check the full product, certification, and any ingredients this tool did not detect.",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
  }
};

function getVerdict(counts: GuidanceCounts, unknownCount: number): RiskGuidance {
  if (counts.avoid > 0) return "avoid";
  if (counts["avoid-if-unclear"] > 0) return "avoid-if-unclear";
  if (counts.verify > 0 || unknownCount > 0) return "verify";
  return "permissible";
}

function formatReport({
  counts,
  input,
  result,
  detailed
}: {
  counts: GuidanceCounts;
  input: string;
  result: ReturnType<typeof checkIngredients>;
  detailed: boolean;
}) {
  const verdict = getVerdict(counts, result.unknownCodes.length);
  const lines = [
    "Halal E-Check result",
    "",
    `Overall: ${verdictMeta[verdict].title}`,
    `Known additives: ${result.matches.length}`,
    `Avoid: ${counts.avoid}`,
    `Avoid if unclear: ${counts["avoid-if-unclear"]}`,
    `Verify source: ${counts.verify}`,
    `Generally OK: ${counts.permissible}`,
    `Unknown: ${result.unknownCodes.length}`,
    "",
    "Detected:"
  ];

  if (result.matches.length) {
    for (const match of result.matches) {
      const guidance = getRiskGuidance(match.additive);
      lines.push(`- ${match.additive.eNumber} ${match.additive.name}: ${riskGuidanceCopy[guidance].label}`);
      if (detailed) {
        lines.push(`  Matched: ${match.matchedText}`);
        lines.push(`  Status: ${match.additive.status}`);
        lines.push(`  Action: ${match.additive.saferAction}`);
      }
    }
  } else {
    lines.push("- No known additives detected.");
  }

  if (result.unknownCodes.length) {
    lines.push("", "Unknown E-numbers:");
    for (const code of result.unknownCodes) {
      lines.push(`- ${code.code}`);
    }
  }

  if (detailed) {
    lines.push("", "Original label:", input.trim());
  }

  lines.push(
    "",
    "Reminder: This is general halal ingredient guidance. Verify doubtful ingredients with the manufacturer or a trusted halal certifier."
  );

  return lines.join("\n");
}

function ResultActions({
  counts,
  input,
  result
}: {
  counts: GuidanceCounts;
  input: string;
  result: ReturnType<typeof checkIngredients>;
}) {
  const [copyStatus, setCopyStatus] = useState("");

  async function copyReport(detailed: boolean) {
    const report = formatReport({ counts, input, result, detailed });
    try {
      await navigator.clipboard.writeText(report);
      setCopyStatus(detailed ? "Detailed results copied." : "Summary copied.");
    } catch {
      setCopyStatus("Copy failed. Select and copy the report manually.");
    }
  }

  function downloadReport() {
    const report = formatReport({ counts, input, result, detailed: true });
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "halal-e-check-result.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setCopyStatus("Text report downloaded.");
  }

  return (
    <section className="scroll-mt-20 rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">Save or share result</h3>
          <p className="mt-1 text-sm text-muted-foreground">Copy a short summary, copy full details, or download a text report.</p>
        </div>
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 sm:flex sm:flex-wrap sm:justify-end">
          <Button type="button" variant="outline" onClick={() => copyReport(false)} className="gap-2">
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy summary
          </Button>
          <Button type="button" variant="outline" onClick={() => copyReport(true)} className="gap-2">
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            Copy details
          </Button>
          <Button type="button" onClick={downloadReport} className="gap-2">
            <Download className="h-4 w-4" aria-hidden="true" />
            Download
          </Button>
        </div>
      </div>
      {copyStatus ? <p className="mt-3 text-sm font-medium text-primary">{copyStatus}</p> : null}
    </section>
  );
}

function makePreview(input: string) {
  const compact = input.trim().replace(/\s+/g, " ");
  return compact.length > 110 ? `${compact.slice(0, 110)}...` : compact;
}

function readHistory(): RecentCheck[] {
  try {
    const raw = window.localStorage.getItem(historyKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(items: RecentCheck[]) {
  window.localStorage.setItem(historyKey, JSON.stringify(items.slice(0, maxHistoryItems)));
}

function readSavedProducts(): SavedProduct[] {
  try {
    const raw = window.localStorage.getItem(savedProductsKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedProducts(items: SavedProduct[]) {
  window.localStorage.setItem(savedProductsKey, JSON.stringify(items.slice(0, maxSavedProducts)));
}

function isGuidance(value: unknown): value is RiskGuidance {
  return typeof value === "string" && groups.includes(value as RiskGuidance);
}

function isDecision(value: unknown): value is SavedProductDecision {
  return value === "none" || value === "safe-for-me" || value === "avoid";
}

function sanitizeCounts(value: unknown): GuidanceCounts {
  const source = value && typeof value === "object" ? (value as Partial<Record<RiskGuidance, unknown>>) : {};

  return {
    avoid: typeof source.avoid === "number" && Number.isFinite(source.avoid) ? Math.max(0, Math.round(source.avoid)) : 0,
    "avoid-if-unclear":
      typeof source["avoid-if-unclear"] === "number" && Number.isFinite(source["avoid-if-unclear"])
        ? Math.max(0, Math.round(source["avoid-if-unclear"]))
        : 0,
    verify: typeof source.verify === "number" && Number.isFinite(source.verify) ? Math.max(0, Math.round(source.verify)) : 0,
    permissible:
      typeof source.permissible === "number" && Number.isFinite(source.permissible) ? Math.max(0, Math.round(source.permissible)) : 0
  };
}

function sanitizeSavedProduct(value: unknown): SavedProduct | null {
  if (!value || typeof value !== "object") return null;

  const source = value as Record<string, unknown>;
  const input = typeof source.input === "string" ? source.input.trim() : "";
  const name = typeof source.name === "string" ? source.name.trim() : "";

  if (!input || !name) return null;

  const now = new Date().toISOString();
  const counts = sanitizeCounts(source.counts);

  return {
    id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    brand: typeof source.brand === "string" ? source.brand.trim() : "",
    note: typeof source.note === "string" ? source.note.trim() : "",
    decision: isDecision(source.decision) ? source.decision : "none",
    input,
    preview: typeof source.preview === "string" && source.preview.trim() ? source.preview.trim() : makePreview(input),
    savedAt: typeof source.savedAt === "string" && source.savedAt.trim() ? source.savedAt : now,
    updatedAt: typeof source.updatedAt === "string" && source.updatedAt.trim() ? source.updatedAt : now,
    verdict: isGuidance(source.verdict) ? source.verdict : getVerdict(counts, 0),
    counts,
    knownCount: typeof source.knownCount === "number" && Number.isFinite(source.knownCount) ? Math.max(0, Math.round(source.knownCount)) : 0,
    unknownCount:
      typeof source.unknownCount === "number" && Number.isFinite(source.unknownCount) ? Math.max(0, Math.round(source.unknownCount)) : 0
  };
}

function parseSavedProductsBackup(value: unknown): SavedProduct[] {
  const rawItems = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as { products?: unknown }).products)
      ? (value as { products: unknown[] }).products
      : [];

  const deduped = new Map<string, SavedProduct>();

  for (const rawItem of rawItems) {
    const item = sanitizeSavedProduct(rawItem);
    if (!item) continue;
    deduped.set(item.input, item);
  }

  return Array.from(deduped.values()).slice(0, maxSavedProducts);
}

function readOcrReports(): OcrCorrectionReport[] {
  try {
    const raw = window.localStorage.getItem(ocrReportsKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOcrReports(items: OcrCorrectionReport[]) {
  window.localStorage.setItem(ocrReportsKey, JSON.stringify(items.slice(0, maxOcrReports)));
}

function OcrPanel({ onText }: { onText: (text: string) => void }) {
  const cropSectionRef = useRef<HTMLDivElement | null>(null);
  const cropRootRef = useRef<HTMLDivElement | null>(null);
  const cropImageRef = useRef<HTMLImageElement | null>(null);
  const reviewSectionRef = useRef<HTMLDivElement | null>(null);
  const ocrTextRef = useRef<HTMLTextAreaElement | null>(null);
  const [ocrState, setOcrState] = useState<OcrState>({
    status: "idle",
    message: "Upload or take a clear photo of the ingredients label.",
    progress: 0
  });
  const [ocrCorrections, setOcrCorrections] = useState<IngredientCodeCorrection[]>([]);
  const [ocrReview, setOcrReview] = useState<OcrReview | null>(null);
  const [pendingImage, setPendingImage] = useState<{ url: string; fileName: string } | null>(null);
  const [cropPreview, setCropPreview] = useState<{ file: File; url: string } | null>(null);
  const [crop, setCrop] = useState<Crop>(defaultCrop());
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [ocrReportCount, setOcrReportCount] = useState(0);
  const [ocrReportStatus, setOcrReportStatus] = useState("");

  useEffect(() => {
    setOcrReportCount(readOcrReports().length);
  }, []);

  useEffect(() => {
    return () => {
      if (pendingImage) URL.revokeObjectURL(pendingImage.url);
    };
  }, [pendingImage]);

  useEffect(() => {
    return () => {
      if (cropPreview) URL.revokeObjectURL(cropPreview.url);
    };
  }, [cropPreview]);

  useEffect(() => {
    return () => {
      if (ocrReview) URL.revokeObjectURL(ocrReview.imageUrl);
    };
  }, [ocrReview]);

  useEffect(() => {
    if (!pendingImage) return;

    const timeout = window.setTimeout(() => {
      cropSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [pendingImage]);

  useEffect(() => {
    if (!ocrReview) return;

    const timeout = window.setTimeout(() => {
      reviewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (window.matchMedia("(pointer: fine)").matches) {
        ocrTextRef.current?.focus({ preventScroll: true });
      }
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [ocrReview]);

  function resetCropEditor() {
    setCrop(defaultCrop());
    setCompletedCrop(null);
    setCropPreview(null);
  }

  function clearCropPreview() {
    setCropPreview((preview) => {
      if (preview) URL.revokeObjectURL(preview.url);
      return null;
    });
  }

  async function readImage(file: File, imageUrl: string) {
    if (!file.type.startsWith("image/")) {
      setOcrState({ status: "error", message: "Please choose an image file.", progress: 0 });
      return false;
    }

    setOcrCorrections([]);
    setOcrState({ status: "reading", message: "Preparing OCR engine...", progress: 5 });

    try {
      const tesseract = await loadTesseract();
      setOcrState({ status: "reading", message: "Improving image contrast...", progress: 10 });
      const enhancedImage = await preprocessOcrImage(file, "enhanced");

      const recognizeImage = async (image: File | Blob, messageText: string, startProgress: number, endProgress: number) => {
        const result = await tesseract.recognize(image, "eng", {
          logger: (message) => {
            if (message.status === "recognizing text" && typeof message.progress === "number") {
              setOcrState({
                status: "reading",
                message: messageText,
                progress: Math.max(startProgress, Math.round(startProgress + message.progress * (endProgress - startProgress)))
              });
            }
          }
        });

        return {
          text: result.data.text.trim(),
          confidence: typeof result.data.confidence === "number" ? Math.round(result.data.confidence) : null
        };
      };

      const enhancedResult = await recognizeImage(enhancedImage, "Reading ingredients from enhanced image...", 15, 72);
      let selectedResult = enhancedResult;

      if (!looksLikeUsefulOcrText(enhancedResult.text)) {
        setOcrState({ status: "reading", message: "Trying a sharper text scan...", progress: 74 });
        const thresholdImage = await preprocessOcrImage(file, "threshold");
        const thresholdResult = await recognizeImage(thresholdImage, "Reading ingredients from sharper image...", 76, 98);

        selectedResult = scoreOcrText(thresholdResult.text) > scoreOcrText(enhancedResult.text) ? thresholdResult : enhancedResult;
      }

      const text = selectedResult.text;
      if (!text) {
        setOcrState({
          status: "error",
          message: "No readable text was found. Try a brighter, closer, sharper photo.",
          progress: 0
        });
        return false;
      }

      const cleaned = cleanIngredientCodeText(text);
      setOcrCorrections(cleaned.corrections);
      setOcrReview({
        rawText: text,
        originalText: cleaned.text || text,
        text: cleaned.text || text,
        confidence: selectedResult.confidence,
        imageUrl,
        corrections: cleaned.corrections,
        suspiciousCodes: findSuspiciousOcrCodes(text, cleaned.corrections)
      });
      setOcrState({
        status: "success",
        message: "OCR draft ready. Review it before applying the additive check.",
        progress: 100
      });
      return true;
    } catch {
      setOcrState({
        status: "error",
        message: "OCR could not read this image. Try another photo or paste the ingredients manually.",
        progress: 0
      });
      return false;
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setOcrState({ status: "error", message: "Please choose an image file.", progress: 0 });
      return;
    }

    resetCropEditor();
    setOcrCorrections([]);
    setOcrReportStatus("");
    setOcrReview(null);
    clearCropPreview();
    setPendingImage({ url: URL.createObjectURL(file), fileName: file.name || "ingredients.jpg" });
    setOcrState({ status: "idle", message: "Image ready for cropping.", progress: 0 });
  }

  async function createSelectedCropFile() {
    if (!pendingImage || !completedCrop || !cropImageRef.current || !cropRootRef.current) {
      setOcrState({ status: "error", message: "The crop area is not ready yet.", progress: 0 });
      return null;
    }

    try {
      return await createCroppedImageFromVisibleSelection(cropImageRef.current, cropRootRef.current, pendingImage.fileName);
    } catch {
      setOcrState({
        status: "error",
        message: "The selected crop could not be processed. Reset the image and try again.",
        progress: 0
      });
      return null;
    }
  }

  async function previewSelectedCrop() {
    setOcrState({ status: "reading", message: "Preparing selected crop preview...", progress: 3 });
    const croppedFile = await createSelectedCropFile();
    if (!croppedFile) return;

    clearCropPreview();
    setCropPreview({ file: croppedFile, url: URL.createObjectURL(croppedFile) });
    setOcrState({ status: "idle", message: "Crop preview ready. Scan it or adjust the crop.", progress: 0 });
  }

  async function scanSelectedCrop() {
    setOcrState({ status: "reading", message: "Preparing selected crop...", progress: 3 });
    const croppedFile = await createSelectedCropFile();
    if (!croppedFile) return;

    const reviewImageUrl = URL.createObjectURL(croppedFile);
    const succeeded = await readImage(croppedFile, reviewImageUrl);

    if (succeeded) {
      setPendingImage(null);
      clearCropPreview();
    } else {
      URL.revokeObjectURL(reviewImageUrl);
    }
  }

  function applyReviewedText() {
    if (!ocrReview?.text.trim()) return;
    onText(ocrReview.text.trim());
    setOcrCorrections(ocrReview.corrections);
    setOcrReview(null);
    setOcrState({ status: "success", message: "Reviewed OCR text applied to the additive check.", progress: 100 });
  }

  function applyOcrCorrection(correction: IngredientCodeCorrection) {
    setOcrReportStatus("");
    setOcrReview((review) => {
      if (!review) return review;

      const pattern = buildFlexibleCodePattern(correction.from);
      const nextText = review.text.replace(pattern, correction.to);
      const fallbackText = nextText === review.text ? `${review.text.trim()} ${correction.to}`.trim() : nextText;
      const cleaned = cleanIngredientCodeText(fallbackText);

      return {
        ...review,
        text: cleaned.text,
        corrections: [...review.corrections, ...cleaned.corrections].filter(
          (item, index, items) => items.findIndex((candidate) => candidate.from === item.from && candidate.to === item.to) === index
        ),
        suspiciousCodes: findSuspiciousOcrCodes(fallbackText, [...review.corrections, ...cleaned.corrections])
      };
    });
  }

  function saveOcrCorrectionReport() {
    if (!ocrReview) return;

    const originalText = ocrReview.originalText.trim();
    const correctedText = ocrReview.text.trim();

    if (!correctedText) {
      setOcrReportStatus("Correct the OCR text before saving the example.");
      return;
    }

    if (originalText === correctedText) {
      setOcrReportStatus("No change detected. Edit the OCR text first if it was wrong.");
      return;
    }

    const report: OcrCorrectionReport = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      originalText,
      correctedText,
      confidence: ocrReview.confidence,
      suspiciousCodes: ocrReview.suspiciousCodes,
      corrections: ocrReview.corrections
    };
    const reports = [report, ...readOcrReports()].slice(0, maxOcrReports);

    writeOcrReports(reports);
    setOcrReportCount(reports.length);
    setOcrReportStatus("OCR mistake saved privately in this browser.");
  }

  async function rotatePendingImage() {
    if (!pendingImage) return;

    try {
      setOcrState({ status: "reading", message: "Rotating image...", progress: 2 });
      const rotatedImage = await rotateImageUrl(pendingImage.url, pendingImage.fileName);
      resetCropEditor();
      clearCropPreview();
      setPendingImage(rotatedImage);
      setOcrState({ status: "idle", message: "Image rotated. Resize the crop box around the ingredients.", progress: 0 });
    } catch {
      setOcrState({ status: "error", message: "The image could not be rotated.", progress: 0 });
    }
  }

  const confidenceDisplay = ocrReview ? getConfidenceLabel(ocrReview.confidence) : null;
  const reviewRequired = Boolean(
    ocrReview && (ocrReview.confidence === null || ocrReview.confidence < 85 || ocrReview.corrections.length > 0)
  );
  const reviewHasManualCorrection = Boolean(ocrReview && ocrReview.originalText.trim() !== ocrReview.text.trim());
  const detectedOcrCodes = ocrReview ? getDetectedOcrCodes(ocrReview.text) : [];

  return (
    <section className="scroll-mt-20 rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ScanText className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="font-semibold">Scan ingredients from image</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Works best with clear English or Bosnian/Croatian/Serbian Latin-script labels. Always review OCR text before relying on results.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap sm:justify-end">
          <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Camera className="h-4 w-4" aria-hidden="true" />
            Take photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              disabled={ocrState.status === "reading"}
              onChange={handleFileChange}
            />
          </label>
          <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload photo
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={ocrState.status === "reading"}
              onChange={handleFileChange}
            />
          </label>
        </div>
      </div>

      {pendingImage ? (
        <div ref={cropSectionRef} className="scroll-mt-4 mt-4 border-t pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-semibold">Manually crop ingredients</h3>
              <p className="mt-1 truncate text-xs text-muted-foreground">{pendingImage.fileName}</p>
              <p className="mt-1 text-xs text-muted-foreground">Drag the crop box and resize it from any edge or corner.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Rotate 90 degrees"
                aria-label="Rotate image 90 degrees"
                disabled={ocrState.status === "reading"}
                onClick={() => void rotatePendingImage()}
              >
                <RotateCw className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Reset crop"
                aria-label="Reset crop"
                disabled={ocrState.status === "reading"}
                onClick={resetCropEditor}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Cancel image"
                aria-label="Cancel image"
                disabled={ocrState.status === "reading"}
                onClick={() => {
                  setPendingImage(null);
                  clearCropPreview();
                  resetCropEditor();
                  setOcrState({ status: "idle", message: "Upload or take a clear photo of the ingredients label.", progress: 0 });
                }}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div ref={cropRootRef} className="mt-4 flex max-h-[34rem] justify-center overflow-auto rounded-md bg-black p-2 sm:p-4">
            <ReactCrop
              crop={crop}
              minWidth={40}
              minHeight={40}
              keepSelection
              ruleOfThirds
              disabled={ocrState.status === "reading"}
              onChange={(_, percentCrop) => {
                clearCropPreview();
                setCrop(percentCrop);
              }}
              onComplete={(pixelCrop) => {
                clearCropPreview();
                setCompletedCrop(pixelCrop);
              }}
              className="max-w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={cropImageRef}
                src={pendingImage.url}
                alt="Selected ingredient label"
                className="block max-h-[30rem] max-w-full object-contain"
                onLoad={(event) => {
                  const image = event.currentTarget;
                  cropImageRef.current = image;
                  const nextCrop = defaultCrop();
                  setCrop(nextCrop);
                  setCompletedCrop(convertToPixelCrop(nextCrop, image.width, image.height));
                }}
              />
            </ReactCrop>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Only the area inside the crop box will be scanned.</p>
            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={ocrState.status === "reading" || !completedCrop}
                onClick={() => void previewSelectedCrop()}
                className="gap-2 sm:shrink-0"
              >
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                Preview crop
              </Button>
              <Button
                type="button"
                disabled={ocrState.status === "reading" || !completedCrop}
                onClick={() => void scanSelectedCrop()}
                className="gap-2 sm:shrink-0"
              >
                <ScanText className="h-4 w-4" aria-hidden="true" />
                Scan selection
              </Button>
            </div>
          </div>

          {cropPreview ? (
            <div className="mt-4 rounded-md border bg-background p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Selected crop preview</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This exact image will be scanned. Adjust the crop if the preview includes extra text.
                  </p>
                </div>
                <Button type="button" variant="outline" disabled={ocrState.status === "reading"} onClick={clearCropPreview} className="sm:shrink-0">
                  Hide preview
                </Button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cropPreview.url}
                alt="Preview of the selected crop before OCR scanning"
                className="mt-3 max-h-[20rem] w-full rounded-md border bg-black object-contain"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {ocrReview && confidenceDisplay ? (
        <div ref={reviewSectionRef} className="scroll-mt-4 mt-4 border-t pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">Review extracted text</h3>
                <span className={cn("rounded-full border px-2 py-1 text-xs font-semibold", confidenceDisplay.className)}>
                  {confidenceDisplay.label}
                  {ocrReview.confidence !== null ? ` · ${ocrReview.confidence}%` : ""}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Compare the text with the image and correct mistakes before checking additives.
              </p>
            </div>
            {reviewRequired ? (
              <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                Review required
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)]">
            <div>
              <p className="mb-2 text-sm font-medium">Scanned crop</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ocrReview.imageUrl}
                alt="Cropped ingredient label used for OCR"
                className="max-h-[26rem] w-full rounded-md border bg-black object-contain"
              />
            </div>
            <label className="grid content-start gap-2 text-sm font-medium">
              OCR text
              <textarea
                ref={ocrTextRef}
                value={ocrReview.text}
                onChange={(event) => {
                  setOcrReportStatus("");
                  setOcrReview((review) => (review ? { ...review, text: event.target.value } : review));
                }}
                className="min-h-64 w-full resize-y rounded-md border bg-background px-3 py-2 font-mono text-sm font-normal leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                spellCheck={false}
              />
            </label>
          </div>

          {detectedOcrCodes.length ? (
            <div className="mt-4 rounded-md border bg-background p-3 text-sm">
              <p className="font-medium">Detected E-numbers in reviewed text</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {detectedOcrCodes.map((item) => (
                  <span key={`${item.code}-${item.label}`} className={cn("rounded-full border px-2 py-1 font-mono text-xs font-semibold", item.className)}>
                    {item.code}
                    <span className="ml-1 font-sans font-medium">{item.label}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {ocrReview.suspiciousCodes.length ? (
            <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
              <p className="font-medium">Codes to verify against the image</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ocrReview.suspiciousCodes.map((code) => (
                  <span key={code} className="rounded-full border border-current/30 bg-background/70 px-2 py-1 font-mono text-xs font-semibold">
                    {code}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {ocrReview.corrections.length ? (
            <div className="mt-3 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100">
              <p className="font-medium">Quick OCR corrections</p>
              <p className="mt-1 text-xs opacity-80">Use these if the OCR text still shows the wrong version.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ocrReview.corrections.slice(0, 6).map((correction) => (
                  <Button
                    key={`${correction.from}-${correction.to}`}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyOcrCorrection(correction)}
                    className="h-auto gap-1 rounded-full bg-background/70 px-2 py-1 font-mono text-xs"
                  >
                    {correction.from}
                    <span className="font-sans">to</span>
                    {correction.to}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-3 rounded-md border bg-background p-3 text-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium">Was the OCR wrong?</p>
                <p className="mt-1 text-muted-foreground">
                  Edit the OCR text above, then save the mistake example. Saved examples stay private in this browser.
                </p>
                {ocrReportCount ? (
                  <p className="mt-2 text-xs text-muted-foreground">{ocrReportCount} OCR example{ocrReportCount === 1 ? "" : "s"} saved.</p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                className="gap-2 sm:shrink-0"
                disabled={!reviewHasManualCorrection}
                onClick={saveOcrCorrectionReport}
              >
                <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                Save OCR mistake
              </Button>
            </div>
            {ocrReportStatus ? <p className="mt-3 text-sm font-medium text-primary">{ocrReportStatus}</p> : null}
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOcrReview(null);
                setOcrCorrections([]);
                setOcrReportStatus("");
                setOcrState({ status: "idle", message: "Choose another photo or take a new one.", progress: 0 });
              }}
            >
              Choose another image
            </Button>
            <Button type="button" className="gap-2" disabled={!ocrReview.text.trim()} onClick={applyReviewedText}>
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              Confirm text and check
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${ocrState.status === "idle" ? 0 : ocrState.progress}%` }}
          />
        </div>
        <p
          className={cn(
            "mt-2 text-sm",
            ocrState.status === "error" ? "text-red-700 dark:text-red-300" : "text-muted-foreground",
            ocrState.status === "success" ? "font-medium text-primary" : null
          )}
        >
          {ocrState.message}
        </p>
      </div>
      <div className="mt-4 grid gap-2 text-xs leading-5 text-muted-foreground sm:grid-cols-3">
        <p className="rounded-md border bg-background p-2">Use bright light and keep the label flat.</p>
        <p className="rounded-md border bg-background p-2">Crop close to ingredients when possible.</p>
        <p className="rounded-md border bg-background p-2">Fix OCR mistakes in the text box before trusting results.</p>
      </div>
      {!ocrReview && ocrCorrections.length ? (
        <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100">
          <p className="font-medium">Likely OCR code corrections</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ocrCorrections.slice(0, 6).map((correction) => (
              <span key={`${correction.from}-${correction.to}`} className="rounded-full border bg-background/70 px-2 py-1 text-xs font-semibold">
                {correction.from} to {correction.to}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function RecentChecks({
  items,
  onLoad,
  onDelete,
  onClear
}: {
  items: RecentCheck[];
  onLoad: (input: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  const [copyStatus, setCopyStatus] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  if (!items.length) return null;

  async function copyRecentCheck(item: RecentCheck) {
    try {
      await navigator.clipboard.writeText(item.input);
      setCopyStatus("Ingredient text copied from recent checks.");
    } catch {
      setCopyStatus("Copy failed. Reopen the check and copy the text manually.");
    }
  }

  return (
    <section className="scroll-mt-20 rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={() => setIsOpen((current) => !current)} className="flex min-w-0 gap-3 text-left" aria-expanded={isOpen}>
          <History className="mt-1 h-5 w-5 flex-none text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">Recent checks</h2>
              <span className="rounded-full border px-2 py-0.5 text-xs font-semibold">{items.length}</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : null)} aria-hidden="true" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Stored privately in this browser.</p>
          </div>
        </button>
        {isOpen ? (
          <Button type="button" variant="outline" size="sm" onClick={onClear} className="w-full gap-2 min-[420px]:w-auto">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear all
          </Button>
        ) : null}
      </div>
      {copyStatus ? <p className="mt-3 text-sm font-medium text-primary">{copyStatus}</p> : null}

      {isOpen ? (
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-md border bg-background p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border px-2 py-1 text-xs font-semibold">
                    {riskGuidanceCopy[item.verdict].label}
                  </span>
                  <span className="text-xs text-muted-foreground">{new Date(item.checkedAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 break-words text-sm leading-6">{item.preview}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.knownCount} known, {item.unknownCount} unknown · Avoid {item.counts.avoid} · Avoid if unclear{" "}
                  {item.counts["avoid-if-unclear"]} · Verify {item.counts.verify}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                <Button type="button" size="sm" onClick={() => onLoad(item.input)}>
                  Reopen
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => void copyRecentCheck(item)}>
                  Copy
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => onDelete(item.id)} className="col-span-2 min-[460px]:col-span-1">
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      ) : null}
    </section>
  );
}

function SaveProductPanel({
  input,
  counts,
  result,
  verdict,
  onSave
}: {
  input: string;
  counts: GuidanceCounts;
  result: ReturnType<typeof checkIngredients>;
  verdict: RiskGuidance;
  onSave: (product: SavedProduct) => void;
}) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");

  function saveProduct() {
    const trimmedInput = input.trim();
    const trimmedName = name.trim();

    if (!trimmedInput) {
      setStatus("Check ingredients before saving a product.");
      return;
    }

    if (!trimmedName) {
      setStatus("Add a product name before saving.");
      return;
    }

    const now = new Date().toISOString();
    const product: SavedProduct = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmedName,
      brand: brand.trim(),
      note: note.trim(),
      decision: "none",
      input: trimmedInput,
      preview: makePreview(trimmedInput),
      savedAt: now,
      updatedAt: now,
      verdict,
      counts,
      knownCount: result.matches.length,
      unknownCount: result.unknownCodes.length
    };

    onSave(product);
    setStatus("Product saved privately in this browser.");
    setName("");
    setBrand("");
    setNote("");
  }

  return (
    <section className="rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BookmarkPlus className="h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="font-semibold">Save product</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Keep this check in a private product list on this device.</p>
        </div>
        <span className="rounded-full border px-2 py-1 text-xs font-semibold">{riskGuidanceCopy[verdict].label}</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Product name
          <input
            value={name}
            onChange={(event) => {
              setStatus("");
              setName(event.target.value);
            }}
            placeholder="Pizza Capricciosa"
            className="min-h-10 rounded-md border bg-background px-3 py-2 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Brand
          <input
            value={brand}
            onChange={(event) => {
              setStatus("");
              setBrand(event.target.value);
            }}
            placeholder="Brand or store"
            className="min-h-10 rounded-md border bg-background px-3 py-2 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Note
          <textarea
            value={note}
            onChange={(event) => {
              setStatus("");
              setNote(event.target.value);
            }}
            placeholder="Why you saved it, where you found it, or what still needs checking."
            className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm font-normal leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {status ? <p className="text-sm font-medium text-primary">{status}</p> : <p className="text-sm text-muted-foreground">Saved products stay on this device.</p>}
        <Button type="button" onClick={saveProduct} className="gap-2 sm:shrink-0">
          <PackageCheck className="h-4 w-4" aria-hidden="true" />
          Save product
        </Button>
      </div>
    </section>
  );
}

function SavedProducts({
  items,
  onLoad,
  onCopy,
  onDelete,
  onDecisionChange,
  onClear,
  onExport,
  onImport
}: {
  items: SavedProduct[];
  onLoad: (input: string) => void;
  onCopy: (input: string) => void;
  onDelete: (id: string) => void;
  onDecisionChange: (id: string, decision: SavedProductDecision) => void;
  onClear: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="scroll-mt-20 rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={() => setIsOpen((current) => !current)} className="flex min-w-0 gap-3 text-left" aria-expanded={isOpen}>
          <PackageCheck className="mt-1 h-5 w-5 flex-none text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">Saved products</h2>
              <span className="rounded-full border px-2 py-0.5 text-xs font-semibold">{items.length}</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : null)} aria-hidden="true" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Your private product list on this device.</p>
          </div>
        </button>
        {isOpen ? (
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 sm:flex sm:flex-wrap sm:justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onExport} disabled={!items.length} className="gap-2">
            <Download className="h-4 w-4" aria-hidden="true" />
            Export
          </Button>
          <label className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent">
            <Upload className="h-4 w-4" aria-hidden="true" />
            Import
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) onImport(file);
              }}
            />
          </label>
          <Button type="button" variant="outline" size="sm" onClick={onClear} disabled={!items.length} className="gap-2">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
        </div>
        ) : null}
      </div>

      {isOpen ? (
      items.length ? (
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-md border bg-background p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{item.name}</h3>
                  {item.brand ? <span className="text-sm text-muted-foreground">{item.brand}</span> : null}
                  <span className="rounded-full border px-2 py-1 text-xs font-semibold">{riskGuidanceCopy[item.verdict].label}</span>
                  {item.decision !== "none" ? (
                    <span
                      className={cn(
                        "rounded-full border px-2 py-1 text-xs font-semibold",
                        item.decision === "safe-for-me"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                          : "border-red-200 bg-red-50 text-red-950"
                      )}
                    >
                      {item.decision === "safe-for-me" ? "Safe for me" : "Avoid"}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Saved {new Date(item.savedAt).toLocaleString()}</p>
                <p className="mt-2 break-words text-sm leading-6">{item.preview}</p>
                {item.note ? <p className="mt-2 rounded-md border bg-card p-2 text-sm leading-6">{item.note}</p> : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.knownCount} known, {item.unknownCount} unknown · Avoid {item.counts.avoid} · Avoid if unclear{" "}
                  {item.counts["avoid-if-unclear"]} · Verify {item.counts.verify}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 min-[460px]:grid-cols-3 lg:flex lg:flex-wrap lg:justify-end">
                <Button type="button" size="sm" onClick={() => onLoad(item.input)}>
                  Reopen
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => onCopy(item.input)}>
                  Copy
                </Button>
                <Button
                  type="button"
                  variant={item.decision === "safe-for-me" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onDecisionChange(item.id, item.decision === "safe-for-me" ? "none" : "safe-for-me")}
                >
                  Safe
                </Button>
                <Button
                  type="button"
                  variant={item.decision === "avoid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onDecisionChange(item.id, item.decision === "avoid" ? "none" : "avoid")}
                >
                  Avoid
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => onDelete(item.id)} className="col-span-2 min-[460px]:col-span-1">
                  Delete
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      ) : (
        <div className="mt-4 rounded-md border bg-background p-4 text-sm leading-6 text-muted-foreground">
          <p className="font-medium text-foreground">No saved products yet</p>
          <p className="mt-1">Save a checked product here, or import a Halal E-Check backup from another browser.</p>
        </div>
      )
      ) : null}
    </section>
  );
}

function SummaryPanel({ counts, unknownCount }: { counts: GuidanceCounts; unknownCount: number }) {
  const verdict = getVerdict(counts, unknownCount);
  const meta = verdictMeta[verdict];
  const Icon = meta.icon;

  return (
    <div className={cn("rounded-lg border p-4 sm:p-5", meta.className)}>
      <div className="flex gap-3">
        <Icon className="mt-1 h-5 w-5 flex-none" aria-hidden="true" />
        <div>
          <h3 className="text-lg font-semibold sm:text-xl">{meta.title}</h3>
          <p className="mt-2 text-sm leading-6">{meta.action}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-5">
        {groups.map((group) => (
          <div key={group} className="rounded-md border bg-background/70 p-3">
            <p className="text-xl font-bold sm:text-2xl">{counts[group]}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide">{riskGuidanceCopy[group].label}</p>
          </div>
        ))}
        <div className="rounded-md border bg-background/70 p-3">
          <p className="text-xl font-bold sm:text-2xl">{unknownCount}</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide">Unknown</p>
        </div>
      </div>
    </div>
  );
}

function ResultNextSteps({ counts, unknownCount }: { counts: GuidanceCounts; unknownCount: number }) {
  const steps: Array<{ label: string; detail: string; active: boolean; className: string }> = [
    {
      label: "Avoid this product for now",
      detail: "A strict avoid additive was detected. Use a halal-certified alternative unless a trusted authority accepts this exact product.",
      active: counts.avoid > 0,
      className: highlightStyles.avoid
    },
    {
      label: "Verify source before buying",
      detail: "Ask whether source-sensitive additives are plant, synthetic, vegan, halal-certified, or manufacturer-confirmed.",
      active: counts["avoid-if-unclear"] > 0 || counts.verify > 0,
      className: counts["avoid-if-unclear"] > 0 ? highlightStyles["avoid-if-unclear"] : highlightStyles.verify
    },
    {
      label: "Check unknown codes",
      detail: "Unknown codes are not in the current dataset yet. Treat them as unresolved until checked.",
      active: unknownCount > 0,
      className: highlightStyles.unknown
    },
    {
      label: "No major additive concern found",
      detail: "Detected additives are generally lower concern, but the full product and certification still matter.",
      active: counts.avoid === 0 && counts["avoid-if-unclear"] === 0 && counts.verify === 0 && unknownCount === 0,
      className: highlightStyles.permissible
    }
  ];

  return (
    <section className="rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-semibold">What to do now</h3>
          <p className="mt-1 text-sm text-muted-foreground">Follow the active items first. They are based on the detected additives.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {steps.map((step) => (
          <div
            key={step.label}
            className={cn(
              "rounded-md border p-3",
              step.active ? step.className : "border-muted bg-muted/40 text-muted-foreground"
            )}
          >
            <div className="flex items-start gap-2">
              {step.active ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
              ) : (
                <span className="mt-1 h-3 w-3 flex-none rounded-full border" aria-hidden="true" />
              )}
              <div>
                <p className="text-sm font-semibold">{step.label}</p>
                <p className="mt-1 text-xs leading-5">{step.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const highlightStyles: Record<RiskGuidance | "unknown", string> = {
  avoid: "border-red-200 bg-red-100 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
  "avoid-if-unclear":
    "border-orange-200 bg-orange-100 text-orange-950 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100",
  verify: "border-sky-200 bg-sky-100 text-sky-950 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100",
  permissible:
    "border-emerald-200 bg-emerald-100 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
  unknown: "border-muted bg-muted text-foreground"
};

type IngredientMatchItem = ReturnType<typeof checkIngredients>["matches"][number];

function MatchCard({ additive, matchedBy, matchedText }: IngredientMatchItem) {
  const guidance = getRiskGuidance(additive);
  const primaryQuestion = getManufacturerQuestions(additive)[0];
  const askText =
    guidance === "permissible"
      ? "Is the finished product halal-certified or otherwise suitable for your standard?"
      : primaryQuestion;

  return (
    <article className="p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href={`/e/${additive.numericCode}`} className="font-semibold text-primary hover:underline">
            {additive.eNumber} · {additive.name}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            Matched {matchedBy.replace("-", " ")}: {matchedText}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:max-w-48 sm:justify-end">
          <StatusBadge status={additive.status} className="px-2 py-1 text-xs sm:px-3 sm:text-sm" />
          <RiskGuidanceBadge additive={additive} className="px-2 py-1 text-xs sm:px-3 sm:text-sm" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-md border bg-background p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why it matters</p>
          <p className="mt-2 text-sm leading-6">{getDecisionReason(additive)}</p>
        </div>
        <div className="rounded-md border bg-background p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next action</p>
          <p className="mt-2 text-sm leading-6">{additive.saferAction}</p>
        </div>
        <div className="rounded-md border bg-background p-3">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 flex-none text-primary" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ask this</p>
          </div>
          <p className="mt-2 text-sm leading-6">{askText}</p>
        </div>
      </div>
    </article>
  );
}

function UnknownCodesPanel({ input, codes }: { input: string; codes: ReturnType<typeof checkIngredients>["unknownCodes"] }) {
  if (!codes.length) return null;

  return (
    <section className="rounded-lg border bg-card p-4 sm:p-5">
      <div>
        <h3 className="font-semibold">Unknown E-numbers</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          These codes were found but are not in the current dataset yet. Treat them as unresolved until they are checked.
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {codes.map((code) => {
          const context = input.slice(Math.max(0, code.start - 80), Math.min(input.length, code.end + 80));

          return (
            <article key={code.code} className="rounded-md border bg-background p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-base font-bold">{code.code}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Matched text: {code.matchedText}</p>
                </div>
                <Link
                  href={`/request?code=${encodeURIComponent(code.code)}&context=${encodeURIComponent(context)}`}
                  className="inline-flex min-h-9 items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold hover:bg-accent"
                >
                  Request review
                </Link>
              </div>
              <div className="mt-3 rounded-md border bg-card p-3 text-sm leading-6">
                <p className="font-medium">Next action</p>
                <p className="mt-1 text-muted-foreground">
                  Search the package, manufacturer website, or halal certificate for this code. If you cannot verify it, keep the product in the
                  verify category.
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function HighlightedLabel({ input, result }: { input: string; result: ReturnType<typeof checkIngredients> }) {
  const ranges = [
    ...result.matches
      .filter((match) => match.start >= 0 && match.end > match.start)
      .map((match) => ({
        start: match.start,
        end: match.end,
        key: match.additive.id,
        label: `${match.additive.eNumber}: ${riskGuidanceCopy[getRiskGuidance(match.additive)].label}`,
        guidance: getRiskGuidance(match.additive) as RiskGuidance | "unknown"
      })),
    ...result.unknownCodes
      .filter((code) => code.start >= 0 && code.end > code.start)
      .map((code) => ({
        start: code.start,
        end: code.end,
        key: code.code,
        label: `${code.code}: Unknown`,
        guidance: "unknown" as const
      }))
  ]
    .sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start))
    .reduce<Array<{ start: number; end: number; key: string; label: string; guidance: RiskGuidance | "unknown" }>>((acc, range) => {
      const previous = acc[acc.length - 1];
      if (previous && range.start < previous.end) return acc;
      acc.push(range);
      return acc;
    }, []);

  if (!ranges.length) return null;

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  ranges.forEach((range, index) => {
    if (range.start > cursor) {
      parts.push(<span key={`text-${index}`}>{input.slice(cursor, range.start)}</span>);
    }

    parts.push(
      <mark
        key={`mark-${range.key}-${index}`}
        title={range.label}
        className={cn("rounded border px-1 py-0.5 font-semibold", highlightStyles[range.guidance])}
      >
        {input.slice(range.start, range.end)}
      </mark>
    );
    cursor = range.end;
  });

  if (cursor < input.length) {
    parts.push(<span key="text-end">{input.slice(cursor)}</span>);
  }

  return (
    <section className="rounded-lg border bg-card p-4 sm:p-5">
      <h3 className="font-semibold">Matched label view</h3>
      <p className="mt-1 text-sm text-muted-foreground">Highlighted terms show what triggered each result.</p>
      <div className="mt-4 whitespace-pre-wrap break-words rounded-md border bg-background p-3 text-sm leading-7 sm:p-4">{parts}</div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
        {groups.map((group) => (
          <span key={group} className={cn("rounded-full border px-2 py-1", highlightStyles[group])}>
            {riskGuidanceCopy[group].label}
          </span>
        ))}
        <span className={cn("rounded-full border px-2 py-1", highlightStyles.unknown)}>Unknown</span>
      </div>
    </section>
  );
}

export function IngredientChecker() {
  const [input, setInput] = useState("");
  const [recentChecks, setRecentChecks] = useState<RecentCheck[]>([]);
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [savedProductStatus, setSavedProductStatus] = useState("");
  const inputSectionRef = useRef<HTMLElement | null>(null);
  const inputTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const result = useMemo(() => checkIngredients(input), [input]);

  const grouped = useMemo(
    () =>
      groups.map((group) => ({
        group,
        matches: result.matches.filter((match) => getRiskGuidance(match.additive) === group)
      })),
    [result.matches]
  );

  const counts = useMemo(
    () =>
      grouped.reduce(
        (acc, item) => {
          acc[item.group] = item.matches.length;
          return acc;
        },
        { avoid: 0, "avoid-if-unclear": 0, verify: 0, permissible: 0 } as GuidanceCounts
      ),
    [grouped]
  );

  const hasInput = input.trim().length > 0;
  const hasResults = result.matches.length > 0 || result.unknownCodes.length > 0;
  const verdict = useMemo(() => getVerdict(counts, result.unknownCodes.length), [counts, result.unknownCodes.length]);

  useEffect(() => {
    setRecentChecks(readHistory());
    setSavedProducts(readSavedProducts());
  }, []);

  useEffect(() => {
    if (!hasInput || !hasResults) return;

    const timeout = window.setTimeout(() => {
      const trimmed = input.trim();
      const item: RecentCheck = {
        id: `${Date.now()}-${trimmed.slice(0, 16)}`,
        input: trimmed,
        preview: makePreview(trimmed),
        checkedAt: new Date().toISOString(),
        verdict,
        counts,
        knownCount: result.matches.length,
        unknownCount: result.unknownCodes.length
      };
      const current = readHistory().filter((historyItem) => historyItem.input !== trimmed);
      const next = [item, ...current].slice(0, maxHistoryItems);
      writeHistory(next);
      setRecentChecks(next);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [counts, hasInput, hasResults, input, result.matches.length, result.unknownCodes.length, verdict]);

  function deleteRecentCheck(id: string) {
    const next = recentChecks.filter((item) => item.id !== id);
    writeHistory(next);
    setRecentChecks(next);
  }

  function clearRecentChecks() {
    writeHistory([]);
    setRecentChecks([]);
  }

  function saveProduct(product: SavedProduct) {
    const next = [product, ...savedProducts.filter((item) => item.input !== product.input)].slice(0, maxSavedProducts);
    writeSavedProducts(next);
    setSavedProducts(next);
    setSavedProductStatus("Product saved.");
  }

  async function copySavedProductInput(savedInput: string) {
    try {
      await navigator.clipboard.writeText(savedInput);
      setSavedProductStatus("Saved product ingredients copied.");
    } catch {
      setSavedProductStatus("Copy failed. Reopen the product and copy the text manually.");
    }
  }

  function deleteSavedProduct(id: string) {
    const next = savedProducts.filter((item) => item.id !== id);
    writeSavedProducts(next);
    setSavedProducts(next);
    setSavedProductStatus("Saved product deleted.");
  }

  function updateSavedProductDecision(id: string, decision: SavedProductDecision) {
    const now = new Date().toISOString();
    const next = savedProducts.map((item) => (item.id === id ? { ...item, decision, updatedAt: now } : item));
    writeSavedProducts(next);
    setSavedProducts(next);
    setSavedProductStatus(decision === "none" ? "Product mark cleared." : "Product mark updated.");
  }

  function clearSavedProducts() {
    writeSavedProducts([]);
    setSavedProducts([]);
    setSavedProductStatus("Saved products cleared.");
  }

  function exportSavedProducts() {
    if (!savedProducts.length) {
      setSavedProductStatus("No saved products to export.");
      return;
    }

    const backup = {
      app: "Halal E-Check",
      type: "saved-products",
      version: 1,
      exportedAt: new Date().toISOString(),
      products: savedProducts
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `halal-e-check-saved-products-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setSavedProductStatus("Saved products exported.");
  }

  async function importSavedProducts(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const imported = parseSavedProductsBackup(parsed);

      if (!imported.length) {
        setSavedProductStatus("No valid saved products found in that backup.");
        return;
      }

      const mergedByInput = new Map<string, SavedProduct>();
      for (const item of savedProducts) mergedByInput.set(item.input, item);
      for (const item of imported) mergedByInput.set(item.input, item);

      const next = Array.from(mergedByInput.values())
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, maxSavedProducts);

      writeSavedProducts(next);
      setSavedProducts(next);
      setSavedProductStatus(`Imported ${imported.length} saved product${imported.length === 1 ? "" : "s"}.`);
    } catch {
      setSavedProductStatus("Import failed. Choose a valid Halal E-Check JSON backup.");
    }
  }

  function loadRecentCheck(nextInput: string) {
    setInput(nextInput);
    window.setTimeout(() => {
      inputSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (window.matchMedia("(pointer: fine)").matches) {
        inputTextareaRef.current?.focus({ preventScroll: true });
      }
    }, 50);
  }

  return (
    <div className="grid gap-5 sm:gap-6">
      <OcrPanel onText={(text) => setInput(text)} />

      <section ref={inputSectionRef} className="scroll-mt-4 rounded-lg border bg-card p-4 sm:p-5">
        <label htmlFor="ingredients" className="text-sm font-semibold">
          Ingredients label
        </label>
        <textarea
          ref={inputTextareaRef}
          id="ingredients"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste ingredients here..."
          className="mt-3 min-h-40 w-full rounded-md border border-input bg-background p-3 text-base leading-7 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-44 sm:p-4"
        />
        <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap">
          <Button type="button" onClick={() => setInput(example)} className="gap-2">
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            Use example
          </Button>
          <Button type="button" variant="outline" onClick={() => setInput("")} className="gap-2">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
        </div>
      </section>

      {hasInput ? (
        <section className="grid gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">Detected additives</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.matches.length} known match{result.matches.length === 1 ? "" : "es"}
                {result.unknownCodes.length ? `, ${result.unknownCodes.length} unknown code${result.unknownCodes.length === 1 ? "" : "s"}` : ""}
              </p>
            </div>
          </div>

          {hasResults ? (
            <div className="grid gap-4 sm:gap-5">
              <SummaryPanel counts={counts} unknownCount={result.unknownCodes.length} />
              <ResultNextSteps counts={counts} unknownCount={result.unknownCodes.length} />
              <ResultActions counts={counts} input={input} result={result} />
              <SaveProductPanel input={input} counts={counts} result={result} verdict={verdict} onSave={saveProduct} />
              <HighlightedLabel input={input} result={result} />

              {grouped.map(({ group, matches }) =>
                matches.length ? (
                  <div key={group} className="overflow-hidden rounded-lg border bg-card">
                    <div className="border-b px-4 py-3">
                      <h3 className="font-semibold">{riskGuidanceCopy[group].label}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{riskGuidanceCopy[group].description}</p>
                    </div>
                    <div className="divide-y">
                      {matches.map((match) => (
                        <MatchCard key={match.additive.id} {...match} />
                      ))}
                    </div>
                  </div>
                ) : null
              )}

              <UnknownCodesPanel input={input} codes={result.unknownCodes} />
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-6 text-sm leading-6 text-muted-foreground">
              <h3 className="font-semibold text-foreground">No additives detected</h3>
              <p className="mt-2">
                No E-numbers, additive names, or known aliases were found. Check whether the label uses plain names like
                lecithin, mono- and diglycerides, carmine, shellac, gelatin, or disodium inosinate instead of E-numbers.
              </p>
              <p className="mt-2">
                If the ingredient still looks source-dependent, use the request page and include the full label text.
              </p>
            </div>
          )}
        </section>
      ) : null}

      <RecentChecks
        items={recentChecks}
        onLoad={loadRecentCheck}
        onDelete={deleteRecentCheck}
        onClear={clearRecentChecks}
      />

      {savedProductStatus ? <p className="text-sm font-medium text-primary">{savedProductStatus}</p> : null}
      <SavedProducts
        items={savedProducts}
        onLoad={loadRecentCheck}
        onCopy={copySavedProductInput}
        onDelete={deleteSavedProduct}
        onDecisionChange={updateSavedProductDecision}
        onClear={clearSavedProducts}
        onExport={exportSavedProducts}
        onImport={(file) => void importSavedProducts(file)}
      />
    </div>
  );
}
