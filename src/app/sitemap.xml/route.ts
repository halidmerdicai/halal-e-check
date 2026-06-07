import { additives } from "@/data/additives";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

const staticRoutes = [
  { path: "", changeFrequency: "weekly", priority: "1.0" },
  { path: "/guide", changeFrequency: "monthly", priority: "0.8" },
  { path: "/methodology", changeFrequency: "monthly", priority: "0.7" },
  { path: "/check", changeFrequency: "weekly", priority: "0.9" },
  { path: "/request", changeFrequency: "monthly", priority: "0.6" },
  { path: "/corrections", changeFrequency: "monthly", priority: "0.5" },
  { path: "/about", changeFrequency: "monthly", priority: "0.5" },
  { path: "/privacy", changeFrequency: "yearly", priority: "0.4" },
  { path: "/disclaimer", changeFrequency: "yearly", priority: "0.3" }
];

export function GET() {
  const now = new Date().toISOString();
  const staticEntries = staticRoutes.map(
    (route) => `
  <url>
    <loc>${escapeXml(`${siteUrl}${route.path}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changeFrequency}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  );

  const additiveEntries = additives.map(
    (additive) => `
  <url>
    <loc>${escapeXml(`${siteUrl}/e/${additive.numericCode}`)}</loc>
    <lastmod>${escapeXml(additive.lastReviewed)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${additive.status === "mashbooh" ? "0.9" : "0.7"}</priority>
  </url>`
  );

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...staticEntries, ...additiveEntries].join("")}
</urlset>`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8"
      }
    }
  );
}
