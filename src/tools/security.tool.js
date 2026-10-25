
import tls from "node:tls";

const TIMEOUT = 10000;
const MAX_REDIRECTS = 5;

const SECURITY_HEADERS = {
  hsts: "strict-transport-security",
  csp: "content-security-policy",
  cspReportOnly: "content-security-policy-report-only",
  frameOptions: "x-frame-options",
  contentTypeOptions: "x-content-type-options",
  referrerPolicy: "referrer-policy",
  permissionsPolicy: "permissions-policy",
  crossOriginOpenerPolicy: "cross-origin-opener-policy",
  crossOriginResourcePolicy: "cross-origin-resource-policy",
};

const parseHSTS = (value) => {
  if (!value) return null;

  const match = value.match(/max-age\s*=\s*(\d+)/i);

  return {
    maxAge: match ? Number(match[1]) : null,
    includeSubDomains: /includesubdomains/i.test(value),
    preload: /(?:^|;)\s*preload(?:;|$)/i.test(value),
  };
};

const parseCookies = (headers) => {
  const cookies = headers.getSetCookie?.() ?? [];

  return cookies.map((cookie) => {
    const [nameValue, ...attributes] = cookie.split(";");
    const name = nameValue.split("=")[0]?.trim();

    const flags = attributes.map((attribute) =>
      attribute.trim().toLowerCase(),
    );

    const sameSite = flags.find((flag) =>
      flag.startsWith("samesite="),
    );

    return {
      name,
      secure: flags.includes("secure"),
      httpOnly: flags.includes("httponly"),
      sameSite: sameSite?.split("=")[1] ?? null,
    };
  });
};

const getTLSInfo = async (hostname, port = 443) =>
  new Promise((resolve, reject) => {
    const socket = tls.connect({
      host: hostname,
      port,
      servername: hostname,
      rejectUnauthorized: true,
      timeout: TIMEOUT,
    });

    socket.once("secureConnect", () => {
      const cert = socket.getPeerCertificate();

      const validTo = cert.valid_to
        ? new Date(cert.valid_to)
        : null;

      const daysUntilExpiry = validTo
        ? Math.ceil(
            (validTo.getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          )
        : null;

      const result = {
        authorized: socket.authorized,
        authorizationError: socket.authorizationError ?? null,
        protocol: socket.getProtocol(),
        cipher: socket.getCipher()?.standardName ?? null,

        certificate: {
          subject: cert.subject?.CN ?? null,
          issuer: cert.issuer?.CN ?? null,
          validFrom: cert.valid_from ?? null,
          validTo: cert.valid_to ?? null,
          daysUntilExpiry,
          fingerprint256: cert.fingerprint256 ?? null,
        },
      };

      socket.end();
      resolve(result);
    });

    socket.once("timeout", () => {
      socket.destroy(new Error("TLS connection timeout"));
    });

    socket.once("error", reject);
  });

const fetchHeaders = async (url) => {
  const redirects = [];
  let currentUrl = url;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const response = await fetch(currentUrl, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT),
      headers: {
        "User-Agent": "WebsiteAuditAgent/1.0",
        Accept: "text/html",
      },
    });

    const status = response.status;

    if (status >= 300 && status < 400) {
      const location = response.headers.get("location");

      await response.body?.cancel();

      if (!location) {
        return {
          response,
          finalUrl: currentUrl,
          redirects,
        };
      }

      const next = new URL(location, currentUrl);

      if (!["http:", "https:"].includes(next.protocol)) {
        throw new Error("Unsupported redirect protocol");
      }

      redirects.push({
        from: currentUrl,
        to: next.href,
        statusCode: status,
      });

      currentUrl = next.href;
      continue;
    }

    await response.body?.cancel();

    return {
      response,
      finalUrl: currentUrl,
      redirects,
    };
  }

  throw new Error("Too many HTTP redirects");
};

