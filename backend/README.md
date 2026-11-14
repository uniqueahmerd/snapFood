# SnapFood Backend

## Commands

Run these commands from `backend/`:

```sh
pnpm dev
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

Development uses `tsx` to execute `src/index.ts`; nodemon watches source files and restarts the process. Production runs the CommonJS output at `dist/index.js`. Keep `type`, `tsconfig.json`, and these scripts aligned when changing the module format or entry point.

## Environment

Copy `.env.example` to `.env` and set database, JWT, SMTP, AI, and frontend-origin values. Never commit `.env` or use development credentials in production. Production requires SMTP credentials and a real `SENDER_EMAIL`; use separate, high-entropy access and refresh JWT secrets.

All runtime configuration is read through `src/config/env.ts`. Add new environment variables there with defaults only when those defaults are safe for development. This makes invalid ports and missing production mail settings fail early rather than during a request.

The admin Monitoring tab can include AI-service logs when `AI_ADMIN_TOKEN` is set to the same high-entropy value in the backend and AI-service environments. The AI service keeps a bounded in-memory log buffer, and the backend proxies it through the admin-authenticated `/api/v1/system/logs` route. Without the shared token, backend monitoring remains available and the dashboard marks AI logs unavailable. Registering a fresh model also requires this shared token. The Models tab accepts a compatible Keras `.keras` classifier or an EfficientNetV2-S multilabel `.pth` checkpoint, plus matching class labels; artifacts are validated before registration. The runtime loads only these supported formats and does not execute uploaded Python code.

## Database

The app uses the TypeORM `AppDataSource` in `src/config/database.config.ts`. Entity discovery supports `.ts` while running under `tsx` and `.js` in `dist`. `synchronize` is enabled only in development; production schema changes must be deployed as migrations.

The food and dashboard modules query a `food_scan` table directly. Verify that a migration exists in the deployed database with the columns used by those queries (`user_id`, `dish_name`, `nutrients`, `calories`, `confidence`, `health_assesment`, `recommendations`, `health_condition`, `risk_level`, `scanned_at`, and `created_at`). Add that migration before enabling those endpoints on a new database.

## API And Security Notes

Routes are mounted under `/api/v1`. Food history is user-scoped and should be requested with `GET /api/v1/food/history`; dashboard endpoints use `/api/v1/dashboard`. Keep protected handlers behind the shared `authenticate` middleware so account activity and token claims are checked consistently.

The test-email route is development-only. Request body limits are intentionally bounded; do not raise them globally for image upload, use a dedicated upload flow instead. Add focused tests for auth token rotation, OTP expiry/reset, user-owned food history, and route access when expanding the test suite.