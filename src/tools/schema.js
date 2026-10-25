const urlParameter = {
  type: "string",
  description: "Complete website URL starting with https://",
};

const deviceParameter = {
  type: "string",
  enum: ["mobile", "desktop"],
  description: "Device to simulate. Defaults to mobile.",
};

const createTool = (name, description, properties) => ({
  type: "function",
  function: {
    name,
    description,
    parameters: {
      type: "object",
      properties,
      required: ["url"],
      additionalProperties: false,
    },
  },
});

export const toolSchemas = [
  createTool(
    "lighthouse_audit",
    "Run Google Lighthouse to measure website performance, accessibility, SEO, best practices, Core Web Vitals, and optimization opportunities.",
    {
      url: urlParameter,
      device: deviceParameter,
    },
  ),

  createTool(
    "seo_audit",
    "Analyze rendered website HTML including metadata, canonical URLs, headings, images, links, Open Graph, robots directives, and structured data.",
    {
      url: urlParameter,
      render: {
        type: "boolean",
        description:
          "Whether to render JavaScript before analysis. Defaults to true.",
      },
    },
  ),

  createTool(
    "accessibility_audit",
    "Analyze accessibility using axe-core. Detect WCAG violations, affected DOM elements, accessible names, ARIA issues, and manual review candidates.",
    {
      url: urlParameter,
      device: deviceParameter,
      wcagOnly: {
        type: "boolean",
        description:
          "Restrict analysis to supported WCAG rules. Defaults to false.",
      },
    },
  ),

  createTool(
    "browser_audit",
    "Inspect website runtime behavior including JavaScript errors, failed network requests, HTTP errors, broken images, responsive overflow, and navigation timings.",
    {
      url: urlParameter,
      device: deviceParameter,
      screenshot: {
        type: "boolean",
        description: "Capture a screenshot. Defaults to false.",
      },
      fullPage: {
        type: "boolean",
        description: "Capture the entire page when screenshots are enabled.",
      },
    },
  ),

  createTool(
    "links_audit",
    "Check rendered website links for broken internal URLs, HTTP errors, redirects, duplicate URLs, and network failures. External links are collected but not requested.",
    {
      url: urlParameter,
    },
  ),

  createTool(
    "security_audit",
    "Perform passive website security configuration checks including HTTPS, TLS certificate, HSTS, CSP, framing protection, security headers, and cookie attributes.",
    {
      url: urlParameter,
    },
  ),
];
