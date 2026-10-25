export const auditPresets = [
  {
    id: "complete",
    label: "Complete website audit",
    query: "Perform a complete website audit",
  },
  {
    id: "performance",
    label: "Performance",
    query:
      "Audit performance only using Lighthouse. Focus on lab metrics and loading issues.",
  },
  {
    id: "seo",
    label: "Search engine optimization",
    query:
      "Check SEO only: metadata, canonical tags, headings, and structured data.",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    query:
      "Run an accessibility audit only. Prioritize verified axe violations.",
  },
  {
    id: "browser",
    label: "Browser diagnostics",
    query:
      "Check browser runtime only: JavaScript errors, failed requests, and layout overflow.",
  },
  {
    id: "links",
    label: "Internal links",
    query: "Audit internal links only. Check broken links and redirects.",
  },
  {
    id: "security",
    label: "Security configuration",
    query:
      "Audit passive security configuration only: HTTPS, TLS, headers, and cookie flags.",
  },
  { id: "custom", label: "Custom instructions" },
];
