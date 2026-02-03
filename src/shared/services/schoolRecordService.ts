/**
 * 생활기록부 AI 문구 생성 서비스
 */

import { callAI } from './ai';
import type {
  SchoolRecordRequest,
  SchoolRecordResponse,
  SavedSchoolRecord,
  SchoolRecordCategory,
} from '@/shared/types';
import { SCHOOL_RECORD_CATEGORY_LABELS } from '@/shared/types';
import { mockSchoolRecordService } from '@/shared/data/mockStudentRecords';

// API 베이스 URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const USE_API = import.meta.env.VITE_USE_API === 'true';

// ============================================================
// 카테고리별 프롬프트 템플릿
// ============================================================

const CATEGORY_PROMPTS: Record<SchoolRecordCategory, string> = {
  comprehensive: `학생의 전반적인 학습심리정서 상태를 바탕으로 생활기록부에 기재할 종합 의견을 작성해주세요.
학생의 강점을 부각하면서도 성장 가능성을 언급해주세요.`,

  learning: `학생의 학습 태도와 관련된 검사 결과를 바탕으로 생활기록부 문구를 작성해주세요.
메타인지, 학습기술, 학업열의 영역을 중심으로 서술해주세요.`,

  personality: `학생의 성격 특성과 관련된 검사 결과를 바탕으로 생활기록부 문구를 작성해주세요.
긍정적자아, 자아효능감 영역을 중심으로 서술해주세요.`,

  socialSkills: `학생의 대인관계 능력과 관련된 검사 결과를 바탕으로 생활기록부 문구를 작성해주세요.
대인관계능력, 지지적관계 영역을 중심으로 서술해주세요.`,

  selfManagement: `학생의 자기관리 능력과 관련된 검사 결과를 바탕으로 생활기록부 문구를 작성해주세요.
학업스트레스, 학업소진 대응 능력을 중심으로 서술해주세요.`,
};

// 카테고리별 목업 응답
const MOCK_RESPONSES: Record<SchoolRecordCategory, string> = {
  comprehensive: '학습에 대한 열의가 있으며, 자기 점검 능력이 발전하고 있는 학생임. 또래 관계에서 적극적으로 소통하며, 모둠 활동에서 협력하는 자세를 보임. 학업 스트레스 관리에 관심을 기울이면 더욱 성장할 것으로 기대됨.',

  learning: '수업 시간에 집중력을 유지하며, 학습 목표를 설정하고 달성하기 위해 노력하는 모습을 보임. 자기 점검 습관이 형성되어 가고 있으며, 메타인지 능력 향상을 위한 꾸준한 노력이 돋보임.',

  personality: '긍정적인 자아상을 가지고 있으며, 새로운 도전에 대해 자신감 있게 임하는 태도를 보임. 실패를 두려워하지 않고 성장의 기회로 삼으려는 마음가짐이 인상적임.',

  socialSkills: '친구들과 원만하게 소통하며, 모둠 활동에서 협력적인 자세를 보임. 타인의 의견을 경청하고 자신의 생각을 적절하게 표현하는 능력이 있음.',

  selfManagement: '학업 과제를 계획적으로 수행하려는 노력이 보이며, 시간 관리 능력이 향상되고 있음. 스트레스 상황에서 적절한 대처 방법을 찾으려는 모습이 관찰됨.',
};

export const schoolRecordService = {
  /**
   * AI로 생기부 문구 생성
   */
  generate: async (request: SchoolRecordRequest): Promise<SchoolRecordResponse> => {
    const systemPrompt = `당신은 학생 생활기록부 작성을 돕는 교육 전문가입니다.

규칙:
1. 3~4문장으로 작성 (150~200자)
2. 긍정적이고 발전적인 표현 사용
3. 구체적인 특성을 언급
4. "~하는 모습을 보임", "~에 대한 관심이 높음" 등 생기부 양식에 맞는 표현 사용
5. 학생 이름은 언급하지 않음
6. 평가적 표현보다 관찰 기반 서술 사용`;

    const categoryPrompt = CATEGORY_PROMPTS[request.category];
    const typeInfo = `학생의 LPA 유형: ${request.predictedType}`;
    const customNote = request.customPrompt
      ? `\n\n추가 요청사항: ${request.customPrompt}`
      : '';

    const userPrompt = `${categoryPrompt}

${typeInfo}

카테고리: ${SCHOOL_RECORD_CATEGORY_LABELS[request.category]}
${customNote}

생활기록부에 바로 기재할 수 있는 문구를 작성해주세요.`;

    const response = await callAI({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      maxTokens: 500,
      temperature: 0.7,
    });

    // AI 응답이 성공하면 그 내용 사용, 아니면 목업
    const content = response.success
      ? response.content
      : MOCK_RESPONSES[request.category];

    return {
      category: request.category,
      content,
      generatedAt: new Date(),
    };
  },

  /**
   * 저장된 문구 조회
   */
  getSavedByStudentId: async (studentId: string): Promise<SavedSchoolRecord[]> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/school-records/student/${studentId}`);
      if (!response.ok) throw new Error('Failed to fetch saved records');
      return response.json();
    }
    return mockSchoolRecordService.getSavedByStudentId(studentId);
  },

  /**
   * 생성된 문구 저장
   */
  save: async (input: Omit<SavedSchoolRecord, 'id' | 'createdAt'>): Promise<SavedSchoolRecord> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/school-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to save school record');
      return response.json();
    }
    return mockSchoolRecordService.save(input);
  },

  /**
   * 저장된 문구 삭제
   */
  delete: async (id: string): Promise<void> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/school-records/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete school record');
      return;
    }
    return mockSchoolRecordService.delete(id);
  },
};
