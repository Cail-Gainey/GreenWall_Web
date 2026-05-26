# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /src

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml ./
# pnpm-lock.yaml*：带通配符允许 lockfile 不存在也不报错
COPY pnpm-lock.yaml* ./
RUN if [ -f pnpm-lock.yaml ]; then \
      pnpm install --frozen-lockfile; \
    else \
      pnpm install --no-frozen-lockfile; \
    fi

COPY . .
RUN pnpm build

# ---------- runtime ----------
FROM nginx:1.27-alpine AS runtime

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
