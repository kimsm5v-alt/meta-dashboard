/**
 * 대시보드 API 서비스
 *
 * API 문서: docs/api-endpoints.md
 * 엔드포인트:
 * - /etc/meta/tc/info: 교사 검사 목록
 * - /etc/meta/tc/detail: 검사 상세
 * - /etc/meta/tc/stinfolist: 학생 목록 + 신뢰도
 * - /etc/meta/tc/analysis: 학급 평균 T점수
 * - /etc/meta/tc/need: 관심 필요 학생
 * - /etc/meta/st/total/analysis: 학생 개별 T점수
 */

import { apiRequest, mockDelay, isApiMode } from './apiClient';
import type { SchoolLevel, StudentType } from '@/shared/types';
import { classifyStudent, getTypeDeviations } from '@/shared/utils/lpaClassifier';
import { checkAttention } from '@/shared/utils/attentionChecker';

// ============================================================
// API 응답 타입
// ============================================================

/** 검사 목록 항목 (교사용) */
export interface DgnssInfoItem {
  dgnssId: number;
  paperIdx: string;
  ordNo: number;
  claId: string;
  tcId: string;
  dgnssAt: 'Y' | 'N';
  dgnssStDt: string;
  dgnssEdDt: string | null;
  stTotalCnt: number;
  stSubmCnt: number;
  notDgnssStartCnt: number;
  notDgnssStartList: string | null;
}

/** 검사 목록 응답 */
export interface DgnssInfoResponse {
  dgnssInfo: DgnssInfoItem[];
}

/** 검사 상세 응답 */
export interface DgnssDetailResponse {
  dgnssId: number;
  paperIdx: string;
  ordNo: number;
  num: number;
  dgnssAt: 'Y' | 'N';
  dgnssStDt: string;
  dgnssEdDt: string | null;
  stTotalCnt: number;
  stSubmCnt: number;
  dgnssText: string | null;
  notSubmStdtId: string | null;
  notSubmStdtName: string | null;
}

/** 학생 정보 항목 */
export interface StudentInfoItem {
  stdtId: string;
  answerIdx: number;
  rowNum: number;
  gender: string;
  reason: string;
  reaction: string;
  repeatResponse: 'Y' | 'N';
  desirable: string;
  styTime: string;
  styPer: string;
  satisPer: string;
  cnsl: string;
}

/** 학생 목록 응답 */
export interface StudentInfoListResponse {
  type: number;
  stInfoList: StudentInfoItem[];
}

/** 관심 필요 학생 응답 */
export interface NeedStudentsResponse {
  reaction: Array<{ num: number; stdtId: string }>;
  repeatResponse: Array<{ num: number; stdtId: string }>;
  desirable: Array<{ num: number; stdtId: string }>;
  etcInfo: Record<string, Array<{ num: number; stdtId: string }>>;
}

/** 섹션별 T점수 항목 */
export interface AnalysisSectionItem {
  ord_no: number;
  SECTION_ID: string;
  SECTION_NM: string;
  DEPTH: number;
  tScore: number;
  id?: number;
  dgnssResultId?: number;
  reaction?: string;
  repeatResponse?: string;
  desirable?: string;
}

/** 분석 결과 응답 (회차별 객체) */
export type AnalysisResponse = Record<string, AnalysisSectionItem[]>;

// ============================================================
// SECTION_ID → 요인 인덱스 매핑
// ============================================================

