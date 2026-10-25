<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/sitescope-logo-dark.svg" />
    <img src="public/sitescope-logo.svg" alt="SiteScope — Clarity for every website." width="320" />
  </picture>
</p>

# SiteScope Frontend

**Clarity for every website.** A responsive dashboard for creating website audits, understanding findings, and deciding what to improve next.

Built with React, Vite, Tailwind CSS, and TanStack React Query. The interface combines a navy sidebar, teal accents, a custom SVG identity, and focused report views.

This guide covers the frontend application. For backend setup, scanner architecture, API examples, and project-wide deployment considerations, start with the [main project README](../README.md).

[Local setup](#local-setup) · [Screens and workflow](#screens-and-workflow) · [Branding and styling](#branding-and-styling) · [Project structure](#project-structure) · [Build and deployment](#build-and-deployment)

## What the dashboard includes

- **Quick audit entry:** carry a website URL from Overview into audit setup.
- **Six focus shortcuts:** performance, SEO, accessibility, browser diagnostics, link health, and security.
- **Workspace insights:** saved-audit count, recent measured scores, average performance, and failed requests.
- **Audit history:** server pagination, current-page website search, and status filtering.
- **Flexible setup:** mobile or desktop profile, scope presets, and custom instructions.
- **Report exploration:** Lighthouse scores, page-load metrics, findings, saved evidence, AI summary, and raw JSON.
- **Report actions:** export JSON, run another audit for the same URL and device, or delete a saved audit after confirmation.
- **Responsive navigation:** desktop sidebar and a modal navigation drawer on smaller screens.

All audit values come from the API. Empty, loading, error, and missing-result states are displayed explicitly.

## Local setup

### Prerequisites

- Node.js and npm. Local frontend checks have been run with Node.js 24.21.0.
- The SiteScope API configured using the [main setup instructions](../README.md#quick-start).

The frontend has its own dependencies and lockfile. Run the following commands from the **repository root**, using two terminals.

### 1. Install frontend dependencies

```bash
npm --prefix frontend ci
```

Backend dependencies, MongoDB, Groq credentials, and browser installation are covered in the main guide.

### 2. Start the API

```bash
# Terminal 1 — repository root
npm run dev
```

### 3. Start the frontend

```bash
# Terminal 2 — repository root
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173). Vite uses a fixed port of `5173`; it exits if the port is occupied. On Windows PowerShell, use `npm.cmd` if execution policy blocks the `npm.ps1` shim.

The UI can load without the backend, but creating audits and loading saved records require a working API. The header shows the connection state and includes a manual health refresh.

### API configuration

| Setting | Default | Where to change it |
| --- | --- | --- |
| Frontend development port | `5173` | [`vite.config.js`](vite.config.js), `server.port` |
| Development API proxy | `/api` → `http://localhost:5000` | [`vite.config.js`](vite.config.js), `server.proxy` |
| API base URL | `/api/v1` | `VITE_API_BASE_URL` |
| Health refresh interval | 60 seconds | [`useHealthQuery.js`](src/hooks/useHealthQuery.js) |

For a separately hosted API, create `frontend/.env.local` using [`frontend/.env.example`](.env.example) as a reference:

```dotenv
VITE_API_BASE_URL=https://your-backend.example.com/api/v1
```

`VITE_` values are public and embedded in the browser build. Groq credentials and MongoDB connection strings belong in the backend environment. Restart Vite after changing frontend environment values.

## Screens and workflow

| Route | Screen | Behaviour |
| --- | --- | --- |
| `/` | Workspace overview | Quick URL entry, six focus shortcuts, statistics, recent charts, and the five most recent audits |
| `/audits` | All audits | Ten records per page, website search, status filter, refresh, and report links |
| `/audits/new` | New audit | URL, device, audit scope, instructions, and request progress |
| `/audits/:id` | Audit report | Section tabs, scores, findings, evidence, AI summary, raw JSON, export, rerun, and deletion |
| Any unmatched path | Not found | A route back to the workspace |

### Start an audit

1. Enter a complete HTTP or HTTPS URL on Overview, or open **New audit**.
2. Select **Mobile** or **Desktop** and choose an audit scope. The six Overview shortcuts preselect the corresponding scope.
3. Review or customize the instructions. Presets cover complete, performance, SEO, accessibility, browser, links, and security audits; custom instructions are also available.
4. Submit once. The progress view shows elapsed request time while the backend runs the audit.
5. The report opens when the request succeeds. Revisit it later from **All audits**.

Scope presets guide the backend agent's tool selection. Check the saved results and any tool errors to confirm which checks actually ran. Progress shows request activity; the API does not stream individual scanner progress or provide a cancellation endpoint.

### Read a report

Report sections include **Overview**, **Performance**, **Accessibility**, **Best Practices**, **SEO**, **Security**, and **Links**. Browser diagnostics appear in the overview when saved. Section selection is stored in `?tab=`, and **Raw JSON** uses `?view=data`.

The Best Practices view shows its Lighthouse score and links to the combined Lighthouse findings. It does not present a separate saved issue list. **Run again** carries over the website and device; scope and instructions can be chosen again in setup.

Deletion requires confirmation. The UI disables deletion for `pending` and `running` records. The backend currently has no equivalent record-state guard, so direct API callers can still delete active records.

### Understand the numbers

- **Saved audits** is the total reported by API pagination.
- **Measured audits**, **Average performance**, and **Failed requests** describe the latest ten records, or fewer when fewer records exist.
- Charts summarize those recent records. They do not represent the entire workspace history.
- Missing scores are excluded from averages and remain unmeasured in report views.
- Search and status filters apply only to the current history page.
- Lighthouse scores and load metrics are lab measurements. Automated results still need review in context.
- A `completed` status is not proof of scanner execution. The current backend can complete an audit with no tool calls; inspect result categories and tool errors before interpreting the report.

## Branding and styling

The custom focus-and-check mark represents inspecting a website and identifying a clear next action. SVG assets remain sharp at both favicon and wordmark sizes.

| Asset or setting | Source |
| --- | --- |
| Product name and tagline | [`src/config/brand.js`](src/config/brand.js) |
| Reusable logo and compact mark | [`BrandLogo.jsx`](src/components/brand/BrandLogo.jsx) |
| Light-background wordmark | [`public/sitescope-logo.svg`](public/sitescope-logo.svg) |
| Dark-background wordmark | [`public/sitescope-logo-dark.svg`](public/sitescope-logo-dark.svg) |
| Browser favicon | [`public/favicon.svg`](public/favicon.svg) |
| Page metadata and theme colour | [`index.html`](index.html) |
| Theme tokens and shared styles | [`src/styles/index.css`](src/styles/index.css) |

The palette uses teal (`#117669`), navy (`#15262b`), white panels, and a soft neutral canvas (`#f5f7f8`). Tailwind's `@theme` defines colours, spacing, radii, typography, and shadows. Shared classes such as `.panel`, `.button`, and `.field` keep screens consistent.

Tailwind integrates through `@tailwindcss/vite`. Icons use individual imports from `lucide-react`; charts use Recharts. The `@/` alias resolves to `src/` in Vite and the editor configuration.

Keyboard navigation includes a skip-to-content link, visible focus styles, labelled controls, and a native modal dialog for the mobile drawer. Entrance animations respect reduced-motion preferences.

To rebrand the app, update the name and tagline, reusable logo, public SVG assets, and HTML metadata together. Route-specific browser titles use the shared brand name.

## Project structure

```text
frontend/
├── public/
│   ├── favicon.svg                  # Compact brand mark
│   ├── sitescope-logo.svg            # Light-background wordmark
│   └── sitescope-logo-dark.svg       # Dark-background wordmark
├── src/
│   ├── app/                         # Routes, query client, error boundary
│   ├── components/
│   │   ├── brand/                   # BrandLogo and BrandMark
│   │   ├── charts/                  # Shared responsive chart frame
│   │   ├── layout/                  # Dashboard shell and sidebar
│   │   └── ui/                      # Buttons, fields, badges, dialogs, states
│   ├── config/                      # Shared brand configuration
│   ├── features/
│   │   ├── audits/
│   │   │   ├── api/                 # HTTP functions and query keys
│   │   │   ├── components/          # Setup, progress, scores, findings, evidence
│   │   │   ├── constants/           # Scope presets and audit categories
│   │   │   ├── hooks/               # Queries and mutations
│   │   │   ├── lib/                 # Score, metric, and finding helpers
│   │   │   └── pages/               # Setup, history, and report screens
│   │   └── dashboard/
│   │       ├── components/          # Quick-audit hero and recent charts
│   │       └── pages/               # Workspace overview
│   ├── hooks/                       # API health query
│   ├── lib/                         # API client, formatting, downloads
│   ├── pages/                       # Not-found screen
│   ├── styles/index.css             # Theme and shared component styles
│   └── main.jsx                     # React entry point
├── .env.example                     # Public API configuration example
├── index.html                       # HTML entry and metadata
├── jsconfig.json                    # Editor alias configuration
├── package.json
├── package-lock.json
├── vite.config.js                   # Plugins, alias, dev server, proxy
├── vitest.config.js                 # Test-runner configuration
└── README.md
```

Keep audit-specific logic inside `features/audits/` and overview logic inside `features/dashboard/`. Shared UI belongs in `components/`. Register new screens in `src/app/App.jsx` and add navigation in `WorkspaceSidebar.jsx` when appropriate.

## API and server state

| Action | Endpoint |
| --- | --- |
| Check API health | `GET /api/v1/health` |
| Load audit history | `GET /api/v1/audits?page=1&limit=10` |
| Load a saved report | `GET /api/v1/audits/:id` |
| Create an audit | `POST /api/v1/audits` |
| Delete an audit | `DELETE /api/v1/audits/:id` |

The shared API client handles JSON parsing and readable request errors. TanStack React Query provides caching, invalidation, and request state:

- Reads stay fresh for 30 seconds and retry eligible network/server failures once.
- Mutations are not retried automatically, preventing duplicate audit submissions.
- Creation seeds the report cache and invalidates history; deletion removes the report cache and refreshes history.
- Lists poll every five seconds while an audit is being created or the page contains an active record. Active report views also poll every five seconds.
- A pending audit remains visible through a workspace notice when navigating away from setup. Keep the browser tab open for the active request.

The backend saves simplified results and `toolErrors` in MongoDB. The frontend also retains tool errors from the create response in the current report cache when refreshing. When no result or explicit tool error exists, the interface shows missing results; it cannot always distinguish a skipped check from an unsaved result. A completed audit can contain partial results or no scanner results.

## Build and deployment

Run from the **repository root**:

| Command | Purpose |
| --- | --- |
| `npm run dev:frontend` | Start the Vite development server |
| `npm run build:frontend` | Generate production assets in `frontend/dist/` |
| `npm run preview:frontend` | Preview the production build locally |
| `npm --prefix frontend run lint` | Check source with Oxlint |

For a production build:

1. Set `VITE_API_BASE_URL` before building when the API uses a separate origin.
2. Run `npm run build:frontend`.
3. Deploy the contents of `frontend/dist/` to a static host.
4. Configure an SPA fallback to `index.html` so report URLs and other nested routes work on refresh.
5. Deploy the API separately. For a relative `/api/v1` base URL, provide an API reverse proxy on the frontend origin.

The configured `/api` proxy is available during Vite development and is inherited by local Vite preview unless overridden. A static production host needs an explicit API URL or its own reverse proxy. Environment values are substituted at build time, so rebuild after changing them.

### Verification

Run the build and lint commands, then check the UI against a running backend: create an audit, inspect a report, filter history, export JSON, and verify mobile navigation. Use disposable audit records when checking deletion.

`npm run test:frontend` invokes Vitest; `npm --prefix frontend run test:watch` enables watch mode. The configuration expects `frontend/tests/setup.js` and `frontend/tests/**/*.test.jsx`, but this checkout does not currently include those files. A successful build or lint run does not establish end-to-end scanner or API coverage.

At present, `npm run test:frontend` exits with code `1` and reports **No test files found**. Add the setup file and meaningful page-flow tests before using it as a release check. Recommended cases include URL handoff, scope selection, failed creation, completed audits without results, saved tool errors, history pagination, export, and confirmed deletion.

### Backend readiness

Deploying the dashboard does not secure the API. Authentication, rate limiting, DNS/IP and redirect checks, and browser/network isolation remain backend work. Review [project limitations](../README.md#current-limitations) and [deployment considerations](../README.md#deployment-considerations) before exposing the application to public traffic.

Return to the [main project guide](../README.md) for backend configuration, API contracts, scanner limitations, and deployment considerations.
