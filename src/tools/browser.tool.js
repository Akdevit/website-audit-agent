import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const TIMEOUT = 30000;
const MAX_ITEMS = 25;
const MAX_TEXT = 1000;
const MAX_DOM_ELEMENTS = 3000;

const VIEWPORTS = {
  mobile: {
    width: 390,
    height: 844,
    isMobile: true,
    deviceScaleFactor: 2,
    hasTouch: true,
  },
  desktop: {
    width: 1365,
    height: 768,
    isMobile: false,
    deviceScaleFactor: 1,
    hasTouch: false,
  },
};

const truncate = (value, limit = MAX_TEXT) =>
  String(value ?? "").slice(0, limit);

const addLimited = (list, value) => {
  if (list.length < MAX_ITEMS) {
    list.push(value);
  }
};

const inspectLayout = async (page) =>
  page.evaluate((maxElements) => {
    const viewportWidth = document.documentElement.clientWidth;
    const documentWidth = document.documentElement.scrollWidth;

    const overflowingElements = [];
    const images = [...document.images];

    const elements = document.body
      ? [...document.body.querySelectorAll("*")].slice(0, maxElements)
      : [];

    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        rect.width === 0 ||
        rect.height === 0
      ) {
        continue;
      }

      if (rect.right > viewportWidth + 2 || rect.left < -2) {
        if (overflowingElements.length < 20) {
          overflowingElements.push({
            tag: element.tagName.toLowerCase(),
            selector: element.id
              ? `#${CSS.escape(element.id)}`
              : element.classList.length
                ? `${element.tagName.toLowerCase()}.${[...element.classList]
                    .slice(0, 2)
                    .map((name) => CSS.escape(name))
                    .join(".")}`
                : element.tagName.toLowerCase(),
            text: (element.textContent || "").trim().slice(0, 120),
            width: Math.round(rect.width),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
          });
        }
      }
    }

    const brokenImages = images
      .filter((image) => {
        const src = image.currentSrc || image.src;
        return Boolean(src) && image.complete && image.naturalWidth === 0;
      })
      .slice(0, 20)
      .map((image) => ({
        src: image.currentSrc || image.src,
        alt: image.alt,
      }));

    return {
      viewportWidth,
      documentWidth,
      hasHorizontalOverflow: documentWidth > viewportWidth + 2,
      overflowAmountPx: Math.max(0, documentWidth - viewportWidth),
      overflowingElements,
      images: {
        total: images.length,
        brokenCount: images.filter(
          (image) =>
            Boolean(image.currentSrc || image.src) &&
            image.complete &&
            image.naturalWidth === 0,
        ).length,
        broken: brokenImages,
      },
      scannedElements: elements.length,
      scanTruncated: document.body?.querySelectorAll("*").length > maxElements,
    };
  }, MAX_DOM_ELEMENTS);

const getNavigationTiming = async (page) =>
  page.evaluate(() => {
    const entry = performance.getEntriesByType("navigation")[0];

    if (!entry) return null;

    const round = (value) => Math.round(Math.max(0, value));

    return {
      dnsMs: round(entry.domainLookupEnd - entry.domainLookupStart),
      tcpMs: round(entry.connectEnd - entry.connectStart),
      ttfbMs: round(entry.responseStart - entry.requestStart),
      domContentLoadedMs: round(
        entry.domContentLoadedEventEnd - entry.startTime,
      ),
      loadEventMs: round(entry.loadEventEnd - entry.startTime),
      transferSize: entry.transferSize || null,
    };
  });

