import type { MetadataRoute } from "next";
import { INDEXABLE, SITE_URL } from "@/lib/site";

/**
 * Served at /robots.txt. The proxy's matcher excludes anything containing a
 * dot, so this is not rewritten to /en/robots.txt.
 */
export default function robots(): MetadataRoute.Robots {
  // Preview deployments are public URLs. Left open they compete with the real
  // site for its own queries, and Google decides which one wins.
  if (!INDEXABLE) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
