# STAGE 1: Builder - instaluje zależności i przygotowuje całą aplikację
FROM node:18-alpine AS builder
WORKDIR /app

# Kopiuj manifesty pakietów
COPY package*.json ./
COPY server/package*.json ./server/

# Instaluj zależności w obu miejscach
RUN npm install --only=production
RUN cd server && npm install --only=production

# Kopiuj resztę plików źródłowych aplikacji
COPY . .

# (Opcjonalny krok, jeśli aplikacja wymaga budowania, np. Next.js)
# RUN npm run build

# STAGE 2: Production - tworzy finalny, lekki obraz
FROM node:18-alpine AS production
WORKDIR /app

# Stwórz dedykowanego użytkownika dla bezpieczeństwa
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# --- KRYTYCZNA POPRAWKA ---
# Zamiast kopiować każdy folder osobno, kopiujemy CAŁY przygotowany
# folder /app z etapu 'builder'. To rozwiązuje problem brakującego
# folderu node_modules i jest znacznie czystszą praktyką.
COPY --from=builder --chown=nextjs:nodejs /app .

# Ustaw użytkownika
USER nextjs

# Ustaw port
EXPOSE 3000
ENV PORT 3000

# Komenda startowa
CMD ["npm", "start"]
