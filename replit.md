# Chicago City Guide

A single-page introduction to Chicago with city facts, a visitor likes list, an AI city guide, and a deep-dish photo gallery.

## Run & Operate

- Install dependencies with `pnpm install --frozen-lockfile`.
- Start `artifacts/chicago-guide: web` to run the website.
- Start `artifacts/api-server: API Server` to run the backend.
- The managed workflows set the required ports and URL prefixes.
- `pnpm run typecheck` — full typecheck across all packages
- `GET /api/healthz` — backend health check
- `GET /api/gallery/photos/search?query=Chicago%20deep%20dish%20pizza` — search Unsplash
- Required secret for photo search: `UNSPLASH_ACCESS_KEY` (Unsplash application Access Key)
- Optional secret for the AI guide: `GEMINI_API_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: plain HTML, CSS, and JavaScript served by Vite
- API: Express 5
- Validation: Zod
- API build: esbuild

## Where things live

- `artifacts/chicago-guide/index.html`, `style.css`, `script.js`, `chat.js`, and `gallery.js` — guide UI and browser interactions.
- `artifacts/api-server/src/routes/` — health, chat, and Unsplash API routes.
- `artifacts/api-server/src/lib/prompts.ts` and `src/city.ts` — AI guide instructions and city facts.
- `SPEC-AI-FEATURES.md` — original feature requirements.

## Architecture decisions

- Unsplash is called from the API server so its access key never reaches the browser.
- Added gallery selections are saved in the visitor's browser, not shared between visitors or stored in a database.
- Unsplash image links and photographer credits are kept with each saved photo.

## Product

Visitors can explore Chicago, ask the AI guide questions when its Gemini key is configured, and search Unsplash for photos to save in a browser-local deep-dish gallery.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Create an Unsplash developer application and add its Access Key to Replit Secrets as `UNSPLASH_ACCESS_KEY`; restart the API workflow after setting it.
- The gallery only saves Unsplash photo references in local browser storage; it does not download or copy image files.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
