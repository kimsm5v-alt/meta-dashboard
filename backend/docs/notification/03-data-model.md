# 03. 데이터 모델

---

## notification 테이블

```sql
CREATE TABLE notification (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '알림 ID',
    user_no         BIGINT       NOT NULL              COMMENT '수신자 user_no',
    category        VARCHAR(20)  NOT NULL              COMMENT 'EXAM, GROUP, NOTICE',
    event_code      VARCHAR(20)  NOT NULL              COMMENT 'T1, S3, T10 등',
    content         VARCHAR(1000) NOT NULL             COMMENT '렌더링된 문구 (박제)',
    link            VARCHAR(500)                       COMMENT '딥링크 경로',
    read_at         DATETIME                           COMMENT 'NULL이면 미확인',
    created_at      DATETIME     NOT NULL              COMMENT '생성 시각',
    INDEX idx_user_created (user_no, created_at DESC),
    INDEX idx_user_read    (user_no, read_at),
    INDEX idx_retention    (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='사용자별 알림 메시지';
```

### 컬럼 설명

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `notification_id` | BIGINT AI | PK, SSE `Last-Event-ID`로도 활용 |
| `user_no` | BIGINT | 수신자 (user 테이블 FK, 논리 참조) |
| `category` | VARCHAR(20) | `EXAM` / `GROUP` / `NOTICE` 등 — FE 섹션 그룹핑 |
| `event_code` | VARCHAR(20) | `T1`, `S3`, `T10` 등 — 이벤트 식별 및 분석 |
| `content` | VARCHAR(1000) | 렌더링된 최종 문구 (닉네임/그룹명 박제) |
| `link` | VARCHAR(500) | 딥링크 URL (쿼리스트링 포함 가능) |
| `read_at` | DATETIME | NULL = 미확인, 값 있으면 읽은 시각 |
| `created_at` | DATETIME | 알림 생성 시각 |

### 인덱스 설계

| 인덱스 | 용도 |
|---|---|
| `idx_user_created` | 사용자별 최신순 목록 조회 |
| `idx_user_read` | 미확인 카운트 집계 (`WHERE user_no=? AND read_at IS NULL`) |
| `idx_retention` | 90일 경과 삭제 배치 |

### 의도적으로 제외한 컬럼

| 컬럼 | 제외 이유 |
|---|---|
| `title` | 스펙상 본문만 있음. 필요 시 나중에 추가 |
| `actor_no` | 문구에 닉네임 박제돼 있어 불필요. 추적 필요 시 `event_code` + 별도 로그로 대응 |
| `related_id` | 딥링크로 충분. 추후 필터링 요구 시 고려 |
| `type` (push/email) | 본 테이블은 인앱 알림만. 이메일은 별도 발송 로그 |

### 카테고리 enum 정의

```java
public enum NotificationCategory {
    EXAM,    // 검사 관련 (T3~T6, S1~S3, S6)
    GROUP,   // 그룹 관련 (T1, T2, S4, S5)
    NOTICE;  // 공지/시스템 (T10, T11, S7 — 고도화)
}
```

---

## shedlock 테이블

스케줄러 중복 실행 방지용.

```sql
CREATE TABLE shedlock (
    name       VARCHAR(64)  NOT NULL PRIMARY KEY COMMENT '락 이름',
    lock_until TIMESTAMP(3) NOT NULL              COMMENT '락 만료 시각',
    locked_at  TIMESTAMP(3) NOT NULL              COMMENT '락 획득 시각',
    locked_by  VARCHAR(255) NOT NULL              COMMENT '락 획득 인스턴스'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='ShedLock 분산 락';
```

### 락 이름 규칙

| 이름 | 용도 |
|---|---|
| `sendExamReminders` | T5/S2 리마인더 (매일 08:00) |
| `cleanupOldNotifications` | 90일 경과 알림 삭제 (매일 03:00) |

---

## 마이그레이션 순서

1. `notification` 테이블 생성
2. `shedlock` 테이블 생성
3. 개발서버 적용 후 샘플 데이터 insert로 인덱스 확인
4. 운영 배포 시 무중단 (신규 테이블이라 기존 영향 없음)

---

## 데이터 볼륨 예측

### 가정

- 회원 수: 5,000명
- 평균 알림: 하루 5건/사용자
- 보관 기간: 90일

### 계산

```
일일 insert: 5,000 × 5 = 25,000건
90일 보관: 25,000 × 90 = 2,250,000건 ≈ 225만 row
row 평균 크기: 약 500~800 bytes
테이블 크기: 약 1~2 GB
```

### 대응

- 현재 규모에선 단일 테이블로 충분
- 회원 수 10만 규모 성장 시 **월별 파티셔닝** 검토
  - `PARTITION BY RANGE (created_at)`
  - 90일 삭제 → DROP PARTITION (빠름)
