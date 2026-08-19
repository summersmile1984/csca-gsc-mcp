"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSitemapRequest = resolveSitemapRequest;
exports.submitSitemap = submitSitemap;
exports.listSitemaps = listSitemaps;
const auth_js_1 = require("../auth.js");
const oauth_js_1 = require("../oauth.js");
function resolveSitemapRequest(configuredSiteUrl, sitemapUrl) {
    const defaultSitemapUrl = configuredSiteUrl.startsWith("sc-domain:")
        ? `https://${configuredSiteUrl.slice("sc-domain:".length)}/sitemap.xml`
        : `${configuredSiteUrl.replace(/\/$/, "")}/sitemap.xml`;
    return {
        siteUrl: configuredSiteUrl,
        sitemapUrl: sitemapUrl || defaultSitemapUrl,
    };
}
async function submitSitemap(sitemapUrl) {
    if ((0, auth_js_1.getAuthMode)() === "oauth" && (0, oauth_js_1.getScopeTier)() === "readonly") {
        return {
            siteUrl: "",
            sitemapUrl: sitemapUrl || "",
            success: false,
            error: "Sitemap submission needs full access, but this install is in read only mode (GSC_SCOPES=readonly). " +
                "Re-run `npx suganthan-gsc-mcp setup --reauth` and choose full access, then try again.",
        };
    }
    const client = await (0, auth_js_1.getSearchConsoleClient)();
    const { siteUrl: configSiteUrl } = (0, auth_js_1.getConfig)();
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
    }
    catch (error) {
        return {
            siteUrl: request.siteUrl,
            sitemapUrl: request.sitemapUrl,
            success: false,
            error: error.message || String(error),
        };
    }
}
async function listSitemaps() {
    const client = await (0, auth_js_1.getSearchConsoleClient)();
    const { siteUrl: configSiteUrl } = (0, auth_js_1.getConfig)();
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
