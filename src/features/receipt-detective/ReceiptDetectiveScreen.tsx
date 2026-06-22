import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createAppsInTossRewardedAdAdapter } from './adAdapter';
import { buildCaseResult, getInitialClueCard, getNextClueCard, QUESTIONS, type QuizAnswers } from './engine';
import { createAppsInTossPromotionAdapter } from './promotionAdapter';
import { runRewardedPointFlow } from './rewardFlow';
import { createRewardAttemptStore } from './rewardAttempts';

type PartialAnswers = Partial<QuizAnswers>;

const attempts = createRewardAttemptStore();
const ads = createAppsInTossRewardedAdAdapter();
const promotion = createAppsInTossPromotionAdapter();

export function ReceiptDetectiveScreen() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<PartialAnswers>({});
  const [revealedClueCount, setRevealedClueCount] = useState(0);
  const [rewardMessage, setRewardMessage] = useState('');
  const [isRewardLoading, setIsRewardLoading] = useState(false);

  const isComplete = questionIndex >= QUESTIONS.length;
  const result = useMemo(() => {
    if (!isComplete) {
      return null;
    }
    return buildCaseResult(answers as QuizAnswers);
  }, [answers, isComplete]);

  const initialClue = result ? getInitialClueCard(result) : null;
  const extraClues = Array.from({ length: revealedClueCount }, (_, index) => getNextClueCard(index));

  function selectAnswer(value: string) {
    const question = QUESTIONS[questionIndex];
    if (!question) {
      return;
    }

    setAnswers((current) => ({ ...current, [question.id]: value }));
    setQuestionIndex((current) => current + 1);
  }

  async function handleRewardPress() {
    setIsRewardLoading(true);
    setRewardMessage('');

    try {
      const attempt = await runRewardedPointFlow({ attempts, ads, promotion });
      if (attempt.status === 'grant_completed') {
        setRevealedClueCount((current) => current + 1);
        setRewardMessage('토스 포인트 1원 지급 완료');
      } else {
        setRewardMessage('지금은 보상을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.');
      }
    } catch {
      setRewardMessage('광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsRewardLoading(false);
    }
  }

  function resetCase() {
    setQuestionIndex(0);
    setAnswers({});
    setRevealedClueCount(0);
    setRewardMessage('');
  }

  if (!isComplete) {
    const question = QUESTIONS[questionIndex];
    if (!question) {
      return null;
    }

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>영수증 탐정</Text>
        <Text style={styles.title}>오늘의 소비 사건을 조사해볼까요?</Text>
        <Text style={styles.progress}>{questionIndex + 1}/3</Text>
        <Text style={styles.question}>{question.label}</Text>
        <View style={styles.optionList}>
          {question.options.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              style={styles.optionButton}
              onPress={() => selectAnswer(option.value)}
            >
              <Text style={styles.optionText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (!result || !initialClue) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>사건 해결</Text>
      <Text style={styles.title}>{result.caseName}</Text>
      <Text style={styles.comment}>{result.detectiveComment}</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>소비 분석 카드</Text>
        <Text style={styles.cardTitle}>{initialClue.title}</Text>
        <Text style={styles.cardBody}>{initialClue.body}</Text>
      </View>

      {extraClues.map((extraClue, index) => (
        <View key={`${extraClue.title}-${index}`} style={styles.card}>
          <Text style={styles.cardLabel}>{extraClue.kind === 'analysis' ? '추가 소비 분석' : '추가 절약 미션'}</Text>
          <Text style={styles.cardTitle}>
            {index + 1}. {extraClue.title}
          </Text>
          <Text style={styles.cardBody}>{extraClue.body}</Text>
        </View>
      ))}

      <View style={styles.missionBox}>
        <Text style={styles.missionLabel}>내일의 미션</Text>
        <Text style={styles.missionText}>{result.mission}</Text>
      </View>

      {rewardMessage ? <Text style={styles.rewardMessage}>{rewardMessage}</Text> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isRewardLoading }}
        style={[styles.primaryButton, isRewardLoading ? styles.disabledButton : null]}
        onPress={handleRewardPress}
        disabled={isRewardLoading}
      >
        <Text style={styles.primaryButtonText}>
          {isRewardLoading
            ? '광고 확인 중...'
            : revealedClueCount > 0
              ? '광고 보고 토스 포인트 1원과 단서 받기'
              : '광고 보고 토스 포인트 1원 받기'}
        </Text>
      </Pressable>

      <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={resetCase}>
        <Text style={styles.secondaryButtonText}>새 사건 조사하기</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#F7F9FC',
    justifyContent: 'center',
  },
  eyebrow: {
    color: '#3182F6',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  title: {
    color: '#191F28',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: 16,
  },
  progress: {
    color: '#6B7684',
    fontSize: 14,
    marginBottom: 12,
  },
  question: {
    color: '#333D4B',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  optionList: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  optionText: {
    color: '#191F28',
    fontSize: 17,
    fontWeight: '600',
  },
  comment: {
    color: '#4E5968',
    fontSize: 17,
    lineHeight: 25,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    marginBottom: 12,
  },
  cardLabel: {
    color: '#3182F6',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#191F28',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardBody: {
    color: '#4E5968',
    fontSize: 16,
    lineHeight: 24,
  },
  missionBox: {
    backgroundColor: '#EAF3FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  missionLabel: {
    color: '#3182F6',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  missionText: {
    color: '#191F28',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
  },
  rewardMessage: {
    color: '#191F28',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#3182F6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  disabledButton: {
    backgroundColor: '#B0C9F8',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6B7684',
    fontSize: 15,
    fontWeight: '700',
  },
});
