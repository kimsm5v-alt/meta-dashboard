#!/bin/bash
# 로컬 HTTPS 개발 환경 셋업 스크립트 (최초 1회 실행)
# - /chat/stream → 로컬 에이전트(localhost:8000)
# - 나머지 경로  → 실서버(t-meta-agent-api.vsaidt.com) 투명 전달
#
# 실행: bash agent/scripts/setup-local-https.sh
set -e

DOMAIN="t-meta-agent-api.vsaidt.com"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENT_DIR="$(dirname "$SCRIPT_DIR")"
CERT_DIR="$AGENT_DIR/certs"
CADDYFILE="$AGENT_DIR/Caddyfile.local"

echo "=== 로컬 HTTPS 셋업 ==="
echo "도메인: $DOMAIN"

# 1. 의존성 확인
for bin in mkcert caddy dig; do
    if ! command -v "$bin" &>/dev/null; then
        echo "[ERROR] '$bin' 없음 → brew install $bin"
        exit 1
    fi
done

# 2. 실서버 IP 조회 (/etc/hosts 등록 전에 확인해야 정확한 IP를 얻을 수 있음)
echo ""
echo "[1/4] 실서버 IP 조회..."
REAL_SERVER_IP=$(dig +short "$DOMAIN" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
if [[ -z "$REAL_SERVER_IP" ]]; then
    echo "[ERROR] IP 조회 실패. /etc/hosts 에 이미 127.0.0.1 로 등록된 경우:"
    echo "  sudo sed -i '' '/$DOMAIN/d' /etc/hosts 로 제거 후 재실행"
    exit 1
fi
echo "  실서버 IP: $REAL_SERVER_IP"

# 3. mkcert 로컬 CA 신뢰 + 인증서 발급
echo ""
echo "[2/4] mkcert 로컬 CA 신뢰 등록 및 인증서 발급..."
mkcert -install
mkdir -p "$CERT_DIR"
pushd "$CERT_DIR" > /dev/null
mkcert "$DOMAIN"
popd > /dev/null
# sudo 컨텍스트에서 생성된 경우 소유권 보정
if [[ "$(stat -f '%Su' "$CERT_DIR")" != "$USER" ]]; then
    sudo chown -R "$USER" "$CERT_DIR"
fi
echo "  cert → $CERT_DIR/$DOMAIN.pem"
echo "  key  → $CERT_DIR/$DOMAIN-key.pem"

# 4. /etc/hosts 등록
echo ""
echo "[3/4] /etc/hosts 등록..."
if grep -q "^127\.0\.0\.1[[:space:]]*$DOMAIN" /etc/hosts; then
    echo "  이미 등록됨"
else
    sudo sed -i '' "/[[:space:]]$DOMAIN/d" /etc/hosts 2>/dev/null || true
    echo "127.0.0.1 $DOMAIN" | sudo tee -a /etc/hosts > /dev/null
    echo "  등록 완료: 127.0.0.1 $DOMAIN"
fi

# 5. Caddyfile.local 생성
#    Caddy가 포트 443 에서 직접 TLS 처리 (pfctl 포워딩 불필요)
#    실행 시 sudo 필요: sudo caddy run --config agent/Caddyfile.local
echo ""
echo "[4/4] Caddyfile.local 생성 (실서버 IP: $REAL_SERVER_IP)..."
cat > "$CADDYFILE" <<EOF
# 로컬 HTTPS 리버스 프록시 (생성: $(date +%Y-%m-%d))
#
# 라우팅:
#   /chat/stream → localhost:8000        (로컬 에이전트)
#   /*           → $REAL_SERVER_IP  (실서버, /etc/hosts 루프 방지)
#
# 실행: sudo caddy run --config agent/Caddyfile.local
{
    admin off
}

$DOMAIN {
    tls $CERT_DIR/$DOMAIN.pem $CERT_DIR/$DOMAIN-key.pem

    handle /chat* {
        reverse_proxy localhost:8000
    }

    handle {
        reverse_proxy https://$REAL_SERVER_IP {
            header_up Host $DOMAIN
            transport http {
                tls_server_name $DOMAIN
            }
        }
    }

    log {
        output stderr
        level  INFO
        format console
    }
}
EOF
echo "  생성: $CADDYFILE"

echo ""
echo "=== 셋업 완료 ==="
echo ""
echo "개발 시 실행 순서:"
echo ""
echo "  터미널 1:  npm run agent          # uvicorn (포트 8000)"
echo "  터미널 2:  sudo caddy run --config agent/Caddyfile.local"
echo ""
echo "라우팅:"
echo "  https://$DOMAIN/chat/stream  →  localhost:8000"
echo "  https://$DOMAIN/*            →  $REAL_SERVER_IP (실서버)"
