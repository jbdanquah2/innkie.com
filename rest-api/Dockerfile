# Stage 1: Build the NestJS app
FROM node:20-alpine AS build

WORKDIR /app

# Copy root workspace configuration
COPY package*.json ./
# Copy shared-models and rest-api package.json files for dependency installation
COPY shared-models/package*.json ./shared-models/
COPY rest-api/package*.json ./rest-api/
COPY functions/package*.json ./functions/

# Install dependencies for all workspaces
RUN npm install --ignore-scripts

# Copy source code
COPY shared-models/ ./shared-models/
COPY rest-api/ ./rest-api/

# Build shared-models first since rest-api depends on it
RUN npm run build -w shared-models

# Build rest-api
RUN npm run build -w rest-api

# Stage 2: Run the app
FROM node:20-alpine

WORKDIR /app

# Copy node_modules from build stage (it contains symlinks to workspaces)
COPY --from=build /app/node_modules ./node_modules

# Copy built files for rest-api
COPY --from=build /app/rest-api/dist ./rest-api/dist
COPY --from=build /app/rest-api/package*.json ./rest-api/

# Copy built files for shared-models (needed because rest-api node_modules symlink points here)
COPY --from=build /app/shared-models/dist ./shared-models/dist
COPY --from=build /app/shared-models/package*.json ./shared-models/

# Set working directory to the app we want to run
WORKDIR /app/rest-api

ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/main.js"]
