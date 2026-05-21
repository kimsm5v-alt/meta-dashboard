# Boot 4 업그레이드 검증 체크리스트 (P0/P1/P2)

**Date:** 2026-05-21
**Source:** `Grep '@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\b'` 자동 추출
**Linked:** `plans/2026-05-21-spring-boot-4-upgrade.md` Task 10
**Design:** `specs/2026-05-21-spring-boot-4-upgrade-design.md`

## 우선순위 정의

- **P0**: 부팅/인증/세션 — 깨지면 전 서비스 다운. **100% 통과 필수**. 1건이라도 ❌면 즉시 롤백.
- **P1**: 일반 도메인 CRUD + 외부 통합(S3/PDF/Mail/Neo4j/SSE/Excel) — 단일 사용자 흐름 정상 동작. **100% 통과 필수**.
- **P2**: 관리/유틸/엣지/덜 호출되는 케이스 — 부분 실패 허용, ❌는 별도 이슈 등록 후 머지 진행.

## 의존성 태그 (라이브러리 단위 동작 검증 추적용)

`MyBatis` `JWT(OAuth2RS)` `Master/Slave` `Redis` `ShedLock` `jasypt` `Caffeine` `log4j2` `PDFBox` `POI` `S3(AWSv1)` `Neo4j` `MapStruct` `AOP` `SSE` `Mail`

각 시나리오 검증 시 응답뿐 아니라 **서버 로그에서 해당 태그 동작 흔적 확인** 필수.

---

## P0 — 부팅/인증/핵심 (11개)

| # | 도메인 | HTTP | Path | 시나리오 | 의존성 태그 | 결과 |
|:---:|:---:|:---:|:---|:---|:---|:---:|
| P0-1 | actuator | GET | `/actuator/health` | "DB+Redis UP" | MyBatis, Redis, log4j2 | ⏳ |
| P0-2 | actuator | GET | `/actuator/health/db` | "DB UP" — DynamicRoutingDataSource 정상 | MyBatis, Master/Slave | ⏳ |
| P0-3 | swagger | GET | `/swagger-ui/index.html` | "200 + 컨텐츠 정상" | springdoc | ⏳ |
| P0-4 | swagger | GET | `/v3/api-docs` | "200 + JSON spec 비어있지 않음" | springdoc | ⏳ |
| P0-5 | sso/auth | POST | `/api/v1/auth/token` | "Authorization Code → JWT 정상 발급" | JWT, jasypt, AOP | ⏳ |
| P0-6 | sso/auth | POST | `/api/v1/auth/refresh` | "Refresh Token → 새 Access 발급" | JWT, jasypt | ⏳ |
| P0-7 | sso/user | GET | `/api/v1/user/status` | "정상 토큰 → 200, 무토큰 → 401" | JWT, MyBatis | ⏳ |
| P0-8 | member | GET | `/member/info` | "정상 회원 정보 응답" | JWT, MyBatis, Master/Slave, AOP | ⏳ |
| P0-9 | group | GET | `/group/list` | "그룹 목록 응답" | JWT, MyBatis, MapStruct, Caffeine | ⏳ |
| P0-10 | group | POST | `/group/create` | "그룹 1건 생성 + invite_code 생성" | JWT, MyBatis, AOP, Master/Slave | ⏳ |
| P0-11 | group | GET | `/group/detail` | "그룹 정보 + 멤버 목록 응답" | JWT, MyBatis, MapStruct | ⏳ |

---

## P1 — 도메인 대표 CRUD + 외부 통합 (32개)

### Member / Email (P1-1~3)
| # | HTTP | Path | 시나리오 | 의존성 | 결과 |
|:---:|:---:|:---|:---|:---|:---:|
| P1-1 | POST | `/member/send-code` | "이메일 발송 + 인증코드 저장" | jasypt, Mail, MyBatis | ⏳ |
| P1-2 | POST | `/member/verify-code` | "코드 검증 200" | MyBatis, Redis | ⏳ |
| P1-3 | POST | `/api/v1/user/complete-profile` | "SSO 사용자 학심정 계정 생성" | JWT, MyBatis, AOP | ⏳ |

