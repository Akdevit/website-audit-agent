import { z } from "zod";
import { runLighthouse } from "./lighthouse.tool.js";
import { analyzeSEO } from "./seo.tool.js";
import { analyzeAccessibility } from "./accessibility.tool.js";
import { analyzeBrowser } from "./browser.tool.js";
import { analyzeLinks } from "./links.tool.js";
import { analyzeSecurity } from "./security.tool.js";

const urlSchema = z.httpUrl();
const deviceSchema = z.enum(["mobile", "desktop"]);

const schemas = {
  lighthouse_audit: z
    .object({
      url: urlSchema,
      device: deviceSchema.default("mobile"),
    })
    .strict(),

  seo_audit: z
    .object({
      url: urlSchema,
      render: z.boolean().default(true),
    })
    .strict(),

  accessibility_audit: z
    .object({
      url: urlSchema,
      device: deviceSchema.default("mobile"),
      wcagOnly: z.boolean().default(false),
    })
    .strict(),

  browser_audit: z
    .object({
      url: urlSchema,
      device: deviceSchema.default("mobile"),
      screenshot: z.boolean().default(false),
      fullPage: z.boolean().default(false),
    })
    .strict(),

  links_audit: z
    .object({
      url: urlSchema,
    })
    .strict(),

  security_audit: z
    .object({
      url: urlSchema,
    })
    .strict(),
};

export const toolRegistry = {
  lighthouse_audit: async ({ url, device }) => runLighthouse(url, { device }),
  seo_audit: async ({ url, render }) => analyzeSEO(url, { render }),
  accessibility_audit: async ({ url, device, wcagOnly }) =>
    analyzeAccessibility(url, { device, wcagOnly }),
  browser_audit: async ({ url, device, screenshot, fullPage }) =>
    analyzeBrowser(url, {
      device,
      screenshot,
      fullPage,
    }),
  links_audit: async ({ url }) => analyzeLinks(url),
  security_audit: async ({ url }) => analyzeSecurity(url),
};

export const executeTool = async (name, args = {}) => {
  const tool = Object.hasOwn(toolRegistry, name) ? toolRegistry[name] : null;

  if (!tool) {
    return {
      success: false,
      tool: name,
      error: {
        code: "UNKNOWN_TOOL",
        message: `Unknown tool: ${name}`,
      },
    };
  }

  const parsed = schemas[name].safeParse(args);

  if (!parsed.success) {
    return {
      success: false,
      tool: name,
      error: {
        code: "INVALID_ARGUMENTS",
        message: "Invalid tool arguments",
        details: z.flattenError(parsed.error).fieldErrors,
      },
    };
  }

  try {
    const data = await tool(parsed.data);

    return {
      success: true,
      tool: name,
      data,
    };
  } catch (error) {
    return {
      success: false,
      tool: name,
      error: {
        code: "TOOL_EXECUTION_FAILED",
        message: error.message,
      },
    };
  }
};
