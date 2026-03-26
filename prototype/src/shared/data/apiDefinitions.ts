/**
 * 신규 필요 API 정의
 *
 * 백엔드 개발자가 참고할 수 있도록
 * 각 API의 상세 정보를 정의합니다.
 *
 * ──────────────────────────────────────────
 * 목차
 * ──────────────────────────────────────────
 *
 * 1. 학급/학생 데이터 조회 (🔴 높음)
 *    - API_TEACHER_ME         GET  /api/dgnss/tc/me
 *    - API_TEACHER_DASHBOARD  GET  /api/dgnss/tc/dashboard?tcId={tcId}
 *    - API_STUDENT_DETAIL     GET  /api/dgnss/st/total/analysis?stdtId={stdtId}
 *
 * 2. 업로드 데이터 저장 (🔴 높음)
 *    - API_UPLOAD_CREATE      POST /api/dgnss/tc/upload
 *    - API_UPLOAD_LATEST      GET  /api/dgnss/tc/upload/latest?tcId={tcId}
 *
 * 3. 학급 운영 전략 템플릿 (🟡 중간)
 *    - API_STRATEGIES_RECOMMENDATIONS  GET /api/strategies/recommendations
 *
 * 4. 추천 학급 활동 (🟢 낮음)
 *    - API_ACTIVITIES_RECOMMENDED  GET /api/activities/recommended
 *    - API_ACTIVITIES_BY_PROFILE   GET /api/activities/by-profile
 *
 * 5. 상담일정 (🔴 높음)
 *    - API_CLASS_ALL_STUDENTS  GET  /group/detail?claId={claId}  (전체 학생, 검사 미제출 포함)
 *    - API_COUNSELING_ALL      GET  /api/counseling?tcId={tcId}  (교사 전체 상담 목록)
 *    - API_COUNSELING_CREATE   POST /api/counseling
 *    - API_COUNSELING_COMPLETE POST /api/counseling/{id}/complete
 *
 * 6. L3 학생 패널 (🔴 높음)
 *    - API_COUNSELING_LIST     GET  /api/counseling/student/{stdtId}  (학생별 상담)
 *    - API_MEMO_LIST           GET  /api/memos/student/{stdtId}
 *    - API_MEMO_CREATE         POST /api/memos
 *    - API_SCHOOL_RECORD_LIST  GET  /api/school-records/student/{stdtId}
 *    - API_SCHOOL_RECORD_SAVE  POST /api/school-records
 *
 * 7. API 그룹 (페이지별 사용)
 *    - TEACHER_DASHBOARD_APIS, CLASS_DASHBOARD_APIS, CLASS_DETAIL_APIS
 *    - ASSESSMENT_APIS, SCHEDULE_APIS, STUDENT_DASHBOARD_APIS, UPLOAD_APIS
 *
 * ──────────────────────────────────────────
 */

import type { ApiTooltipProps } from '@/shared/components/api-tooltip';

type ApiDefinition = Omit<ApiTooltipProps, 'children' | 'position'>;

// ============================================================
// 1. 학급/학생 데이터 조회 API (🔴 높음)
// ============================================================

export const API_TEACHER_ME: ApiDefinition = {
  method: 'GET',
  endpoint: '/api/dgnss/tc/me',
  summary: '사용자 정보 조회',
  description: '현재 로그인한 사용자의 정보를 조회합니다.',
  priority: 'high',
  responseExample: {
    tcId: 'TC001',
    name: '김선생',
    email: 'kim@school.edu',
  },
  errorCases: [
    { code: 401, message: '인증 토큰이 없거나 만료됨' },
  ],
  currentImpl: 'MOCK_TEACHER 하드코딩 사용 중',
  relatedFiles: ['src/shared/contexts/DataContext.tsx', 'src/shared/data/mockData.ts'],
};

/**
 * L1 교사 대시보드 API
 *
 * 프론트엔드 계산 최소화를 위해 백엔드에서 모든 집계 데이터를 반환.
 * 이 API 하나로 L1 대시보드 렌더링에 필요한 모든 데이터 제공.
 */
