# 검사 유형(paperIdx) 권한 (FE 연동 가이드)

> 대상: 프론트엔드 개발자
> 최종: 2026-08-11
> 관련 API: `GET /api/dgnss/paper-permission/me`

---

## 1. 개요
계정(교사)별로 수행 가능한 검사 유형을 권한으로 관리합니다.

- `paperIdx=1` **종합학습검사**, `paperIdx=2` **자기조절**
- **독립 권한**: 종합/자기조절을 **각각** 부여할 수 있어, 계정은 **둘 다 가질 수도** 있습니다.
- **기본값**: 종합 허용, 자기조절 비허용 (권한이 설정되지 않은 계정은 종합만 가능)
- **"한 종류만 보기"는 FE 토글의 몫**입니다. 백엔드는 유형별 허용 여부만 알려주고, 배타(둘 중 하나만)를 강제하지 않습니다.

---

## 2. API — 내 검사 유형 권한 조회

```
GET /api/dgnss/paper-permission/me
Authorization: Bearer <JWT>
```
현재 로그인 사용자의 권한을 반환합니다.

**응답 `resultData`**
| 필드 | 타입 | 설명 |
|---|---|---|
| `comprehensive` | boolean | 종합학습검사(paperIdx=1) 허용 여부 |
| `selfreg` | boolean | 자기조절(paperIdx=2) 허용 여부 |

```json
{
  "success": true,
  "resultData": { "comprehensive": true, "selfreg": false },
  "resultMessage": "검사 유형 권한 조회"
}
```

---

## 3. FE 처리 가이드 (메뉴/토글 노출)

`comprehensive`·`selfreg` 조합에 따라 화면을 구성합니다.

| comprehensive | selfreg | FE 동작 |
|:---:|:---:|---|
| true | true | **토글 노출** — 같은 페이지에서 종합/자기조절 중 한 유형씩 전환 표시 |
| true | false | **종합만** 표시(토글 숨김) — 기본 계정 |
| false | true | **자기조절만** 표시(토글 숨김) |
| false | false | 검사 접근 없음 — 안내 문구 표시(관리자가 모두 회수한 예외 케이스) |

- 초기 진입 시 앱 부트스트랩 단계에서 1회 조회해 캐싱하는 것을 권장합니다(권한은 자주 바뀌지 않음).
- 권한이 없는 유형의 검사 화면/메뉴는 **숨김 처리**하세요. (백엔드도 생성 시점을 차단할 예정 — 아래 §5)

---

## 4. 참고 DDL (백엔드 적용 대상)
```sql
CREATE TABLE account_paper_permission (
    user_no          BIGINT   NOT NULL COMMENT '교사 계정(user.user_no)',
    comprehensive_yn CHAR(1)  NOT NULL DEFAULT 'Y' COMMENT '종합학습검사(paperIdx=1) 허용',
    selfreg_yn       CHAR(1)  NOT NULL DEFAULT 'N' COMMENT '자기조절(paperIdx=2) 허용',
    updated_by       BIGINT   NOT NULL DEFAULT 0,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_no)
) COMMENT='계정별 검사 유형 권한 (행 없으면 종합만 허용)';
```

---

## 5. 진행 상태 / 후속 (참고)
- **현재(Phase 1)**: 위 조회 API만 제공. FE는 이걸로 메뉴/토글을 구성하면 됩니다.
- **후속(백엔드)**:
  - 검사 **생성/배정 시점 권한 차단**(미허용 유형 생성 시 `403`). FE는 숨김 + 서버 차단 이중 방어.
  - 관리자 페이지에서 계정별 권한 부여/회수(별도 admin, FE 무관).
- 응답 필드/스키마는 유지될 예정이며, 변경 시 이 문서를 갱신합니다.
