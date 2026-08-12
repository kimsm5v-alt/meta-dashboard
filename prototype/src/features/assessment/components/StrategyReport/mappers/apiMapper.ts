/**
 * API 응답 → ReportData 변환 매퍼
 *
 * 백엔드 응답 필드명이 확정 전이니 여기만 고치면 됨
 * 스펙 나오면 ApiResponse 타입과 매핑 로직만 수정
 */

import type { ReportData, Score, DomainResult } from '../types';

/**
 * 백엔드 API 응답 타입 (임시 - 스펙 확정 후 수정)
 */
interface ApiResponse {
  // 대분류
  motivation?: {
    tScore?: number;
    percentile?: number;
    description?: string;
  };
  cognitive?: {
    tScore?: number;
    percentile?: number;
    description?: string;
  };
  behavioral?: {
    tScore?: number;
    percentile?: number;
    description?: string;
  };

  // 소분류
  subscales?: {
    learningDrive?: { tScore?: number; percentile?: number };
    emotionRegulation?: { tScore?: number; percentile?: number };
    metacognition?: { tScore?: number; percentile?: number };
    cognitiveSkill?: { tScore?: number; percentile?: number };
    behaviorRegulation?: { tScore?: number; percentile?: number };
    behavioralSkill?: { tScore?: number; percentile?: number };
  };
}

/** 기본 점수 (데이터 없을 때) */
const DEFAULT_SCORE: Score = { t: 50, percentile: 50 };

/** 기본 대분류 결과 */
const DEFAULT_DOMAIN_RESULT: DomainResult = {
  ...DEFAULT_SCORE,
  description: '',
};

/**
 * API 응답 → Score 변환
 */
const mapScore = (data?: { tScore?: number; percentile?: number }): Score => {
  if (!data) return DEFAULT_SCORE;
  return {
    t: data.tScore ?? 50,
    percentile: data.percentile ?? 50,
  };
};

/**
 * API 응답 → DomainResult 변환
 */
const mapDomainResult = (
  data?: { tScore?: number; percentile?: number; description?: string }
): DomainResult => {
  if (!data) return DEFAULT_DOMAIN_RESULT;
  return {
    t: data.tScore ?? 50,
    percentile: data.percentile ?? 50,
    description: data.description ?? '',
  };
};

/**
 * API 응답 → ReportData 변환
 *
 * @param response 백엔드 API 응답
 * @returns 프론트엔드용 ReportData
 */
export const mapApiResponseToReportData = (response: ApiResponse): ReportData => {
  return {
    domains: {
      motivation: mapDomainResult(response.motivation),
      cognitive: mapDomainResult(response.cognitive),
      behavioral: mapDomainResult(response.behavioral),
    },
    subscales: {
      learningDrive: mapScore(response.subscales?.learningDrive),
      emotionRegulation: mapScore(response.subscales?.emotionRegulation),
      metacognition: mapScore(response.subscales?.metacognition),
      cognitiveSkill: mapScore(response.subscales?.cognitiveSkill),
      behaviorRegulation: mapScore(response.subscales?.behaviorRegulation),
      behavioralSkill: mapScore(response.subscales?.behavioralSkill),
    },
  };
};

export default mapApiResponseToReportData;
