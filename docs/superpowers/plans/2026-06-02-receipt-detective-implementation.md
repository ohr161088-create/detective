# Receipt Detective v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `영수증 탐정` Apps in Toss non-game MVP: a 3-question spending quiz, deterministic case result, clue cards, rewarded ad loop, and Toss Point 1 won grant flow.

**Architecture:** Use a Granite React Native mini app with one `pages/index.tsx` entry. Keep product logic in pure TypeScript modules under `src/features/receipt-detective` so quiz/result/reward behavior is testable without the Apps in Toss runtime. Wrap Apps in Toss ad and promotion SDK calls behind small adapter modules with fake implementations for local development and tests.

**Tech Stack:** Granite React Native, TypeScript, React Native core components, `@apps-in-toss/framework`, Vitest for pure TypeScript tests.

---

## Source Documents

- Design spec: `docs/superpowers/specs/2026-06-02-receipt-detective-design.md`
- Apps in Toss Granite setup: `https://developers-apps-in-toss.toss.im/tutorials/react-native.md`
- Apps in Toss rewarded ad API: `https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/IntegratedAd.md`
- Apps in Toss non-game promotion API: `https://developers-apps-in-toss.toss.im/bedrock/reference/framework/비게임/promotion.md`

## File Structure

- Create: `package.json` and Granite scaffold files via `npm create granite-app`
- Modify: `granite.config.ts` for `receipt-detective`, display name `영수증 탐정`, and brand color
- Create: `pages/index.tsx` as the only route for v1
- Create: `src/features/receipt-detective/content.ts` for questions, cases, and clue card content
- Create: `src/features/receipt-detective/engine.ts` for deterministic quiz result and clue selection
- Create: `src/features/receipt-detective/rewardAttempts.ts` for local attempt state and duplicate prevention
- Create: `src/features/receipt-detective/adAdapter.ts` for rewarded ad loading/showing
- Create: `src/features/receipt-detective/promotionAdapter.ts` for Toss Point promotion grant
- Create: `src/features/receipt-detective/ReceiptDetectiveScreen.tsx` for the UI state machine
- Create: `src/features/receipt-detective/*.test.ts` for domain and reward tests
- Create: `vitest.config.ts` for test configuration

---

### Task 1: Scaffold Granite App And Test Harness

**Files:**
- Create: `package.json`
- Create: `granite.config.ts`
- Create: `pages/index.tsx`
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Scaffold the Granite project in the current repository**

Run from `C:\pro\a`:

```powershell
npm create granite-app
```

When prompted:

```text
app name: receipt-detective
quality tool: prettier + eslint
```

Expected:

```text
package.json created
granite.config.ts created
pages directory created
```

- [ ] **Step 2: Install dependencies**

Run:

```powershell
npm install
npm install -D vitest
```

Expected:

```text
added ... packages
found 0 vulnerabilities
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Add test script**

Modify `package.json` so `scripts` includes:

```json
{
  "scripts": {
    "dev": "granite dev",
    "build": "granite build",
    "test": "vitest run"
  }
}
```

Keep any scaffold-provided scripts that are required by Granite.

- [ ] **Step 5: Configure Apps in Toss branding**

Modify `granite.config.ts` to use these brand values:

```ts
import { appsInToss } from '@apps-in-toss/framework/plugins';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  appName: 'receipt-detective',
  plugins: [
    appsInToss({
      brand: {
        displayName: '영수증 탐정',
        primaryColor: '#3182F6',
        icon: null,
      },
      permissions: [],
    }),
  ],
});
```

- [ ] **Step 6: Create a temporary route**

Create `pages/index.tsx`:

```tsx
import { Text, View } from 'react-native';

