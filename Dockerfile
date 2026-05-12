# Stage 1: Build the Frontend
FROM node:18-slim as build-stage
WORKDIR /app
COPY package*.json ./
# Install all dependencies including devDependencies for build
RUN npm install
COPY . .
# Fix potential permission issues with vite binary and build
RUN chmod -R +x node_modules/.bin
RUN npm run build

# Stage 2: Production Server
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=build-stage /app/dist ./dist
COPY server.cjs ./
COPY .env ./

# Environment Setup
ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002
CMD ["node", "server.cjs"]