export const analyzeBrowser = async (
  url,
  { device = "mobile", screenshot = false, fullPage = false } = {},
) => {
  console.log(`calling analyzeBrowser tool url : ${url}`);

  const startedAt = Date.now();

  const target = new URL(url);

  if (!["http:", "https:"].includes(target.protocol)) {
    throw new Error("Only HTTP/HTTPS URLs are supported");
  }

  if (!Object.hasOwn(VIEWPORTS, device)) {
    throw new Error("Invalid device type");
  }

  const consoleErrors = [];
  const consoleWarnings = [];
  const pageErrors = [];
  const failedRequests = [];
  const httpErrors = [];

  const requestStats = {
    total: 0,
    finished: 0,
    failed: 0,
    httpErrors: 0,
  };

  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      viewport: {
        width: VIEWPORTS[device].width,
        height: VIEWPORTS[device].height,
      },
      isMobile: VIEWPORTS[device].isMobile,
      deviceScaleFactor: VIEWPORTS[device].deviceScaleFactor,
      hasTouch: VIEWPORTS[device].hasTouch,
      serviceWorkers: "block",
    });

    const page = await context.newPage();

    // Collect console messages.
    page.on("console", (message) => {
      if (message.type() === "error") {
        addLimited(consoleErrors, {
          message: truncate(message.text()),
          location: message.location(),
        });
      }

      if (message.type() === "warning") {
        addLimited(consoleWarnings, {
          message: truncate(message.text()),
          location: message.location(),
        });
      }
    });

    // Collect uncaught JavaScript errors.
    page.on("pageerror", (error) => {
      addLimited(pageErrors, {
        name: error.name,
        message: truncate(error.message),
        stack: truncate(error.stack),
      });
    });

    // Monitor outgoing requests.
    page.on("request", () => {
      requestStats.total++;
    });

    page.on("requestfinished", () => {
      requestStats.finished++;
    });

    page.on("requestfailed", (request) => {
      requestStats.failed++;

      addLimited(failedRequests, {
        url: truncate(request.url()),
        method: request.method(),
        resourceType: request.resourceType(),
        error: request.failure()?.errorText ?? "Unknown",
      });
    });

    // HTTP 4xx/5xx are different from transport failures.
    page.on("response", (response) => {
      if (response.status() < 400) return;

      requestStats.httpErrors++;

      addLimited(httpErrors, {
        url: truncate(response.url()),
        status: response.status(),
        statusText: response.statusText(),
        resourceType: response.request().resourceType(),
      });
    });

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUT,
    });

    if (!response) {
      throw new Error("No navigation response received");
    }

    // Let common React/Vite roots render.
    await page
      .waitForFunction(
        () => {
          const root =
            document.querySelector("#root") ||
            document.querySelector("#app") ||
            document.querySelector("#__next");

          if (root) return root.children.length > 0;

          return document.body?.children.length > 0;
        },
        null,
        { timeout: 10000 },
      )
      .catch(() => null);

    await page.waitForTimeout(750);

    const layout = await inspectLayout(page);
    const navigation = await getNavigationTiming(page);

    const title = await page.title();

    let screenshotPath = null;

    if (screenshot) {
      const directory = path.resolve("reports", "screenshots");

      await mkdir(directory, { recursive: true });

      screenshotPath = path.join(directory, `${randomUUID()}-${device}.png`);

      await page.screenshot({
        path: screenshotPath,
        fullPage,
        animations: "disabled",
        timeout: 15000,
      });
    }

    const issues = [];

    if (pageErrors.length > 0) {
      issues.push({
        id: "javascript-errors",
        severity: "high",
        message: `${pageErrors.length} JavaScript exceptions captured`,
      });
    }

    if (requestStats.failed > 0) {
      issues.push({
        id: "failed-network-requests",
        severity: "medium",
        message: `${requestStats.failed} network requests failed`,
      });
    }

    if (requestStats.httpErrors > 0) {
      issues.push({
        id: "http-errors",
        severity: "medium",
        message: `${requestStats.httpErrors} HTTP error responses captured`,
      });
    }

    if (layout.hasHorizontalOverflow) {
      issues.push({
        id: "horizontal-overflow",
        severity: "medium",
        message: `Page overflows viewport by ${layout.overflowAmountPx}px`,
      });
    }

    if (layout.images.brokenCount > 0) {
      issues.push({
        id: "broken-images",
        severity: "medium",
        message: `${layout.images.brokenCount} broken images detected`,
      });
    }

    return {
      url: page.url(),
      requestedUrl: url,
      device,
      status: "completed",
      statusCode: response.status(),
      title,

      viewport: {
        width: VIEWPORTS[device].width,
        height: VIEWPORTS[device].height,
      },

      console: {
        errors: consoleErrors,
        warnings: consoleWarnings,
      },

      pageErrors,

      network: {
        stats: requestStats,
        failedRequests,
        httpErrors,
      },

      layout,

      navigation,

      screenshot: screenshotPath,

      issues,
      issueCount: issues.length,

      durationMs: Date.now() - startedAt,
      auditedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Browser audit failed: ${error.message}`, { cause: error });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * Browser Website Audit Tool
 *
 * Uses Playwright Chromium to inspect runtime behavior.
 *
 * Returns:
 * - Console errors and warnings
 * - Uncaught JavaScript exceptions
 * - Failed network requests
 * - HTTP 4xx/5xx responses
 * - Horizontal overflow and affected DOM elements
 * - Broken image details
 * - Browser navigation timing measurements
 * - Optional page screenshots
 * - Issue summary with severity
 * - Mobile and desktop viewport support
 *
 * Limitations:
 * - Audits only the loaded page state.
 * - Does not automatically navigate through user flows.
 * - Does not replace Lighthouse or axe-core.
 * - Requires isolated browser execution and SSRF protection
 *   before accepting untrusted public URLs.
 */
