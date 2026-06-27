# syntax=docker/dockerfile:1
FROM node:24-slim AS build
WORKDIR /app

# Bake API/socket URLs into the client config at build time.
# config.json is imported as a module, so Vite inlines these into the bundle.
# Defaults assume single-origin hosting behind a reverse proxy:
#   - API served under /v1/api on the same origin
#   - Socket.IO on the same origin (empty URL => same-origin connect)
# Override for standalone use, e.g.:
#   --build-arg API_BASE_URL=http://localhost:4056/v1/api --build-arg SOCKET_URL=http://localhost:4056
ARG API_BASE_URL=/v1/api
ARG SOCKET_URL=

COPY package.json ./
RUN npm install

COPY . .

RUN printf '{\n  "API_BASE_URL": "%s",\n  "SOCKET_URL": "%s"\n}\n' "$API_BASE_URL" "$SOCKET_URL" > src/config/config.json \
    && npx vite build

# ---- Runtime stage: serve the static build with nginx ----
FROM nginx:alpine

# SPA routing config: try_files ... /index.html (replaces the stock default.conf)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static build output
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
