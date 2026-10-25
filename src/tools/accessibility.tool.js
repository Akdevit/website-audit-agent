
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const TIMEOUT = 30000;
const MAX_NODES = 15;
const MAX_RULES = 100;
const MAX_TEXT = 1500;

const WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
];

const IMPACT_PRIORITY = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
  unknown: 4,
};

const VIEWPORTS = {
  mobile: {
    width: 390,
    height: 844,
  },
  desktop: {
    width: 1365,
    height: 768,
  },
};

const truncate = (value, length = MAX_TEXT) =>
  typeof value === "string"
    ? value.slice(0, length)
    : null;

const getImpact = (impact) =>
  Object.hasOwn(IMPACT_PRIORITY, impact)
    ? impact
    : "unknown";

const normalizeNode = (node) => ({
  target: node.target ?? [],
  html: truncate(node.html),
  failureSummary: truncate(node.failureSummary),
  impact: getImpact(node.impact),

  checks: {
    any: (node.any ?? []).map((check) => ({
      id: check.id,
      message: truncate(check.message),
    })),

    all: (node.all ?? []).map((check) => ({
      id: check.id,
      message: truncate(check.message),
    })),

    none: (node.none ?? []).map((check) => ({
      id: check.id,
      message: truncate(check.message),
    })),
  },
});

const normalizeViolation = (violation) => ({
  id: violation.id,
  impact: getImpact(violation.impact),
  description: violation.description,
  help: violation.help,
  helpUrl: violation.helpUrl,

  wcag: violation.tags.filter((tag) =>
    tag.startsWith("wcag"),
  ),

  tags: violation.tags,

  affectedElements: violation.nodes.length,

  nodes: violation.nodes
    .slice(0, MAX_NODES)
    .map(normalizeNode),
});

const getSummary = (violations, incomplete, passes) => {
  const byImpact = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    unknown: 0,
  };

  let affectedElements = 0;

  for (const violation of violations) {
    const impact = getImpact(violation.impact);

    byImpact[impact]++;
    affectedElements += violation.nodes.length;
  }

  return {
    totalViolations: violations.length,
    affectedElements,
    byImpact,
    passedRules: passes.length,
    incompleteRules: incomplete.length,
  };
};

const normalizeIncomplete = (rule) => ({
  id: rule.id,
  impact: getImpact(rule.impact),
  help: rule.help,
  helpUrl: rule.helpUrl,
  affectedElements: rule.nodes.length,

  nodes: rule.nodes
    .slice(0, MAX_NODES)
    .map((node) => ({
      target: node.target ?? [],
      html: truncate(node.html),
      failureSummary: truncate(node.failureSummary),
    })),
});

export const analyzeAccessibility = async (
  url,
  { device = "mobile", wcagOnly = false } = {},
) => {
    console.log(`calling accessibility tool url : ${url}`)
  const startedAt = Date.now();

  const parsedUrl = new URL(url);

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only HTTP/HTTPS URLs are supported");
  }

  if (!Object.hasOwn(VIEWPORTS, device)) {
    throw new Error("Invalid device type");
  }

  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      viewport: VIEWPORTS[device],
      deviceScaleFactor: device === "mobile" ? 2 : 1,
      isMobile: device === "mobile",
      hasTouch: device === "mobile",
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
      throw new Error(
        `Website returned HTTP ${response.status()}`,
      );
    }

    // Wait for common SPA mount points.
    // Do not fail if the website uses a different structure.
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

          return document.body?.children.length > 0;
        },
        null,
        { timeout: 10000 },
      )
      .catch(() => null);

    // Allow initial client-side rendering to settle.
    await page.waitForTimeout(500);

    let axe = new AxeBuilder({ page });

    if (wcagOnly) {
      axe = axe.withTags(WCAG_TAGS);
    }

    const results = await axe.analyze();

    const violations = results.violations
      .slice(0, MAX_RULES)
      .map(normalizeViolation)
      .sort(
        (a, b) =>
          IMPACT_PRIORITY[a.impact] -
          IMPACT_PRIORITY[b.impact],
      );

    const incomplete = results.incomplete
      .slice(0, MAX_RULES)
      .map(normalizeIncomplete);

    return {
      url: page.url(),
      requestedUrl: url,
      device,
      status: "completed",
      statusCode: response.status(),

      engine: {
        name: "axe-core",
        version: results.testEngine.version,
      },

      standard: wcagOnly
        ? "WCAG A/AA automated checks"
        : "axe-core default rules",

      summary: getSummary(
        results.violations,
        results.incomplete,
        results.passes,
      ),

      violations,
      incomplete,

      passedRules: results.passes.map((rule) => ({
        id: rule.id,
        description: rule.description,
      })),

      durationMs: Date.now() - startedAt,
      auditedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(
      `Accessibility audit failed: ${error.message}`,
      { cause: error },
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * Accessibility Website Audit Tool
 *
 * Uses Playwright and axe-core to audit rendered web pages.
 *
 * Returns:
 * - Critical, serious, moderate, and minor violations
 * - WCAG rule references and documentation links
 * - Affected DOM selectors and HTML snippets
 * - Failed accessibility checks and remediation guidance
 * - Passed accessibility rules
 * - Incomplete rules requiring manual verification
 * - Summary grouped by impact
 * - Mobile and desktop audit support
 * - Execution duration and scan timestamp
 *
 * Supports React/Vite/Next.js rendered applications.
 *
 * Limitations:
 * - Automated checks cannot guarantee WCAG compliance.
 * - Scans the current page state, not all interactive states.
 * - No numerical accessibility score is calculated.
 * - Use trusted URLs until browser network isolation
 *   and SSRF protections are implemented.
 */
