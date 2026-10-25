import * as cheerio from "cheerio";
import { chromium } from "playwright";

const MAX_ITEMS = 20;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const TIMEOUT = 30000;

const clean = (value = "") =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const resolveUrl = (value, baseUrl) => {
  if (!value) return null;

  try {
    return new URL(value, baseUrl).href;
  } catch {
    return null;
  }
};

const getMeta = ($, name, attr = "name") => {
  const element = $(`meta[${attr}]`)
    .filter((_, el) => $(el).attr(attr)?.toLowerCase() === name.toLowerCase())
    .first();

  return clean(element.attr("content"));
};

const getMetadata = ($, baseUrl) => {
  const canonicalRaw = $('link[rel~="canonical"]').first().attr("href") || null;

  return {
    title: clean($("head title").first().text()),
    description: getMeta($, "description"),
    viewport: getMeta($, "viewport"),
    charset: $("meta[charset]").first().attr("charset") || null,

    canonical: resolveUrl(canonicalRaw, baseUrl),
    canonicalRaw,

    robots: getMeta($, "robots"),
    googlebot: getMeta($, "googlebot"),

    openGraph: {
      title: getMeta($, "og:title", "property"),
      description: getMeta($, "og:description", "property"),
      image: resolveUrl(getMeta($, "og:image", "property"), baseUrl),
      url: resolveUrl(getMeta($, "og:url", "property"), baseUrl),
      type: getMeta($, "og:type", "property"),
      siteName: getMeta($, "og:site_name", "property"),
    },

    twitter: {
      card: getMeta($, "twitter:card"),
      title: getMeta($, "twitter:title"),
      description: getMeta($, "twitter:description"),
      image: resolveUrl(getMeta($, "twitter:image"), baseUrl),
    },
  };
};

const getHeadings = ($) => {
  const headings = {};
  const counts = {};
  const hierarchy = [];
  const hierarchyIssues = [];

  for (let level = 1; level <= 6; level++) {
    const tag = `h${level}`;
    const elements = $(tag);

    counts[tag] = elements.length;

    headings[tag] = elements
      .map((_, el) => clean($(el).text()))
      .get()
      .slice(0, MAX_ITEMS);
  }

  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    hierarchy.push({
      tag: el.tagName.toLowerCase(),
      text: clean($(el).text()),
    });
  });

  for (let i = 1; i < hierarchy.length; i++) {
    const previous = Number(hierarchy[i - 1].tag[1]);
    const current = Number(hierarchy[i].tag[1]);

    if (current > previous + 1) {
      hierarchyIssues.push({
        from: hierarchy[i - 1].tag,
        to: hierarchy[i].tag,
        text: hierarchy[i].text,
      });
    }
  }

  return {
    headings,
    counts,
    hierarchy: hierarchy.slice(0, 100),
    hierarchyIssues: hierarchyIssues.slice(0, MAX_ITEMS),
  };
};

const getImages = ($, baseUrl) => {
  const images = $("img");

  const result = {
    total: images.length,
    missingAltCount: 0,
    emptyAltCount: 0,
    lazyLoaded: 0,
    missingAlt: [],
    emptyAlt: [],
  };

  images.each((_, el) => {
    const image = $(el);

    const src = resolveUrl(
      image.attr("src") || image.attr("data-src"),
      baseUrl,
    );

    const alt = image.attr("alt");

    if (image.attr("loading")?.toLowerCase() === "lazy") {
      result.lazyLoaded++;
    }

    if (alt === undefined) {
      result.missingAltCount++;

      if (result.missingAlt.length < MAX_ITEMS) {
        result.missingAlt.push(src);
      }
    } else if (!clean(alt)) {
      result.emptyAltCount++;

      if (result.emptyAlt.length < MAX_ITEMS) {
        result.emptyAlt.push(src);
      }
    }
  });

  return result;
};

const getLinks = ($, baseUrl) => {
  const base = new URL(baseUrl);

  const links = $("a[href]");

  const result = {
    total: links.length,
    internal: 0,
    external: 0,
    nofollow: 0,
    emptyText: 0,
    invalid: 0,
    emptyTextExamples: [],
  };

  links.each((_, el) => {
    const anchor = $(el);
    const href = anchor.attr("href");

    const text =
      clean(anchor.text()) ||
      clean(anchor.attr("aria-label")) ||
      clean(anchor.find("img").first().attr("alt"));

    if (!text) {
      result.emptyText++;

      if (result.emptyTextExamples.length < MAX_ITEMS) {
        result.emptyTextExamples.push(href);
      }
    }

    const rel = (anchor.attr("rel") || "").toLowerCase().split(/\s+/);

    if (rel.includes("nofollow")) {
      result.nofollow++;
    }

    const absolute = resolveUrl(href, baseUrl);

    if (!absolute) {
      result.invalid++;
      return;
    }

    const parsed = new URL(absolute);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return;
    }

    if (parsed.hostname === base.hostname) {
      result.internal++;
    } else {
      result.external++;
    }
  });

  return result;
};

