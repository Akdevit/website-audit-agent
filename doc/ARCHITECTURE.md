# SiteScope architecture

[Main guide](../README.md) · [Setup](SETUP.md) · [API reference](API_USE_CASES.md) · [Frontend](../frontend/README.md) · [Troubleshooting](TROUBLESHOOTING.md)

SiteScope has a React dashboard in `frontend/` and an Express API in `src/`. The API coordinates Groq tool selection, six scanners, and MongoDB persistence. Each application has its own dependency manifest and lockfile.

## Request flow

```text
POST /api/v1/audits
  -> audit.route.js
  -> audit.controller.js: validate URL, query, and device
  -> audit.service.js: create a running MongoDB audit record
  -> audit.agent.js: ask Groq to select tools
  -> schema.js + registry.js: describe, validate, and execute tools
  -> audit.agent.js: return the model report and collected results
  -> audit.service.js: simplify results and save the completed record
  -> controller: return HTTP 201 with the audit
```

When execution throws, the service marks the audit as failed and the error middleware formats the HTTP response. Individual tool failures can still produce a completed audit with partial findings; inspect `toolErrors` and report limitations.

The current service does not require a successful scanner result before saving `completed`. If the model returns without tool calls, a completed record can contain no scan results. This is an execution gap, not evidence of a healthy website.

## File guide

Paths below are relative to the project root.

| File | Responsibility | When to change it |
| --- | --- | --- |
| `src/server.js` | Connects MongoDB and starts the HTTP server | Startup behavior |
| `src/app.js` | Express setup, health endpoint, routes, and error handlers | Add an API route or application middleware |
| `src/config/env.js` | Loads runtime environment values | Wire a new environment setting into the application |
| `src/config/db.js` | MongoDB connection | Database connection behavior |
| `src/ai/groq.client.js` | Shared Groq client | Client configuration |
| `src/routes/audit.route.js` | Registers create, list, detail, and delete audit endpoints | Add audit endpoints |
| `src/controllers/audit.controller.js` | Validates incoming data and formats the response | Request validation or response envelope |
| `src/services/audit.service.js` | Audit lifecycle, persistence, and result simplification | Saved or returned audit fields |
| `src/models/audit.model.js` | MongoDB audit schema, status, results, and timestamps | Persist new audit data |
| `src/agents/audit.agent.js` | Tool loop, result reuse, compact evidence, and final reporting | Agent execution behavior |
| `src/agents/prompt.js` | Tool-selection prompt and separate report prompt | Report wording, evidence rules, or tool-selection instructions |
| `src/tools/schema.js` | Tool descriptions and JSON argument schemas sent to Groq | Expose a tool or parameter to the model |
| `src/tools/registry.js` | Zod validation, tool dispatch, and structured failure handling | Register a new tool or validate parameters |
| `src/middlewares/error.middleware.js` | HTTP error responses | Error status or message handling |
| `frontend/src/app/App.jsx` | Dashboard routes and lazy page loading | Add frontend screens |
| `frontend/src/features/audits/hooks/useAudits.js` | Query caching, polling, creation, and deletion | Change server-state behaviour |
| `frontend/src/config/brand.js` | Product name and tagline | Update branding |
| `frontend/src/styles/index.css` | Theme tokens and shared UI styles | Change visual foundations |
| `frontend/vitest.config.js` | Frontend test-runner configuration; test files are currently absent | Configure future page-flow tests |
| `.env.example` | Shareable configuration template | Document a supported environment variable |
| `.gitignore` | Excludes credentials and generated output | Add a generated directory |

Reporting is implemented in `src/agents/audit.agent.js`; there is no separate report service file in this checkout. `src/middlewares/validate.middleware.js` is not wired into the audit route; active request validation is in the controller.

## Persistence and API boundaries

The service saves the URL, device, lifecycle status, simplified results, `toolErrors`, report, error text, timing, and timestamps in the audit model. Successful scanner data is reduced to selected fields and bounded finding lists before saving. A JSON export contains that saved representation.

The history query projects basic record fields and Lighthouse scores. The detail query loads the saved record, including category evidence and tool errors. Deletion uses `findByIdAndDelete` without an active-status guard; the dashboard's disabled delete button is a UI restriction only.

## Tool files and use cases

| Tool file | Registered name | Use case |
| --- | --- | --- |
| `src/tools/lighthouse.tool.js` | `lighthouse_audit` | Investigate slow loads, Core Web Vitals lab metrics, and Lighthouse scores |
| `src/tools/seo.tool.js` | `seo_audit` | Check metadata, headings, canonical tags, and structured data |
| `src/tools/accessibility.tool.js` | `accessibility_audit` | Find automated axe accessibility violations |
| `src/tools/browser.tool.js` | `browser_audit` | Investigate JavaScript errors, request failures, and layout overflow |
| `src/tools/links.tool.js` | `links_audit` | Check internal links for HTTP failures and redirects |
| `src/tools/security.tool.js` | `security_audit` | Inspect HTTPS, TLS, security headers, and cookie flags |

## Agent behavior

- A complete audit instructs the model to select all six tools. A focused query lets it choose relevant tools.
- The loop permits up to six selection rounds, matching the number of registered tools. Multiple calls can be handled in one round.
- Repeated requests for the same tool reuse its result within that audit.
- The agent pins the URL to the validated request URL and overrides device arguments for device-aware tools.
- Once all tools have results, or the round budget is exhausted, a fresh conversation generates the final report with tools disabled. It includes collected evidence and unexecuted check names.
- If the model returns a report earlier without tool calls, the agent returns that report immediately.

## Validation and execution limits

The controller checks URL syntax and HTTP/HTTPS protocol, device, query, pagination, and record IDs. Tool arguments receive separate Zod validation in the registry. Its `z.httpUrl()` schema requires a domain-style hostname and rejects literal IP addresses and single-label names such as `localhost`.

Hostname validation does not provide SSRF protection. Domain names can resolve to private addresses, redirects can change destinations, and browser subrequests also require network controls. The API has no authentication, rate limiter, queue, overall audit deadline, or cancellation endpoint.

The frontend uses React Query for caching and polling; it does not create a background worker. A pending create mutation survives in-app navigation while the tab remains open. See the [frontend guide](../frontend/README.md#api-and-server-state) for cache behaviour.

## Adding a tool

1. Implement the scanner in `src/tools/`.
2. Add its model-facing definition to `schema.js`.
3. Add its Zod argument schema and handler to `registry.js`.
4. Update the tool instructions in `prompt.js`, including the complete-audit tool count.
5. Update `compactResult` in the agent so the report receives the relevant evidence.
6. Update the name mapping and `simplifyResult` in `audit.service.js`, plus the MongoDB results schema if the new result must be saved.
7. Extend the frontend category definitions and report views when the new scanner needs a UI.
8. Add regression tests and update the API, setup, and architecture documentation. Test runners exist, but backend and frontend test suites are not included in this checkout.
