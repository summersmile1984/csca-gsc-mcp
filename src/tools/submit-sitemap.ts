import { getSearchConsoleClient, getConfig, getAuthMode } from "../auth.js";
import { getScopeTier } from "../oauth.js";

interface SitemapSubmitResult {
  siteUrl: string;
  sitemapUrl: string;
  success: boolean;
  error: string | null;
}

interface SitemapListResult {
  siteUrl: string;
  sitemaps: Array<{
    path: string;
    lastSubmitted: string | null;
    isPending: boolean;
    lastDownloaded: string | null;
    warnings: number;
    errors: number;
    contents: Array<{ type: string; submitted: number; indexed: number }>;
  }>;
}

export function resolveSitemapRequest(
  configuredSiteUrl: string,
  sitemapUrl?: string,
): { siteUrl: string; sitemapUrl: string } {
  const defaultSitemapUrl = configuredSiteUrl.startsWith("sc-domain:")
    ? `https://${configuredSiteUrl.slice("sc-domain:".length)}/sitemap.xml`
    : `${configuredSiteUrl.replace(/\/$/, "")}/sitemap.xml`;

  return {
    siteUrl: configuredSiteUrl,
    sitemapUrl: sitemapUrl || defaultSitemapUrl,
  };
}

export async function submitSitemap(sitemapUrl?: string): Promise<SitemapSubmitResult> {
  if (getAuthMode() === "oauth" && getScopeTier() === "readonly") {
    return {
      siteUrl: "",
      sitemapUrl: sitemapUrl || "",
      success: false,
      error:
        "Sitemap submission needs full access, but this install is in read only mode (GSC_SCOPES=readonly). " +
        "Re-run `npx suganthan-gsc-mcp setup --reauth` and choose full access, then try again.",
    };
  }

  const client = await getSearchConsoleClient();
  const { siteUrl: configSiteUrl } = getConfig();
  const request = resolveSitemapRequest(configSiteUrl, sitemapUrl);

  try {
    await client.sitemaps.submit({
      siteUrl: request.siteUrl,
      feedpath: request.sitemapUrl,
    });

    return {
      siteUrl: request.siteUrl,
      sitemapUrl: request.sitemapUrl,
      success: true,
      error: null,
    };
  } catch (error: any) {
    return {
      siteUrl: request.siteUrl,
      sitemapUrl: request.sitemapUrl,
      success: false,
      error: error.message || String(error),
    };
  }
}

export async function listSitemaps(): Promise<SitemapListResult> {
  const client = await getSearchConsoleClient();
  const { siteUrl: configSiteUrl } = getConfig();
  const response = await client.sitemaps.list({ siteUrl: configSiteUrl });

  const sitemaps = (response.data.sitemap || []).map((s) => ({
    path: s.path || "",
    lastSubmitted: s.lastSubmitted || null,
    isPending: s.isPending || false,
    lastDownloaded: s.lastDownloaded || null,
    warnings: Number(s.warnings) || 0,
    errors: Number(s.errors) || 0,
    contents: (s.contents || []).map((c) => ({
      type: c.type || "unknown",
      submitted: Number(c.submitted) || 0,
      indexed: Number(c.indexed) || 0,
    })),
  }));

  return {
    siteUrl: configSiteUrl,
    sitemaps,
  };
}
