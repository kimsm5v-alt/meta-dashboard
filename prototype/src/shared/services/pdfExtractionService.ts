/**
 * PDF 결과지 → RawData 추출 서비스
 *
 * META 학습심리정서검사 PDF 결과지(교사용 보고서 / 학생별 보고서)에서
 * Gemini AI를 사용하여 구조화된 데이터를 추출합니다.
 *
 * 지원 형식:
 * - 교사용 보고서: 학급 전체 학생의 검사 결과 (1개 PDF → 다수 학생)
 * - 학생별 보고서: 개별 학생의 검사 결과 (1개 PDF → 1명 학생)
 *
 * 흐름:
 * File → base64 변환 → Gemini multimodal API → JSON 파싱 → 유효성 검증 → RawData
 */

import { callGeminiMultimodal } from '@/shared/services/gemini';
import { FACTORS } from '@/shared/data/lpaProfiles';
import type { RawData } from '@/shared/services/storageService';

// ============================================================
// 타입 정의
// ============================================================

export interface ValidationResult {
  isValid: boolean;
  studentCount: number;
  classCount: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  type: 'missing_factor' | 'invalid_score' | 'missing_student_name' | 'no_data' | 'parse_error';
  studentId?: string;
  factorName?: string;
  message: string;
}

interface ValidationWarning {
  type: 'score_out_of_typical_range' | 'missing_round' | 'few_factors';
  message: string;
}

export interface ExtractionResult {
  success: boolean;
  rawData?: RawData;
  validation?: ValidationResult;
  error?: string;
}

// ============================================================
// 추출 프롬프트
// ============================================================

const EXTRACTION_PROMPT = `당신은 META 학습심리정서검사 결과 PDF에서 데이터를 추출하는 전문가입니다.

이 PDF는 다음 두 가지 형식 중 하나입니다:
1. **교사용 보고서**: 학급 전체 학생들의 검사 결과가 포함된 보고서
2. **학생별 보고서**: 개별 학생 1명의 검사 결과가 포함된 보고서

PDF에서 다음 정보를 추출하여 **반드시 유효한 JSON만** 반환하세요. 설명이나 마크다운 코드블록 없이 순수 JSON만 출력하세요.

## 추출해야 할 38개 요인 (T점수)

자아존중감, 자기효능감, 성장마인드셋, 자기정서인식, 자기정서조절, 타인정서인식, 타인공감능력,
계획능력, 점검능력, 조절능력, 공부환경, 시간관리, 수업태도, 노트하기, 시험준비,
부모의사소통, 부모학업지지, 친구정서지지, 교사정서지지,
활기, 몰두, 의미감, 자율성, 유능성, 관계성,
성적부담, 공부부담, 수업부담, 스마트폰의존, 게임과몰입,
부모성적압력, 부모공부부담, 친구공부비교, 교사성적압력, 교사수업부담,
고갈, 무능감, 반감냉소

## T점수 추출 규칙
- T점수는 보통 20~80 범위의 숫자입니다
- 소수점이 있을 수 있습니다 (예: 57.87)
- 요인명이 PDF에서 약간 다를 수 있으니 유사한 이름으로 매칭하세요
  (예: "타인공감" → "타인공감능력", "게임 과몰입" → "게임과몰입")
- 원점수(rawScore)가 있으면 무시하고, T점수만 추출하세요

## 출력 JSON 형식

\`\`\`
{
  "examInfo": {
    "name": "META 학습종합검사",
    "year": <검사 연도 숫자>,
    "school": "<학교명>",
    "grade": <학년 숫자>
  },
  "classes": {
    "<학년>학년 <반>반": {
      "teacher": "<교사명 또는 빈 문자열>",
      "examStatus": { "test1": "종료", "test2": "시작전" },
      "students": [
        {
          "id": "S<반번호2자리><출석번호2자리>",
          "name": "<학생 이름>",
          "test1": {
            "status": "제출완료",
            "date": "<YYYY-MM-DD 형식 또는 빈 문자열>",
            "tScores": {
              "자아존중감": <숫자>,
              "자기효능감": <숫자>,
              ... (38개 모두)
            },
            "type": "<유형명 또는 null>",
            "reliability": []
          },
          "test2": {
            "status": "미실시",
            "tScores": null,
            "type": null,
            "reliability": null
          }
        }
      ]
    }
  }
}
\`\`\`

## 중요 규칙
1. 1차 검사 결과는 "test1", 2차 검사 결과는 "test2"에 넣으세요.
2. 검사가 하나만 있으면 test1에 넣고, test2는 "미실시"로 설정하세요.
3. 2차 검사 결과도 있으면 test2에도 동일한 형식으로 넣으세요.
4. 학생 ID는 "S" + 반번호(2자리) + 출석번호(2자리) 형식 (예: S0201)
5. 반번호를 알 수 없으면 "01"로 설정하세요.
6. 출석번호를 알 수 없으면 순서대로 01, 02, 03... 으로 설정하세요.
7. 신뢰도(사회적바람직성, 반응일관성, 연속동일반응) 중 "주의" 또는 "부적절"로 표시된 항목만 reliability 배열에 넣으세요. "양호"이거나 정상이면 빈 배열 []로 두세요. 예: 사회적바람직성이 "주의"이면 ["사회적바람직성"], 모두 양호이면 [].
8. 유형명(자원소진형, 안전균형형, 몰입자원풍부형, 무기력형, 정서조절취약형, 자기주도몰입형)이 있으면 type에 넣으세요.
9. JSON만 출력하세요. 절대 마크다운 코드블록(\`\`\`)이나 설명을 포함하지 마세요.`;

