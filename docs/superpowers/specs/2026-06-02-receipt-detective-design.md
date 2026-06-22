# Receipt Detective v1 Design

## Overview

`영수증 탐정` is a non-game Apps in Toss mini app for lightweight spending habit reflection. The user answers a 3-question spending quiz, receives a cute detective-style "today's spending case" result, and can watch rewarded ads repeatedly to receive Toss Point rewards and extra clue cards.

The product should feel like "solve one spending case and receive 1 Toss Point" rather than a heavy budgeting app.

## Goals

- Let users complete the main flow within 30 to 60 seconds.
- Make the first screen actionable with no landing or explanation page.
- Monetize primarily through rewarded ads.
- Grant `토스 포인트 1원` after each successfully completed rewarded ad.
- Keep the app categorized as non-game: spending habits / lifestyle.
- Pair every rewarded ad with useful or playful content so the app does not feel like an ad-only reward screen.

## Non-Goals

- Do not integrate real card transaction data in v1.
- Do not implement OCR or actual receipt scanning in v1.
- Do not create cash-out language or an internal currency named "포인트".
- Do not rely on chance-based rewards.
- Do not add complex account, budget, or household ledger features.

## User Flow

### 1. Quiz Screen

The app opens directly on the quiz screen.

Content:

- Header: `영수증 탐정`
- Prompt: `오늘의 소비 사건을 조사해볼까요?`
- Current question and answer choices
- CTA: `다음 단서 찾기`

Behavior:

- The user answers 3 questions.
- After the third answer, the app moves to the case result screen.
- Progress should be visible as `1/3`, `2/3`, `3/3`.

### 2. Case Result Screen

The app shows a cute spending case result based on the quiz answers.

Content:

- Case name, for example:
  - `편의점 잠입 사건`
  - `야식 미스터리`
  - `카페 지출 사건`
  - `쇼핑 충동 사건`
  - `교통비 추적 사건`
- Detective comment
- One free clue card
- CTA: `광고 보고 토스 포인트 1원 받기`
- Secondary CTA: `내일 미션 확인하기`

Behavior:

- The free clue card is shown without ad viewing.
- The rewarded ad CTA starts the rewarded ad flow.

### 3. Rewarded Ad Flow

Content before ad:

- Button label: `광고 보고 토스 포인트 1원 받기`
- Supporting copy: `광고를 끝까지 보면 토스 포인트 1원과 추가 단서 카드 1장을 받을 수 있어요.`

Behavior:

- Load and show a rewarded ad.
- Grant Toss Point only after a verified ad completion callback.
- Prevent duplicate grant for the same reward attempt.
- After reward processing, move to the reward complete screen.

### 4. Reward Complete Screen

Content:

- Message: `토스 포인트 1원 지급 완료`
- One extra clue card
- CTA: `단서 더 찾기`

Behavior:

- `단서 더 찾기` lets the user watch another rewarded ad.
- Rewarded ad viewing is repeatable.
- Operational safety rules can stop Toss Point grants if budget, fraud, or ad availability conditions fail.

### 5. Limit / Fallback Screen

Show this state when:

- Promotion budget is exhausted.
- Rewarded ad is unavailable.
- Reward grant fails.
- Abnormal behavior is detected.

Content examples:

- `오늘 지급 가능한 보상이 모두 소진됐어요.`
- `광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.`
- `포인트 지급 확인 중이에요. 중복 지급을 막기 위해 잠시 기다려 주세요.`

Behavior:

- The app may still provide non-point clue or mission content.
- Do not promise Toss Point if the system cannot grant it.

## Quiz Design

Question 1: `오늘 가장 의심되는 소비는?`

- `편의점`
- `카페`
- `배달/야식`
- `쇼핑`
- `교통/이동`

Question 2: `이 소비는 어떤 상황에서 발생했나요?`

- `계획한 소비였어요`
- `갑자기 샀어요`
- `스트레스 때문에 샀어요`
- `그냥 습관처럼 샀어요`

Question 3: `내일 줄일 수 있다면 어느 정도?`

