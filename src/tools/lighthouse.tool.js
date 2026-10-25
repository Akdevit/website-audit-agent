/**
 * Lighthouse Website Audit Tool
 *
 * Runs a comprehensive website audit using Google Lighthouse.
 *
 * Returns:
 * - Performance, Accessibility, SEO, and Best Practices scores.
 * - Core performance metrics (FCP, LCP, CLS, Speed Index, TBT, TTI).
 * - LCP element information when available.
 * - Detailed diagnostics for rendering, images, JavaScript, CSS, and network requests.
 * - Performance optimization opportunities with estimated savings.
 * - Identified issues with severity, descriptions, and affected elements.
 * - Mobile and desktop audit support.
 * - Lighthouse version, audit duration, and execution timestamp.
 *
 * Automatically launches and closes Chrome after the audit.
 * Returns structured JSON for AI analysis and report generation.
 */

import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

const METRICS = {
  fcp: "first-contentful-paint",
  lcp: "largest-contentful-paint",
  cls: "cumulative-layout-shift",
  speedIndex: "speed-index",
  tbt: "total-blocking-time",
  interactive: "interactive",
};

const MAX_ITEMS = 15;
const MAX_DEPTH = 5;
const MAX_STRING_LENGTH = 2000;

const round = (value, digits = 2) =>
  typeof value === "number" && Number.isFinite(value)
    ? Number(value.toFixed(digits))
    : null;

const getScore = (category) =>
  typeof category?.score === "number" ? Math.round(category.score * 100) : null;

const getMetric = (audit) => {
  if (!audit) return null;

  return {
    value: audit.numericValue ?? null,
    displayValue: audit.displayValue ?? null,
    score: audit.score ?? null,
    unit: audit.numericUnit ?? null,
  };
};

const getMetrics = (audits) =>
  Object.fromEntries(
    Object.entries(METRICS).map(([key, id]) => [key, getMetric(audits[id])]),
  );

// Extract DOM information when Lighthouse provides it.
const extractNode = (node) => {
  if (!node || typeof node !== "object") return null;

  const data = {
    selector: node.selector ?? null,
    snippet: node.snippet ?? null,
    nodeLabel: node.nodeLabel ?? null,
    path: node.path ?? null,
  };

  return Object.values(data).some(Boolean) ? data : null;
};

// Convert Lighthouse details into bounded JSON.
// Supported types include tables, lists, insights and nested objects.
const normalizeDetails = (value, depth = 0) => {
  if (value == null) return null;

  if (typeof value === "string") {
    return value.slice(0, MAX_STRING_LENGTH);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (depth >= MAX_DEPTH) return null;

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ITEMS)
      .map((item) => normalizeDetails(item, depth + 1));
  }

  if (typeof value !== "object") return null;

  // Lighthouse DOM node representation
  if (value.type === "node") {
    return extractNode(value);
  }

  // Preserve useful diagnostic fields without including
  // screenshots, traces or bulky internal debug data.
  const excluded = new Set([
    "debugData",
    "screenshot",
    "screenshotData",
    "data",
    "timing",
  ]);

  const result = {};

  for (const [key, item] of Object.entries(value)) {
    if (excluded.has(key)) continue;

    // Skip large non-essential or sensitive payloads.
    if (
      key === "value" &&
      typeof item === "string" &&
      item.startsWith("data:")
    ) {
      continue;
    }

    const normalized = normalizeDetails(item, depth + 1);

    if (normalized !== null) {
      result[key] = normalized;
    }
  }

  return result;
};

const getSeverity = (audit) => {
  if (audit.score === 0) return "high";
  if (audit.score != null && audit.score < 0.5) return "medium";
  return "low";
};

