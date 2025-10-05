# Stage 1: Build the NestJS app
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Stage 2: Run the app
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/main.js"]
