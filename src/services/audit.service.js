import { runAuditAgent } from "../agents/audit.agent.js";
import { Audit } from "../models/audit.model.js";

const simplifyResult = (name, data) => {
  switch (name) {
    case "lighthouse_audit":
      return {
        scores: data.scores,
        metrics: {
          fcp: data.metrics?.fcp?.displayValue,
          lcp: data.metrics?.lcp?.displayValue,
          cls: data.metrics?.cls?.displayValue,
          tbt: data.metrics?.tbt?.displayValue,
          speedIndex: data.metrics?.speedIndex?.displayValue,
        },
        issues: data.issues?.slice(0, 10).map((issue) => ({
          id: issue.id,
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
          displayValue: issue.displayValue,
          categories: issue.categories,
          details: issue.details,
        })),
      };

    case "seo_audit":
      return {
        metadata: data.metadata,
        summary: data.summary,
        issues: data.issues?.slice(0, 10),
      };

    case "accessibility_audit":
      return {
        summary: data.summary,
        violations: data.violations?.slice(0, 10).map((item) => ({
          id: item.id,
          impact: item.impact,
          description: item.description,
          help: item.help,
          helpUrl: item.helpUrl,
          wcag: item.wcag,
          affectedElements: item.affectedElements,
          nodes: item.nodes,
        })),
      };

    case "browser_audit":
      return {
        pageErrors: data.pageErrors?.slice(0, 5),
        issues: data.issues?.slice(0, 10),
      };

    case "links_audit":
      return {
        summary: data.summary,
        broken: data.broken?.slice(0, 10),
        errors: data.errors?.slice(0, 5),
      };

    case "security_audit":
      return {
        https: data.https,
        tls: {
          authorized: data.tls?.authorized,
          protocol: data.tls?.protocol,
        },
        issues: data.issues?.slice(0, 10),
      };

    default:
      return {};
  }
};

export const executeAudit = async (url, options = {}) => {
  const { query = "Perform a complete website audit", device = "mobile" } =
    options;

  const audit = await Audit.create({
    url,
    device,
    status: "running",
    startedAt: new Date(),
  });

  try {
    const { answer, results } = await runAuditAgent(query, url, device);

    const toolNames = {
      lighthouse_audit: "lighthouse",
      seo_audit: "seo",
      accessibility_audit: "accessibility",
      browser_audit: "browser",
      links_audit: "links",
      security_audit: "security",
    };

    const compactResults = {};
    const toolErrors = {};

    for (const [name, result] of Object.entries(results)) {
      const key = toolNames[name];

      if (!key) continue;

      if (result.success) {
        compactResults[key] = simplifyResult(name, result.data);
      } else {
        toolErrors[key] = result.error;
      }
    }

    audit.results = compactResults;
    audit.toolErrors = toolErrors;
    audit.report = answer;
    audit.status = "completed";
    audit.completedAt = new Date();
    audit.durationMs = audit.completedAt - audit.startedAt;

    await audit.save();

    return {
      id: audit.id,
      url: audit.url,
      device: audit.device,
      status: audit.status,
      results: compactResults,
      toolErrors,
      report: audit.report,
      durationMs: audit.durationMs,
    };
  } catch (error) {
    audit.status = "failed";
    audit.error = error.message;
    audit.completedAt = new Date();
    audit.durationMs = audit.completedAt - audit.startedAt;

    await audit.save();
    throw error;
  }
};

export const getAllAudits = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [audits, total] = await Promise.all([
    Audit.find()
      .select(
        "url device status durationMs createdAt results.lighthouse.scores",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Audit.countDocuments(),
  ]);

  return {
    audits,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getAuditById = async (id) => {
  return Audit.findById(id).lean();
};


export const deleteAuditById = async (id) => {
  return Audit.findByIdAndDelete(id);
};