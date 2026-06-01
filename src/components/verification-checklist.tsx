import { CheckCircle2 } from "lucide-react";

const checks = [
  "Look for reliable halal certification on the finished product.",
  "Check whether the source is plant, synthetic, microbial, fish, insect, pork, or other animal.",
  "Use vegan or plant-based labels as helpful source clues, not as full halal certification.",
  "Ask the manufacturer when an E-number is source-dependent or unclear."
];

export function VerificationChecklist({ items = checks }: { items?: string[] }) {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 rounded-md border bg-card p-3 text-sm leading-6">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-primary" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
