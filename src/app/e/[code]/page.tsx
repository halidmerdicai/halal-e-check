import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { additives } from "@/data/additives";
import { AdditiveDetail } from "@/components/additive-detail";
import { findAdditiveByCode, normalizeCode } from "@/lib/search";

type Props = {
  params: { code: string };
};

export function generateStaticParams() {
  return additives.flatMap((additive) => [{ code: additive.numericCode }, { code: additive.eNumber.toLowerCase() }]);
}

export function generateMetadata({ params }: Props): Metadata {
  const additive = findAdditiveByCode(params.code);
  if (!additive) {
    return {
      title: "E-number not found"
    };
  }

  return {
    title: `${additive.eNumber} Halal or Haram?`,
    description: `${additive.eNumber} ${additive.name}: ${additive.summary}`,
    alternates: {
      canonical: `/e/${additive.numericCode}`
    }
  };
}

export default function AdditivePage({ params }: Props) {
  const additive = findAdditiveByCode(params.code);
  if (!additive) notFound();

  const requested = normalizeCode(params.code);
  if (requested === additive.id && params.code.toLowerCase().startsWith("e")) {
    redirect(`/e/${additive.numericCode}`);
  }

  return <AdditiveDetail additive={additive} />;
}