export const API_TEACHER_DASHBOARD: ApiDefinition = {
  method: 'GET',
  endpoint: '/api/dgnss/tc/dashboard?tcId={tcId}',
  summary: 'L1 교사 대시보드 데이터',
  description: '교사의 담당 학급 목록과 각 학급별 집계 통계를 반환합니다. 프론트엔드에서 추가 계산 없이 바로 렌더링 가능.',
  priority: 'high',
  responseExample: {
    tcId: 'TC001',
    classes: [
      {
        claId: '1c4379432acc4a37ad0b608fd3a16a5c', // UUID 형식
        grade: 'el',        // 학교급: el(초등), mi(중등), hi(고등)
        gradeYear: 6,       // 학년 (1~6)
        classNo: 1,         // 반 번호
        stTotalCnt: 25,     // 총 인원
        stSubmCnt: 23,      // 제출 인원
        stats: {
          typeDistribution: {
            '자원소진형': 8,
            '안전균형형': 10,
            '몰입자원풍부형': 5,
          },
          categoryAverages: {
            '자아강점': 52.3,
            '학습디딤돌': 48.7,
            '학습걸림돌': 45.2,
            '긍정적공부마음': 51.8,
            '부정적공부마음': 47.5,
          },
        },
        // 검사 현황 (회차별)
        dgnssInfo: [
          {
            dgnssId: 1001,
            paperIdx: 1,              // 1: 학습종합검사, 2: META자기조절학습검사
            ordNo: 1,                 // 1회차
            dgnssAt: 'N',             // Y: 평가중, N: 평가 종료
            dgnssStDt: '2026.02.15',  // 검사 시작 일시
            dgnssEdDt: '2026.02.20',  // 응시 종료 일시
            stTotalCnt: 25,
            stSubmCnt: 23,
            notDgnssStartCnt: 2,      // 검사지 배부 못받은 인원수
            notDgnssStartList: ['stdtId1', 'stdtId2'], // 배부 못받은 학생 ID 목록
            notSubmStdtId: 'stdtId3,stdtId4', // 미제출 인원 (콤마 구분 학생 ID)
          },
          {
            dgnssId: 1002,
            paperIdx: 1,
            ordNo: 2,                 // 2회차
            dgnssAt: 'Y',             // 평가중
            dgnssStDt: '2026.03.01',
            dgnssEdDt: null,          // 미종료
            stTotalCnt: 25,
            stSubmCnt: 15,
            notDgnssStartCnt: 0,
            notDgnssStartList: null,
            notSubmStdtId: 'stdtId5,stdtId6,stdtId7', // 미제출 인원
          },
        ],
      },
    ],
    totals: {
      stTotalCnt: 100,          // 전체 학생 수
      stSubmCnt: 92,            // 전체 제출 인원
    },
  },
  errorCases: [
    { code: 401, message: '인증 토큰이 없거나 만료됨' },
    { code: 404, message: '담당 학급이 없음' },
  ],
  currentImpl: '현재 프론트엔드에서 여러 API 호출 후 계산 중. 이 API로 대체 시 호출 1회로 감소.',
  relatedFiles: [
    'src/features/teacher-dashboard/pages/TeacherDashboardPage.tsx',
    'src/shared/hooks/useApiData.ts',
  ],
};

/**
 * L2 반 대시보드용 학생 목록 + LPA 유형 API
 *
 * 🔴 핵심 개선: LPA 유형 분류를 백엔드에서 수행하여 API 호출 2N번 → 1번 감소
 *
 * 현재 문제:
 * - 학생 N명 × 2회차 = 2N번 API 호출 (/api/dgnss/st/analysis)
 * - 프론트에서 38개 T점수 받아서 LPA 분류 수행
 *
 * 확정: 기존 /api/dgnss/tc/stinfolist 응답에 LPA 필드 추가
 * (백엔드에서 LPA 유형 저장 로직 개발 완료 확인)
 */
