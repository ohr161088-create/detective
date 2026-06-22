import { useEffect, useMemo, useRef, useState } from 'react';
import detectiveLogoUrl from '../../../assets/receipt-detective-logo-toss-600.png';
import {
  addAdRewardCoin,
  addDailyMissionAdReward,
  addCheckInAdReward,
  canExchangeToTossPoint,
  COINS_PER_TOSS_POINT_EXCHANGE,
  createInitialCoinWallet,
  DAILY_AD_REWARD_LIMIT,
  DAILY_MISSION_AD_REWARD_COINS,
  exchangeCoinsForTossPoint,
  getExchangeProgressPercent,
  normalizeCoinWallet,
  STREAK_BONUS_COINS,
  STREAK_REQUIRED_DAYS,
  CHECK_IN_AD_REWARD_COINS,
  TOSS_POINT_EXCHANGE_UNITS,
  type CoinWallet,
} from './coinEconomy';
import { buildCaseResult, getInitialClueCard, getNextClueCard, QUESTIONS, type QuizAnswers } from './engine';
import {
  BANNER_AD_GROUP_ID,
  createAppsInTossWebRewardedAdAdapter,
  getErrorMessage,
  loadTossAdsBridge,
  type RewardAdPlacement,
  type TossAdsAttachBannerResult,
} from './webAds';

type PartialAnswers = Partial<QuizAnswers>;

const WALLET_STORAGE_KEY = 'receipt-detective-coin-wallet';

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadWallet(): CoinWallet {
  if (typeof window === 'undefined') {
    return createInitialCoinWallet(getTodayKey());
  }

  const stored = window.localStorage.getItem(WALLET_STORAGE_KEY);
  if (stored == null) {
    return createInitialCoinWallet(getTodayKey());
  }

  try {
    return normalizeCoinWallet(JSON.parse(stored) as Partial<CoinWallet>, getTodayKey());
  } catch {
    return createInitialCoinWallet(getTodayKey());
  }
}

function saveWallet(wallet: CoinWallet) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
}

function isSupported(isSupported?: () => boolean): boolean {
  return isSupported?.() ?? true;
}

