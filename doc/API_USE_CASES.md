# SiteScope API reference and use cases

[Main guide](../README.md) · [Setup](SETUP.md) · [Architecture](ARCHITECTURE.md) · [Troubleshooting](TROUBLESHOOTING.md)

Default base URL: `http://localhost:5000`.

## Available endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Confirm that the API is running |
| `POST` | `/api/v1/audits` | Execute an audit, save it, and return its results |
| `GET` | `/api/v1/audits?page=1&limit=10` | List saved audits with pagination |
| `GET` | `/api/v1/audits/:id` | Retrieve a saved audit record |
| `DELETE` | `/api/v1/audits/:id` | Permanently delete a saved audit |

Create requests wait for scanning and reporting to finish. The read endpoints support saved history and report retrieval. There is currently no background-job or cancellation endpoint.

The list endpoint accepts a positive integer `page` (default `1`) and a `limit` from `1` to `100` (default `10`). Its `data` contains `audits` and `pagination: { page, limit, total, totalPages }`. List items include `_id`, URL, device, status, duration, creation time, and Lighthouse scores. Detail and delete endpoints require a valid MongoDB ID; a missing record returns `404`. Delete returns a success message without an audit payload.

List responses contain projected summary fields. Use the detail endpoint for saved category evidence, report text, errors, and full record metadata. Create responses identify the record with `id`; saved list/detail records use MongoDB's `_id`.

The API currently has no authentication or ownership checks. Delete does not reject active records, even though the dashboard disables deletion while an audit is pending or running. Restrict callers until server-side access and lifecycle controls are implemented.

## Audit request

Send JSON with `Content-Type: application/json`:

```json
{
  "url": "https://example.com/",
  "query": "Perform a complete website audit",
  "device": "mobile"
}
```

| Field | Required | Behavior |
| --- | --- | --- |
| `url` | Yes | Must be a parseable HTTP or HTTPS URL |
| `query` | No | Non-empty string; defaults to `Perform a complete website audit` |
| `device` | No | `mobile` or `desktop`; defaults to `mobile` |

The controller accepts parseable HTTP/HTTPS URLs, while the tool registry applies `z.httpUrl()` and requires a domain-style hostname. Literal IP addresses and single-label hostnames such as `localhost` are rejected at tool-argument validation. A URL accepted by the controller can therefore still produce tool errors. Domain validation does not block private-network DNS resolution or unsafe redirects.

## Use case 1: complete website audit

Use before a release or when you want findings across all six categories. Omitting `query` and `device` uses the defaults.

```powershell
$auditBody = @{ url = 'https://example.com/' } | ConvertTo-Json
Invoke-RestMethod -Method Post `
  -Uri 'http://localhost:5000/api/v1/audits' `
  -ContentType 'application/json' `
  -Body $auditBody
```

The model is instructed to run all six tools, but selection is not enforced. Check the returned categories and limitations to confirm actual coverage. If the model makes no tool calls, the current implementation can still return HTTP `201` with `status: "completed"` and no scanner results.

## Use case 2: focused SEO audit

Use when investigating missing titles, descriptions, canonical URLs, or heading problems.

```json
{
  "url": "https://example.com/",
  "query": "Check SEO only. Inspect metadata, canonical tags, headings, and structured data.",
  "device": "mobile"
}
```

The query guides model selection; there is currently no API field that forces an exact list of tools.

## Use case 3: desktop performance and runtime issues

Use when a page is slow or has browser errors on desktop.

```json
{
  "url": "https://example.com/",
  "query": "Audit performance and browser runtime only. Focus on slow loading, JavaScript errors, failed requests, and horizontal overflow.",
  "device": "desktop"
}
```

To compare devices, submit a second request with `device` set to `mobile`. Each request creates its own audit record and report.

## Use case 4: accessibility checks

```json
{
  "url": "https://example.com/",
  "query": "Run an accessibility audit only. Prioritize verified axe violations and actionable fixes.",
  "device": "mobile"
}
```

Automated accessibility checks do not replace manual keyboard and assistive-technology testing.

## Use case 5: internal links and security configuration

```json
{
  "url": "https://example.com/",
  "query": "Check internal broken links and passive security configuration only, including redirects, HTTPS, TLS, and security headers."
}
```

The link scanner checks up to 30 internal links. External links are collected but not requested. Security checks inspect configuration; they do not perform exploitation.

## Successful response

HTTP `201` returns this structure. Field values below are illustrative; actual results depend on tools executed.

```json
{
  "success": true,
  "message": "Website audit completed successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "url": "https://example.com/",
    "device": "mobile",
    "status": "completed",
    "results": {},
    "toolErrors": {},
    "report": "Summary: ... Findings: ... Limitations: ...",
    "durationMs": 45000
  }
}
```

`results` contains simplified successful outputs under `lighthouse`, `seo`, `accessibility`, `browser`, `links`, and/or `security`. `toolErrors` contains failures under those same category names. Both are persisted in MongoDB and returned by the detail endpoint. The list endpoint omits tool errors and detailed findings.

A completed status means the workflow returned without throwing. It does not guarantee that any scanner ran, that all requested categories were checked, or that the website passed. Compare non-null result categories and explicit tool errors; an absent category may have been skipped.

Saved evidence is bounded: most issue lists retain at most ten items, browser page errors retain at most five, and only selected scanner fields are persisted. The API does not return every raw scanner diagnostic.

The report prompt requests at most 150 words with Summary, Findings, and Limitations, and up to three verified issues. This format is prompted rather than validated by a response schema.

## Errors and current limits

- HTTP `400`: invalid or missing URL, unsupported URL protocol, invalid device, empty/non-string query, invalid pagination, or invalid audit ID.
- HTTP `404`: unknown route or a valid audit ID with no matching saved record.
- Execution errors go through the error middleware, which uses `err.statusCode` or defaults to `500`. Production hides the message for a `500` response.
- Audits inspect the supplied page; this is not a full-site crawler.
- The current API has no authentication, rate limiter, or private-network destination blocking. Keep this development service restricted to trusted callers and target URLs.

## Lifecycle status

| Status | Meaning |
| --- | --- |
| `pending` | Supported by the model; the current create service starts records directly as `running` |
| `running` | The create request is executing |
| `completed` | The workflow returned and results/report were saved; scanner coverage can be partial or empty |
| `failed` | Execution threw; the service attempts to save the error and completion timing |

There is no update, retry, or cancellation endpoint. Re-running an audit creates a new record. Confirm deletion before sending `DELETE`; it removes the saved record permanently.
