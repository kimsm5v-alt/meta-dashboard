# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm install
RUN npm run build --workspace=frontend

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
