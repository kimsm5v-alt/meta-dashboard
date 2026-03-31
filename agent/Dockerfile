# -----------------------------------------------------------------------------
# Meta Dashboard AI Agent Service Dockerfile
# -----------------------------------------------------------------------------
# 이 Dockerfile은 LangChain과 LiteLLM을 활용한 고성능 AI 에이전트 서비스를
# 컨테이너화하기 위해 설계되었습니다. 가벼운 배포를 위해 alpine 기반 이미지를 사용하며,
# 보안과 효율성을 고려하여 구성되었습니다.

# 1단계: 빌드 환경 (의존성 설치)
FROM python:3.11-slim AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 환경 변수 설정 (Python 캐시 무효화 방지 및 출력 실시간 확인)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 시스템 종속성 설치 (필요시 추가)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 의존성 파일 복사 및 설치
COPY agent/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt


# 2단계: 실행 환경
FROM python:3.11-slim

# 작업 디렉토리 설정
WORKDIR /app

# 빌드 단계에서 설치된 라이브러리 복사
COPY --from=builder /install /usr/local

# 애플리케이션 소스 코드 복사
COPY agent/ .

# 실행 시간 환경 변수 설정
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# 보안을 위해 비루트(non-root) 사용자 생성 및 전환
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# API 포트 노출 (FastAPI 기본 포트)
EXPOSE 8000

# 컨테이너 실행 명령 (Gunicorn + UvicornWorker를 사용한 프로덕션 서버 실행)
# --workers: CPU 코어 수에 맞춘 워커 프로세스 생성 (병렬 처리 향상)
# --worker-class: 비동기 처리를 위한 UvicornWorker 지정
# --keep-alive: 연결 유지 시간 최적화
# 주의: 세션 메모리가 인메모리(dict) 기반이므로 워커는 1개로 고정
# 멀티 워커(-w N)가 필요하면 Redis 등 외부 세션 저장소 도입 후 변경할 것
CMD ["gunicorn", "main:app", "-w", "1", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "--keep-alive", "65", "--forwarded-allow-ips", "*"]
