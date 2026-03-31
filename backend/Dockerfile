# ===== Build Stage =====
FROM ncp-vsaidt-registry.ncr.gov-ntruss.com/openjdk:17.0.1-jdk-slim AS builder

COPY . /tmp
WORKDIR /tmp

RUN sed -i 's/\r$//' ./gradlew
RUN chmod +x ./gradlew
RUN ./gradlew :backend:clean
RUN ./gradlew :backend:bootJar -x test

# ===== Runtime Stage =====
FROM ncp-vsaidt-registry.ncr.gov-ntruss.com/openjdk:17.0.1-jdk-slim

COPY --from=builder /tmp/backend/build/libs/*.jar app.jar
# 심리검사 파일
COPY --from=builder /tmp/backend/assets ./assets

# CSAP 조치
RUN useradd -m -s /bin/bash visang
USER visang

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

CMD ["java", "-jar", "app.jar"]
