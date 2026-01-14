# tCredex Front + Backend Routing & Middleware Analysis

## What changed
- **Engines consolidated in backend**: The frontend now acts as a thin shell that proxies `/api/*` traffic to the backend service. All scoring, automatch, compliance, closing fees, and ingestion engines are expected to run on the backend.
- **API rewiring**: `next.config.js` adds a rewrite so every `/api/:path*` call is forwarded to the backend (`BACKEND_SERVICE_URL` or `NEXT_PUBLIC_API_URL`, default `http://localhost:3001`).
- **Middleware fast-path**: `middleware.ts` still gates private API routes with Clerk when needed, but skips UI-only logic for `/api` requests so backend-owned routes are not blocked or slowed by edge middleware.

## How to run locally
1) Start the backend on the port in `BACKEND_SERVICE_URL` (default `http://localhost:3001`).
2) Start the frontend with `npm run dev`.
3) Frontend requests to `/api/*` will be proxied to `<backend>/api/*` with no additional auth from the middleware (backend must enforce auth/ACLs).

## Operational checklist
- Verify backend health: `curl $BACKEND_SERVICE_URL/api/health`.
- Smoke critical engines through the proxy:
  - Automatch: `POST /api/automatch` with a `dealId`.
  - Scoring: `POST /api/scoring`.
  - Compliance: `POST /api/compliance/debarment`.
- Confirm Clerk/route protections still apply to app pages (non-`/api`).

## Notes for debugging
- If the backend URL changes, set `BACKEND_SERVICE_URL` (preferred) or `NEXT_PUBLIC_API_URL` before building/deploying.
- Middleware still handles QR/referral redirects and onboarding gating for app pages; API calls skip UI middleware but non-public routes still invoke Clerk protection before proxying.