export const API_CLASS_STUDENTS: ApiDefinition = {
  method: 'GET',
  endpoint: '/api/dgnss/tc/stinfolist?dgnssId={dgnssId}',
  summary: 'L2 학생 목록 + LPA 유형 조회',
  description:
    '학급 학생 목록과 회차별 LPA 유형 분류 결과를 조회합니다. 기존 stinfolist API 응답에 round1/round2 LPA 필드를 추가. 프론트 API 호출 2N번 → 1번으로 감소.',
  priority: 'high',
  responseExample: {
    stInfoList: [
      {
        stdtId: 'a1b2c3d4e5f6',
        rowNum: 1,                    // 출석번호
        stdtNm: '김철수',              // 학생 이름 (신규 필요)
        gender: 'M',
        // 신뢰도 지표 (기존)
        reaction: '양호',              // 반응일관성: '양호' | '주의'
        desirable: '양호',             // 사회적바람직성: '양호' | '주의'
        repeatResponse: 'N',           // 연속동일반응: 'Y' | 'N'
        // 1차 검사 LPA 분류 결과 (신규)
        round1: {
          predictedType: '안전균형형',  // LPA 유형
          typeConfidence: 0.85,        // 유형 확신도 (0~1)
          typeProbabilities: {         // 전체 유형별 확률
            '자원소진형': 0.10,
            '안전균형형': 0.85,
            '몰입자원풍부형': 0.05,
          },
        },
        // 2차 검사 LPA 분류 결과 (신규, 미실시면 null)
        round2: {
          predictedType: '몰입자원풍부형',
          typeConfidence: 0.78,
          typeProbabilities: {
            '자원소진형': 0.12,
            '안전균형형': 0.10,
            '몰입자원풍부형': 0.78,
          },
        },
      },
      {
        stdtId: 'b2c3d4e5f6g7',
        rowNum: 2,
        stdtNm: '이영희',
        gender: 'F',
        reaction: '주의',              // 신뢰도 주의
        desirable: '양호',
        repeatResponse: 'N',
        round1: {
          predictedType: '자원소진형',
          typeConfidence: 0.72,
          typeProbabilities: {
            '자원소진형': 0.72,
            '안전균형형': 0.18,
            '몰입자원풍부형': 0.10,
          },
        },
        round2: null,                  // 2차 미실시
      },
    ],
  },
  errorCases: [
    { code: 401, message: '인증 토큰이 없거나 만료됨' },
    { code: 403, message: '해당 학급에 대한 접근 권한 없음' },
    { code: 404, message: '검사(dgnssId)를 찾을 수 없음' },
  ],
  currentImpl:
    '현재 /api/dgnss/tc/stinfolist 호출 후, 학생별 /api/dgnss/st/analysis를 N×2번 호출하여 프론트에서 LPA 분류 수행 중. 기존 stinfolist 응답에 round1/round2 LPA 필드 추가 확정.',
  relatedFiles: [
    'src/shared/services/dashboardService.ts',
    'src/shared/utils/lpaClassifier.ts',
    'src/features/class-dashboard/pages/ClassDashboardPage.tsx',
  ],
};

/**
 * L3 학생 상세 분석 API
 *
 * 변경사항 (dgnss-api-spec.md v1.4, 2026-03-19):
 * - /api/dgnss/st/total/analysis 삭제 → /api/dgnss/st/analysis로 통합
 * - dgnssResultId 전달 시: 해당 회차만 조회
 * - stdtId + paperIdx 전달 시: 학생 기준 전체 회차 조회 (1차/2차 모두)
 * - paperIdx=1/2 모두 SECTION_ID, SECTION_NM, tScore 리스트 형식으로 통일
 *   (기존 paperIdx=2의 motivateInfo/cognitionInfo/behaviorInfo 구조 삭제)
 */
export const API_STUDENT_DETAIL: ApiDefinition = {
  method: 'GET',
  endpoint: '/api/dgnss/st/analysis?stdtId={stdtId}&paperIdx={paperIdx}',
  summary: 'L3 학생 상세 분석 데이터',
  description: '특정 학생의 38개 T점수와 LPA 유형 분류 결과를 조회합니다. st/total/analysis가 st/analysis로 통합됨. stdtId 전달 시 전체 회차 조회.',
  priority: 'high',
  responseExample: {
    stUserInfo: {
      stdtId: 'viva-s-00000001',
      eakStDt: '2026-03-18 10:00:00',
      ordNo: 1,
      paperIdx: 1,
      gender: '남자',
      grade: '중1',
      classCd: '1반',
      dgnssResultId: 12509,
    },
    '1': [
      {
        dgnssResultId: 12509,
        SECTION_ID: '10-22-01-01-0-0',
        SECTION_NM: '긍정적 자아',
        DEPTH: 3,
        tScore: 55,
        ord_no: 1,
        reaction: null,
        desirable: null,
        repeatResponse: 'N',
      },
    ],
    '2': [
      {
        dgnssResultId: 12510,
        SECTION_ID: '10-22-01-01-0-0',
        SECTION_NM: '긍정적 자아',
        DEPTH: 3,
        tScore: 58,
        ord_no: 2,
        reaction: null,
        desirable: null,
        repeatResponse: 'N',
      },
    ],
  },
  errorCases: [
    { code: 401, message: '인증 토큰이 없거나 만료됨' },
    { code: 404, message: '학생 검사 결과를 찾을 수 없음' },
  ],
  currentImpl: '현재 API 연동 완료 (endpoint 변경 필요: st/total/analysis → st/analysis)',
  relatedFiles: [
    'src/shared/services/dashboardService.ts',
    'src/shared/services/apiDataTransformer.ts',
    'src/features/student-dashboard/pages/StudentDashboardPage.tsx',
  ],
};

