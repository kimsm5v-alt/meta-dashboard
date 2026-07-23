#!/usr/bin/env bash
# 배스천 서버를 경유해 dev MySQL로 로컬 포트포워딩(SSH 터널)을 여는 스크립트.
#
# 사용법:
#   ./db_tunnel.sh              # 비밀번호를 SSH가 대화식으로 물어봄 (권장)
#   LOCAL_PORT=23306 ./db_tunnel.sh   # 로컬 포트를 바꾸고 싶을 때
#
# 터널이 열리면 백그라운드로 전환되고 "연결 확인" 메시지가 출력됩니다.
# 이후 다른 터미널에서:
#   mysql -h 127.0.0.1 -P 13306 -u <DB_USER> -p
# 로 접속하면 됩니다. 종료는 스크립트가 출력하는 PID를 kill.
#
# 참고: `ssh -N`은 원격 명령을 실행하지 않는 순수 포트포워딩 모드라
# 원래 ssh 자체는 성공해도 아무 메시지를 찍지 않습니다(정상 동작).
# 그래서 이 스크립트가 로컬 포트가 실제로 열렸는지 확인해서 별도로 안내합니다.

set -euo pipefail

BASTION_HOST="175.45.200.82"
BASTION_USER="manageuser"
DB_HOST="dev-vsaidt-vs-dev-mysql-b6b97-115979187-a584c42663b3.kr.lb.naverncp.com"
DB_PORT="3306"
LOCAL_PORT="${LOCAL_PORT:-13306}"

echo "터널 오픈 시도: localhost:${LOCAL_PORT} -> (${BASTION_HOST} 경유) -> ${DB_HOST}:${DB_PORT}"
echo "SSH 비밀번호를 물어보면 배스천 계정(${BASTION_USER}) 비밀번호를 입력하세요."

# -f: 인증이 끝나면 백그라운드로 전환 (그래야 아래에서 연결 확인 후 메시지를 찍을 수 있음)
# -N: 원격 명령 실행 없이 포트포워딩만 수행
# -L: 로컬 포트를 배스천을 통해 목적지(DB_HOST:DB_PORT)로 포워딩
ssh -f -N -L "${LOCAL_PORT}:${DB_HOST}:${DB_PORT}" "${BASTION_USER}@${BASTION_HOST}"

# 로컬 포트가 실제로 리스닝 상태가 될 때까지 최대 5초 대기
for _ in $(seq 1 10); do
    if (exec 3<>"/dev/tcp/127.0.0.1/${LOCAL_PORT}") 2>/dev/null; then
        exec 3<&- 3>&-
        PID="$(lsof -tiTCP:"${LOCAL_PORT}" -sTCP:LISTEN 2>/dev/null | head -n1 || true)"
        echo "✅ SSH 터널링이 연결되었습니다. (localhost:${LOCAL_PORT}, PID=${PID:-미확인})"
        echo "   접속 예시: mysql -h 127.0.0.1 -P ${LOCAL_PORT} -u <DB계정> -p"
        echo "   종료하려면: kill ${PID:-<위 PID>}"
        exit 0
    fi
    sleep 0.5
done

echo "❌ 터널 연결 확인에 실패했습니다. 비밀번호 오류이거나 배스천 접속에 문제가 있을 수 있습니다." >&2
exit 1
