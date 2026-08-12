/**
 * 학습전략검사 상수 정의
 */

import type { LevelType, DomainKey, SubscaleKey } from '../types';

/** 대분류 정보 */
export const DOMAIN_INFO: Record<DomainKey, {
  label: string;
  color: string;
  lightColor: string;
  /** 카드 고정 문구 (대분류 성격) */
  characterDescription: string;
  /** 소속 소분류 키 */
  subscales: SubscaleKey[];
}> = {
  motivation: {
    label: '동기전략',
    color: '#9F91F8',
    lightColor: 'rgba(159, 145, 248, 0.15)',
    characterDescription: '학습하는 이유와 목적을 발견하여,\n학습 지속성을 갖게 하는 마음가짐 전략',
    subscales: ['learningDrive', 'emotionRegulation'],
  },
  cognitive: {
    label: '인지전략',
    color: '#4AC1FF',
    lightColor: 'rgba(74, 193, 255, 0.15)',
    characterDescription: '학습 내용을 효과적으로 파악하고,\n체계적으로 습득하도록 돕는 전략',
    subscales: ['metacognition', 'cognitiveSkill'],
  },
  behavioral: {
    label: '행동전략',
    color: '#FF8993',
    lightColor: 'rgba(255, 137, 147, 0.15)',
    characterDescription: '학습 활동을 최적화될 수 있게 하는\n학습기술 및 실행력 향상 전략',
    subscales: ['behaviorRegulation', 'behavioralSkill'],
  },
};

/** 소분류 정보 */
export const SUBSCALE_INFO: Record<SubscaleKey, {
  label: string;
  /** 소속 대분류 */
  domain: DomainKey;
  /** 레이더 차트 각도 (0° = 3시 방향, 반시계 방향) */
  angle: number;
  /** 소소분류 (툴팁/확장용, 화면 미표시) */
  subFactors: string[];
}> = {
  behaviorRegulation: {
    label: '행동조절',
    domain: 'behavioral',
    angle: 0,
    subFactors: ['자기칭찬', '도움구하기', '학습지속성'],
  },
  behavioralSkill: {
    label: '행동적\n학습기술',
    domain: 'behavioral',
    angle: 60,
    subFactors: ['공부환경', '시간관리', '수업태도', '노트하기', '시험준비'],
  },
  learningDrive: {
    label: '학습원동력',
    domain: 'motivation',
    angle: 120,
    subFactors: ['성장마인드셋', '학업효능감', '학습동기'],
  },
  emotionRegulation: {
    label: '정서조절',
    domain: 'motivation',
    angle: 180,
    subFactors: ['성적부담조절', '공부부담조절', '실패부담조절'],
  },
  metacognition: {
    label: '메타인지',
    domain: 'cognitive',
    angle: 240,
    subFactors: ['계획능력', '점검능력', '조절능력'],
  },
  cognitiveSkill: {
    label: '인지적\n학습기술',
    domain: 'cognitive',
    angle: 300,
    subFactors: ['이해기술', '기억기술', '집중기술'],
  },
};

/** 등급별 색상 */
export const LEVEL_COLORS: Record<LevelType, string> = {
  '매우 낮음': '#FF5722',
  '낮음': '#FF9800',
  '보통': '#26C6A0',
  '높음': '#2196F3',
  '매우 높음': '#1565C0',
};

/** 외곽 링 대분류 배치 (경계각) */
export const RING_SEGMENTS: {
  domain: DomainKey;
  startAngle: number;
  endAngle: number;
}[] = [
  { domain: 'behavioral', startAngle: 330, endAngle: 90 },   // 330° ~ 90° (120°)
  { domain: 'motivation', startAngle: 90, endAngle: 210 },   // 90° ~ 210° (120°)
  { domain: 'cognitive', startAngle: 210, endAngle: 330 },   // 210° ~ 330° (120°)
];

/** 레이더 차트 설정 */
export const RADAR_CONFIG = {
  /** 눈금 최대값 */
  maxValue: 80,
  /** 눈금 단위 */
  tickUnit: 20,
  /** 눈금 배열 */
  ticks: [0, 20, 40, 60, 80],
  /** 데이터 폴리곤 스트로크 색상 */
  polygonStroke: '#F5A623',
  /** 데이터 폴리곤 채움 색상 */
  polygonFill: 'rgba(245, 166, 35, 0.25)',
};
