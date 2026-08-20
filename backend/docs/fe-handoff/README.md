# FE 전달 문서 모음 (고도화 건)

프론트엔드 개발자 전달용 API 문서 7종을 한 곳에 모았습니다.
공통: 인증 `Authorization: Bearer {accessToken}`, `Content-Type: application/json`, 응답은 `ResponseDTO<CustomBody>` 래핑(`success/resultData/resultMessage`).

| # | 문서 | 대상 기능 | 주요 API |
|---|---|---|---|
| 1 | [ai-chat-api-spec.md](./ai-chat-api-spec.md) | AI 어시스턴트 대화 | 생성·목록·메시지 + **대화방 제목 수정** `POST /api/ai/conversations/{id}/title` · **삭제** `POST .../delete` |
| 2 | [school-record-fe-guide.md](./school-record-fe-guide.md) | 생활기록부 작성 고도화 | 저장 `POST /api/school-records/draft` · 리스트 `GET /class/{classId}` · 상세 `GET /student/{studentId}/draft` |
| 3 | [tc-analysis-lernreport-fe-guide.md](./tc-analysis-lernreport-fe-guide.md) | 교사 분석 `lernReportByOrd` | `GET /api/dgnss/tc/analysis` 응답 변경(paperIdx=2 노출 + `reliabilityWarnings`) |
| 4 | [paper-permission-fe-guide.md](./paper-permission-fe-guide.md) | 검사 유형(paperIdx) 권한 | `GET /api/dgnss/paper-permission/me` (메뉴·토글 노출) · `tc/info`·`tc/overview` **paperIdx 필터** · `tc/start` 미허용 시 **403 `PAPER_NOT_ALLOWED`** |
| 5 | [student-learning-status-fe-guide.md](./student-learning-status-fe-guide.md) | 변화추적 학생 학습현황 | `GET /api/dgnss/students/{studentId}/learning-status` (회차별 학습현황 **코드값** 반환) |
| 6 | [exam-reminder-fe-guide.md](./exam-reminder-fe-guide.md) | 미제출 학생 독려 알림 | `POST /api/dgnss/tc/reminder` (dgnssId 기준 미제출 재조회 후 내부 알림 발송) |
| 7 | [st-coaching-fe-guide.md](./st-coaching-fe-guide.md) | 개인화 코칭 v2 | `GET /api/dgnss/st/coaching/{answerIdx}` (강점 top2 + 코칭 top1, Neo4j 선별 + RDB 문구, `[학생명]` FE 치환) |

> 최종 정리: 2026-08-12
