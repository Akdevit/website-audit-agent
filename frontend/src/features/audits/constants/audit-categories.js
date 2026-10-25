import {
  Accessibility,
  Braces,
  Gauge,
  Link2,
  Search,
  ShieldCheck,
} from "lucide-react";

export const auditCategories = [
  {
    id: "lighthouse",
    label: "Performance",
    icon: Gauge,
    description: "Loading speed, lab metrics, and Lighthouse insights.",
  },
  {
    id: "seo",
    label: "Search visibility",
    icon: Search,
    description: "Metadata, headings, and structured data.",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    icon: Accessibility,
    description: "Automated checks for a more inclusive experience.",
  },
  {
    id: "browser",
    label: "Browser diagnostics",
    icon: Braces,
    description: "Runtime errors, failed requests, and layout issues.",
  },
  {
    id: "links",
    label: "Link health",
    icon: Link2,
    description: "Broken internal links and redirect checks.",
  },
  {
    id: "security",
    label: "Security",
    icon: ShieldCheck,
    description: "HTTPS, TLS, headers, and cookie configuration.",
  },
];
