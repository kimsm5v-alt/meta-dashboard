# Build stage
FROM containerregistry-private.kr.ncr.ntruss.com/node:20-alpine AS build
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

# 4) 빌드 (BUILD_MODE: dev → .env.development, prod → .env.production)
#    CI에서 브랜치별로 --build-arg BUILD_MODE=dev|prod 전달
#    미전달 시 prod로 동작하여 기존 동작과 동일(하위호환)
ARG BUILD_MODE=prod
RUN npm run build:${BUILD_MODE} --workspace=frontend

# Production stage
FROM nginx:stable-alpine

# non-root(UID 1000) 실행을 위한 권한 설정
RUN mkdir -p /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp \
    && chown -R 1000:1000 /tmp \
    && chown -R 1000:1000 /var/log/nginx \
    && chown -R 1000:1000 /etc/nginx/conf.d \
    && touch /tmp/nginx.pid \
    && chown 1000:1000 /tmp/nginx.pid

COPY frontend/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
RUN chown -R 1000:1000 /usr/share/nginx/html

USER 1000
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]