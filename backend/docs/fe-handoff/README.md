# FE 전달 문서 모음 (고도화 건)

프론트엔드 개발자 전달용 API 문서 3종을 한 곳에 모았습니다.
공통: 인증 `Authorization: Bearer {accessToken}`, `Content-Type: application/json`, 응답은 `ResponseDTO<CustomBody>` 래핑(`success/resultData/resultMessage`).

| # | 문서 | 대상 기능 | 주요 API |
|---|---|---|---|
| 1 | [ai-chat-api-spec.md](./ai-chat-api-spec.md) | AI 어시스턴트 대화 | 생성·목록·메시지 + **대화방 제목 수정** `POST /api/ai/conversations/{id}/title` · **삭제** `POST .../delete` |
| 2 | [school-record-fe-guide.md](./school-record-fe-guide.md) | 생활기록부 작성 고도화 | 저장 `POST /api/school-records/draft` · 리스트 `GET /class/{classId}` · 상세 `GET /student/{studentId}/draft` |
| 3 | [tc-analysis-lernreport-fe-guide.md](./tc-analysis-lernreport-fe-guide.md) | 교사 분석 `lernReportByOrd` | `GET /api/dgnss/tc/analysis` 응답 변경(paperIdx=2 노출 + `reliabilityWarnings`) |

> 최종 정리: 2026-08-07