const getStructuredData = ($) => {
  const items = [];
  const errors = [];

  const scripts = $('script[type="application/ld+json"]');

  const extractTypes = (data) => {
    if (!data || typeof data !== "object") return;

    if (Array.isArray(data)) {
      data.forEach(extractTypes);
      return;
    }

    if (Array.isArray(data["@graph"])) {
      data["@graph"].forEach(extractTypes);
    }

    if (data["@type"] && items.length < MAX_ITEMS) {
      items.push({
        type: data["@type"],
        context: data["@context"] ?? null,
      });
    }
  };

  scripts.each((index, el) => {
    try {
      const raw = $(el).html();

      if (!raw?.trim()) {
        throw new Error("Empty JSON-LD");
      }

      extractTypes(JSON.parse(raw));
    } catch {
      errors.push({
        scriptIndex: index,
        message: "Invalid or empty JSON-LD",
      });
    }
  });

  return {
    scriptCount: scripts.length,
    count: items.length,
    items,
    errors,
  };
};

const getContent = ($) => {
  const body = $("body").clone();

  body.find("script, style, noscript, svg, template, nav, footer").remove();

  const text = clean(body.text());

  return {
    wordCount: text ? text.split(/\s+/).length : 0,
    textLength: text.length,
    language: $("html").attr("lang") || null,
  };
};

const getIssues = (data) => {
  const issues = [];

  const add = (id, severity, message, recommendation, evidence = null) => {
    issues.push({
      id,
      severity,
      message,
      recommendation,
      evidence,
    });
  };

  const {
    metadata,
    headings,
    images,
    links,
    content,
    structuredData,
    xRobotsTag,
  } = data;

  if (!metadata.title) {
    add(
      "missing-title",
      "high",
      "Page title is missing",
      "Add a descriptive and unique page title.",
    );
  }

  if (!metadata.description) {
    add(
      "missing-description",
      "medium",
      "Meta description is missing",
      "Add a relevant page-specific meta description.",
    );
  }

  if (!metadata.canonical) {
    add(
      "missing-canonical",
      "low",
      "Canonical URL is missing or invalid",
      "Review canonical requirements and add one if appropriate.",
      metadata.canonicalRaw,
    );
  }

  if (headings.counts.h1 === 0) {
    add(
      "missing-h1",
      "medium",
      "No H1 heading detected",
      "Add a descriptive main heading.",
    );
  }

  if (headings.counts.h1 > 1) {
    add(
      "multiple-h1",
      "low",
      "Multiple H1 headings detected",
      "Review heading hierarchy for clarity.",
      headings.headings.h1,
    );
  }

  if (headings.hierarchyIssues.length) {
    add(
      "heading-hierarchy",
      "low",
      "Skipped heading levels detected",
      "Use a logical heading hierarchy.",
      headings.hierarchyIssues,
    );
  }

  const robots = [metadata.robots, metadata.googlebot, xRobotsTag]
    .filter(Boolean)
    .join(",")
    .toLowerCase();

  if (/(?:^|[,;\s])noindex(?:$|[,;\s])/.test(robots)) {
    add(
      "noindex-detected",
      "medium",
      "Noindex directive detected",
      "Verify that excluding this page from search is intentional.",
      robots,
    );
  }

  if (images.missingAltCount > 0) {
    add(
      "missing-image-alt",
      "medium",
      `${images.missingAltCount} images are missing alt attributes`,
      "Provide descriptive alt text for informative images and alt='' for decorative images.",
      images.missingAlt,
    );
  }

  if (links.emptyText > 0) {
    add(
      "empty-link-text",
      "medium",
      `${links.emptyText} links have no detected accessible text`,
      "Add visible or accessible names to links.",
      links.emptyTextExamples,
    );
  }

  if (!metadata.openGraph.title) {
    add(
      "missing-og-title",
      "low",
      "Open Graph title is missing",
      "Add og:title for social link previews.",
    );
  }

  if (!metadata.openGraph.image) {
    add(
      "missing-og-image",
      "low",
      "Open Graph image is missing",
      "Add an appropriate og:image.",
    );
  }

  if (!content.language) {
    add(
      "missing-html-lang",
      "medium",
      "HTML language is missing",
      "Set an appropriate lang attribute.",
    );
  }

  if (structuredData.errors.length) {
    add(
      "invalid-json-ld",
      "medium",
      "Invalid JSON-LD detected",
      "Fix the structured data JSON syntax.",
      structuredData.errors,
    );
  }

  const priority = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return issues.sort((a, b) => priority[a.severity] - priority[b.severity]);
};

