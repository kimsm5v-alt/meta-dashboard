# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# 1) 루트 + 각 workspace의 package.json만 먼저 복사 (소스 제외)
#    → package.json이 바뀌지 않으면 npm install 레이어가 캐시됨
COPY package*.json ./
COPY frontend/package.json ./frontend/
COPY prototype/package.json ./prototype/

# 2) 의존성 설치 (workspace 구조 인식 가능)
RUN npm install && npm install @rollup/rollup-linux-x64-musl --optional

# 3) 빌드에 필요한 frontend 소스만 복사
COPY frontend/ ./frontend/

# 4) 빌드
RUN npm run build --workspace=frontend

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