const SECTION_ID_TO_INDEX: Record<string, number> = {
  // 긍정적 자아 (자아강점)
  '10-22-01-01-01-0': 0,  // 자아존중감
  '10-22-01-01-02-0': 1,  // 자기효능감
  '10-22-01-01-03-0': 2,  // 성장마인드셋
  // 대인관계능력 (자아강점)
  '10-22-01-02-01-0': 3,  // 자기정서인식
  '10-22-01-02-02-0': 4,  // 자기정서조절
  '10-22-01-02-03-0': 5,  // 타인정서인식
  '10-22-01-02-04-0': 6,  // 타인공감능력
  // 메타인지 (학습디딤돌)
  '10-22-02-01-01-0': 7,  // 계획능력
  '10-22-02-01-02-0': 8,  // 점검능력
  '10-22-02-01-03-0': 9,  // 조절능력
  // 학습기술 (학습디딤돌)
  '10-22-02-02-01-0': 10, // 공부환경
  '10-22-02-02-02-0': 11, // 시간관리
  '10-22-02-02-03-0': 12, // 수업태도
  '10-22-02-02-04-0': 13, // 노트하기
  '10-22-02-02-05-0': 14, // 시험준비
  // 지지적 관계 (학습디딤돌)
  '10-22-02-03-01-0': 15, // 부모 의사소통
  '10-22-02-03-02-0': 16, // 부모 학업지지
  '10-22-02-03-03-0': 17, // 친구 정서지지
  '10-22-02-03-04-0': 18, // 교사 정서지지
  // 학업스트레스 (학습걸림돌)
  '10-22-03-01-01-0': 19, // 성적부담
  '10-22-03-01-02-0': 20, // 공부부담
  '10-22-03-01-03-0': 21, // 수업부담
  // 학업관계 스트레스 (학습걸림돌)
  '10-22-03-02-01-0': 22, // 부모 성적압력
  '10-22-03-02-02-0': 23, // 부모 공부부담
  '10-22-03-02-03-0': 24, // 친구 공부비교
  '10-22-03-02-04-0': 25, // 교사 성적압력
  '10-22-03-02-05-0': 26, // 교사 수업부담
  // 학습 방해물 (학습걸림돌)
  '10-22-03-03-01-0': 27, // 스마트폰 의존
  '10-22-03-03-02-0': 28, // 게임 과몰입
  // 학업열의 (긍정적공부마음)
  '10-22-04-01-01-0': 29, // 활기
  '10-22-04-01-02-0': 30, // 몰두
  '10-22-04-01-03-0': 31, // 의미감
  // 성장력 (긍정적공부마음)
  '10-22-04-02-01-0': 32, // 자율성
  '10-22-04-02-02-0': 33, // 유능성
  '10-22-04-02-03-0': 34, // 관계성
  // 학업소진 (부정적공부마음)
  '10-22-05-01-01-0': 35, // 고갈
  '10-22-05-01-02-0': 36, // 무능감
  '10-22-05-01-03-0': 37, // 반감-냉소
};

/** API 섹션 데이터를 38개 T점수 배열로 변환 */
function convertSectionsToTScores(sections: AnalysisSectionItem[]): number[] {
  const tScores: number[] = new Array(38).fill(50); // 기본값 50

  // DEBUG: 섹션 데이터 확인
  if (process.env.NODE_ENV === 'development' && sections.length > 0) {
    const depth5Sections = sections.filter(s => s.DEPTH === 5);
    console.log('[convertSectionsToTScores] 전체 섹션:', sections.length);
    console.log('[convertSectionsToTScores] DEPTH 5 섹션:', depth5Sections.length);
    if (depth5Sections.length > 0) {
      console.log('[convertSectionsToTScores] 샘플 SECTION_ID:', depth5Sections[0].SECTION_ID);
      const unmapped = depth5Sections.filter(s => SECTION_ID_TO_INDEX[s.SECTION_ID] === undefined);
      if (unmapped.length > 0) {
        console.warn('[convertSectionsToTScores] 매핑 안 된 SECTION_ID:', unmapped.map(s => s.SECTION_ID));
      }
    }
  }

  for (const section of sections) {
    // DEPTH 5 (소분류)만 사용
    if (section.DEPTH !== 5) continue;

    const index = SECTION_ID_TO_INDEX[section.SECTION_ID];
    if (index !== undefined) {
      tScores[index] = Math.round(section.tScore);
    }
  }

  return tScores;
}