// ============================================================
// 2. 업로드 데이터 저장 API (🔴 높음)
// ============================================================

export const API_UPLOAD_CREATE: ApiDefinition = {
  method: 'POST',
  endpoint: '/api/dgnss/tc/upload',
  summary: '검사 결과 업로드',
  description: '검사 결과 데이터를 업로드합니다. JSON 파일 또는 PDF 파싱 결과.',
  priority: 'high',
  requestBody: {
    rawData: {
      examInfo: { grade: 6, year: 2026 },
      classes: [
        {
          teacher: '김선생',
          students: [{ stdtId: 'S0201', name: '김철수' /* ... */ }],
        },
      ],
    },
    metadata: {
      fileName: 'exam_result_2026.json',
      uploadedAt: '2026-03-01T10:00:00Z',
    },
  },
  responseExample: {
    uploadId: 'upload-001',
    uploadedAt: '2026-03-01T10:00:00Z',
    classCount: 4,
    studentCount: 88,
  },
  errorCases: [
    { code: 400, message: '잘못된 데이터 형식' },
    { code: 401, message: '인증 토큰이 없거나 만료됨' },
    { code: 413, message: '파일 크기 초과 (최대 10MB)' },
  ],
  currentImpl: 'localStorage (meta_dashboard_uploaded_data) 사용 중',
  relatedFiles: ['src/shared/services/storageService.ts'],
};

export const API_UPLOAD_LATEST: ApiDefinition = {
  method: 'GET',
  endpoint: '/api/dgnss/tc/upload/latest',
  summary: 'PDF 업로드 데이터 조회',
  description: '교사가 업로드한 PDF 검사 결과지 데이터를 조회합니다. AIDT/비바샘에서 받은 PDF 파일을 업로드하면 파싱된 학생 검사 결과가 저장됩니다.',
  priority: 'high',
  responseExample: {
    uploadId: 'upload-001',
    version: 1,
    uploadedAt: '2026-03-01T10:00:00Z',
    rawData: {
      examInfo: { grade: 6, year: 2026 },
      classes: [
        {
          teacher: '김선생',
          students: [
            {
              stdtId: 'S0201',
              name: '김철수',
              test1: {
                rawScores: [3, 4, 2 /* ... 124개 */],
                tScores: [52, 48, 55 /* ... 38개 */],
                type: '안전균형형',
                reliability: [],
                date: '2026-02-15',
              },
            },
          ],
        },
      ],
    },
    metadata: {
      fileName: 'exam_result_2026.pdf',
    },
  },
  errorCases: [
    { code: 401, message: '인증 토큰이 없거나 만료됨' },
    { code: 404, message: '업로드된 데이터가 없음' },
  ],
  currentImpl: 'localStorage (meta_dashboard_uploaded_data) 사용 중',
  relatedFiles: ['src/shared/contexts/DataContext.tsx', 'src/shared/services/storageService.ts'],
};

// ============================================================
// 3. 학급 운영 전략 템플릿 API (🟡 중간)
// ============================================================

export const API_STRATEGIES_RECOMMENDATIONS: ApiDefinition = {
  method: 'GET',
  endpoint: '/api/dgnss/tc/strategies/recommend',
  summary: '맞춤 전략 추천',
  description: '학급 프로필(약점 영역)을 기반으로 맞춤 전략을 추천합니다.',
  priority: 'medium',
  requestBody: {
    weaknesses: ['학습디딤돌', '긍정적공부마음'],
  },
  responseExample: [
    {
      id: 'strategy-002',
      category: '학습디딤돌',
      title: '메타인지 학습법 도입',
      priority: 1,
    },
    {
      id: 'strategy-003',
      category: '긍정적공부마음',
      title: '성장 마인드셋 캠페인',
      priority: 2,
    },
  ],
  errorCases: [],
  currentImpl: '약점 TOP 3 기반 하드코딩 매칭',
  relatedFiles: ['src/features/class-dashboard/components/detail/StrategySection.tsx'],
};

// ============================================================
// 4. 추천 학급 활동 API (🟢 낮음)
// ============================================================