### Group (P1-4~10)
| # | HTTP | Path | 시나리오 | 의존성 | 결과 |
|:---:|:---:|:---|:---|:---|:---:|
| P1-4 | POST | `/group/join` | "회원 그룹 참가" | JWT, MyBatis, AOP | ⏳ |
| P1-5 | POST | `/group/join-guest` | "게스트 그룹 참가" | MyBatis, JWT(guest) | ⏳ |
| P1-6 | GET | `/group/invite` | "초대코드 조회" | MyBatis | ⏳ |
| P1-7 | PUT | `/group/update` | "그룹 정보 수정 (방장 권한)" | JWT, MyBatis | ⏳ |
| P1-8 | POST | `/group/member/leave` | "그룹 탈퇴" | JWT, MyBatis | ⏳ |
| P1-9 | POST | `/group/invite/email` | "초대 이메일 발송" | JWT, MyBatis, jasypt, Mail | ⏳ |
| P1-10 | GET | `/group/invite/list` | "초대 목록" | JWT, MyBatis, Master/Slave | ⏳ |

### Counseling (P1-11~14)
| # | HTTP | Path | 시나리오 | 의존성 | 결과 |
|:---:|:---:|:---|:---|:---|:---:|
| P1-11 | GET | `/api/counseling` | "본인 상담 목록" | JWT, MyBatis, Master/Slave | ⏳ |
| P1-12 | GET | `/api/counseling/{id}` | "단일 상담 조회" | JWT, MyBatis | ⏳ |
| P1-13 | POST | `/api/counseling` | "상담 1건 생성" | JWT, MyBatis, AOP | ⏳ |
| P1-14 | PATCH | `/api/counseling/{id}` | "상담 부분 수정" | JWT, MyBatis | ⏳ |

### Memo / SchoolRecord (P1-15~17)
| # | HTTP | Path | 시나리오 | 의존성 | 결과 |
|:---:|:---:|:---|:---|:---|:---:|
| P1-15 | GET | `/api/memos/student/{studentId}` | "학생별 메모 조회" | JWT, MyBatis | ⏳ |
| P1-16 | POST | `/api/memos` | "메모 1건 생성" | JWT, MyBatis, AOP | ⏳ |
| P1-17 | GET | `/api/school-records/student/{studentId}` | "학생별 생기부 조회" | JWT, MyBatis | ⏳ |

### School / File (P1-18~19)
| # | HTTP | Path | 시나리오 | 의존성 | 결과 |
|:---:|:---:|:---|:---|:---|:---:|
| P1-18 | POST | `/school/import` | "CSV 파일 → upsert 성공" | MyBatis, AOP, multipart | ⏳ |
| P1-19 | GET | `/files/pfile-download` | "S3 다운로드 1건 성공" | S3(AWSv1), JWT | ⏳ |

### DGNSS 검사 핵심 (P1-20~25)
| # | HTTP | Path | 시나리오 | 의존성 | 결과 |
|:---:|:---:|:---|:---|:---|:---:|
| P1-20 | GET | `/api/dgnss/tc/info` 또는 `/list` | "교사 검사 목록" | JWT, MyBatis, Master/Slave | ⏳ |
| P1-21 | POST | `/api/dgnss/tc/start` | "검사 시작" | JWT, MyBatis, AOP | ⏳ |
| P1-22 | POST | `/api/dgnss/st/submit` | "학생 검사 제출" | JWT(guest), MyBatis, AOP | ⏳ |
| P1-23 | GET | `/api/dgnss/st/analysis` | "학생 결과 보기" | JWT, MyBatis | ⏳ |
| P1-24 | GET | `/api/dgnss/tc/detail` | "교사용 검사 상세" | JWT, MyBatis, MapStruct | ⏳ |
| P1-25 | POST | `/api/dgnss/pdf` | "PDF 생성 성공" | JWT, MyBatis, PDFBox, S3 | ⏳ |

### Notification (P1-26~29)
| # | HTTP | Path | 시나리오 | 의존성 | 결과 |
|:---:|:---:|:---|:---|:---|:---:|
| P1-26 | GET | `/api/v1/notifications` | "알림 목록 + 페이징" | JWT, MyBatis, MapStruct | ⏳ |
| P1-27 | GET | `/api/v1/notifications/unread-count` | "미확인 알림 개수" | JWT, MyBatis | ⏳ |
| P1-28 | POST | `/api/v1/notifications/{id}/read` | "개별 읽음" | JWT, MyBatis, Redis | ⏳ |
| P1-29 | GET | `/api/v1/notifications/stream` | "SSE 연결 + 이벤트 1건 수신" | JWT, SSE, Redis Pub/Sub | ⏳ |

### AI / Guest (P1-30~32)
| # | HTTP | Path | 시나리오 | 의존성 | 결과 |
|:---:|:---:|:---|:---|:---|:---:|
| P1-30 | POST | `/api/ai/conversations` | "AI 대화 생성" | JWT, MyBatis | ⏳ |
| P1-31 | POST | `/api/ai/bug-reports` | "버그리포트 + 이미지 업로드" | JWT, MyBatis, S3, multipart | ⏳ |
| P1-32 | GET | `/guest/check` 또는 POST `/guest/convert` | "게스트→회원 전환 또는 매칭 확인" | MyBatis, JWT(guest) | ⏳ |

