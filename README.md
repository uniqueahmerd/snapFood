# SnapFood

SnapFood contains a React client, a Node.js API, and an AI inference service.

## Prerequisites

- Node.js and pnpm 11.22.0
- Git LFS for the model artifacts
- Docker
- PostgreSQL and Redis

## Clone

```sh
git clone <repository-url> snapFood
cd snapFood
git lfs install
git lfs pull
```

## Configure the API

Copy `backend/.env.example` to `backend/.env`, then set the PostgreSQL and Redis connection values and replace the example JWT secrets. Keep `.env` files local and never commit real credentials.

Start PostgreSQL and Redis, then run:

```sh
cd backend
pnpm install
pnpm dev
```

The API listens on port `5001` by default. `pnpm maildev` can start the development email inbox when needed.

## Start the AI service

From the project root, build and run the container:

```sh
docker build -t snapfood-ai ./ai-service/snapFood-ai
docker run --rm -p 8000:7860 -e AI_ADMIN_TOKEN=replace-with-a-long-random-service-token snapfood-ai
```

Set `AI_URL=http://localhost:8000/predict` in `backend/.env`. If using admin/model-management features, set the same high-entropy `AI_ADMIN_TOKEN` in both places.

## Start the client

Copy `client/.env.example` to `client/.env.development`, then run:

```sh
cd client
pnpm install
pnpm dev
```

The client listens on port `5174` and uses `http://localhost:5001/api/v1` by default.

## Checks

Run backend checks from `backend/` with `pnpm typecheck`, `pnpm test`, and `pnpm build`. Run the client production build from `client/` with `pnpm build`.