export const API_ACTIVITIES_RECOMMENDED: ApiDefinition = {
  method: 'GET',
  endpoint: '/api/dgnss/tc/activities',
  summary: '추천 활동 목록 조회',
  description: '일반 추천 학급 활동 목록을 조회합니다.',
  priority: 'low',
  responseExample: [
    {
      id: 'activity-001',
      title: '감정 온도계 활동',
      description: '매일 아침 자신의 감정 상태를 체크하고 공유하는 활동',
    },
    {
      id: 'activity-002',
      title: '또래 학습 멘토링',
      description: '학습 강점이 다른 학생끼리 짝을 이루어 서로 가르치는 활동',
    },
  ],
  errorCases: [],
  currentImpl: 'ClassInsights.tsx 내 RECOMMENDED_ACTIVITIES 하드코딩',
  relatedFiles: ['src/features/class-dashboard/components/ClassInsights.tsx'],
};

export const API_ACTIVITIES_BY_PROFILE: ApiDefinition = {
  method: 'GET',
  endpoint: '/api/dgnss/tc/activities/recommend',
  summary: '프로필 기반 활동 추천',
  description: '학급 프로필(강점/약점)을 기반으로 맞춤 활동을 추천합니다.',
  priority: 'low',
  requestBody: {
    strengths: ['긍정적자아'],
    weaknesses: ['학습디딤돌'],
    typeDistribution: { '자원소진형': 8, '안전균형형': 10, '몰입자원풍부형': 7 },
  },
  responseExample: [
    {
      id: 'activity-003',
      title: '메타인지 학습일지',
      description: '매주 학습 과정을 돌아보고 다음 주 계획을 세우는 활동',
      targetWeakness: '학습디딤돌',
    },
  ],
  errorCases: [],
  currentImpl: '하드코딩된 3개 활동만 표시',
  relatedFiles: ['src/features/class-dashboard/components/ClassInsights.tsx'],
};

// ============================================================
// 5. 상담일정 API (🔴 높음)
// ============================================================

/**
 * 학급 전체 학생 목록 API (상담용)
 *
 * 검사 제출 여부와 무관하게 학급 소속 전체 학생 목록을 조회합니다.
 * 기존 /group/detail API가 멤버 목록을 반환하므로 신규 API 불필요.
 * (backend-api-specification-v0.1.md #26 참고)
 */
export const API_CLASS_ALL_STUDENTS: ApiDefinition = {
  method: 'GET',
  endpoint: '/group/detail?claId={claId}',
  summary: '학급 전체 학생 목록 조회 (그룹 상세)',
  description: '검사 제출 여부와 무관하게 학급에 소속된 전체 학생 목록을 반환합니다. 기존 /group/detail API 활용. 상담 일정 등록 시 학생 선택에 사용.',
  priority: 'high',
  responseExample: {
    members: [
      {
        id: 1,
        userNo: 456,
        stdtId: 'viva-s-00000001',
        nickname: '학생1',
        gender: 'M',
        email: 'student@test.com',
        memberNo: 1,
        memberType: 'STUDENT',
        status: 'ACTIVE',
      },
      {
        id: 2,
        userNo: 789,
        stdtId: 'viva-s-00000002',
        nickname: '학생2',
        gender: 'F',
        email: 'student2@test.com',
        memberNo: 2,
        memberType: 'STUDENT',
        status: 'ACTIVE',
      },
    ],
  },
  errorCases: [
    { code: 401, message: '인증 토큰이 없거나 만료됨' },
    { code: 404, message: '학급(그룹)을 찾을 수 없음' },
  ],
  currentImpl: 'SCHEDULE_STUDENTS (mockUnifiedCounseling.ts)',
  relatedFiles: [
    'src/features/schedule/components/ScheduleStudentPicker.tsx',
  ],
};

/**
 * 교사 전체 상담 목록 API (상담일정 페이지용)
 *
 * 상담일정 캘린더에서 교사의 전체 상담 일정을 조회합니다.
 */