---

## P2 — 관리/유틸/엣지 (28개)

### DGNSS 검사 운영/관리 (P2-1~14)
| # | HTTP | Path | 의존성 | 결과 |
|:---:|:---:|:---|:---|:---:|
| P2-1 | POST | `/api/dgnss/tc/end` | JWT, MyBatis | ⏳ |
| P2-2 | POST | `/api/dgnss/tc/cancel` | JWT, MyBatis | ⏳ |
| P2-3 | POST | `/api/dgnss/tc/restart` | JWT, MyBatis | ⏳ |
| P2-4 | GET | `/api/dgnss/tc/stinfolist` | JWT, MyBatis | ⏳ |
| P2-5 | POST | `/api/dgnss/tc/text/save` | JWT, MyBatis | ⏳ |
| P2-6 | GET | `/api/dgnss/tc/need` | JWT, MyBatis | ⏳ |
| P2-7 | GET | `/api/dgnss/tc/analysis` | JWT, MyBatis | ⏳ |
| P2-8 | GET | `/api/dgnss/tc/class-factor-avg` | JWT, MyBatis | ⏳ |
| P2-9 | GET | `/api/dgnss/tc/notsubm` `/list` | JWT, MyBatis | ⏳ |
| P2-10 | GET | `/api/dgnss/tc/start/preview` | JWT, MyBatis | ⏳ |
| P2-11 | GET | `/api/dgnss/tc/sample-excel` | JWT, POI | ⏳ |
| P2-12 | POST | `/api/dgnss/tc/upload-answers` | JWT, POI, MyBatis, AOP | ⏳ |
| P2-13 | GET | `/api/dgnss/dgnss-download-all` | JWT, PDFBox, S3 | ⏳ |
| P2-14 | GET | `/api/dgnss/pdf/search` | JWT, MyBatis | ⏳ |

### DGNSS 학생 보조 + Neo4j + 메일테스트 (P2-15~22)
| # | HTTP | Path | 의존성 | 결과 |
|:---:|:---:|:---|:---|:---:|
| P2-15 | GET | `/api/dgnss/st/new` | JWT, MyBatis | ⏳ |
| P2-16 | GET | `/api/dgnss/st/info` 또는 `/stnt/list` | JWT, MyBatis | ⏳ |
| P2-17 | POST | `/api/dgnss/st/start` 또는 `/stnt/start/update` | JWT, MyBatis | ⏳ |
| P2-18 | POST | `/api/dgnss/st/answer` 또는 `/stnt/answer/save` | JWT, MyBatis | ⏳ |
| P2-19 | POST | `/api/dgnss/st/answer/random` | JWT, MyBatis | ⏳ |
| P2-20 | GET | `/api/dgnss/graph/classes/{className}/moderation-paths` | Neo4j | ⏳ |
| P2-21 | GET | `/api/dgnss/graph/recommendation/by-answer/{answerIdx}` | Neo4j | ⏳ |
| P2-22 | GET | `/api/dgnss/graph/recommendation/by-type` | Neo4j | ⏳ |
| - | POST | `/api/dgnss/mail/test` | Mail, jasypt | (수동 테스트 only) |
| - | POST | `/api/dgnss/summary/pdf` | PDFBox, S3 | ⏳ |

### CRUD 보조 (P2-23~28)
| # | HTTP | Path | 의존성 | 결과 |
|:---:|:---:|:---|:---|:---:|
| P2-23 | PATCH | `/api/memos/{id}` | JWT, MyBatis | ⏳ |
| P2-24 | DELETE | `/api/memos/{id}` | JWT, MyBatis | ⏳ |
| P2-25 | DELETE | `/api/school-records/{id}` | JWT, MyBatis | ⏳ |
| P2-26 | POST | `/api/counseling/{id}/complete` | JWT, MyBatis, AOP | ⏳ |
| P2-27 | POST | `/api/counseling/{id}/cancel` | JWT, MyBatis | ⏳ |
| P2-28 | DELETE | `/api/counseling/{id}` | JWT, MyBatis | ⏳ |