/** 신뢰도 경고 생성 */
function getReliabilityWarnings(info: StudentInfoItem | AnalysisSectionItem): string[] {
  const warnings: string[] = [];

  if ('reaction' in info && info.reaction === '주의') {
    warnings.push('반응일관성');
  }
  if ('desirable' in info && info.desirable === '주의') {
    warnings.push('사회적바람직성');
  }
  if ('repeatResponse' in info && info.repeatResponse === 'Y') {
    warnings.push('연속동일반응');
  }

  return warnings;
}

// ============================================================
// API 함수
// ============================================================

/**
 * 교사 검사 목록 조회
 * GET /etc/meta/tc/info
 */
export async function fetchTeacherExams(
  claId: string,
  tcId: string,
  paperIdx?: string
): Promise<DgnssInfoItem[]> {
  if (!isApiMode()) {
    await mockDelay(300);
    return [];
  }

  let url = `/etc/meta/tc/info?claId=${claId}&tcId=${tcId}`;
  if (paperIdx) {
    url += `&paperIdx=${paperIdx}`;
  }

  const response = await apiRequest<DgnssInfoResponse>(url);
  return response.resultData.dgnssInfo ?? [];
}

/**
 * 검사 상세 조회
 * GET /etc/meta/tc/detail
 */
export async function fetchExamDetail(
  dgnssId: number
): Promise<DgnssDetailResponse | null> {
  if (!isApiMode()) {
    await mockDelay(300);
    return null;
  }

  const response = await apiRequest<DgnssDetailResponse>(
    `/etc/meta/tc/detail?dgnssId=${dgnssId}`
  );
  return response.resultData;
}

/**
 * 학생 목록 조회 (신뢰도/전략별)
 * GET /etc/meta/tc/stinfolist
 */
export async function fetchStudentInfoList(
  dgnssId: number,
  paperIdx: string = '1',
  type: number = 1
): Promise<StudentInfoItem[]> {
  if (!isApiMode()) {
    await mockDelay(300);
    return [];
  }

  const response = await apiRequest<StudentInfoListResponse>(
    `/etc/meta/tc/stinfolist?dgnssId=${dgnssId}&paperIdx=${paperIdx}&type=${type}`
  );
  return response.resultData.stInfoList ?? [];
}

/**
 * 관심 필요 학생 조회
 * GET /etc/meta/tc/need
 */
export async function fetchNeedAttentionStudents(
  dgnssId: number,
  paperIdx: string = '1'
): Promise<NeedStudentsResponse> {
  if (!isApiMode()) {
    await mockDelay(300);
    return { reaction: [], repeatResponse: [], desirable: [], etcInfo: {} };
  }

  const response = await apiRequest<NeedStudentsResponse>(
    `/etc/meta/tc/need?dgnssId=${dgnssId}&paperIdx=${paperIdx}`
  );
  return response.resultData;
}

/**
 * 학급 평균 T점수 조회
 * GET /etc/meta/tc/analysis
 */
export async function fetchClassAnalysis(
  claId: string,
  paperIdx: string = '1',
  ordNo: number = 1
): Promise<number[]> {
  if (!isApiMode()) {
    await mockDelay(300);
    return new Array(38).fill(50);
  }

  const response = await apiRequest<AnalysisResponse>(
    `/etc/meta/tc/analysis?claId=${claId}&paperIdx=${paperIdx}&ordNo=${ordNo}`
  );

  const roundData = response.resultData[String(ordNo)];
  if (!roundData) {
    return new Array(38).fill(50);
  }

  return convertSectionsToTScores(roundData);
}

/**
 * 학급 분석 전체 데이터 조회 (원본 섹션 포함)
 */
export async function fetchClassAnalysisRaw(
  claId: string,
  paperIdx: string = '1',
  ordNo: number = 1
): Promise<AnalysisSectionItem[]> {
  if (!isApiMode()) {
    await mockDelay(300);
    return [];
  }

  const response = await apiRequest<AnalysisResponse>(
    `/etc/meta/tc/analysis?claId=${claId}&paperIdx=${paperIdx}&ordNo=${ordNo}`
  );

  return response.resultData[String(ordNo)] ?? [];
}

