# Etapa 1: build del frontend e instalación de dependencias
FROM node:18-alpine AS builder

# Dependencias de compilación para better-sqlite3 (nativo)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar solo package.json para aprovechar caché de Docker
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json

RUN cd server && npm install && cd ../client && npm install

# Copiar todo el código y build del frontend
COPY . .
WORKDIR /app/client
RUN npm run build

# Etapa 2: imagen final ligera (solo producción)
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/package.json ./server/package.json

# Instalar solo dependencias de producción
RUN cd server && npm install --omit=dev

# Puerto que expone el contenedor
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/server.js"]
