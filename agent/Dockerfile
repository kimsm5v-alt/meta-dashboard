FROM python:3.11-slim
WORKDIR /app

# 기본 의존성 설치
COPY agent/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사 (모노레포 구조 대응)
COPY agent/ /app/

# 포트 설정 및 실행
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