/**
 * 학생 개별 T점수 조회
 * GET /etc/meta/st/total/analysis
 */
export async function fetchStudentAnalysis(
  stdtId: string,
  paperIdx: string = '1',
  ordNo: number = 1
): Promise<{
  tScores: number[];
  reliabilityWarnings: string[];
  sections: AnalysisSectionItem[];
}> {
  if (!isApiMode()) {
    await mockDelay(300);
    return {
      tScores: new Array(38).fill(50),
      reliabilityWarnings: [],
      sections: [],
    };
  }

  const response = await apiRequest<AnalysisResponse>(
    `/etc/meta/st/total/analysis?stdtId=${stdtId}&paperIdx=${paperIdx}&ordNo=${ordNo}`
  );

  const roundData = response.resultData[String(ordNo)];
  if (!roundData || roundData.length === 0) {
    return {
      tScores: new Array(38).fill(50),
      reliabilityWarnings: [],
      sections: [],
    };
  }

  const tScores = convertSectionsToTScores(roundData);
  const reliabilityWarnings = getReliabilityWarnings(roundData[0]);

  return {
    tScores,
    reliabilityWarnings,
    sections: roundData,
  };
}

/**
 * 학생 전체 분석 (1차 + 2차) 조회
 */
export async function fetchStudentFullAnalysis(
  stdtId: string,
  paperIdx: string = '1'
): Promise<{
  round1: { tScores: number[]; reliabilityWarnings: string[] } | null;
  round2: { tScores: number[]; reliabilityWarnings: string[] } | null;
}> {
  if (!isApiMode()) {
    await mockDelay(300);
    return { round1: null, round2: null };
  }

  // 1차와 2차를 병렬로 조회
  const [r1Result, r2Result] = await Promise.allSettled([
    fetchStudentAnalysis(stdtId, paperIdx, 1),
    fetchStudentAnalysis(stdtId, paperIdx, 2),
  ]);

  // DEBUG: 학생 분석 결과 확인
  if (process.env.NODE_ENV === 'development') {
    console.log(`[fetchStudentFullAnalysis] stdtId=${stdtId}`);
    if (r1Result.status === 'fulfilled') {
      console.log(`  round1 tScores:`, r1Result.value.tScores?.slice(0, 5), '...');
    } else {
      console.log(`  round1 rejected:`, r1Result.reason);
    }
  }

  // 안전한 null 체크
  const hasValidR1 = r1Result.status === 'fulfilled'
    && r1Result.value.tScores
    && Array.isArray(r1Result.value.tScores)
    && r1Result.value.tScores.some(t => t !== 50);

  const hasValidR2 = r2Result.status === 'fulfilled'
    && r2Result.value.tScores
    && Array.isArray(r2Result.value.tScores)
    && r2Result.value.tScores.some(t => t !== 50);

  return {
    round1: hasValidR1 && r1Result.status === 'fulfilled'
      ? { tScores: r1Result.value.tScores, reliabilityWarnings: r1Result.value.reliabilityWarnings }
      : null,
    round2: hasValidR2 && r2Result.status === 'fulfilled'
      ? { tScores: r2Result.value.tScores, reliabilityWarnings: r2Result.value.reliabilityWarnings }
      : null,
  };
}

// ============================================================
// 데이터 변환 유틸리티
// ============================================================

/**
 * API 분석 데이터를 Assessment 타입으로 변환
 */
