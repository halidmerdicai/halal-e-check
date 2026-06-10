"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  HelpCircle,
  History,
  MessageSquareText,
  ScanText,
  Trash2,
  RotateCcw,
  ShieldAlert,
  Upload
} from "lucide-react";
import { checkIngredients } from "@/lib/ingredient-check";
import { getRiskGuidance, riskGuidanceCopy, type RiskGuidance } from "@/lib/risk-guidance";
import { getDecisionReason, getManufacturerQuestions } from "@/lib/decision-guide";
import { StatusBadge } from "@/components/status-badge";
import { RiskGuidanceBadge } from "@/components/risk-guidance-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const groups: RiskGuidance[] = ["avoid", "avoid-if-unclear", "verify", "permissible"];
const historyKey = "halal-e-check:recent-checks";
const maxHistoryItems = 10;

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
  ) => Promise<{ data: { text: string } }>;
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
    <section className="rounded-lg border bg-card p-4 sm:p-5">
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

function OcrPanel({ onText }: { onText: (text: string) => void }) {
  const [ocrState, setOcrState] = useState<OcrState>({
    status: "idle",
    message: "Upload or take a clear photo of the ingredients label.",
    progress: 0
  });

  async function readImage(file: File) {
    if (!file.type.startsWith("image/")) {
      setOcrState({ status: "error", message: "Please choose an image file.", progress: 0 });
      return;
    }

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

        return result.data.text.trim();
      };

      const enhancedText = await recognizeImage(enhancedImage, "Reading ingredients from enhanced image...", 15, 72);
      let text = enhancedText;

      if (!looksLikeUsefulOcrText(enhancedText)) {
        setOcrState({ status: "reading", message: "Trying a sharper text scan...", progress: 74 });
        const thresholdImage = await preprocessOcrImage(file, "threshold");
        const thresholdText = await recognizeImage(thresholdImage, "Reading ingredients from sharper image...", 76, 98);

        text = scoreOcrText(thresholdText) > scoreOcrText(enhancedText) ? thresholdText : enhancedText;
      }

      if (!text) {
        setOcrState({
          status: "error",
          message: "No readable text was found. Try a brighter, closer, sharper photo.",
          progress: 0
        });
        return;
      }

      onText(text);
      setOcrState({
        status: "success",
        message: "Text extracted. Review and fix the OCR text below before trusting the result.",
        progress: 100
      });
    } catch {
      setOcrState({
        status: "error",
        message: "OCR could not read this image. Try another photo or paste the ingredients manually.",
        progress: 0
      });
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void readImage(file);
  }

  return (
    <section className="rounded-lg border bg-card p-4 sm:p-5">
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
  if (!items.length) return null;

  return (
    <section className="rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <History className="mt-1 h-5 w-5 flex-none text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-semibold">Recent checks</h2>
            <p className="mt-1 text-sm text-muted-foreground">Stored privately in this browser.</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onClear} className="w-full gap-2 min-[420px]:w-auto">
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Clear all
        </Button>
      </div>

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
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Button type="button" size="sm" onClick={() => onLoad(item.input)}>
                  Reopen
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => onDelete(item.id)}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
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

  return (
    <div className="grid gap-5 sm:gap-6">
      <OcrPanel onText={(text) => setInput(text)} />

      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <label htmlFor="ingredients" className="text-sm font-semibold">
          Ingredients label
        </label>
        <textarea
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
              <ResultActions counts={counts} input={input} result={result} />
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

              {result.unknownCodes.length ? (
                <div className="rounded-lg border bg-card p-4 sm:p-5">
                  <h3 className="font-semibold">Unknown E-numbers</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    These codes were found but are not in the current dataset yet.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.unknownCodes.map((code) => (
                      <Link
                        key={code.code}
                        href={`/request?code=${encodeURIComponent(code.code)}&context=${encodeURIComponent(input.slice(Math.max(0, code.start - 80), Math.min(input.length, code.end + 80)))}`}
                        className="rounded-full border bg-background px-3 py-1 text-sm font-semibold hover:bg-accent"
                      >
                        Request {code.code}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
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
        onLoad={setInput}
        onDelete={deleteRecentCheck}
        onClear={clearRecentChecks}
      />
    </div>
  );
}
