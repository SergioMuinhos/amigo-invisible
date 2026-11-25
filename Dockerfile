# ==========================================
# Etapa 1: Build del frontend y dependencias
# ==========================================
FROM node:20-alpine AS builder

# Herramientas de compilación C/C++ requeridas para better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar archivos de dependencias
COPY server/package.json server/package-lock.json ./server/
COPY client/package.json client/package-lock.json ./client/

# Instalar dependencias completas para build
RUN cd server && npm ci
RUN cd client && npm ci

# Variables de compilación para el frontend (Vite)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_API_BASE=/api

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_API_BASE=$VITE_API_BASE

# Copiar el código fuente completo
COPY . .

# Compilar frontend
WORKDIR /app/client
RUN npm run build

# Limpiar dependencias de desarrollo en el servidor para dejar solo producción
WORKDIR /app/server
RUN npm prune --omit=dev

# ==========================================
# Etapa 2: Imagen final de producción
# ==========================================
FROM node:20-alpine

WORKDIR /app

# Zona horaria y herramientas básicas
RUN apk add --no-cache tzdata

# Crear directorio para la base de datos SQLite persistente
RUN mkdir -p /data

# Copiar backend ya preparado con sus módulos compilados
COPY --from=builder /app/server ./server
# Copiar el build del frontend para que Express lo sirva estáticamente
COPY --from=builder /app/client/dist ./client/dist

# Variables de entorno por defecto
ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/data/database.sqlite

EXPOSE 3000

# Verificación de salud del contenedor (compatible con Docker y Portainer)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server/server.js"]
