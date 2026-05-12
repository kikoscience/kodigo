# Stage 1: Build the Frontend
FROM node:18-slim as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production Server
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=build-stage /app/dist ./dist
COPY server.cjs ./
COPY .env ./

# Ensure the app can connect to MSSQL on the host/network
ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002
CMD ["node", "server.cjs"]