export function convertToAssessment(
  studentId: string,
  round: 1 | 2,
  data: {
    tScores: number[];
    reliabilityWarnings: string[];
  } | null | undefined,
  schoolLevel: SchoolLevel
): import('@/shared/types').Assessment {
  // 방어: data 자체가 없을 수 있음
  const tScores = data?.tScores;
  const reliabilityWarnings = data?.reliabilityWarnings ?? [];

  // 방어: tScores가 없거나 비어있으면 기본값 사용
  const safeTScores = tScores && Array.isArray(tScores) && tScores.length === 38
    ? tScores
    : new Array(38).fill(50);

  // DEBUG: tScores 상태 확인
  if (process.env.NODE_ENV === 'development' && (!tScores || tScores.length !== 38)) {
    console.warn(`[convertToAssessment] studentId=${studentId}, round=${round}, tScores 비정상:`, tScores);
  }

  // LPA 분류
  const classification = classifyStudent(safeTScores, schoolLevel);

  // 유형별 특이점 계산
  const deviations = getTypeDeviations(safeTScores, classification.predictedType, schoolLevel, 3);

  // 관심 필요 판별
  const attentionResult = checkAttention(safeTScores);

  return {
    id: `${studentId}-r${round}`,
    studentId,
    round,
    assessedAt: new Date(),
    tScores: safeTScores,
    predictedType: classification.predictedType as StudentType,
    typeConfidence: classification.confidence,
    typeProbabilities: classification.allProbabilities,
    deviations,
    reliabilityWarnings,
    attentionResult,
  };
}

/**
 * 학급 데이터를 프론트엔드 Class 타입으로 변환
 */
export async function buildClassFromAPI(
  claId: string,
  grade: number,
  classNumber: number,
  schoolLevel: SchoolLevel,
  dgnssId: number,
  round2DgnssId?: number
): Promise<import('@/shared/types').Class | null> {
  try {
    // 학생 목록 조회
    const studentInfoList = await fetchStudentInfoList(dgnssId, '1', 1);
    if (studentInfoList.length === 0) {
      return null;
    }

    // 학생별 분석 데이터 조회 (병렬)
    const studentPromises = studentInfoList.map(async (info) => {
      const fullAnalysis = await fetchStudentFullAnalysis(info.stdtId, '1');
      return { info, fullAnalysis };
    });

    const studentResults = await Promise.all(studentPromises);

    // Student 배열 생성
    const students: import('@/shared/types').Student[] = studentResults
      .filter(({ fullAnalysis }) => {
        // round1 또는 round2가 유효한 tScores를 가지고 있는지 확인
        const hasValidR1 = fullAnalysis.round1?.tScores && Array.isArray(fullAnalysis.round1.tScores);
        const hasValidR2 = fullAnalysis.round2?.tScores && Array.isArray(fullAnalysis.round2.tScores);
        return hasValidR1 || hasValidR2;
      })
      .map(({ info, fullAnalysis }) => {
        const assessments: import('@/shared/types').Assessment[] = [];

        if (fullAnalysis.round1?.tScores) {
          assessments.push(
            convertToAssessment(info.stdtId, 1, fullAnalysis.round1, schoolLevel)
          );
        }

        if (fullAnalysis.round2?.tScores) {
          assessments.push(
            convertToAssessment(info.stdtId, 2, fullAnalysis.round2, schoolLevel)
          );
        }

        return {
          id: info.stdtId,
          classId: claId,
          number: info.rowNum,
          name: `학생${info.rowNum}`,  // API에서 이름 미제공 시 기본값
          schoolLevel,
          grade,
          assessments,
        };
      });

    // 통계 계산
    const assessedStudents = students.filter(s => s.assessments.length > 0).length;
    const typeDistribution: Record<string, { count: number; percentage: number }> = {};

    for (const student of students) {
      const latestAssessment = student.assessments[student.assessments.length - 1];
      if (latestAssessment) {
        const type = latestAssessment.predictedType;
        if (!typeDistribution[type]) {
          typeDistribution[type] = { count: 0, percentage: 0 };
        }
        typeDistribution[type].count++;
      }
    }

    // 퍼센트 계산
    for (const type of Object.keys(typeDistribution)) {
      typeDistribution[type].percentage = Math.round(
        (typeDistribution[type].count / assessedStudents) * 100
      );
    }

    const needAttentionCount = students.filter(
      s => s.assessments.some(a => a.attentionResult.needsAttention)
    ).length;

    return {
      id: claId,
      schoolLevel,
      grade,
      classNumber,
      teacherId: '',
      students,
      stats: {
        totalStudents: studentInfoList.length,
        assessedStudents,
        typeDistribution,
        needAttentionCount,
        round1Completed: assessedStudents > 0,
        round2Completed: students.some(s => s.assessments.some(a => a.round === 2)),
        examStatus: {
          round1: assessedStudents > 0 ? '종료' : '시작전',
          round2: students.some(s => s.assessments.some(a => a.round === 2)) ? '종료' : '시작전',
        },
        round2SubmittedCount: students.filter(
          s => s.assessments.some(a => a.round === 2)
        ).length,
        dgnssIds: {
          round1: dgnssId,
          round2: round2DgnssId,
        },
      },
    };
  } catch (error) {
    console.error('Failed to build class from API:', error);
    return null;
  }
}

