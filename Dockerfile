```dockerfile
# STAGE 1: Builder - instaluje zależności i buduje aplikację
FROM node:18-alpine AS builder
WORKDIR /app

# Kopiuj manifesty pakietów dla obu części aplikacji
COPY package*.json ./
COPY server/package*.json ./server/

# Instaluj zależności w sposób jawny i rozdzielony
# Krok 1: Instalacja dla głównego folderu
RUN npm install --only=production

# Krok 2: Instalacja dla podfolderu /server
RUN cd server && npm install --only=production

# Kopiuj resztę plików aplikacji
COPY . .

# (Opcjonalny krok, jeśli aplikacja wymaga budowania, np. Next.js)
# RUN npm run build

# STAGE 2: Production - tworzy finalny, lekki obraz
FROM node:18-alpine AS production
WORKDIR /app

# Stwórz dedykowanego użytkownika dla bezpieczeństwa
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Kopiuj zależności i pliki aplikacji z etapu buildera
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --chown=nextjs:nodejs . .

# Ustaw użytkownika
USER nextjs

# Ustaw port
EXPOSE 3000
ENV PORT 3000

# Komenda startowa
CMD ["npm", "start"]
```