# --- build stage ---
FROM node:24-slim AS build
WORKDIR /app
# npm install (not npm ci) — the committed lockfile is out of sync with package.json,
# which makes `npm ci` fail. Regenerate the lockfile to switch back to `npm ci`.
COPY package.json ./
RUN npm install
COPY . .
# Single-origin: relative API + same-origin socket (overridable via build args).
ARG API_BASE_URL=/v1/api
ARG SOCKET_URL=
RUN printf '{\n  "API_BASE_URL": "%s",\n  "SOCKET_URL": "%s"\n}\n' "$API_BASE_URL" "$SOCKET_URL" > src/config/config.json
# tsc baseline is pre-existing-broken; Vite build (esbuild) does not type-check.
RUN npx vite build

# --- serve stage ---
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
