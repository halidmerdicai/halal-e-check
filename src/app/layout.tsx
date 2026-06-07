import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://halal-e-check.local";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Halal E-Check | E-number halal checker",
    template: "%s | Halal E-Check"
  },
  description:
    "Search E-numbers and food additives for general halal guidance, source concerns, and verification steps.",
  openGraph: {
    title: "Halal E-Check",
    description: "A fast halal E-number checker for source-sensitive food additives.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
