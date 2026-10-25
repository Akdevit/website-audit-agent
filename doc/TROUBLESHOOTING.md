# SiteScope troubleshooting and verification

[Main guide](../README.md) · [Setup](SETUP.md) · [API reference](API_USE_CASES.md) · [Architecture](ARCHITECTURE.md) · [Frontend guide](../frontend/README.md)

## MongoDB fails during startup

Confirm `MONGODB_URI` is present in `.env`, the database is reachable, and credentials are correct. For Atlas, also check database-user permissions and network access. The HTTP server starts only after the MongoDB connection succeeds.

## Groq authentication or model errors

Replace both Groq placeholders in `.env`. Use a model available to your account that supports local tool calling. Restart the server after changing `.env` so the running process picks up the values.

## `Tool choice is none, but model called a tool`

The agent allows up to six selection rounds and uses a separate report-only conversation after data collection. That conversation contains compact evidence and unexecuted checks, with `tool_choice` explicitly set to `none`.

Verify the running server uses the current `src/agents/audit.agent.js` and `src/agents/prompt.js`. Check model compatibility and whether the failure occurs during selection or final reporting. Never treat `failed_generation` text as a successful tool result.

## Browser executable not found

For Playwright checks, install Chromium from the project root:

```powershell
npx.cmd playwright install chromium
```

Lighthouse uses `chrome-launcher`; ensure Google Chrome is installed and discoverable separately.

If Lighthouse reports that it cannot fetch Chrome's browser WebSocket URL, check that the headless process can launch and that local debugging-port access is permitted. A working Playwright browser does not establish that Lighthouse's separate Chrome launch succeeds.

## `npm.ps1 cannot be loaded because running scripts is disabled`

Use the Windows command shim from PowerShell:

```powershell
npm.cmd run dev
npm.cmd run dev:frontend
```

This avoids changing the machine's PowerShell execution policy.

## Missing results or long-running audits

Inspect `toolErrors`, report limitations, and server logs. Individual tools have navigation/network timeouts; a complete audit can involve multiple browser scans and Groq requests. There is no global audit timeout setting wired into the application.

Groq rate limits can interrupt an audit. Review the provider error and available quota before retrying; the agent does not implement its own rate-limit queue.

Optional browser screenshots are written to `reports/screenshots/`, which is excluded by `.gitignore`. The public request body exposes only `url`, `query`, and `device`; screenshot options are tool-level arguments.

### An audit is completed but has no scan results

The current agent returns immediately when the model produces no tool calls. The service then saves `completed`, even if no scanner ran. This can affect complete as well as focused audit requests.

Inspect non-null categories under `results` and failures under `toolErrors`. A generated report or `completed` status alone is insufficient evidence of a measured audit. Enforcing a minimum scan requirement and complete-scope coverage requires a code change; it has not been implemented.

### Tool errors after reopening a report

The current backend persists `toolErrors` in the audit model and returns them through the detail endpoint. The history endpoint intentionally projects summary fields, so it does not include detailed tool errors. Existing records created before persistence was added may lack those details.

### A valid URL produces invalid tool arguments

The controller accepts parseable HTTP/HTTPS URLs, but the tool registry's `z.httpUrl()` schema requires a domain-style hostname. IP-literal URLs and single-label names such as `localhost` fail tool validation. A trusted website with a domain name is the supported request path.

This hostname rule does not protect against domains resolving to private addresses, redirected destinations, or unsafe browser subrequests. Those protections remain implementation work.

## Frontend connection and navigation issues

| Symptom | Check |
| --- | --- |
| Header shows API offline | Start the backend and verify its health endpoint; check the configured API port and base URL |
| Vite says port 5173 is occupied | Use the existing development server or stop the process occupying that port; Vite uses `strictPort` |
| Page loads but API returns HTML | Verify the API base URL or reverse proxy routes `/api` to the backend rather than the SPA fallback |
| Report URL fails on refresh after deployment | Configure the static host to serve `index.html` for frontend routes |
| New frontend environment value is ignored | Restart Vite in development or rebuild for deployment |
| Search misses an older audit | History search and status filtering apply only to the current page |

The Vite development proxy is inherited by local Vite preview unless overridden. A production static host needs its own API proxy or an absolute `VITE_API_BASE_URL`.

## Deleting an active audit

The UI disables deletion for `pending` and `running` records. The delete endpoint currently performs no status check, so a direct API request can remove an active record. Add a server-side lifecycle guard before relying on that restriction; there is no cancellation endpoint.

## Verification and test status

Run the following from the repository root:

```powershell
npm.cmd run build:frontend
npm.cmd --prefix frontend run lint
```

These commands check frontend compilation and linting. They do not execute a real audit or establish backend regression coverage.

| Command | Current result |
| --- | --- |
| `npm.cmd test` | Node.js test runner reports zero tests because no backend test files are included |
| `npm.cmd run test:frontend` | Vitest exits with code `1`: **No test files found** |

The frontend test configuration references `frontend/tests/setup.js` and `frontend/tests/**/*.test.jsx`; those files are absent. A zero-test exit from the backend runner is not a passing regression suite.

### Manual verification

1. Start MongoDB, the API, and the frontend using the [setup guide](SETUP.md).
2. Check `/api/v1/health`, then submit an audit for a trusted website using a complete or focused query.
3. Inspect actual result categories, saved tool errors, and the report. Reload the detail page to confirm persistence.
4. Verify history pagination, current-page filters, report tabs, JSON export, and rerun setup.
5. Check mobile navigation and keyboard focus. Use a disposable completed record to verify deletion and its confirmation dialog.

A real audit uses the configured Groq account, runs scanners, and creates a database record. Browser tests with mocked responses verify UI behaviour without proving that live scanners, Groq, and MongoDB work together.

### Recommended regression coverage

The following cases need tests; they are not an existing suite:

- All six tools requested in separate rounds.
- Multiple calls in one round and URL/device enforcement.
- Reused results, bounded repeated calls, and unexecuted checks.
- Failed tool evidence reaching the report phase.
- Model responses with no tool calls and no measured results.
- Persistence and retrieval of tool errors.
- Server-side handling of attempted active-record deletion.
- Frontend creation, failures, pagination, partial reports, exports, and confirmation flows.

For dependency advisory checks, run `npm.cmd audit` and `npm.cmd --prefix frontend audit`. They require registry access and reflect advisories available at execution time; they do not replace code review or application testing.