// ============================================================
// L2 대시보드용 API 함수
// ============================================================

/**
 * L2 대시보드 데이터 조회 (병렬 호출)
 *
 * 호출 API:
 * - /etc/meta/tc/detail: 검사 메타정보
 * - /etc/meta/tc/stinfolist: 학생 목록 + 신뢰도
 * - /etc/meta/tc/analysis: 학급 평균 T점수
 * - /etc/meta/tc/need: 관심 필요 학생
 */
export interface L2DashboardData {
  /** 검사 상세 정보 */
  examDetail: DgnssDetailResponse | null;
  /** 학생 목록 (신뢰도 포함) */
  studentInfoList: StudentInfoItem[];
  /** 학급 평균 T점수 (38개) */
  classTScores: number[];
  /** 관심 필요 학생 */
  needAttention: NeedStudentsResponse;
  /** 학생별 분석 데이터 */
  students: import('@/shared/types').Student[];
}

export async function fetchL2DashboardData(
  dgnssId: number,
  claId: string,
  schoolLevel: SchoolLevel,
  grade: number
): Promise<L2DashboardData> {
  // 1단계: 병렬 호출 (검사 상세, 학생 목록, 학급 평균, 관심 필요)
  const [examDetail, studentInfoList, classTScores, needAttention] = await Promise.all([
    fetchExamDetail(dgnssId),
    fetchStudentInfoList(dgnssId, '1', 1),
    fetchClassAnalysis(claId, '1', 1),
    fetchNeedAttentionStudents(dgnssId, '1'),
  ]);

  // 2단계: 학생별 개별 T점수 조회 (병렬)
  const studentAnalysisPromises = studentInfoList.map(async (info) => {
    const fullAnalysis = await fetchStudentFullAnalysis(info.stdtId, '1');
    return { info, fullAnalysis };
  });

  const studentResults = await Promise.all(studentAnalysisPromises);

  // Student 배열 생성
  const students: import('@/shared/types').Student[] = studentResults
    .map(({ info, fullAnalysis }) => {
      const assessments: import('@/shared/types').Assessment[] = [];

      if (fullAnalysis.round1?.tScores) {
        assessments.push(
          convertToAssessment(info.stdtId, 1, fullAnalysis.round1, schoolLevel)
        );
      }

      if (fullAnalysis.round2?.tScores) {
        assessments.push(
          convertToAssessment(info.stdtId, 2, fullAnalysis.round2, schoolLevel)
        );
      }

      // 신뢰도 경고 병합 (stinfolist의 정보 활용)
      const infoReliabilityWarnings = getReliabilityWarnings(info);
      for (const assessment of assessments) {
        const merged = new Set([...assessment.reliabilityWarnings, ...infoReliabilityWarnings]);
        assessment.reliabilityWarnings = Array.from(merged);
      }

      return {
        id: info.stdtId,
        classId: claId,
        number: info.rowNum,
        name: `학생${info.rowNum}`,
        schoolLevel,
        grade,
        assessments,
      };
    });

  return {
    examDetail,
    studentInfoList,
    classTScores,
    needAttention,
    students,
  };
}