// ============================================================
// 유틸리티
// ============================================================

/**
 * File → base64 문자열 변환
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // data:application/pdf;base64,XXXX → XXXX 부분만 추출
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Gemini 응답에서 JSON 추출 (코드블록 제거 등)
 */
const parseJsonFromResponse = (content: string): unknown => {
  // 마크다운 코드블록 제거
  let cleaned = content.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  return JSON.parse(cleaned);
};

/**
 * 공백/하이픈 제거 정규화 (dataTransformer.ts와 동일)
 */
const normalizeName = (name: string): string => name.replace(/[\s\-]/g, '');

/**
 * 유효한 신뢰도 경고 항목
 * reliability 배열에는 이 3가지만 허용 (주의/부적절 판정 시)
 */
const VALID_RELIABILITY_WARNINGS = ['사회적바람직성', '반응일관성', '연속동일반응'];

/**
 * Gemini가 추출한 reliability 배열 정제
 *
 * Gemini가 "양호"인 항목까지 포함하거나, "사회적바람직성: 양호" 같은
 * 형태로 넣는 경우를 처리. "양호/정상" 키워드가 포함된 항목은 제거.
 */
const sanitizeReliability = (reliability: unknown): string[] => {
  if (!Array.isArray(reliability)) return [];

  return reliability
    .filter((item): item is string => typeof item === 'string')
    .filter(item => {
      // "양호", "정상" 등이 포함되면 경고가 아님
      if (/양호|정상|통과|적절/.test(item)) return false;
      // 유효한 경고 항목명이 포함되어 있는지 확인
      return VALID_RELIABILITY_WARNINGS.some(w => item.includes(w));
    })
    .map(item => {
      // "사회적바람직성: 주의" → "사회적바람직성"으로 정규화
      const matched = VALID_RELIABILITY_WARNINGS.find(w => item.includes(w));
      return matched ?? item;
    });
};

/**
 * 추출된 전체 데이터에서 reliability 배열을 정제
 */
const sanitizeExtractedData = (data: Record<string, unknown>): void => {
  const classes = data.classes as Record<string, { students?: Array<{ test1?: { reliability?: unknown }; test2?: { reliability?: unknown } }> }> | undefined;
  if (!classes) return;

  for (const classData of Object.values(classes)) {
    if (!classData.students) continue;
    for (const student of classData.students) {
      if (student.test1) {
        student.test1.reliability = sanitizeReliability(student.test1.reliability);
      }
      if (student.test2) {
        student.test2.reliability = sanitizeReliability(student.test2.reliability);
      }
    }
  }
};

// ============================================================
// 유효성 검증
// ============================================================

