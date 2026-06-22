import {
  CASE_NAMES,
  type CaseResult,
  type ClueCard,
  EXTRA_CLUE_CARDS,
  MISSIONS,
  QUESTIONS,
  type QuizAnswers,
  RISK_LABELS,
  SITUATION_COMMENTS,
  type SpendSituation,
  type SuspiciousSpend,
} from './content';

export { QUESTIONS };
export type { CaseResult, ClueCard, QuizAnswers };

const RISK_TIME_BY_SPEND: Record<SuspiciousSpend, string> = {
  convenience_store: '퇴근길이나 이동 중의 짧은 시간이 편의점 소비 단서로 남기 쉬워요.',
  cafe: '점심 후나 오후의 작은 휴식 시간이 카페 소비 단서로 남기 쉬워요.',
  delivery_night: '밤 시간대의 피로와 허기가 배달/야식 소비 단서로 남기 쉬워요.',
  shopping: '저녁에 쉬면서 보는 장바구니 시간이 쇼핑 소비 단서로 남기 쉬워요.',
  transport: '출발 전 급하게 이동 수단을 고르는 순간이 교통비 단서로 남기 쉬워요.',
};

const RISK_TIME_BY_SITUATION: Partial<Record<SpendSituation, string>> = {
  stress: '특히 스트레스가 큰 날에는 이 시간대의 결제가 더 쉽게 늘어날 수 있어요.',
  impulse: '갑자기 끌리는 순간에는 결제 전 10초 멈춤이 가장 강한 단서예요.',
  habit: '습관처럼 반복되는 시간이라면 알림이나 동선을 살짝 바꿔보세요.',
};

export function buildCaseResult(answers: QuizAnswers): CaseResult {
  const mission = MISSIONS[answers.savingTarget][answers.suspiciousSpend];

  return {
    caseName: CASE_NAMES[answers.suspiciousSpend],
    detectiveComment: `${SITUATION_COMMENTS[answers.situation]} 내일의 단서는 "${mission}"입니다.`,
    riskLabel: RISK_LABELS[answers.situation],
    mission,
    suspiciousSpend: answers.suspiciousSpend,
    situation: answers.situation,
  };
}

export function getInitialClueCard(result: CaseResult): ClueCard {
  return {
    kind: 'analysis',
    title: '오늘의 범인',
    body: `오늘의 범인은 ${result.caseName}이에요. ${result.riskLabel} 단서가 보여요.`,
  };
}

function getRiskTimeClueCard(result: CaseResult): ClueCard {
  const situationHint = RISK_TIME_BY_SITUATION[result.situation];

  return {
    kind: 'analysis',
    title: '위험 시간대',
    body: situationHint ? `${RISK_TIME_BY_SPEND[result.suspiciousSpend]} ${situationHint}` : RISK_TIME_BY_SPEND[result.suspiciousSpend],
  };
}

export function getNextClueCard(index: number, result?: CaseResult): ClueCard {
  const safeIndex = Number.isFinite(index) ? Math.floor(index) : 0;
  const normalizedIndex = ((safeIndex % EXTRA_CLUE_CARDS.length) + EXTRA_CLUE_CARDS.length) % EXTRA_CLUE_CARDS.length;

  if (normalizedIndex === 0 && result != null) {
    return getRiskTimeClueCard(result);
  }

  const card = EXTRA_CLUE_CARDS[normalizedIndex];
  if (!card) {
    throw new Error('No clue cards configured');
  }
  return card;
}
