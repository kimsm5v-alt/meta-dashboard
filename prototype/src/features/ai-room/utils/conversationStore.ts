import { useSyncExternalStore } from 'react';
import type { Conversation } from '../types';

/**
 * 대화 히스토리 공유 스토어
 * - 어시스턴트 페이지(AIRoomPage)와 플로팅 챗봇(FloatingChatbot)이 하나의 히스토리를 공유
 * - 플로팅 챗봇 대화는 `screen`(질의응답한 화면)을 태그로 저장
 */

// 목업: META 검사 측정 영역 안내 답변
const META_DOMAIN_ANSWER = `META 학습종합검사는 **5개 대분류 영역**을 측정합니다.

**① 자아강점** (정적요인): 자신의 가치와 능력에 대한 긍정적 인식과 대인관계능력을 파악합니다. 하위 척도로 긍정적 자아(자아존중감, 자기효능감, 성장마인드셋)와 대인관계능력(자기정서인식, 자기정서조절, 타인정서인식, 타인공감능력)이 있습니다.

**② 학습 디딤돌** (정적요인): 학습에 도움이 되는 메타인지(계획·점검·조절능력), 학습기술(공부환경, 시간관리, 수업태도, 노트하기, 시험준비), 지지적 관계(부모의사소통, 부모학업지지, 친구정서지지, 교사정서지지)를 확인합니다.

**③ 학습 걸림돌** (부적요인): 학업스트레스(성적부담, 공부부담, 수업부담), 학습방해물(스마트폰의존, 게임과몰입), 학업관계스트레스(부모성적압력, 부모공부부담, 친구공부비교, 교사성적압력, 교사수업부담)를 파악합니다.

**④ 긍정적 공부마음** (정적요인): 학업열의(활기, 몰두, 의미감)와 성장력(자율성, 유능성, 관계성)을 측정합니다.

**⑤ 부정적 공부마음** (부적요인): 학업소진(고갈, 무능감, 반감·냉소)을 측정합니다.

전체적으로 **5개 대분류, 11개 중분류, 38개 하위 변인**으로 구성되어 있으며, 정적요인(높을수록 긍정적)과 부적요인(높을수록 부정적)으로 구분됩니다. 이 검사는 Demerouti 등(2001)의 JD-R 모형을 학업 맥락에 적용하여 설계되었으며, 한국심리학회 공인 인증(KPA 2201)을 받은 도구입니다.`;

// 목업: 학업열의 vs 학업소진 (플로팅 챗봇 - 결과보기 화면에서 질문)
const ENGAGEMENT_BURNOUT_ANSWER = `학업열의(긍정적 공부마음)와 학업소진(부정적 공부마음)은 **JD-R 모형**에서 학업 성취도에 직접 영향을 미치는 양대 경로입니다. 학습 자원이 충분하면 학업 열의가 높아져 성취로 이어지고, 학업 요구가 과도하면 학업 소진으로 이어집니다.

두 영역을 함께 보면 학생의 '공부마음' 상태를 **입체적으로 파악**할 수 있습니다. 요약 리포트에서도 '공부마음' 단계에서 '열의 vs 소진'을 비교하도록 안내하고 있습니다.

예를 들어, 학업열의와 학업소진이 **모두 높은 경우**라면 공부를 열심히 하고 있지만 동시에 지쳐가는 상태일 수 있어 주의 깊게 살펴볼 필요가 있습니다.`;

// 목업: 지지적 관계 하위 척도 (결과보기 화면)
const SUPPORT_RELATION_ANSWER = `지지적 관계는 **학습 디딤돌**(정적요인)의 중분류로, **4개 하위 변인**으로 구성됩니다.

- **부모 의사소통**: 부모님께 자신의 생활과 생각에 대해 편안하게 대화하는 정도
- **부모 학업지지**: 부모님이 공부와 관련하여 자신의 의견과 노력을 지지한다고 생각하는 정도
- **친구 정서지지**: 친구들이 자신의 의견과 고민을 잘 이해하고 들어준다고 생각하는 정도
- **교사 정서지지**: 교사가 자신의 의견과 고민을 잘 이해하며 격려한다고 생각하는 정도

정적요인이므로 점수가 높을수록 주변의 지지를 풍부하게 느끼고 있다는 의미입니다.`;

// 목업: 반 전체 부정 요인이 높을 때 (학급 코칭 화면)
const CLASS_NEGATIVE_ANSWER = `반 평균에서 부적요인(학습 걸림돌·부정적 공부마음) T점수가 높게 나왔다면, 학급 전체적으로 해당 영역의 어려움이 공통적으로 존재할 수 있습니다.

예를 들어, 학업스트레스가 전반적으로 높다면 시험 전 스트레스 관리 활동, 학습량 조절 등의 집단 지도 전략을 고려할 수 있습니다. 학업소진이 높다면 심리적 지원 및 휴식 제공이 우선입니다.

다만 반 평균만으로 개별 학생을 판단하지 않도록 주의하시고, 개별 학생 중 특히 **T≥65인 위험 신호**에 해당하는 학생이 있는지 확인하시는 것이 좋습니다.`;

let conversations: Conversation[] = [
  {
    id: 'c1',
    title: 'META 학습종합검사 측정 영역',
    group: '오늘',
    messages: [
      { id: 'seed-u1', role: 'user', content: 'META 학습종합검사는 어떤 영역을 측정하나요?' },
      { id: 'seed-b1', role: 'bot', content: META_DOMAIN_ANSWER, isReference: true },
    ],
  },
  {
    id: 'c-eb',
    title: '학업열의와 학업소진을 함께 보는 이유',
    group: '오늘',
    screen: '결과보기',
    messages: [
      { id: 'seed-u2', role: 'user', content: '학업열의와 학업소진을 함께 보는 이유?' },
      { id: 'seed-b2', role: 'bot', content: ENGAGEMENT_BURNOUT_ANSWER, isReference: true },
    ],
  },
  {
    id: 'c-support',
    title: '지지적 관계 하위 척도',
    group: '지난 7일',
    screen: '결과보기',
    messages: [
      { id: 'seed-u3', role: 'user', content: '지지적 관계 하위 척도?' },
      { id: 'seed-b3', role: 'bot', content: SUPPORT_RELATION_ANSWER, isReference: true },
    ],
  },
  {
    id: 'c-classneg',
    title: '반 전체 부정 요인 높을 때',
    group: '이전',
    screen: '학급 코칭',
    messages: [
      { id: 'seed-u4', role: 'user', content: '반 전체 부정 요인 높을 때?' },
      { id: 'seed-b4', role: 'bot', content: CLASS_NEGATIVE_ANSWER, isReference: true },
    ],
  },
];

const listeners = new Set<() => void>();

export const conversationStore = {
  get: (): Conversation[] => conversations,
  subscribe(l: () => void): () => void {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  /** setState 스타일 업데이트 (배열 또는 updater 함수) */
  update(updater: Conversation[] | ((prev: Conversation[]) => Conversation[])): void {
    conversations = typeof updater === 'function' ? updater(conversations) : updater;
    listeners.forEach((l) => l());
  },
};

/** 컴포넌트에서 대화 목록 구독 */
export function useConversations(): Conversation[] {
  return useSyncExternalStore(conversationStore.subscribe, conversationStore.get, conversationStore.get);
}