const buildIssues = ({ url, headers, tlsInfo, cookies }) => {
  const issues = [];

  const add = (id, severity, message, recommendation) => {
    issues.push({
      id,
      severity,
      message,
      recommendation,
    });
  };

  const isHTTPS = new URL(url).protocol === "https:";

  if (!isHTTPS) {
    add(
      "https-not-enabled",
      "high",
      "Website is not using HTTPS",
      "Enable HTTPS and redirect HTTP traffic to HTTPS.",
    );
  }

  if (isHTTPS && !headers.hsts) {
    add(
      "missing-hsts",
      "medium",
      "Strict-Transport-Security header is missing",
      "Configure HSTS after verifying HTTPS across the required hosts.",
    );
  }

  if (!headers.csp) {
    add(
      "missing-csp",
      "medium",
      "Content-Security-Policy header is missing",
      "Configure an appropriate CSP with restrictive script sources.",
    );
  }

  if (!headers.frameOptions && !headers.csp?.includes("frame-ancestors")) {
    add(
      "missing-frame-protection",
      "medium",
      "No detected framing protection",
      "Configure CSP frame-ancestors or X-Frame-Options.",
    );
  }

  if (headers.contentTypeOptions?.toLowerCase() !== "nosniff") {
    add(
      "missing-nosniff",
      "medium",
      "X-Content-Type-Options is missing or invalid",
      "Set X-Content-Type-Options: nosniff.",
    );
  }

  if (!headers.referrerPolicy) {
    add(
      "missing-referrer-policy",
      "low",
      "Referrer-Policy header is missing",
      "Review and configure an appropriate referrer policy.",
    );
  }

  if (!headers.permissionsPolicy) {
    add(
      "missing-permissions-policy",
      "low",
      "Permissions-Policy header is missing",
      "Restrict unused browser features where appropriate.",
    );
  }

  if (headers.poweredBy) {
    add(
      "technology-disclosure",
      "low",
      "X-Powered-By header exposes implementation information",
      "Remove unnecessary technology-identifying headers.",
    );
  }

  if (tlsInfo?.certificate?.daysUntilExpiry != null) {
    if (tlsInfo.certificate.daysUntilExpiry <= 14) {
      add(
        "certificate-expiry",
        "high",
        "TLS certificate expires within 14 days",
        "Renew and verify the TLS certificate.",
      );
    }
  }

  for (const cookie of cookies) {
    if (isHTTPS && !cookie.secure) {
      add(
        "cookie-missing-secure",
        "medium",
        `Cookie ${cookie.name} is missing Secure`,
        "Set Secure for cookies transmitted over HTTPS.",
      );
    }

    if (!cookie.httpOnly) {
      add(
        "cookie-missing-httponly",
        "low",
        `Cookie ${cookie.name} is accessible to JavaScript`,
        "Set HttpOnly for session cookies that do not require JavaScript access.",
      );
    }

    if (!cookie.sameSite) {
      add(
        "cookie-missing-samesite",
        "low",
        `Cookie ${cookie.name} does not explicitly set SameSite`,
        "Configure SameSite=Lax or Strict where appropriate.",
      );
    }
  }

  const priority = { high: 0, medium: 1, low: 2 };

  return issues.sort(
    (a, b) => priority[a.severity] - priority[b.severity],
  );
};

export const analyzeSecurity = async (url) => {
  console.log(`calling analyzeSecurity tool url : ${url}`);

  const startedAt = Date.now();
  const target = new URL(url);

  if (!["http:", "https:"].includes(target.protocol)) {
    throw new Error("Only HTTP/HTTPS URLs are supported");
  }

  const { response, finalUrl, redirects } =
    await fetchHeaders(url);

  const finalTarget = new URL(finalUrl);

  const rawHeaders = response.headers;

  const headers = {
    hsts: rawHeaders.get(SECURITY_HEADERS.hsts),
    csp: rawHeaders.get(SECURITY_HEADERS.csp),
    cspReportOnly: rawHeaders.get(
      SECURITY_HEADERS.cspReportOnly,
    ),
    frameOptions: rawHeaders.get(
      SECURITY_HEADERS.frameOptions,
    ),
    contentTypeOptions: rawHeaders.get(
      SECURITY_HEADERS.contentTypeOptions,
    ),
    referrerPolicy: rawHeaders.get(
      SECURITY_HEADERS.referrerPolicy,
    ),
    permissionsPolicy: rawHeaders.get(
      SECURITY_HEADERS.permissionsPolicy,
    ),
    crossOriginOpenerPolicy: rawHeaders.get(
      SECURITY_HEADERS.crossOriginOpenerPolicy,
    ),
    crossOriginResourcePolicy: rawHeaders.get(
      SECURITY_HEADERS.crossOriginResourcePolicy,
    ),
    poweredBy: rawHeaders.get("x-powered-by"),
    server: rawHeaders.get("server"),
  };

  const cookies = parseCookies(rawHeaders);

  let tlsInfo = null;
  let tlsError = null;

  if (finalTarget.protocol === "https:") {
    try {
      tlsInfo = await getTLSInfo(
        finalTarget.hostname,
        finalTarget.port
          ? Number(finalTarget.port)
          : 443,
      );
    } catch (error) {
      tlsError = {
        message: error.message,
        code: error.code ?? null,
      };
    }
  }

  const issues = buildIssues({
    url: finalUrl,
    headers,
    tlsInfo,
    cookies,
  });

  if (tlsError) {
    issues.unshift({
      id: "tls-verification-failed",
      severity: "high",
      message: "TLS certificate verification failed",
      recommendation:
        "Investigate the TLS handshake and certificate configuration.",
      evidence: tlsError,
    });
  }

  return {
    url: finalUrl,
    requestedUrl: url,
    status: "completed",
    statusCode: response.status,

    https: {
      enabled: finalTarget.protocol === "https:",
      redirects,
      redirectCount: redirects.length,
    },

    tls: tlsInfo,
    tlsError,

    headers: {
      ...headers,
      hstsDetails: parseHSTS(headers.hsts),
    },

    cookies: {
      total: cookies.length,
      items: cookies,
    },

    issues,
    issueCount: issues.length,

    durationMs: Date.now() - startedAt,
    auditedAt: new Date().toISOString(),
  };
};

/**
 * Passive Website Security Audit Tool
 *
 * Returns:
 * - HTTPS status and redirect chain
 * - TLS version, cipher, and certificate information
 * - Certificate issuer and expiration details
 * - Security headers (HSTS, CSP, X-Frame-Options, etc.)
 * - Cookie security attributes
 * - Basic technology disclosure findings
 * - Prioritized configuration issues
 * - Execution duration and audit timestamp
 *
 * Limitations:
 * - Does not conduct vulnerability exploitation.
 * - Does not test application authentication or authorization.
 * - Does not inspect all subresources or website routes.
 * - Does not guarantee that a website is secure.
 *
 * Security:
 * - Use only with trusted URLs during local development.
 * - Production requires SSRF prevention, isolated network
 *   access, destination validation, and request limits.
 */