import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "react-image-crop/dist/ReactCrop.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { absoluteSiteUrl, siteUrl } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const ogImage = absoluteSiteUrl("/og-image.svg");

export const viewport: Viewport = {
  themeColor: "#16803c"
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Halal E-Check",
  manifest: absoluteSiteUrl("/manifest.webmanifest"),
  title: {
    default: "Halal E-Check | E-number halal checker",
    template: "%s | Halal E-Check"
  },
  description:
    "Search E-numbers and food additives for general halal guidance, source concerns, and verification steps.",
  keywords: [
    "halal E-number checker",
    "halal additives",
    "food additive halal",
    "E numbers",
    "emulsifier halal",
    "mashbooh additives"
  ],
  alternates: {
    canonical: siteUrl
  },
  appleWebApp: {
    title: "Halal E-Check",
    capable: true,
    statusBarStyle: "default"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: absoluteSiteUrl("/icon.svg"), type: "image/svg+xml" },
      { url: absoluteSiteUrl("/icon-192.png"), sizes: "192x192", type: "image/png" },
      { url: absoluteSiteUrl("/icon-512.png"), sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: absoluteSiteUrl("/apple-touch-icon.png"), sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    title: "Halal E-Check | E-number halal checker",
    description: "Search E-numbers and food additives for general halal guidance and source verification steps.",
    url: siteUrl,
    siteName: "Halal E-Check",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "Halal E-Check E-number halal checker"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Halal E-Check | E-number halal checker",
    description: "Search E-numbers and food additives for general halal guidance and source verification steps.",
    images: [ogImage]
  },
  robots: {
    index: true,
    follow: true
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