export const API_COUNSELING_ALL: ApiDefinition = {
  method: 'GET',
  endpoint: '/api/counseling?tcId={tcId}',
  summary: '교사 전체 상담 목록 조회',
  description: '교사가 등록한 모든 상담 일정(예정/완료/취소)을 조회합니다. 상담일정 캘린더 표시용.',
  priority: 'high',
  responseExample: [
    {
      id: 'counseling-001',
      students: [{ id: 'student-01', name: '김철수', number: 1 }],
      claId: 'class-6-2',
      scheduledAt: '2026-03-15 14:00',
      duration: 30,
      types: ['regular'],
      areas: ['academic'],
      methods: ['face-to-face'],
      status: 'scheduled',
      reason: '학업 성취도 점검',
    },
    {
      id: 'counseling-002',
      students: [{ id: 'student-03', name: '박지민', number: 3 }],
      claId: 'class-6-2',
      scheduledAt: '2026-03-10 11:00',
      types: ['follow-up'],
      areas: ['emotion'],
      methods: ['face-to-face'],
      status: 'completed',
      summary: '정서 안정 확인, 경과 양호',
    },
  ],
  errorCases: [
    { code: 401, message: '인증 토큰이 없거나 만료됨' },
  ],
  currentImpl: 'unifiedCounselingService.getAll() → /api/counseling',
  relatedFiles: [
    'src/shared/services/unifiedCounselingService.ts',
    'src/features/schedule/pages/SchedulePage.tsx',
  ],
};

// ============================================================
// 6. L3 학생 패널 API (🔴 높음)
// ============================================================

/**
 * 학생별 상담 기록 API (L3 학생 대시보드용)
 *
 * 특정 학생의 상담 기록을 조회합니다.
 */
export const API_COUNSELING_LIST: ApiDefinition = {
  method: 'GET',
  endpoint: '/api/counseling/student/{stdtId}',
  summary: '학생별 상담 기록 조회',
  description: '특정 학생의 상담 기록(예정/완료)을 조회합니다.',
  priority: 'high',
  responseExample: [
    {
      id: 'counseling-001',
      students: [{ id: 'student-01', name: '김철수', number: 1 }],
      claId: 'class-6-2',
      scheduledAt: '2026-03-15 14:00',
      duration: 30,
      types: ['regular'],
      areas: ['academic', 'career'],
      methods: ['face-to-face'],
      status: 'completed',
      summary: '학습 동기 부여에 대한 상담 진행',
      nextSteps: '주 1회 자기 점검 일지 작성',
      createdAt: '2026-03-10T09:00:00Z',
    },
  ],
  errorCases: [
    { code: 401, message: '인증 토큰이 없거나 만료됨' },
    { code: 404, message: '학생을 찾을 수 없음' },
  ],
  currentImpl: 'mockUnifiedCounselingService (localStorage)',
  relatedFiles: [
    'src/shared/services/unifiedCounselingService.ts',
    'src/features/student-dashboard/components/counseling/CounselingRecordPanel.tsx',
  ],
};

export const API_COUNSELING_CREATE: ApiDefinition = {
  method: 'POST',
  endpoint: '/api/counseling',
  summary: '상담 일정 생성',
  description: '새로운 상담 일정을 생성합니다. 복수 학생 지원.',
  priority: 'high',
  requestBody: {
    students: [{ id: 'student-01', name: '김철수', number: 1 }],
    claId: 'class-6-2',
    scheduledAt: '2026-03-20 10:00',
    types: ['initial'],
    areas: ['academic'],
    methods: ['face-to-face'],
    reason: '1차 검사 결과 상담',
  },
  responseExample: {
    id: 'counseling-002',
    status: 'scheduled',
    createdAt: '2026-03-15T09:00:00Z',
  },
  errorCases: [
    { code: 400, message: '필수 필드 누락' },
  ],
  currentImpl: 'mockUnifiedCounselingService (localStorage)',
  relatedFiles: ['src/shared/services/unifiedCounselingService.ts'],
};

export const API_COUNSELING_COMPLETE: ApiDefinition = {
  method: 'POST',
  endpoint: '/api/counseling/{id}/complete',
  summary: '상담 완료 처리',
  description: '예정된 상담을 완료 처리하고 상담 기록을 저장합니다.',
  priority: 'high',
  requestBody: {
    duration: 30,
    summary: '학습 동기 부여 상담 진행. 목표 설정 필요.',
    nextSteps: '주 1회 학습 일지 작성 권장',
  },
  responseExample: {
    id: 'counseling-002',
    status: 'completed',
    updatedAt: '2026-03-20T10:30:00Z',
  },
  errorCases: [
    { code: 404, message: '상담 기록을 찾을 수 없음' },
    { code: 409, message: '이미 완료된 상담' },
  ],
  currentImpl: 'mockUnifiedCounselingService (localStorage)',
  relatedFiles: ['src/features/student-dashboard/components/counseling/CompletionModal.tsx'],
};

/**
 * 관찰 메모 API
 */
