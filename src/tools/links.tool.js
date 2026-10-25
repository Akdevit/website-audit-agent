import { chromium } from "playwright";

const TIMEOUT = 10000;
const MAX_LINKS = 30;
const CONCURRENCY = 4;
const MAX_REDIRECTS = 3;

const normalizeUrl = (value, baseUrl) => {
  try {
    const url = new URL(value, baseUrl);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    url.hash = "";

    return url.href;
  } catch {
    return null;
  }
};

const classifyStatus = (status) => {
  if (status >= 500) return "server-error";
  if (status === 404 || status === 410) return "broken";
  if (status >= 400) return "client-error";
  if (status >= 300) return "redirect";
  if (status >= 200) return "working";

  return "unknown";
};

// Check one link, following a bounded redirect chain.
const checkLink = async (url, origin) => {
  const startedAt = Date.now();
  let currentUrl = url;
  const redirects = [];

  try {
    for (let i = 0; i <= MAX_REDIRECTS; i++) {
      const current = new URL(currentUrl);

      // Initial development policy: same-origin only.
      if (current.origin !== origin) {
        return {
          url,
          finalUrl: currentUrl,
          status: "skipped",
          reason: "external-redirect",
          redirects,
          durationMs: Date.now() - startedAt,
        };
      }

      const response = await fetch(currentUrl, {
        method: "HEAD",
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT),
        headers: {
          "User-Agent": "WebsiteAuditAgent/1.0",
        },
      });

      // Some servers do not support HEAD.
      let result = response;

      if ([405, 501].includes(response.status)) {
        result = await fetch(currentUrl, {
          method: "GET",
          redirect: "manual",
          signal: AbortSignal.timeout(TIMEOUT),
          headers: {
            "User-Agent": "WebsiteAuditAgent/1.0",
          },
        });

        await result.body?.cancel();
      }

      const status = result.status;

      if (status >= 300 && status < 400) {
        const location = result.headers.get("location");

        await result.body?.cancel();

        if (!location) {
          return {
            url,
            statusCode: status,
            status: "redirect",
            redirects,
            durationMs: Date.now() - startedAt,
          };
        }

        const nextUrl = normalizeUrl(location, currentUrl);

        if (!nextUrl) {
          return {
            url,
            status: "error",
            reason: "invalid-redirect",
            durationMs: Date.now() - startedAt,
          };
        }

        redirects.push({
          from: currentUrl,
          to: nextUrl,
          statusCode: status,
        });

        currentUrl = nextUrl;
        continue;
      }

      await result.body?.cancel();

      return {
        url,
        finalUrl: currentUrl,
        statusCode: status,
        status: classifyStatus(status),
        redirects,
        durationMs: Date.now() - startedAt,
      };
    }

    return {
      url,
      status: "error",
      reason: "too-many-redirects",
      redirects,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      url,
      status: "error",
      reason: error.name === "TimeoutError" ? "timeout" : "network-error",
      error: error.message,
      redirects,
      durationMs: Date.now() - startedAt,
    };
  }
};

const collectLinks = async (url) => {
  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const context = await browser.newContext({
      serviceWorkers: "block",
    });

    const page = await context.newPage();

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    if (!response?.ok()) {
      throw new Error(
        `Page navigation failed: HTTP ${response?.status() ?? "unknown"}`,
      );
    }

    // Let client-side links render.
    await page
      .waitForFunction(
        () => {
          const root =
            document.querySelector("#root") ||
            document.querySelector("#app") ||
            document.querySelector("#__next");

          return root
            ? root.children.length > 0
            : document.body?.children.length > 0;
        },
        null,
        { timeout: 10000 },
      )
      .catch(() => null);

    await page.waitForTimeout(500);

    const baseUrl = page.url();

    const anchors = await page.locator("a[href]").evaluateAll((elements) =>
      elements.map((element) => ({
        href: element.getAttribute("href"),
        text: (element.textContent || "").trim().slice(0, 150),
      })),
    );

    return { baseUrl, anchors };
  } finally {
    await browser.close();
  }
};

export const analyzeLinks = async (url) => {
  console.log(`calling analyzeLinks tool url : ${url}`);

  const startedAt = Date.now();

  const target = new URL(url);

  if (!["http:", "https:"].includes(target.protocol)) {
    throw new Error("Only HTTP/HTTPS URLs are supported");
  }

  const { baseUrl, anchors } = await collectLinks(url);
  const origin = new URL(baseUrl).origin;

  const unique = new Map();
  let duplicateCount = 0;
  let otherProtocols = 0;

  for (const anchor of anchors) {
    const normalized = normalizeUrl(anchor.href, baseUrl);

    if (!normalized) {
      otherProtocols++;
      continue;
    }

    if (unique.has(normalized)) {
      duplicateCount++;
      continue;
    }

    unique.set(normalized, {
      url: normalized,
      text: anchor.text,
      type: new URL(normalized).origin === origin ? "internal" : "external",
    });
  }

  const links = [...unique.values()];

  const internal = links.filter((link) => link.type === "internal");

  const external = links.filter((link) => link.type === "external");

  const selected = internal.slice(0, MAX_LINKS);
  const results = [];

  // Bounded concurrency; no unrestricted Promise.all.
  for (let i = 0; i < selected.length; i += CONCURRENCY) {
    const batch = selected.slice(i, i + CONCURRENCY);

    const checked = await Promise.all(
      batch.map(async (link) => ({
        ...link,
        ...(await checkLink(link.url, origin)),
      })),
    );

    results.push(...checked);
  }

  const broken = results.filter(
    (link) =>
      link.status === "broken" ||
      link.status === "client-error" ||
      link.status === "server-error",
  );

  const errors = results.filter((link) => link.status === "error");

  const redirected = results.filter((link) => link.redirects?.length > 0);

  return {
    url: baseUrl,
    requestedUrl: url,
    status: "completed",

    summary: {
      totalAnchors: anchors.length,
      uniqueLinks: links.length,
      internalLinks: internal.length,
      externalLinks: external.length,
      duplicateCount,
      otherProtocols,
      checkedLinks: results.length,
      uncheckedInternal: Math.max(0, internal.length - results.length),
      brokenLinks: broken.length,
      networkErrors: errors.length,
      redirectedLinks: redirected.length,
    },

    broken,
    errors,
    redirected,
    checked: results,

    external: external.slice(0, MAX_LINKS),

    durationMs: Date.now() - startedAt,
    auditedAt: new Date().toISOString(),
  };
};

/**
 * Website Links Audit Tool
 *
 * Uses Playwright to collect links from rendered HTML.
 *
 * Returns:
 * - Total, unique, internal, and external links
 * - Duplicate URL counts
 * - HTTP status for checked internal links
 * - Broken links (4xx/5xx)
 * - Network and timeout errors
 * - Redirect chains
 * - Unchecked link counts
 * - Scan duration and timestamp
 *
 * Limits:
 * - Checks up to 30 internal links
 * - Maximum concurrency: 4
 * - Maximum redirects: 3
 * - External links are not requested
 *
 * Production requires SSRF protection, DNS/IP validation,
 * browser isolation, authorization, and network restrictions.
 */