const fetchRawHtml = async (url) => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT),
    headers: {
      Accept: "text/html",
      "User-Agent": "WebsiteAuditAgent/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("text/html")) {
    throw new Error("Response is not HTML");
  }

  if (Number(response.headers.get("content-length")) > MAX_HTML_BYTES) {
    await response.body?.cancel();
    throw new Error("HTML response exceeds size limit");
  }

  if (!response.body) {
    throw new Error("Empty HTTP response body");
  }

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      total += value.byteLength;

      if (total > MAX_HTML_BYTES) {
        await reader.cancel();
        throw new Error("HTML response exceeds size limit");
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));

  return {
    html: new TextDecoder().decode(bytes),
    finalUrl: response.url,
    statusCode: response.status,
    xRobotsTag: response.headers.get("x-robots-tag"),
  };
};

const fetchRenderedHtml = async (url) => {
  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: {
        width: 1365,
        height: 768,
      },
      serviceWorkers: "block",
    });

    const page = await context.newPage();

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUT,
    });

    if (!response) {
      throw new Error("No navigation response received");
    }

    if (!response.ok()) {
      throw new Error(`HTTP ${response.status()}`);
    }

    const contentType = (await response.headerValue("content-type")) || "";

    if (!contentType.toLowerCase().includes("text/html")) {
      throw new Error("Response is not HTML");
    }

    // Wait for common SPA root containers.
    await page
      .waitForFunction(
        () => {
          const root =
            document.querySelector("#root") ||
            document.querySelector("#app") ||
            document.querySelector("#__next");

          if (root) {
            return root.children.length > 0;
          }

          return (
            document.querySelectorAll("main, h1, h2, article, a[href]").length >
            0
          );
        },
        null,
        { timeout: 10000 },
      )
      .catch(() => null);

    await page.waitForTimeout(500);

    const html = await page.content();

    if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
      throw new Error("Rendered HTML exceeds size limit");
    }

    return {
      html,
      finalUrl: page.url(),
      statusCode: response.status(),
      xRobotsTag: await response.headerValue("x-robots-tag"),
    };
  } finally {
    await browser.close();
  }
};

export const analyzeSEO = async (url, options = {}) => {
  console.log(`calling analyzeSEO tool url : ${url}`);

  const startedAt = Date.now();

  const target = new URL(url);

  if (!["http:", "https:"].includes(target.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }

  const { render = true, html } = options;

  let page;

  if (html !== undefined) {
    if (typeof html !== "string") {
      throw new Error("HTML must be a string");
    }

    if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
      throw new Error("HTML exceeds size limit");
    }

    page = {
      html,
      finalUrl: url,
      statusCode: null,
      xRobotsTag: null,
    };
  } else if (render) {
    page = await fetchRenderedHtml(url);
  } else {
    page = await fetchRawHtml(url);
  }

  const $ = cheerio.load(page.html);
  const baseUrl = page.finalUrl;

  const data = {
    url: baseUrl,
    requestedUrl: url,
    statusCode: page.statusCode,

    source:
      html !== undefined
        ? "provided-html"
        : render
          ? "rendered-html"
          : "raw-html",

    metadata: getMetadata($, baseUrl),
    headings: getHeadings($),
    images: getImages($, baseUrl),
    links: getLinks($, baseUrl),
    content: getContent($),
    structuredData: getStructuredData($),
    xRobotsTag: page.xRobotsTag,
  };

  const issues = getIssues(data);

  return {
    ...data,
    issues,
    issueCount: issues.length,
    durationMs: Date.now() - startedAt,
    auditedAt: new Date().toISOString(),
  };
};

/**
 * Enhanced SEO Website Audit Tool
 *
 * Features:
 * - Raw and JavaScript-rendered HTML analysis
 * - React, Vite, and Next.js website support
 * - Title, description, canonical, and robots directives
 * - Open Graph and Twitter Card metadata
 * - H1-H6 headings and hierarchy analysis
 * - Image alt attributes and lazy-loading statistics
 * - Internal and external links
 * - JSON-LD structured data inspection
 * - Page content and language analysis
 * - SEO findings with severity and recommendations
 * - Structured JSON for AI Agent integration
 *
 * Limitations:
 * - Does not verify Google indexing or search rankings.
 * - Does not perform full website crawling.
 * - Some checks are heuristics, not confirmed SEO failures.
 * - Use only on trusted URLs during local development.
 * - Production requires SSRF protection, redirect validation,
 *   browser network isolation, and resource limits.
 */

/* 
const seo = await analyzeSEO('https://ulivv.com');
console.log(seo)

*/