export const API_MEMO_LIST: ApiDefinition = {
  method: 'GET',
  endpoint: '/api/memos/student/{stdtId}',
  summary: '학생별 관찰 메모 조회',
  description: '특정 학생의 관찰 메모 목록을 조회합니다.',
  priority: 'high',
  responseExample: [
    {
      id: 'memo-001',
      stdtId: 'student-01',
      content: '수업 중 집중력이 향상됨',
      category: 'academic',
      tag: '학업열의',
      isImportant: true,
      createdAt: '2026-03-10T09:00:00Z',
    },
  ],
  errorCases: [
    { code: 401, message: '인증 토큰이 없거나 만료됨' },
    { code: 404, message: '학생을 찾을 수 없음' },
  ],
  currentImpl: 'mockMemoService (localStorage)',
  relatedFiles: [
    'src/shared/services/memoService.ts',
    'src/features/student-dashboard/components/ObservationMemoPanel.tsx',
  ],
};

export const API_MEMO_CREATE: ApiDefinition = {
  method: 'POST',
  endpoint: '/api/memos',
  summary: '관찰 메모 생성',
  description: '새로운 관찰 메모를 생성합니다.',
  priority: 'high',
  requestBody: {
    stdtId: 'student-01',
    claId: 'class-6-2',
    content: '모둠 활동에서 리더십 발휘',
    tag: '대인관계능력',
    observedAt: '2026-03-15',
    situation: '과학 실험 모둠 활동',
  },
  responseExample: {
    id: 'memo-002',
    createdAt: '2026-03-15T14:00:00Z',
  },
  errorCases: [
    { code: 400, message: '필수 필드 누락' },
  ],
  currentImpl: 'mockMemoService (localStorage)',
  relatedFiles: ['src/shared/services/memoService.ts'],
};

/**
 * 생활기록부 저장 API
 *
 * AI 문구 생성은 Gemini API 사용. 저장/조회만 백엔드 API 필요.
 */
export const API_SCHOOL_RECORD_LIST: ApiDefinition = {
  method: 'GET',
  endpoint: '/api/school-records/student/{stdtId}',
  summary: '저장된 생기부 문구 조회',
  description: 'AI로 생성하여 저장한 생활기록부 문구를 조회합니다.',
  priority: 'medium',
  responseExample: [
    {
      id: 'record-001',
      stdtId: 'student-01',
      category: 'comprehensive',
      content: '학습에 대한 열의가 있으며, 자기 점검 능력이 발전하고 있는 학생임.',
      generatedAt: '2026-03-10T09:00:00Z',
      savedAt: '2026-03-10T09:05:00Z',
    },
  ],
  errorCases: [
    { code: 401, message: '인증 토큰이 없거나 만료됨' },
  ],
  currentImpl: 'mockSchoolRecordService (localStorage)',
  relatedFiles: [
    'src/shared/services/schoolRecordService.ts',
    'src/features/student-dashboard/components/SchoolRecordPanel.tsx',
  ],
};

export const API_SCHOOL_RECORD_SAVE: ApiDefinition = {
  method: 'POST',
  endpoint: '/api/school-records',
  summary: '생기부 문구 저장',
  description: 'AI로 생성한 생활기록부 문구를 저장합니다.',
  priority: 'medium',
  requestBody: {
    stdtId: 'student-01',
    category: 'comprehensive',
    content: '학습에 대한 열의가 있으며...',
  },
  responseExample: {
    id: 'record-002',
    savedAt: '2026-03-15T10:00:00Z',
  },
  errorCases: [
    { code: 400, message: '필수 필드 누락' },
  ],
  currentImpl: 'mockSchoolRecordService (localStorage)',
  relatedFiles: ['src/shared/services/schoolRecordService.ts'],
};

// ============================================================
// 7. API 그룹 (페이지별 사용)
// ============================================================

/** L1 교사 대시보드에서 사용하는 API */
export const TEACHER_DASHBOARD_APIS = {
  teacherDashboard: API_TEACHER_DASHBOARD,
};

/** L2 반 대시보드에서 사용하는 API */
export const CLASS_DASHBOARD_APIS = {
  classStudents: API_CLASS_STUDENTS,
  activitiesByProfile: API_ACTIVITIES_BY_PROFILE,
};

/** L2.5 학급 상세 분석에서 사용하는 API */
export const CLASS_DETAIL_APIS = {
  strategiesRecommendations: API_STRATEGIES_RECOMMENDATIONS,
};

/** 상담일정 페이지에서 사용하는 API */
export const SCHEDULE_APIS = {
  counselingAll: API_COUNSELING_ALL,
  counselingCreate: API_COUNSELING_CREATE,
  counselingComplete: API_COUNSELING_COMPLETE,
  classAllStudents: API_CLASS_ALL_STUDENTS,
  teacherDashboard: API_TEACHER_DASHBOARD,
};

