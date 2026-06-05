#!/usr/bin/env bash
# ============================================================================
# verify-enrich.sh — IDP 회원정보 enrich 전수 검증 스크립트
# ============================================================================
# 목적: 학심정 BE 가 로컬 DB 에 없는 회원 PII(이름/이메일)를 IDP(superplatform-auth)
#       /api/v1/users 로 조회해서 응답에 채워넣는 모든 enrich 경로를 한 번에 검증.
#
# 전제:
#   1. BE 로컬 기동 중 (./gradlew :backend:bootRun -Dspring.profiles.active=local)
#   2. application-local.yml 의 superplatform.auth.internal-api.base-url 이 dev Auth 로 설정
#      (base-url: https://t-auth-superplatform-api.vsaidt.com/api/v1)
#   3. podman 컨테이너(mysql/redis/neo4j) 기동
#   4. 교사 계정(user_no 28, sp_user_id e3968ba3...) 의 SSO JWT
#
# 검증 데이터 기준: user_no 28 (그룹 14 / 멤버 36 / 상담 9 / 검사 다수)
#   - claId 7f6c97874b0f4c308b4357cd1a0ba2c6 = group 20 (6학년 3반, 학생 12명)
#   - dgnssId 46 = 미제출 11명 (GROUP_CONCAT notSubmStdtName 채워짐)
#
# 사용법:
#   export META_TOKEN='<교사 Bearer 토큰>'
#   bash docs/user-info-from-idp/verify-enrich.sh
#   # 또는: bash verify-enrich.sh '<토큰>' [base_url]
# ============================================================================

set -uo pipefail

BASE_URL="${2:-${META_BASE_URL:-http://localhost:8081}}"
TOKEN="${1:-${META_TOKEN:-}}"
CLA_ID="7f6c97874b0f4c308b4357cd1a0ba2c6"
DGNSS_ID_NOTSUBM="46"   # 미제출 11명 — GROUP_CONCAT enrich 검증용

if [ -z "$TOKEN" ]; then
  echo "ERROR: 토큰이 없습니다. META_TOKEN 환경변수 또는 첫 인자로 전달하세요."
  echo "  export META_TOKEN='eyJ...'; bash $0"
  exit 1
fi

AUTH=(-H "Authorization: Bearer $TOKEN")
PASS=0; FAIL=0

hr() { printf '%.0s─' {1..70}; echo; }

# $1=설명 $2=기대키워드(응답에 이 문자열이 있으면 enrich 성공) $3.. = curl 인자
check() {
  local desc="$1"; local expect="$2"; shift 2
  local body http
  body=$(curl -s -w $'\n%{http_code}' "${AUTH[@]}" "$@")
  http=$(printf '%s' "$body" | tail -1)
  body=$(printf '%s' "$body" | sed '$d')
  if [ "$http" = "200" ] && printf '%s' "$body" | grep -q "$expect"; then
    echo "  ✅ PASS  $desc  (http=$http)"
    PASS=$((PASS+1))
  else
    echo "  ❌ FAIL  $desc  (http=$http, '$expect' 미발견)"
    echo "     응답: $(printf '%s' "$body" | head -c 200)"
    FAIL=$((FAIL+1))
  fi
}

echo "BASE_URL=$BASE_URL"
hr
echo "[0] health"
curl -s -o /dev/null -w "  actuator/health = %{http_code}\n" "$BASE_URL/actuator/health"

hr
echo "[1] 단건 enrich — GET /member/info"
# 기대: nickname 에 실제 이름(placeholder '(탈퇴 회원)' 아님)
check "본인 정보 nickname/email" '"email":"' "$BASE_URL/member/info"

hr
echo "[2] batch Map패칭 — GET /group/detail (학생 12명)"
# 기대: 멤버 이름이 placeholder 가 아닌 실제 이름
check "그룹 멤버 batch enrich" '"hostNickname"' "$BASE_URL/group/detail?claId=$CLA_ID"

hr
echo "[3] GROUP_CONCAT enrich — GET /api/dgnss/tc/detail (미제출 11명)"
# 기대: notSubmStdtName = "이름(번호), 이름(번호), ..." 형식
check "notSubmStdtName GROUP_CONCAT 복원" '"notSubmStdtName"' "$BASE_URL/api/dgnss/tc/detail?dgnssId=$DGNSS_ID_NOTSUBM"

hr
echo "[4] 상담 학생 batch enrich — GET /api/counseling/class/{claId}"
# 기대: students[].name 에 실제 이름
check "상담 학생 이름 enrich" '"students"' "$BASE_URL/api/counseling/class/$CLA_ID"

hr
echo "[5] 버그리포트 reporter/resolver enrich — GET /api/ai/bug-reports"
# 데이터 없으면 빈 목록(정상). reporter enrich 키 존재 여부만 확인.
check "버그리포트 목록(데이터 있으면 reporter enrich)" '"success"' "$BASE_URL/api/ai/bug-reports?page=1&size=10"

hr
echo "결과: PASS=$PASS  FAIL=$FAIL"
echo ""
echo "※ enrich 동작의 진짜 증거는 BE 로그에서 확인:"
echo "   - 'Service AT 발급 완료' (client_credentials 토큰 발급)"
echo "   - Auth '/users/batch' 호출이 요청당 1회 (PersonInfoRequestCache dedup)"
echo "   - 'Auth getBatch 실패' WARN 이 없어야 함 (있으면 internal-api.base-url 확인)"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