### AI 보조 + 그룹 보조 + 알림 보조 (P2 묶음)
| # | HTTP | Path | 의존성 | 결과 |
|:---:|:---:|:---|:---|:---:|
| - | GET | `/api/ai/conversations` | JWT, MyBatis | ⏳ |
| - | GET | `/api/ai/conversations/{id}/messages` | JWT, MyBatis | ⏳ |
| - | POST | `/api/ai/conversations/{id}/messages` | JWT, MyBatis | ⏳ |
| - | POST | `/api/ai/conversations/{id}/delete` | JWT, MyBatis | ⏳ |
| - | GET | `/api/ai/bug-reports/my` | JWT, MyBatis | ⏳ |
| - | GET | `/api/ai/bug-reports` | JWT, MyBatis | ⏳ |
| - | GET | `/api/ai/bug-reports/{id}` | JWT, MyBatis | ⏳ |
| - | PATCH | `/api/ai/bug-reports/{id}/status` | JWT, MyBatis | ⏳ |
| - | POST | `/group/member/kick` | JWT, MyBatis | ⏳ |
| - | DELETE | `/group/delete` | JWT, MyBatis | ⏳ |
| - | DELETE | `/group/invite/{invitationId}` | JWT, MyBatis | ⏳ |
| - | POST | `/api/v1/notifications/read-all` | JWT, MyBatis | ⏳ |

### Public/Dev (제외 검증 — 코드 라우팅만 OK 확인)
| # | HTTP | Path | 의존성 | 결과 |
|:---:|:---:|:---|:---|:---:|
| - | GET | `/` | - | ⏳ |
| - | GET | `/robots.txt` | - | ⏳ |
| - | GET | `/dev/**` (NotificationTesterPageController) | dev only | (vs-dev에서만) |
| - | * | `/api/v1/notifications/debug/**` | dev only | (vs-dev에서만) |

---

## 검증 절차 (Task 10 실행 시)

1. **Task 9 (L1~L3) 통과 후** 본 체크리스트 진입
2. D1 (개발 서버 배포) → D2 (P0) → D3 (P1) → D4 (P2) 순서대로 진행
3. 각 시나리오 통과 시 결과 컬럼 ⏳ → ✅
4. 실패 시 ❌ + 우측에 비고 추가 (HTTP 코드, 에러 메시지 요약, 서버 로그 발췌)
5. **D2 ❌ 1건**: 즉시 이전 JAR 롤백, 본 PR 작업 중단
6. **D3 ❌ 1건**: 머지 보류, 패치 후 D2~D3 재실행
7. **D4 ❌ 일부**: 별도 GitLab 이슈 등록, 본 PR 머지 진행

## 핵심 라이브러리 동작 매트릭스 (D2~D3 중 동시 수집)

P0/P1 시나리오 통과 시 다음을 서버 로그/응답에서 동시 확인:

- ✅ **MyBatis 3.0.3 + Boot 4.0.5**: P0-1, P0-8, P0-9에서 응답 정상 = SqlSession 호환성 통과 (🔴 최상)
- ✅ **Master/Slave 라우팅**: P0-8(슬레이브) + P0-10(마스터) 로그에서 다른 DataSource 사용 흔적 (🔴)
- ✅ **OAuth2 RS + JWKS**: P0-5/6/7에서 JWT 검증 동작 (🔴)
- ✅ **log4j2**: 모든 시나리오 로그가 log4j2 패턴으로 출력 (🟡)
- ✅ **jasypt**: P1-1, P1-9에서 NCP Mail 실제 발송 (🟡)
- ✅ **Caffeine**: P0-9 2회 호출 → 2번째 캐시 hit 로그 (🟢)
- ✅ **Redis Pub/Sub**: P1-29 SSE 연결 후 P1-28 트리거 시 수신 (🟡)
- ✅ **ShedLock**: 본 시점 스케줄 잡 발화 시 `shedlock` 테이블 row (🟡) — 별도 확인
- ✅ **PDFBox**: P1-25 PDF 생성 성공 (🟡)
- ✅ **POI**: P2-11, P2-12 Excel 다운로드/업로드 (🟢)
- ✅ **AWS SDK v1 (NCP S3)**: P1-19, P1-25, P1-31 S3 동작 (🟡)
- ✅ **Neo4j**: P2-20~22 그래프 API (🟢)
- ✅ **MapStruct 1.6.3**: P0-9, P0-11, P1-24, P1-26 DTO 변환 응답 필드 정상 (🟡)
- ✅ **AOP 4종**: P0-10, P1-13, P1-21 호출 시 로그에 ApiResponseAspect/TransactionAspect 흔적 (🟡)

---

## 합계

- P0: 11개 (100% 통과 필수)
- P1: 32개 (100% 통과 필수)
- P2: ~28개 + 알파 (부분 실패 허용)
- **총 ~71개 + 14개 라이브러리 매트릭스**

> 1차 우선순위 안은 AI(Opus 4.7)가 매김. **사용자(개발자)가 검수해서 P0/P1/P2 조정 후 확정.**
