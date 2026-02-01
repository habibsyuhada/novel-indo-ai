# ---- deps ----
FROM node:22.13.1 AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- build ----
FROM node:22.13.1 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- run ----
FROM node:22.13.1 AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Jika pakai output: "standalone", uncomment 3 baris ini dan sesuaikan:
# COPY --from=build /app/.next/standalone ./
# COPY --from=build /app/.next/static ./.next/static
# COPY --from=build /app/public ./public

# Jika tidak pakai standalone:
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["npm","start"]
