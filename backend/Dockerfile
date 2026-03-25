# ===== Build Stage =====
FROM gradle:8.5-jdk17 AS build

WORKDIR /app
COPY settings.gradle ./
COPY backend/build.gradle ./backend/
COPY gradle ./gradle

# 의존성 캐시 레이어 (소스 변경 시 재다운로드 방지)
RUN gradle :backend:dependencies --no-daemon || true

COPY backend/src ./backend/src
RUN gradle :backend:bootJar --no-daemon -x test

# ===== Runtime Stage =====
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /app/backend/build/libs/*.jar app.jar

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8081

# 필수 환경변수 (docker run --env-file 또는 -e 로 주입)
# ── DB ──
# SPRING_DATASOURCE_DRIVER_CLASS_NAME
# META_API_DATASOURCE_MASTER_URL / USERNAME / PASSWORD
# META_API_DATASOURCE_SLAVE_URL  / USERNAME / PASSWORD
# ── JWT ──
# META_API_JWT_SECRET
# ── NCP Mail ──
# NCP_MAIL_ACCESS_KEY / SECRET_KEY
# ── 기타 ──
# KEY_SALT_MAIN
# SPRING_PROFILES_ACTIVE (default: local)

ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dserver.port=8081", \
  "-jar", "app.jar"]