const validateExtractedData = (data: unknown): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, studentCount: 0, classCount: 0, errors: [{ type: 'parse_error', message: '유효한 JSON이 아닙니다' }], warnings };
  }

  const raw = data as Record<string, unknown>;

  // examInfo 검증
  if (!raw.examInfo || typeof raw.examInfo !== 'object') {
    errors.push({ type: 'no_data', message: 'examInfo가 없습니다' });
  }

  // classes 검증
  if (!raw.classes || typeof raw.classes !== 'object') {
    errors.push({ type: 'no_data', message: 'classes가 없습니다' });
    return { isValid: false, studentCount: 0, classCount: 0, errors, warnings };
  }

  const classes = raw.classes as Record<string, { students?: Array<{ id?: string; name?: string; test1?: { tScores?: Record<string, number> }; test2?: { tScores?: Record<string, number> } }> }>;
  let totalStudents = 0;
  const classCount = Object.keys(classes).length;
  const normalizedFactors = FACTORS.map(f => normalizeName(f));

  for (const [className, classData] of Object.entries(classes)) {
    if (!classData.students || !Array.isArray(classData.students)) {
      errors.push({ type: 'no_data', message: `${className}: students 배열이 없습니다` });
      continue;
    }

    for (const student of classData.students) {
      totalStudents++;

      if (!student.name) {
        errors.push({ type: 'missing_student_name', studentId: student.id, message: `학생 이름이 없습니다 (ID: ${student.id})` });
      }

      // test1 또는 test2에서 tScores 확인
      const tScoresData = student.test1?.tScores || student.test2?.tScores;
      if (!tScoresData) {
        errors.push({ type: 'no_data', studentId: student.id, message: `${student.name || student.id}: T점수 데이터가 없습니다` });
        continue;
      }

      // 38개 요인 확인
      const extractedKeys = Object.keys(tScoresData).map(k => normalizeName(k));
      const matchedCount = normalizedFactors.filter(f => extractedKeys.some(k => k === f)).length;

      if (matchedCount < 30) {
        warnings.push({ type: 'few_factors', message: `${student.name || student.id}: ${matchedCount}/38 요인만 추출됨` });
      }

      // T점수 범위 확인
      for (const [factor, score] of Object.entries(tScoresData)) {
        if (typeof score !== 'number') continue;
        if (score < 10 || score > 90) {
          warnings.push({ type: 'score_out_of_typical_range', message: `${student.name || student.id}: ${factor} T=${score} (범위 이탈)` });
        }
      }
    }
  }

  const isValid = errors.length === 0 && totalStudents > 0;

  return { isValid, studentCount: totalStudents, classCount, errors, warnings };
};

// ============================================================
// 메인 추출 함수
// ============================================================

/**
 * PDF 파일에서 META 검사 데이터 추출
 *
 * @param file - PDF 파일 (File 객체)
 * @returns 추출 결과 (rawData + validation)
 */
export const extractFromPdf = async (file: File): Promise<ExtractionResult> => {
  try {
    // 1. 파일 크기 검증 (20MB)
    if (file.size > 20 * 1024 * 1024) {
      return { success: false, error: '파일 크기가 20MB를 초과합니다.' };
    }

    // 2. PDF 여부 확인
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return { success: false, error: 'PDF 파일만 업로드할 수 있습니다.' };
    }

    // 3. base64 변환
    const base64Data = await fileToBase64(file);

    // 4. Gemini multimodal 호출
    const response = await callGeminiMultimodal(
      EXTRACTION_PROMPT,
      { data: base64Data, mimeType: 'application/pdf' },
    );

    if (!response.success) {
      return { success: false, error: response.error || 'AI 응답 생성 실패' };
    }

    // 5. JSON 파싱
    let parsed: unknown;
    try {
      parsed = parseJsonFromResponse(response.content);
    } catch {
      return { success: false, error: 'AI 응답을 JSON으로 파싱할 수 없습니다. 다시 시도해주세요.' };
    }

    // 5.5. reliability 배열 정제 (양호 항목 제거)
    if (parsed && typeof parsed === 'object') {
      sanitizeExtractedData(parsed as Record<string, unknown>);
    }

    // 6. 유효성 검증
    const validation = validateExtractedData(parsed);

    return {
      success: true,
      rawData: parsed as RawData,
      validation,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, error: `PDF 처리 중 오류: ${message}` };
  }
};