export function ReceiptDetectiveWeb() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<PartialAnswers>({});
  const [revealedClueCount, setRevealedClueCount] = useState(0);
  const [wallet, setWallet] = useState<CoinWallet>(() => loadWallet());
  const [rewardMessage, setRewardMessage] = useState('');
  const [loadingRewardPlacement, setLoadingRewardPlacement] = useState<RewardAdPlacement | null>(null);
  const [bannerAdStatus, setBannerAdStatus] = useState('배너 광고 준비 중');
  const bannerContainerRef = useRef<HTMLDivElement | null>(null);
  const bannerSlotRef = useRef<TossAdsAttachBannerResult | null>(null);

  const todayKey = getTodayKey();
  const isComplete = questionIndex >= QUESTIONS.length;
  const result = useMemo(() => {
    if (!isComplete) {
      return null;
    }
    return buildCaseResult(answers as QuizAnswers);
  }, [answers, isComplete]);

  const initialClue = result ? getInitialClueCard(result) : null;
  const extraClues = result ? Array.from({ length: revealedClueCount }, (_, index) => getNextClueCard(index, result)) : [];
  const exchangeProgress = getExchangeProgressPercent(wallet);
  const remainingRewards = Math.max(0, DAILY_AD_REWARD_LIMIT - (wallet.rewardDate === todayKey ? wallet.todayAdRewards : 0));
  const canExchange = canExchangeToTossPoint(wallet);
  const isCheckInRewardClaimedToday = wallet.checkInRewardDate === todayKey;
  const isMissionRewardClaimedToday = wallet.missionRewardDate === todayKey;
  const streakCount = wallet.adStreakDate === todayKey ? wallet.adStreakCount : 0;

  useEffect(() => {
    let isActive = true;

    function setAdStatus(message: string, payload?: unknown) {
      if (!isActive) {
        return;
      }

      setBannerAdStatus(message);
      console.log('[banner-ad]', message, payload ?? '');
    }

    async function attachBanner() {
      try {
        const TossAds = await loadTossAdsBridge();

        if (!TossAds) {
          setAdStatus('배너 광고 SDK를 찾지 못했어요.');
          return;
        }

        if (!isSupported(TossAds.initialize.isSupported)) {
          setAdStatus('현재 환경에서 배너 초기화를 지원하지 않아요.');
          return;
        }

        if (!isSupported(TossAds.attachBanner.isSupported)) {
          setAdStatus('현재 환경에서 배너 표시를 지원하지 않아요.');
          return;
        }

        setAdStatus('배너 광고 SDK 초기화 요청');
        TossAds.initialize({
          callbacks: {
            onInitialized: () => {
              const container = bannerContainerRef.current;

              if (!container) {
                setAdStatus('배너 광고 영역을 찾지 못했어요.');
                return;
              }

              try {
                setAdStatus('배너 광고 부착 요청');
                bannerSlotRef.current?.destroy();
                bannerSlotRef.current = TossAds.attachBanner(BANNER_AD_GROUP_ID, container, {
                  theme: 'light',
                  tone: 'blackAndWhite',
                  variant: 'expanded',
                  callbacks: {
                    onAdRendered: (payload) => setAdStatus('배너 광고 렌더 완료', payload),
                    onAdImpression: (payload) => setAdStatus('배너 광고 노출', payload),
                    onAdViewable: (payload) => setAdStatus('배너 광고 노출 기록됨', payload),
                    onAdClicked: (payload) => setAdStatus('배너 광고 클릭됨', payload),
                    onNoFill: (payload) => setAdStatus('표시할 배너 광고가 없어요(onNoFill)', payload),
                    onAdFailedToRender: (payload) => setAdStatus(`배너 렌더 실패: ${getErrorMessage(payload)}`, payload),
                  },
                });
              } catch (error) {
                setAdStatus(`배너 부착 예외: ${getErrorMessage(error)}`);
              }
            },
            onInitializationFailed: (error) => {
              setAdStatus(`배너 초기화 실패: ${getErrorMessage(error)}`);
            },
          },
        });
      } catch (error) {
        setAdStatus(`배너 초기화 예외: ${getErrorMessage(error)}`);
      }
    }

    void attachBanner();

    return () => {
      isActive = false;
      bannerSlotRef.current?.destroy();
      bannerSlotRef.current = null;
    };
  }, []);

  function commitWallet(nextWallet: CoinWallet) {
    setWallet(nextWallet);
    saveWallet(nextWallet);
  }

  function commitReward(nextWallet: CoinWallet, message: string) {
    const earnedStreakBonus = nextWallet.lastStreakBonusDate === todayKey && wallet.lastStreakBonusDate !== todayKey;
    commitWallet(nextWallet);
    setRewardMessage(earnedStreakBonus ? `${message} 3일 연속 보너스 ${STREAK_BONUS_COINS}코인도 받았어요.` : message);
  }

  function selectAnswer(value: string) {
    const question = QUESTIONS[questionIndex];
    if (question == null) {
      return;
    }

    setAnswers((current) => ({ ...current, [question.id]: value }));
    setQuestionIndex((current) => current + 1);
  }

  async function runRewardAd(placement: RewardAdPlacement): Promise<boolean> {
    setLoadingRewardPlacement(placement);
    setRewardMessage('');

    try {
      const adResult = await createAppsInTossWebRewardedAdAdapter(placement).showRewardedAd();

      if (!adResult.completed) {
        setRewardMessage(
          adResult.reason === 'UNSUPPORTED'
            ? '현재 환경에서는 리워드 광고를 지원하지 않아요. Toss 앱에서 다시 시도해주세요.'
            : '광고를 끝까지 본 뒤에만 탐정 코인을 받을 수 있어요.',
        );
        return false;
      }

      return true;
    } catch (error) {
      setRewardMessage(`광고를 불러오지 못했어요. ${getErrorMessage(error)}`);
      return false;
    } finally {
      setLoadingRewardPlacement(null);
    }
  }

  async function handleAdReward() {
    const completedAd = await runRewardAd('default');
    if (!completedAd) {
      return;
    }

    try {
      const nextWallet = addAdRewardCoin(wallet, todayKey);
      commitReward(nextWallet, '광고 보상으로 탐정 코인 1개를 받았어요.');
      setRevealedClueCount((current) => current + 1);
    } catch (error) {
      if (error instanceof Error && error.message === 'DAILY_REWARD_LIMIT_REACHED') {
        setRewardMessage('오늘 받을 수 있는 기본 광고 보상을 모두 받았어요.');
        return;
      }
      setRewardMessage('보상을 처리하지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  }

  async function handleCheckInReward() {
    const completedAd = await runRewardAd('checkIn');
    if (!completedAd) {
      return;
    }

    try {
      const nextWallet = addCheckInAdReward(wallet, todayKey);
      commitReward(nextWallet, `탐정 출석 보너스로 탐정 코인 ${CHECK_IN_AD_REWARD_COINS}개를 받았어요.`);
    } catch (error) {
      if (error instanceof Error && error.message === 'CHECK_IN_REWARD_ALREADY_CLAIMED') {
        setRewardMessage('오늘의 탐정 출석 보너스는 이미 받았어요.');
        return;
      }
      setRewardMessage('보상을 처리하지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  }

  async function handleDailyMissionReward() {
    const completedAd = await runRewardAd('mission');
    if (!completedAd) {
      return;
    }

    try {
      const nextWallet = addDailyMissionAdReward(wallet, todayKey);
      commitReward(nextWallet, `오늘의 영수증 미션 보상으로 탐정 코인 ${DAILY_MISSION_AD_REWARD_COINS}개를 받았어요.`);
    } catch (error) {
      if (error instanceof Error && error.message === 'MISSION_REWARD_ALREADY_CLAIMED') {
        setRewardMessage('오늘의 미션 보상은 이미 받았어요.');
        return;
      }
      setRewardMessage('보상을 처리하지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  }

  function handleExchange() {
    try {
      const nextWallet = exchangeCoinsForTossPoint(wallet);
      commitWallet(nextWallet);
      setRewardMessage(`탐정 코인 ${COINS_PER_TOSS_POINT_EXCHANGE}개로 토스포인트 ${TOSS_POINT_EXCHANGE_UNITS}원 지급을 신청했어요.`);
    } catch {
      setRewardMessage(`토스포인트 교환까지 탐정 코인 ${COINS_PER_TOSS_POINT_EXCHANGE - wallet.coinBalance}개가 더 필요해요.`);
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
    if (question == null) {
      return null;
    }

    return (
      <main className="app-shell">
        <section className="detective-panel question-panel">
          <div className="mascot-wrap" aria-hidden="true">
            <img className="mascot" src={detectiveLogoUrl} alt="" />
          </div>
          <div className="case-tag-row">
            <span className="case-tag">Case {questionIndex + 1}</span>
            <span className="case-tag case-tag-soft">단서 수집 중</span>
          </div>
          <p className="eyebrow">영수증 탐정</p>
          <h1>오늘의 소비 사건을 조사해볼까요?</h1>
          <div className="progress" aria-label={`질문 ${questionIndex + 1} / 3`}>
            <span>{questionIndex + 1}</span>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${((questionIndex + 1) / QUESTIONS.length) * 100}%` }} />
            </div>
            <span>{QUESTIONS.length}</span>
          </div>
          <h2>{question.label}</h2>
          <div className="option-list">
            {question.options.map((option) => (
              <button key={option.value} className="option-button" type="button" onClick={() => selectAnswer(option.value)}>
                <span className="option-dot" aria-hidden="true" />
                {option.label}
              </button>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (result == null || initialClue == null) {
    return null;
  }

  return (
    <main className="app-shell">
      <section className="detective-panel result-panel">
        <div className="mascot-wrap result-mascot" aria-hidden="true">
          <img className="mascot" src={detectiveLogoUrl} alt="" />
        </div>
        <div className="case-tag-row">
          <span className="case-tag">Case closed</span>
          <span className="case-tag case-tag-soft">미션 발견</span>
        </div>
        <p className="eyebrow">사건 해결</p>
        <h1>{result.caseName}</h1>
        <p className="comment">{result.detectiveComment}</p>

        <section className="coin-wallet" aria-label="탐정 코인 지갑">
          <div>
            <span className="wallet-label">탐정 코인</span>
            <strong>{wallet.coinBalance}개</strong>
          </div>
          <div>
            <span className="wallet-label">연속 광고 보상</span>
            <strong>{streakCount}/{STREAK_REQUIRED_DAYS}일</strong>
          </div>
          <div className="wallet-progress">
            <span>{COINS_PER_TOSS_POINT_EXCHANGE}개 = 토스포인트 {TOSS_POINT_EXCHANGE_UNITS}원</span>
            <div className="wallet-progress-track">
              <div className="wallet-progress-fill" style={{ width: `${exchangeProgress}%` }} />
            </div>
          </div>
        </section>

        <article className="clue-card featured-clue">
          <span>소비 분석 카드</span>
          <h2>{initialClue.title}</h2>
          <p>{initialClue.body}</p>
        </article>

        {extraClues.map((extraClue, index) => (
          <article className="clue-card" key={`${extraClue.title}-${index}`}>
            <span>{extraClue.kind === 'analysis' ? '추가 소비 분석' : '추가 절약 미션'}</span>
            <h2>
              {index + 1}. {extraClue.title}
            </h2>
            <p>{extraClue.body}</p>
          </article>
        ))}

        <div className="mission-box">
          <span>오늘의 영수증 미션</span>
          <strong>{result.mission}</strong>
        </div>

        <section className="banner-ad-card" aria-label="광고">
          <div ref={bannerContainerRef} id="receipt-detective-banner-ad" className="banner-ad-slot" aria-label="광고" />
          <div className="ad-debug-log" aria-live="polite">
            광고 상태: {bannerAdStatus}
          </div>
        </section>

        {rewardMessage ? <p className="reward-message">{rewardMessage}</p> : null}

        <div className="actions">
          <button
            className="primary-button"
            type="button"
            onClick={handleAdReward}
            disabled={remainingRewards === 0 || loadingRewardPlacement !== null}
          >
            {loadingRewardPlacement === 'default'
              ? '광고 확인 중...'
              : `광고 보고 탐정 코인 받기 +1 (${remainingRewards}/${DAILY_AD_REWARD_LIMIT})`}
          </button>
          <div className="bonus-actions">
            <button
              className="bonus-button"
              type="button"
              onClick={handleCheckInReward}
              disabled={isCheckInRewardClaimedToday || loadingRewardPlacement !== null}
            >
              {loadingRewardPlacement === 'checkIn' ? '광고 확인 중...' : `탐정 출석 광고 보너스 +${CHECK_IN_AD_REWARD_COINS}`}
            </button>
            <button
              className="bonus-button"
              type="button"
              onClick={handleDailyMissionReward}
              disabled={isMissionRewardClaimedToday || loadingRewardPlacement !== null}
            >
              {loadingRewardPlacement === 'mission' ? '광고 확인 중...' : `오늘의 미션 광고 보너스 +${DAILY_MISSION_AD_REWARD_COINS}`}
            </button>
          </div>
          <p className="streak-note">3일 연속 광고 보상을 받으면 탐정 코인 {STREAK_BONUS_COINS}개를 추가로 받아요.</p>
          <button className="exchange-button" type="button" onClick={handleExchange} disabled={!canExchange}>
            토스포인트 30원 받기
          </button>
          <button className="secondary-button" type="button" onClick={resetCase}>
            새 사건 조사하기
          </button>
        </div>
      </section>
    </main>
  );
}
