import assert from "node:assert/strict";
import test from "node:test";

import { resolveSitemapRequest } from "../dist/tools/submit-sitemap.js";

test("keeps a domain property for the Sitemaps API", () => {
  assert.deepEqual(resolveSitemapRequest("sc-domain:csca-china.com"), {
    siteUrl: "sc-domain:csca-china.com",
    sitemapUrl: "https://csca-china.com/sitemap.xml",
  });
});

test("normalizes the default sitemap URL for URL-prefix properties", () => {
  assert.deepEqual(resolveSitemapRequest("https://csca-china.com/"), {
    siteUrl: "https://csca-china.com/",
    sitemapUrl: "https://csca-china.com/sitemap.xml",
  });
});

test("preserves an explicitly supplied sitemap URL", () => {
  assert.deepEqual(
    resolveSitemapRequest(
      "sc-domain:csca-china.com",
      "https://csca-china.com/sitemaps/articles.xml",
    ),
    {
      siteUrl: "sc-domain:csca-china.com",
      sitemapUrl: "https://csca-china.com/sitemaps/articles.xml",
    },
  );
});
