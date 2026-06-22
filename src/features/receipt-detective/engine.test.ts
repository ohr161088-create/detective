import { describe, expect, it } from 'vitest';
import { buildCaseResult, getInitialClueCard, getNextClueCard, QUESTIONS, type QuizAnswers } from './engine';

describe('receipt detective engine', () => {
  it('defines the three approved quiz questions', () => {
    expect(QUESTIONS).toHaveLength(3);
    expect(QUESTIONS[0].label).toBe('오늘 가장 의심스러운 소비는?');
    expect(QUESTIONS[1].label).toBe('그 소비는 어떤 상황에서 발생했나요?');
    expect(QUESTIONS[2].label).toBe('내일 줄일 수 있다면 어느 정도?');
  });

  it('builds a deterministic convenience store case', () => {
    const result = buildCaseResult({
      suspiciousSpend: 'convenience_store',
      situation: 'impulse',
      savingTarget: '3000',
    });

    expect(result.caseName).toBe('편의점 잠입 사건');
    expect(result.detectiveComment).toContain('갑작스러운 소비 단서');
    expect(result.mission).toBe('내일 편의점 앞에서 10초만 멈춰보기');
  });

  it('returns a free initial clue and cycles extra clue cards', () => {
    const result = buildCaseResult({
      suspiciousSpend: 'cafe',
      situation: 'stress',
      savingTarget: '1000',
    });

    expect(getInitialClueCard(result).kind).toBe('analysis');
    expect(getNextClueCard(0, result).title).toBe('위험 시간대');
    expect(getNextClueCard(31, result).title).toBe('위험 시간대');
  });

  it('changes the risky time clue by spending situation', () => {
    const cafeResult = buildCaseResult({
      suspiciousSpend: 'cafe',
      situation: 'habit',
      savingTarget: '1000',
    });
    const transportResult = buildCaseResult({
      suspiciousSpend: 'transport',
      situation: 'planned',
      savingTarget: '3000',
    });
    const deliveryResult = buildCaseResult({
      suspiciousSpend: 'delivery_night',
      situation: 'stress',
      savingTarget: 'hard',
    });

    expect(getNextClueCard(0, cafeResult).body).toContain('오후');
    expect(getNextClueCard(0, transportResult).body).toContain('출발 전');
    expect(getNextClueCard(0, deliveryResult).body).toContain('밤');
  });

  it('builds nonempty results for every quiz option', () => {
    const answers: QuizAnswers[] = QUESTIONS[0].options.flatMap((spend) =>
      QUESTIONS[1].options.flatMap((situation) =>
        QUESTIONS[2].options.map((target) => ({
          suspiciousSpend: spend.value,
          situation: situation.value,
          savingTarget: target.value,
        })),
      ),
    );

    for (const answer of answers) {
      const result = buildCaseResult(answer);
      expect(result.caseName).not.toHaveLength(0);
      expect(result.riskLabel).not.toHaveLength(0);
      expect(result.mission).not.toHaveLength(0);
    }
  });

  it('normalizes clue card indexes to whole numbers', () => {
    const result = buildCaseResult({
      suspiciousSpend: 'shopping',
      situation: 'impulse',
      savingTarget: '5000_plus',
    });

    expect(getNextClueCard(0.8, result).title).toBe('위험 시간대');
    expect(getNextClueCard(Number.NaN, result).title).toBe('위험 시간대');
    expect(getNextClueCard(Number.POSITIVE_INFINITY, result).title).toBe('위험 시간대');
  });
});
