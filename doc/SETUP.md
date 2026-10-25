# SiteScope local setup

[Main guide](../README.md) · [Frontend guide](../frontend/README.md) · [API reference](API_USE_CASES.md) · [Troubleshooting](TROUBLESHOOTING.md)

The API and dashboard run as separate processes. Commands below start from the repository root.

## Requirements

- Node.js and npm. Local development and frontend checks have been run with Node.js 24.21.0.
- A running local MongoDB instance or a MongoDB Atlas connection string.
- A Groq API key and a model supporting local function/tool calling.
- Google Chrome for Lighthouse and Playwright Chromium for the other browser checks.
- Network access to the target website and Groq.

Use trusted callers and target websites during development. Authentication, rate limiting, and complete browser/network isolation are not implemented.

## Install and run on Windows PowerShell

Run these commands from the project root:

```powershell
npm.cmd ci
npm.cmd --prefix frontend ci
npx.cmd playwright install chromium
```

Create the root environment file only if it does not already exist:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Compare an existing `.env` with [`.env.example`](../.env.example) and keep its values. Set the MongoDB connection string and replace both Groq placeholders. Start the API in the first terminal:

```powershell
npm.cmd run dev
```

The server connects to MongoDB before listening. Successful startup prints:

```text
MongoDB connected successfully
Server running on http://localhost:5000
```

The port changes if you set `PORT` to another value. On shells without the PowerShell script restriction, `npm` and `npx` can be used without `.cmd`.

### Start the dashboard

In a second terminal at the repository root:

```powershell
npm.cmd run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173). The development server reserves port `5173` and forwards `/api` to `http://localhost:5000`. If the API port changes, update `server.proxy` in [`frontend/vite.config.js`](../frontend/vite.config.js).

The dashboard can render without a reachable backend, but audit creation and saved history require the API. Check its connection indicator if requests fail.

### macOS and Linux

Use the same npm scripts without the `.cmd` suffix. Create the root environment file with the following command if it is absent:

```bash
test -f .env || cp .env.example .env
```

Install Google Chrome separately from Playwright Chromium. On Linux, provision the browser's required system libraries for your environment.

## Environment variables

| Variable | Purpose | Example/default |
| --- | --- | --- |
| `PORT` | HTTP server port | Defaults to `5000` |
| `NODE_ENV` | Application environment; production hides internal 500 error messages | Defaults to `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/website_audit_agent` |
| `GROQ_API_KEY` | Authenticates Groq API requests | Replace the template placeholder |
| `GROQ_MODEL` | Model ID used for tool selection and reporting | Replace with a tool-capable model available to your account |

The root [`.env.example`](../.env.example) contains placeholders only. `.env` and environment variants such as `.env.local` are ignored by Git. The backend loads the root `.env` through `dotenv/config`; backend environment variants are not automatically loaded.

Only the five variables above are consumed by the backend configuration. `AUDIT_TIMEOUT_MS` and `MAX_AUDIT_PAGES` are not wired into the code. Tool timeouts and limits are defined inside `src/tools/`.

### Frontend environment

The frontend defaults to `/api/v1`, so no frontend environment file is required for the local proxy setup. For a separately hosted API, set the following in `frontend/.env.local`, using [`frontend/.env.example`](../frontend/.env.example) as a reference:

```dotenv
VITE_API_BASE_URL=https://your-backend.example.com/api/v1
```

Vite loads frontend environment files and embeds `VITE_` settings into the browser build. Keep database credentials and Groq keys in the backend environment. Restart Vite or rebuild after changing frontend settings.

## Check the server

```powershell
Invoke-RestMethod -Uri 'http://localhost:5000/api/v1/health'
```

Expected response:

```json
{
  "success": true,
  "message": "Website Audit Agent API is running"
}
```

The health endpoint confirms that the HTTP process responds. It does not execute scanners or validate Groq model access.

## Verify the installation

```powershell
npm.cmd run build:frontend
npm.cmd --prefix frontend run lint
```

Then follow [API use cases](API_USE_CASES.md) to submit a real audit against a trusted website. This creates a MongoDB record and uses the configured Groq account. Inspect saved result categories, tool errors, and report limitations: `completed` alone does not prove scanner execution.

The test runners are configured, but the backend and frontend test suites are absent. `npm.cmd test` reports zero tests; `npm.cmd run test:frontend` currently exits with **No test files found**. See [verification and test status](TROUBLESHOOTING.md#verification-and-test-status) for the distinction between manual checks and regression coverage.

For production builds and static hosting, see the [frontend deployment guide](../frontend/README.md#build-and-deployment) and [project deployment considerations](../README.md#deployment-considerations).