- `1,000원`
- `3,000원`
- `5,000원 이상`
- `못 줄일 것 같아요`

## Result Logic

The result engine can be deterministic in v1.

- Question 1 chooses the primary case category.
- Question 2 modifies the detective comment and risk label.
- Question 3 selects the next-day saving mission difficulty.

Example:

- Q1: `편의점`
- Q2: `갑자기 샀어요`
- Q3: `3,000원`
- Result: `편의점 잠입 사건`
- Comment: `갑작스러운 소비 단서가 발견됐어요. 내일은 편의점 앞에서 10초만 멈춰봐요.`

## Clue Cards

Clue cards mix spending analysis and saving missions.

### Spending Analysis Cards

Examples:

- `오늘의 범인`: `오늘의 범인은 편의점 잠입 사건이에요.`
- `위험 카테고리`: `간식비 단서가 가장 선명하게 남아 있어요.`
- `충동구매 신호`: `계획하지 않은 소비가 사건 현장에 남아 있어요.`
- `위험 시간대`: `밤 시간대 소비를 조심해볼 만해요.`

### Saving Mission Cards

Examples:

- `내일 편의점 1회 참기`
- `커피 1잔 줄이기`
- `야식 시간 피하기`
- `결제 전 10초 멈추기`
- `오늘 사고 싶었던 것 하루 미루기`

## Monetization

Primary monetization is rewarded ads.

Reward policy:

- Successful rewarded ad completion grants `토스 포인트 1원`.
- Each successful rewarded ad also reveals one additional clue card.
- Users can repeatedly watch rewarded ads.
- There is no fixed per-user daily reward count cap in v1.
- Reward grants may still stop because of total promotion budget exhaustion, ad unavailability, failed verification, or abnormal behavior detection.

Profit model:

- Revenue per ad impression depends on ad eCPM.
- Gross margin per reward attempt is approximately:
  - ad revenue per completed view
  - minus Toss Point grant cost
  - minus operational costs

Operational rule:

- Continue the `1원` reward policy only while average ad revenue per completed view remains safely above the reward cost.
- If revenue falls below the safe threshold or promotion budget is exhausted, stop Toss Point grants and show the limit state.

## Toss Point / Promotion Rules

Use Apps in Toss promotion functionality for Toss Point grants.

Required safeguards:

- Grant only after verified rewarded ad completion.
- Create a unique reward attempt ID for every ad attempt.
- Prevent duplicate grant for the same attempt.
- Do not enforce a fixed per-user daily cap for normal users in v1.
- Track grant status: `created`, `ad_completed`, `grant_requested`, `grant_completed`, `grant_failed`.
- Use server-to-server promotion grant for v1 if Apps in Toss setup allows it; otherwise use client-side grant with the same attempt-state safeguards.
- Keep a promotion budget cap.
- Detect abnormal repeated attempts and pause grants for suspicious sessions.

Copy rules:

- Use `토스 포인트 1원 지급` when referring to real Toss Point grants.
- Do not name internal app rewards `포인트`.
- Use names like `단서 카드`, `배지`, or `탐정 기록` for internal rewards.
- Do not use words that imply cash withdrawal or conversion.

## MVP Scope

Build only:

- 3-question quiz flow
- Case result screen
- 5 to 8 case result templates
- Around 30 clue cards
- Rewarded ad integration
- Toss Point 1 won promotion grant
- Reward attempt logging
- Duplicate grant prevention
- Budget exhausted and ad unavailable states

## Success Metrics

- Quiz completion rate
- Rewarded ad start rate from result screen
- Rewarded ad completion rate
- Average rewarded ads watched per user
- Toss Point grant success rate
- Duplicate grant prevention incidents
- Average ad revenue per completed view
- Margin after Toss Point grant cost
- Next-day return rate

## Open Implementation Decisions

- Exact Apps in Toss SDK APIs and required app version checks.
- Exact fraud detection thresholds.
- Exact promotion budget and kill-switch policy.
- Final visual style and character assets.