const getIssues = (lhr) => {
  const issues = new Map();

  for (const category of Object.values(lhr.categories)) {
    for (const ref of category.auditRefs ?? []) {
      const audit = lhr.audits[ref.id];

      if (!audit) continue;

      const isScored =
        audit.scoreDisplayMode === "binary" ||
        audit.scoreDisplayMode === "numeric";

      if (!isScored) continue;

      if (typeof audit.score !== "number") continue;
      if (audit.score >= 0.9) continue;

      const existing = issues.get(audit.id);

      if (existing) {
        if (!existing.categories.includes(category.id)) {
          existing.categories.push(category.id);
        }

        continue;
      }

      issues.set(audit.id, {
        id: audit.id,
        title: audit.title,
        description: audit.description,
        severity: getSeverity(audit),
        score: audit.score,
        displayValue: audit.displayValue ?? null,
        categories: [category.id],
        details: normalizeDetails(audit.details),
      });
    }
  }

  const priority = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return [...issues.values()].sort(
    (a, b) => priority[a.severity] - priority[b.severity],
  );
};

const getDiagnostics = (audits) => {
  const ids = [
    "lcp-breakdown-insight",
    "lcp-discovery-insight",
    "network-dependency-tree-insight",
    "render-blocking-insight",
    "image-delivery-insight",
    "document-latency-insight",
    "unused-javascript",
    "unused-css-rules",
    "total-byte-weight",
    "network-requests",
    "mainthread-work-breakdown",
    "long-tasks",
  ];

  return Object.fromEntries(
    ids
      .filter((id) => audits[id])
      .map((id) => {
        const audit = audits[id];

        return [
          id,
          {
            title: audit.title,
            score: audit.score ?? null,
            displayValue: audit.displayValue ?? null,
            savings: audit.metricSavings ?? null,
            details: normalizeDetails(audit.details),
          },
        ];
      }),
  );
};

const getLcpElement = (audits) => {
  const audit = audits["largest-contentful-paint-element"];

  if (!audit?.details) return null;

  return normalizeDetails(audit.details);
};

const getOpportunities = (audits) => {
  return Object.values(audits)
    .filter(
      (audit) =>
        audit.details?.type === "opportunity" &&
        typeof audit.details?.overallSavingsMs === "number" &&
        audit.details.overallSavingsMs > 0,
    )
    .map((audit) => ({
      id: audit.id,
      title: audit.title,
      savingsMs: round(audit.details.overallSavingsMs),
      savingsBytes: audit.details.overallSavingsBytes ?? null,
      details: normalizeDetails(audit.details),
    }))
    .sort((a, b) => b.savingsMs - a.savingsMs);
};

export const runLighthouse = async (url, { device = "mobile" } = {}) => {
  console.log(`calling runLighthouse tool url : ${url}`);

  if (!["mobile", "desktop"].includes(device)) {
    throw new Error("Invalid device type");
  }

  const startedAt = Date.now();
  let chrome;

  try {
    chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless", "--disable-gpu"],
    });

    const flags = {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: CATEGORIES,
      formFactor: device,
      maxWaitForLoad: 45000,
      maxWaitForFcp: 30000,
      screenEmulation:
        device === "desktop"
          ? {
              mobile: false,
              width: 1350,
              height: 940,
              deviceScaleFactor: 1,
              disabled: false,
            }
          : {
              mobile: true,
              width: 412,
              height: 823,
              deviceScaleFactor: 1.75,
              disabled: false,
            },
    };

    const result = await lighthouse(url, flags);

    if (!result?.lhr) {
      throw new Error("No Lighthouse results returned");
    }

    const lhr = result.lhr;

    if (lhr.runtimeError) {
      throw new Error(lhr.runtimeError.message);
    }

    const audits = lhr.audits;
    const categories = lhr.categories;

    const issues = getIssues(lhr);

    return {
      url: lhr.finalDisplayedUrl || url,
      requestedUrl: url,
      device,
      status: "completed",

      lighthouseVersion: lhr.lighthouseVersion,

      scores: {
        performance: getScore(categories.performance),
        accessibility: getScore(categories.accessibility),
        bestPractices: getScore(categories["best-practices"]),
        seo: getScore(categories.seo),
      },

      metrics: getMetrics(audits),

      lcpElement: getLcpElement(audits),

      diagnostics: getDiagnostics(audits),

      opportunities: getOpportunities(audits),

      issues,
      issueCount: issues.length,

      durationMs: Date.now() - startedAt,
      auditedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Lighthouse audit failed: ${error.message}`, {
      cause: error,
    });
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
};

// const light = await runLighthouse('https://ulivv.com')
// console.log(light)
