import { groq } from "../ai/groq.client.js";
import { env } from "../config/env.js";
import { toolSchemas } from "../tools/schema.js";
import { executeTool } from "../tools/registry.js";
import { AUDIT_REPORT_PROMPT, AUDIT_SYSTEM_PROMPT } from "./prompt.js";

// Allow every tool to run even when the model requests only one per round.
const MAX_ROUNDS = toolSchemas.length;

// Send only useful findings to Groq.
const compactResult = (name, result) => {
  if (!result.success) {
    return JSON.stringify({
      success: false,
      tool: name,
      error: result.error,
    });
  }

  const data = result.data;

  const summary = {
    success: true,
    tool: name,
    scores: data.scores,
    metrics: data.metrics,
    metadata: data.metadata,
    headings: data.headings,
    summary: data.summary,
    https: data.https,
    tls: data.tls
      ? {
          authorized: data.tls.authorized,
          protocol: data.tls.protocol,
        }
      : undefined,
    issues: data.issues?.slice(0, 5).map((issue) => ({
      id: issue.id,
      title: issue.title,
      severity: issue.severity,
      displayValue: issue.displayValue,
      message: issue.message,
    })),
    violations: data.violations?.slice(0, 3),
    broken: data.broken?.slice(0, 5),
    errors: data.errors?.slice(0, 3),
  };

  return JSON.stringify(summary);
};

export const runAuditAgent = async (query, url, device = "mobile") => {
  const messages = [
    {
      role: "system",
      content: AUDIT_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `Audit ${url} on ${device}. Task: ${query}`,
    },
  ];

  const results = {};

  for (let i = 0; i < MAX_ROUNDS; i++) {
    const response = await groq.chat.completions.create({
      model: env.GROQ_MODEL,
      messages,
      tools: toolSchemas,
      tool_choice: "auto",
      max_completion_tokens: 1200,
    });

    const message = response.choices[0]?.message;

    if (!message) {
      throw new Error("Empty response from Groq");
    }

    messages.push(message);

    if (!message.tool_calls?.length) {
      return {
        answer: message.content ?? "",
        results,
      };
    }

    for (const call of message.tool_calls) {
      try {
        const args = JSON.parse(call.function.arguments || "{}");

        args.url = url;

        if (
          ["lighthouse_audit", "accessibility_audit", "browser_audit"].includes(
            call.function.name,
          )
        ) {
          args.device = device;
        } else {
          delete args.device;
        }

        // Reuse results instead of scanning again.
        if (!Object.hasOwn(results, call.function.name)) {
          results[call.function.name] = await executeTool(
            call.function.name,
            args,
          );
        }

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: compactResult(
            call.function.name,
            results[call.function.name],
          ),
        });
      } catch (error) {
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({
            success: false,
            error: error.message,
          }),
        });
      }
    }

    if (
      toolSchemas.every(({ function: tool }) => Object.hasOwn(results, tool.name))
    ) {
      break;
    }
  }

  // Use a fresh reporting conversation so tool instructions/history cannot
  // encourage further calls after tools have been disabled.
  const response = await groq.chat.completions.create({
    model: env.GROQ_MODEL,
    messages: [
      { role: "system", content: AUDIT_REPORT_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          task: query,
          url,
          device,
          results: Object.entries(results).map(([name, result]) =>
            JSON.parse(compactResult(name, result)),
          ),
          unexecutedChecks: toolSchemas
            .map(({ function: tool }) => tool.name)
            .filter((name) => !Object.hasOwn(results, name)),
        }),
      },
    ],
    tool_choice: "none",
    max_completion_tokens: 1200,
  });

  return {
    answer: response.choices[0]?.message?.content ?? "",
    results,
  };
};