/** L3 학생 대시보드에서 사용하는 API */
export const STUDENT_DASHBOARD_APIS = {
  counselingList: API_COUNSELING_LIST,
  counselingCreate: API_COUNSELING_CREATE,
  counselingComplete: API_COUNSELING_COMPLETE,
  memoList: API_MEMO_LIST,
  memoCreate: API_MEMO_CREATE,
  schoolRecordList: API_SCHOOL_RECORD_LIST,
  schoolRecordSave: API_SCHOOL_RECORD_SAVE,
};

/**
 * 검사 관리 페이지 (/assessment) 에서 사용하는 API
 *
 * 흐름: 그룹 목록 조회 → 그룹 선택(필수) → 검사 생성 → QR 배포
 *
 * 기존 API (dgnss-api-spec.md 참고):
 *  - GET  /group/list                    → 교사 소유 그룹 목록 (claId 획득)
 *  - GET  /api/dgnss/tc/info             → 그룹별 검사 목록 조회 (claId, tcId, paperIdx)
 *  - POST /api/dgnss/tc/start            → 검사 생성 (claId from 선택된 그룹)
 *  - POST /api/dgnss/tc/end              → 검사 종료 (dgnssId)
 *  - POST /api/dgnss/tc/cancel           → 검사 취소 (dgnssId)
 *  - GET  /api/dgnss/tc/detail           → 검사 상세 (dgnssId)
 *  - GET  /api/dgnss/tc/notsubm          → 미제출 학생 목록 (dgnssId)
 */
export const ASSESSMENT_APIS = {
  // 그룹 목록 (검사 대상 그룹 선택용)
  groupList: { method: 'GET', endpoint: '/group/list', summary: '교사 소유 그룹 목록' },
  // 검사 CRUD (기존 dgnss API)
  examList: { method: 'GET', endpoint: '/api/dgnss/tc/info', summary: '그룹별 검사 목록 조회' },
  examStart: { method: 'POST', endpoint: '/api/dgnss/tc/start', summary: '검사 생성 (그룹 claId 사용)' },
  examEnd: { method: 'POST', endpoint: '/api/dgnss/tc/end', summary: '검사 종료' },
  examCancel: { method: 'POST', endpoint: '/api/dgnss/tc/cancel', summary: '검사 취소' },
  examDetail: { method: 'GET', endpoint: '/api/dgnss/tc/detail', summary: '검사 상세' },
  notSubmitted: { method: 'GET', endpoint: '/api/dgnss/tc/notsubm', summary: '미제출 학생 목록' },
};

/** 업로드 페이지에서 사용하는 API */
export const UPLOAD_APIS = {
  uploadCreate: API_UPLOAD_CREATE,
  uploadLatest: API_UPLOAD_LATEST,
};

/**
 * 검사 실시 페이지 (/exam) 에서 사용하는 API (학생용)
 *
 * 흐름: 그룹 초대코드(QR) → 로그인/게스트 → /st/info로 활성 검사 조회
 *       → /tc/restart로 새 학생 OMR 발급 → /st/start로 문제 로드
 *
 * 기존 API (dgnss-api-spec.md 참고):
 *  - GET  /group/invite?code={inviteCode}  → 그룹 정보 조회
 *  - GET  /api/dgnss/st/info               → 학생 활성 검사 조회
 *  - POST /api/dgnss/tc/restart            → 새 학생 OMR 발급
 *  - POST /api/dgnss/st/start              → 문제 목록 반환
 *  - POST /api/dgnss/st/answer             → 답안 저장
 *  - POST /api/dgnss/st/submit             → 검사 제출
 */
export const EXAM_APIS = {
  groupInvite: { method: 'GET', endpoint: '/group/invite?code={inviteCode}', summary: '초대코드로 그룹 조회' },
  studentInfo: { method: 'GET', endpoint: '/api/dgnss/st/info', summary: '학생 활성 검사 조회' },
  restart: { method: 'POST', endpoint: '/api/dgnss/tc/restart', summary: '새 학생 OMR 발급' },
  studentStart: { method: 'POST', endpoint: '/api/dgnss/st/start', summary: '문제 목록 반환' },
  studentAnswer: { method: 'POST', endpoint: '/api/dgnss/st/answer', summary: '답안 저장' },
  studentSubmit: { method: 'POST', endpoint: '/api/dgnss/st/submit', summary: '검사 제출' },
};