export default function Page() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>영수증 탐정</Text>
    </View>
  );
}
```

- [ ] **Step 7: Verify tests run**

Run:

```powershell
npm test
```

Expected:

```text
No test files found
```

Vitest may exit with code 1 when no tests exist. This is acceptable only for this step.

- [ ] **Step 8: Commit scaffold**

```powershell
git add package.json package-lock.json granite.config.ts pages/index.tsx vitest.config.ts
git commit -m "chore: scaffold receipt detective app"
```

---

### Task 2: Add Quiz Content And Result Engine

**Files:**
- Create: `src/features/receipt-detective/content.ts`
- Create: `src/features/receipt-detective/engine.ts`
- Create: `src/features/receipt-detective/engine.test.ts`

- [ ] **Step 1: Write failing result engine tests**

Create `src/features/receipt-detective/engine.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildCaseResult, getInitialClueCard, getNextClueCard, QUESTIONS } from './engine';

describe('receipt detective engine', () => {
  it('defines the three approved quiz questions', () => {
    expect(QUESTIONS).toHaveLength(3);
    expect(QUESTIONS[0].label).toBe('오늘 가장 의심되는 소비는?');
    expect(QUESTIONS[1].label).toBe('이 소비는 어떤 상황에서 발생했나요?');
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
    expect(getNextClueCard(0).title).toBe('위험 시간대');
    expect(getNextClueCard(31).title).toBe('위험 시간대');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- src/features/receipt-detective/engine.test.ts
```

Expected:

```text
FAIL src/features/receipt-detective/engine.test.ts
Cannot find module './engine'
```

- [ ] **Step 3: Create content module**

Create `src/features/receipt-detective/content.ts`:

```ts
export type SuspiciousSpend = 'convenience_store' | 'cafe' | 'delivery_night' | 'shopping' | 'transport';
export type SpendSituation = 'planned' | 'impulse' | 'stress' | 'habit';
export type SavingTarget = '1000' | '3000' | '5000_plus' | 'hard';

export type QuizAnswers = {
  suspiciousSpend: SuspiciousSpend;
  situation: SpendSituation;
  savingTarget: SavingTarget;
};

export type QuizQuestion<OptionValue extends string> = {
  id: keyof QuizAnswers;
  label: string;
  options: Array<{ value: OptionValue; label: string }>;
};

export type CaseResult = {
  caseName: string;
  detectiveComment: string;
  riskLabel: string;
  mission: string;
};

export type ClueCard = {
  kind: 'analysis' | 'mission';
  title: string;
  body: string;
};

export const QUESTIONS = [
  {
    id: 'suspiciousSpend',
    label: '오늘 가장 의심되는 소비는?',
    options: [
      { value: 'convenience_store', label: '편의점' },
      { value: 'cafe', label: '카페' },
      { value: 'delivery_night', label: '배달/야식' },
      { value: 'shopping', label: '쇼핑' },
      { value: 'transport', label: '교통/이동' },
    ],
  },
  {
    id: 'situation',
    label: '이 소비는 어떤 상황에서 발생했나요?',
    options: [
      { value: 'planned', label: '계획한 소비였어요' },
      { value: 'impulse', label: '갑자기 샀어요' },
      { value: 'stress', label: '스트레스 때문에 샀어요' },
      { value: 'habit', label: '그냥 습관처럼 샀어요' },
    ],
  },
  {
    id: 'savingTarget',
    label: '내일 줄일 수 있다면 어느 정도?',
    options: [
      { value: '1000', label: '1,000원' },
      { value: '3000', label: '3,000원' },
      { value: '5000_plus', label: '5,000원 이상' },
      { value: 'hard', label: '못 줄일 것 같아요' },
    ],
  },
] as const;

export const CASE_NAMES: Record<SuspiciousSpend, string> = {
  convenience_store: '편의점 잠입 사건',
  cafe: '카페 지출 사건',
  delivery_night: '야식 미스터리',
  shopping: '쇼핑 충동 사건',
  transport: '교통비 추적 사건',
};

export const SITUATION_COMMENTS: Record<SpendSituation, string> = {
  planned: '계획된 소비라 사건 현장이 비교적 차분해요.',
  impulse: '갑작스러운 소비 단서가 발견됐어요.',
  stress: '스트레스가 결제 버튼 근처에 머문 흔적이 있어요.',
  habit: '습관처럼 반복된 소비 발자국이 보여요.',
};

export const RISK_LABELS: Record<SpendSituation, string> = {
  planned: '낮은 위험',
  impulse: '충동구매 신호',
  stress: '감정 소비 신호',
  habit: '반복 소비 신호',
};

export const MISSIONS: Record<SavingTarget, Record<SuspiciousSpend, string>> = {
  '1000': {
    convenience_store: '내일 편의점에서 작은 간식 하나만 줄이기',
    cafe: '내일 커피 사이즈 한 단계 낮추기',
    delivery_night: '야식 주문 전 물 한 잔 마시기',
    shopping: '장바구니에 담고 하루 미루기',
    transport: '가까운 거리는 한 정거장 먼저 걷기',
  },
  '3000': {
    convenience_store: '내일 편의점 앞에서 10초만 멈춰보기',
    cafe: '내일 카페 결제 한 번 쉬어가기',
    delivery_night: '내일 야식 앱 열기 전에 10분 기다리기',
    shopping: '내일 즉시 구매 대신 찜만 하기',
    transport: '내일 택시 대신 대중교통 한 번 선택하기',
  },
  '5000_plus': {
    convenience_store: '편의점 방문을 하루 한 번 이하로 줄이기',
    cafe: '카페 대신 집이나 사무실 음료 선택하기',
    delivery_night: '내일 배달/야식 하루 쉬기',
    shopping: '내일 새 상품 구매하지 않기',
    transport: '이동 전 최저 비용 경로 확인하기',
  },
  hard: {
    convenience_store: '편의점 결제 전 영수증 탐정 떠올리기',
    cafe: '커피 주문 전 오늘 이미 마셨는지 확인하기',
    delivery_night: '야식 주문 전 배고픔 점수 매기기',
    shopping: '구매 전 필요한 이유 한 줄 적기',
    transport: '이동 전 급한 일정인지 확인하기',
  },
};

export const EXTRA_CLUE_CARDS: ClueCard[] = [
  { kind: 'analysis', title: '위험 시간대', body: '밤 시간대 소비를 조심해볼 만해요.' },
  { kind: 'analysis', title: '충동구매 신호', body: '계획하지 않은 소비가 사건 현장에 남아 있어요.' },
  { kind: 'analysis', title: '위험 카테고리', body: '간식비 단서가 가장 선명하게 남아 있어요.' },
  { kind: 'mission', title: '10초 멈춤', body: '결제 전 10초만 멈추면 사건이 작아질 수 있어요.' },
  { kind: 'mission', title: '하루 미루기', body: '오늘 사고 싶었던 것을 내일까지 미뤄봐요.' },
  { kind: 'mission', title: '카페 쉬는 날', body: '내일은 커피 한 잔을 쉬어가요.' },
  { kind: 'mission', title: '편의점 패스', body: '내일 편의점 방문을 한 번만 줄여봐요.' },
  { kind: 'analysis', title: '반복 소비', body: '습관처럼 결제한 흔적은 가장 오래 남아요.' },
];
```

- [ ] **Step 4: Create engine module**

Create `src/features/receipt-detective/engine.ts`:

```ts
import {
  CASE_NAMES,
  CaseResult,
  ClueCard,
  EXTRA_CLUE_CARDS,
  MISSIONS,
  QUESTIONS,
  QuizAnswers,
  RISK_LABELS,
  SITUATION_COMMENTS,
} from './content';

export { QUESTIONS };
export type { CaseResult, ClueCard, QuizAnswers };

export function buildCaseResult(answers: QuizAnswers): CaseResult {
  return {
    caseName: CASE_NAMES[answers.suspiciousSpend],
    detectiveComment: `${SITUATION_COMMENTS[answers.situation]} ${MISSIONS[answers.savingTarget][answers.suspiciousSpend]}`,
    riskLabel: RISK_LABELS[answers.situation],
    mission: MISSIONS[answers.savingTarget][answers.suspiciousSpend],
  };
}

export function getInitialClueCard(result: CaseResult): ClueCard {
  return {
    kind: 'analysis',
    title: '오늘의 범인',
    body: `오늘의 범인은 ${result.caseName}이에요. ${result.riskLabel} 단서가 보여요.`,
  };
}

export function getNextClueCard(index: number): ClueCard {
  return EXTRA_CLUE_CARDS[index % EXTRA_CLUE_CARDS.length];
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```powershell
npm test -- src/features/receipt-detective/engine.test.ts
```

Expected:

```text
PASS src/features/receipt-detective/engine.test.ts
```

- [ ] **Step 6: Commit domain engine**

```powershell
git add src/features/receipt-detective/content.ts src/features/receipt-detective/engine.ts src/features/receipt-detective/engine.test.ts
git commit -m "feat: add receipt detective result engine"
```

---

### Task 3: Add Reward Attempt State Machine

**Files:**
- Create: `src/features/receipt-detective/rewardAttempts.ts`
- Create: `src/features/receipt-detective/rewardAttempts.test.ts`

- [ ] **Step 1: Write failing reward attempt tests**

Create `src/features/receipt-detective/rewardAttempts.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createRewardAttemptStore } from './rewardAttempts';

describe('reward attempt store', () => {
  it('creates unique attempts and completes each attempt once', () => {
    const store = createRewardAttemptStore(() => 'attempt-1');

    const attempt = store.createAttempt();
    expect(attempt.status).toBe('created');

    store.markAdCompleted(attempt.id);
    const completed = store.markGrantCompleted(attempt.id, 'reward-key-1');

    expect(completed.status).toBe('grant_completed');
    expect(completed.promotionKey).toBe('reward-key-1');
    expect(() => store.markGrantCompleted(attempt.id, 'reward-key-2')).toThrow('Reward attempt already completed');
  });

  it('records grant failures without completing the attempt', () => {
    const store = createRewardAttemptStore(() => 'attempt-2');
    const attempt = store.createAttempt();

    store.markAdCompleted(attempt.id);
    const failed = store.markGrantFailed(attempt.id, '4109');

    expect(failed.status).toBe('grant_failed');
    expect(failed.errorCode).toBe('4109');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- src/features/receipt-detective/rewardAttempts.test.ts
```

Expected:

```text
FAIL src/features/receipt-detective/rewardAttempts.test.ts
Cannot find module './rewardAttempts'
```

- [ ] **Step 3: Implement reward attempt store**

Create `src/features/receipt-detective/rewardAttempts.ts`:

```ts
export type RewardAttemptStatus =
  | 'created'
  | 'ad_completed'
  | 'grant_requested'
  | 'grant_completed'
  | 'grant_failed';

export type RewardAttempt = {
  id: string;
  status: RewardAttemptStatus;
  createdAt: number;
  promotionKey?: string;
  errorCode?: string;
};

export type RewardAttemptStore = {
  createAttempt: () => RewardAttempt;
  markAdCompleted: (id: string) => RewardAttempt;
  markGrantRequested: (id: string) => RewardAttempt;
  markGrantCompleted: (id: string, promotionKey: string) => RewardAttempt;
  markGrantFailed: (id: string, errorCode: string) => RewardAttempt;
  getAttempt: (id: string) => RewardAttempt | undefined;
};

export function createRewardAttemptStore(
  createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`,
): RewardAttemptStore {
  const attempts = new Map<string, RewardAttempt>();

  function read(id: string): RewardAttempt {
    const attempt = attempts.get(id);
    if (!attempt) {
      throw new Error(`Reward attempt not found: ${id}`);
    }
    return attempt;
  }

  function write(attempt: RewardAttempt): RewardAttempt {
    attempts.set(attempt.id, attempt);
    return attempt;
  }

  return {
    createAttempt() {
      const attempt: RewardAttempt = {
        id: createId(),
        status: 'created',
        createdAt: Date.now(),
      };
      return write(attempt);
    },
    markAdCompleted(id) {
      const attempt = read(id);
      if (attempt.status !== 'created') {
        throw new Error(`Cannot mark ad completed from status ${attempt.status}`);
      }
      return write({ ...attempt, status: 'ad_completed' });
    },
    markGrantRequested(id) {
      const attempt = read(id);
      if (attempt.status !== 'ad_completed') {
        throw new Error(`Cannot request grant from status ${attempt.status}`);
      }
      return write({ ...attempt, status: 'grant_requested' });
    },
    markGrantCompleted(id, promotionKey) {
      const attempt = read(id);
      if (attempt.status === 'grant_completed') {
        throw new Error('Reward attempt already completed');
      }
      if (attempt.status !== 'grant_requested' && attempt.status !== 'ad_completed') {
        throw new Error(`Cannot complete grant from status ${attempt.status}`);
      }
      return write({ ...attempt, status: 'grant_completed', promotionKey });
    },
    markGrantFailed(id, errorCode) {
      const attempt = read(id);
      return write({ ...attempt, status: 'grant_failed', errorCode });
    },
    getAttempt(id) {
      return attempts.get(id);
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm test -- src/features/receipt-detective/rewardAttempts.test.ts
```

Expected:

```text
PASS src/features/receipt-detective/rewardAttempts.test.ts
```

- [ ] **Step 5: Commit reward attempt store**

```powershell
git add src/features/receipt-detective/rewardAttempts.ts src/features/receipt-detective/rewardAttempts.test.ts
git commit -m "feat: add reward attempt tracking"
```

---

### Task 4: Add Ad And Promotion Adapters

**Files:**
- Create: `src/features/receipt-detective/adAdapter.ts`
- Create: `src/features/receipt-detective/promotionAdapter.ts`
- Create: `src/features/receipt-detective/rewardFlow.ts`
- Create: `src/features/receipt-detective/rewardFlow.test.ts`

- [ ] **Step 1: Write failing rewarded flow test**

Create `src/features/receipt-detective/rewardFlow.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createRewardAttemptStore } from './rewardAttempts';
import { runRewardedPointFlow } from './rewardFlow';

describe('rewarded point flow', () => {
  it('grants 1 Toss Point after a completed rewarded ad', async () => {
    const store = createRewardAttemptStore(() => 'attempt-1');

    const result = await runRewardedPointFlow({
      attempts: store,
      ads: {
        showRewardedAd: async () => ({ completed: true }),
      },
      promotion: {
        grantTossPoint: async ({ amount }) => ({ ok: true, key: `point-${amount}` }),
      },
    });

    expect(result.status).toBe('grant_completed');
    expect(result.promotionKey).toBe('point-1');
  });

  it('does not grant Toss Point when the ad is not completed', async () => {
    const store = createRewardAttemptStore(() => 'attempt-2');

    const result = await runRewardedPointFlow({
      attempts: store,
      ads: {
        showRewardedAd: async () => ({ completed: false }),
      },
      promotion: {
        grantTossPoint: async () => {
          throw new Error('grant should not be called');
        },
      },
    });

    expect(result.status).toBe('grant_failed');
    expect(result.errorCode).toBe('AD_NOT_COMPLETED');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- src/features/receipt-detective/rewardFlow.test.ts
```

Expected:

```text
FAIL src/features/receipt-detective/rewardFlow.test.ts
Cannot find module './rewardFlow'
```

- [ ] **Step 3: Add ad adapter interface and Apps in Toss implementation**

Create `src/features/receipt-detective/adAdapter.ts`:

```ts
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/framework';

export type RewardedAdResult = {
  completed: boolean;
};

export type RewardedAdAdapter = {
  showRewardedAd: () => Promise<RewardedAdResult>;
};

const REWARDED_AD_GROUP_ID = 'ait-ad-test-rewarded-id';

export function createAppsInTossRewardedAdAdapter(): RewardedAdAdapter {
  return {
    showRewardedAd() {
      return new Promise((resolve, reject) => {
        if (!loadFullScreenAd.isSupported() || !showFullScreenAd.isSupported()) {
          resolve({ completed: false });
          return;
        }

        const unregisterLoad = loadFullScreenAd({
          options: { adGroupId: REWARDED_AD_GROUP_ID },
          onEvent: (loadEvent) => {
            if (loadEvent.type !== 'loaded') {
              return;
            }

            unregisterLoad();
            let completed = false;
            const unregisterShow = showFullScreenAd({
              options: { adGroupId: REWARDED_AD_GROUP_ID },
              onEvent: (showEvent) => {
                if (showEvent.type === 'userEarnedReward') {
                  completed = true;
                }
                if (showEvent.type === 'failedToShow') {
                  unregisterShow();
                  resolve({ completed: false });
                }
                if (showEvent.type === 'dismissed') {
                  unregisterShow();
                  resolve({ completed });
                }
              },
              onError: (error) => {
                unregisterShow();
                reject(error);
              },
            });
          },
          onError: reject,
        });
      });
    },
  };
}
```

- [ ] **Step 4: Add promotion adapter interface and client-side implementation**

Create `src/features/receipt-detective/promotionAdapter.ts`:

```ts
import { grantPromotionReward } from '@apps-in-toss/framework';

export type GrantTossPointParams = {
  amount: number;
  attemptId: string;
};

export type GrantTossPointResult =
  | { ok: true; key: string }
  | { ok: false; errorCode: string; message: string };

export type PromotionAdapter = {
  grantTossPoint: (params: GrantTossPointParams) => Promise<GrantTossPointResult>;
};

const PROMOTION_CODE = 'RECEIPT_DETECTIVE_TEST_PROMOTION';

export function createAppsInTossPromotionAdapter(): PromotionAdapter {
  return {
    async grantTossPoint({ amount }) {
      const result = await grantPromotionReward({
        params: {
          promotionCode: PROMOTION_CODE,
          amount,
        },
      });

      if (!result) {
        return { ok: false, errorCode: 'UNSUPPORTED_APP_VERSION', message: '지원하지 않는 앱 버전이에요.' };
      }

      if (result === 'ERROR') {
        return { ok: false, errorCode: 'ERROR', message: '포인트 지급 중 알 수 없는 오류가 발생했어요.' };
      }

      if ('key' in result) {
        return { ok: true, key: result.key };
      }

      return { ok: false, errorCode: result.errorCode, message: result.message };
    },
  };
}
```

- [ ] **Step 5: Add rewarded flow orchestration**

Create `src/features/receipt-detective/rewardFlow.ts`:

```ts
import { RewardedAdAdapter } from './adAdapter';
import { PromotionAdapter } from './promotionAdapter';
import { RewardAttempt, RewardAttemptStore } from './rewardAttempts';

export type RewardFlowDependencies = {
  attempts: RewardAttemptStore;
  ads: RewardedAdAdapter;
  promotion: PromotionAdapter;
};

export async function runRewardedPointFlow({
  attempts,
  ads,
  promotion,
}: RewardFlowDependencies): Promise<RewardAttempt> {
  const attempt = attempts.createAttempt();
  const adResult = await ads.showRewardedAd();

  if (!adResult.completed) {
    return attempts.markGrantFailed(attempt.id, 'AD_NOT_COMPLETED');
  }

  attempts.markAdCompleted(attempt.id);
  attempts.markGrantRequested(attempt.id);

  const grant = await promotion.grantTossPoint({
    amount: 1,
    attemptId: attempt.id,
  });

  if (!grant.ok) {
    return attempts.markGrantFailed(attempt.id, grant.errorCode);
  }

  return attempts.markGrantCompleted(attempt.id, grant.key);
}
```

- [ ] **Step 6: Run test to verify it passes**

Run:

```powershell
npm test -- src/features/receipt-detective/rewardFlow.test.ts
```

Expected:

```text
PASS src/features/receipt-detective/rewardFlow.test.ts
```

- [ ] **Step 7: Commit ad and promotion adapters**

```powershell
git add src/features/receipt-detective/adAdapter.ts src/features/receipt-detective/promotionAdapter.ts src/features/receipt-detective/rewardFlow.ts src/features/receipt-detective/rewardFlow.test.ts
git commit -m "feat: add rewarded toss point flow"
```

---

### Task 5: Build Receipt Detective Screen

**Files:**
- Create: `src/features/receipt-detective/ReceiptDetectiveScreen.tsx`
- Modify: `pages/index.tsx`

- [ ] **Step 1: Create the screen component**

Create `src/features/receipt-detective/ReceiptDetectiveScreen.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createAppsInTossRewardedAdAdapter } from './adAdapter';
import { buildCaseResult, getInitialClueCard, getNextClueCard, QUESTIONS, QuizAnswers } from './engine';
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
  const [extraClueIndex, setExtraClueIndex] = useState(0);
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
  const extraClue = extraClueIndex > 0 ? getNextClueCard(extraClueIndex - 1) : null;

  function selectAnswer(value: string) {
    const question = QUESTIONS[questionIndex];
    setAnswers((current) => ({ ...current, [question.id]: value }));
    setQuestionIndex((current) => current + 1);
  }

  async function handleRewardPress() {
    setIsRewardLoading(true);
    setRewardMessage('');

    try {
      const attempt = await runRewardedPointFlow({ attempts, ads, promotion });
      if (attempt.status === 'grant_completed') {
        setExtraClueIndex((current) => current + 1);
        setRewardMessage('토스 포인트 1원 지급 완료');
      } else {
        setRewardMessage('오늘 지급 가능한 보상을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.');
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
    setExtraClueIndex(0);
    setRewardMessage('');
  }

  if (!isComplete) {
    const question = QUESTIONS[questionIndex];
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>영수증 탐정</Text>
        <Text style={styles.title}>오늘의 소비 사건을 조사해볼까요?</Text>
        <Text style={styles.progress}>{questionIndex + 1}/3</Text>
        <Text style={styles.question}>{question.label}</Text>
        <View style={styles.optionList}>
          {question.options.map((option) => (
            <Pressable key={option.value} style={styles.optionButton} onPress={() => selectAnswer(option.value)}>
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
        <Text style={styles.cardLabel}>{initialClue.kind === 'analysis' ? '소비 분석 카드' : '절약 미션 카드'}</Text>
        <Text style={styles.cardTitle}>{initialClue.title}</Text>
        <Text style={styles.cardBody}>{initialClue.body}</Text>
      </View>

      {extraClue ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{extraClue.kind === 'analysis' ? '추가 소비 분석' : '추가 절약 미션'}</Text>
          <Text style={styles.cardTitle}>{extraClue.title}</Text>
          <Text style={styles.cardBody}>{extraClue.body}</Text>
        </View>
      ) : null}

      {rewardMessage ? <Text style={styles.rewardMessage}>{rewardMessage}</Text> : null}

      <Pressable style={[styles.primaryButton, isRewardLoading ? styles.disabledButton : null]} onPress={handleRewardPress} disabled={isRewardLoading}>
        <Text style={styles.primaryButtonText}>
          {isRewardLoading ? '광고 확인 중...' : extraClueIndex > 0 ? '단서 더 찾기' : '광고 보고 토스 포인트 1원 받기'}
        </Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={resetCase}>
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
```

- [ ] **Step 2: Wire the route to the screen**

Replace `pages/index.tsx`:

```tsx
import { ReceiptDetectiveScreen } from '../src/features/receipt-detective/ReceiptDetectiveScreen';

export default function Page() {
  return <ReceiptDetectiveScreen />;
}
```

- [ ] **Step 3: Run TypeScript/build check**

Run:

```powershell
npm run build
```

Expected:

```text
build completed
```

- [ ] **Step 4: Run tests**

Run:

```powershell
npm test
```

Expected:

```text
PASS src/features/receipt-detective/engine.test.ts
PASS src/features/receipt-detective/rewardAttempts.test.ts
PASS src/features/receipt-detective/rewardFlow.test.ts
```

- [ ] **Step 5: Commit UI**

```powershell
git add pages/index.tsx src/features/receipt-detective/ReceiptDetectiveScreen.tsx
git commit -m "feat: build receipt detective screen"
```

---

### Task 6: Add Launch Configuration And Verification Notes

**Files:**
- Create: `.env.example`
- Create: `docs/receipt-detective-launch-checklist.md`
- Modify: `src/features/receipt-detective/adAdapter.ts`
- Modify: `src/features/receipt-detective/promotionAdapter.ts`

- [ ] **Step 1: Add env example**

Create `.env.example`:

```text
RECEIPT_DETECTIVE_REWARDED_AD_GROUP_ID=ait-ad-test-rewarded-id
RECEIPT_DETECTIVE_PROMOTION_CODE=RECEIPT_DETECTIVE_TEST_PROMOTION
```

- [ ] **Step 2: Add launch checklist**

Create `docs/receipt-detective-launch-checklist.md`:

```md
# Receipt Detective Launch Checklist

## Console Setup

- Register app name as `receipt-detective`.
- Set display name to `영수증 탐정`.
- Register the final app icon in Apps in Toss Console.
- Create a rewarded ad group.
- Use the test rewarded ad group ID during development.
- Create a non-game Toss Point promotion.
- Test promotion grant at least once in Toss app QR test mode before launch.

## Policy Checks

- Reward copy says `토스 포인트 1원 지급`.
- Internal rewards are called `단서 카드`, not `포인트`.
- No copy says withdrawal, cash-out, or conversion.
- Toss Point is granted only after `userEarnedReward`.
- No fixed per-user daily cap is enforced for normal users in v1.
- Promotion budget exhaustion shows a clear fallback state.

## Verification

- Run `npm test`.
- Run `npm run build`.
- In sandbox app, complete all 3 quiz questions.
- Verify the result screen shows one free clue card.
- Verify rewarded ad completion grants Toss Point 1 won.
- Verify closing an ad before reward completion does not grant Toss Point.
- Verify repeated rewarded ads reveal additional clue cards.
```

- [ ] **Step 3: Replace hard-coded IDs with local constants that can be wired to env later**

Modify `src/features/receipt-detective/adAdapter.ts`:

```ts
const REWARDED_AD_GROUP_ID =
  process.env.RECEIPT_DETECTIVE_REWARDED_AD_GROUP_ID ?? 'ait-ad-test-rewarded-id';
```

Modify `src/features/receipt-detective/promotionAdapter.ts`:

```ts
const PROMOTION_CODE =
  process.env.RECEIPT_DETECTIVE_PROMOTION_CODE ?? 'RECEIPT_DETECTIVE_TEST_PROMOTION';
```

- [ ] **Step 4: Run full verification**

Run:

```powershell
npm test
npm run build
git status --short
```

Expected:

```text
All tests pass
Build completes
Only intended launch checklist and env/config changes are unstaged
```

- [ ] **Step 5: Commit launch configuration**

```powershell
git add .env.example docs/receipt-detective-launch-checklist.md src/features/receipt-detective/adAdapter.ts src/features/receipt-detective/promotionAdapter.ts
git commit -m "chore: add receipt detective launch checklist"
```

---

## Self-Review

### Spec Coverage

- 3-question quiz flow: Task 2 and Task 5.
- Case result screen: Task 2 and Task 5.
- 5 case result templates: Task 2.
- Clue cards: Task 2 and Task 5.
- Rewarded ad integration: Task 4.
- Toss Point 1 won grant for non-game: Task 4.
- Duplicate grant prevention: Task 3 and Task 4.
- No fixed per-user daily cap: Task 4 and Task 6 checklist.
- Budget/ad/failure fallback states: Task 5 and Task 6 checklist.
- Copy restrictions around Toss Point: Task 6 checklist.

### Placeholder Scan

This plan intentionally avoids incomplete implementation placeholders. The only future-facing items are operational console values, represented as concrete test defaults in `.env.example`.

### Type Consistency

- `QuizAnswers` is defined in `content.ts` and re-exported from `engine.ts`.
- `RewardAttemptStore` is defined in `rewardAttempts.ts` and consumed by `rewardFlow.ts`.
- `RewardedAdAdapter` and `PromotionAdapter` are dependency-injected into `runRewardedPointFlow`.
- UI imports only public exports from the feature modules.
