/**
 * 백엔드 개인화 코칭 API(GET /api/dgnss/st/coaching/{answerIdx}) 응답을
 * 위젯이 쓰는 화면 모델로 매핑한다. observation/interpretation의 "[학생명]"
 * placeholder를 실제 학생 이름으로 치환한다(백엔드는 의도적으로 치환하지 않고 내려보냄).
 */
import type { StudentCoaching } from '@features/coaching/api/coachingService';

export interface IndividualStrengthPraise {
  factor: string;
  observation: string;
  praiseLine: string;
  praiseQuestion: string;
}

export interface IndividualCoachingPathway {
  weakFactor: string;
  focusFactor: string;
  targetFactor: string;
  interpretation: string;
  coaching1Method: string;
  coaching1Line: string;
  coaching2Action: string;
  coaching2Line: string;
}

function substituteStudentName(text: string, studentName: string): string {
  return text.replaceAll('[학생명]', studentName);
}

export function mapStudentCoachingContent(
  data: StudentCoaching,
  studentName: string,
): {
  strengthPraises: IndividualStrengthPraise[];
  coachingPathway: IndividualCoachingPathway | null;
} {
  const strengthPraises: IndividualStrengthPraise[] = data.strengthCards.map((card) => ({
    factor: card.factor,
    observation: substituteStudentName(card.observation, studentName),
    praiseLine: card.line,
    praiseQuestion: card.question,
  }));

  const coachingPathway: IndividualCoachingPathway | null = data.coachingCard
    ? {
        weakFactor: data.coachingCard.zFactor,
        focusFactor: data.coachingCard.xFactor,
        targetFactor: data.coachingCard.yFactor,
        interpretation: substituteStudentName(data.coachingCard.interpretation, studentName),
        coaching1Method: data.coachingCard.coaching1.method,
        coaching1Line: data.coachingCard.coaching1.line,
        coaching2Action: data.coachingCard.coaching2.action,
        coaching2Line: data.coachingCard.coaching2.line,
      }
    : null;

  return { strengthPraises, coachingPathway };
}
