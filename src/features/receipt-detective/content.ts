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
  suspiciousSpend: SuspiciousSpend;
  situation: SpendSituation;
};

export type ClueCard = {
  kind: 'analysis' | 'mission';
  title: string;
  body: string;
};

export const QUESTIONS = [
  {
    id: 'suspiciousSpend',
    label: '오늘 가장 의심스러운 소비는?',
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
    label: '그 소비는 어떤 상황에서 발생했나요?',
    options: [
      { value: 'planned', label: '계획한 소비였어요' },
      { value: 'impulse', label: '갑자기 끌렸어요' },
      { value: 'stress', label: '스트레스 때문에 썼어요' },
      { value: 'habit', label: '그냥 습관처럼 썼어요' },
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
  planned: '계획된 소비라 사건 현장은 비교적 차분해요.',
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
    delivery_night: '야식 주문 전 물 한 컵 마시기',
    shopping: '장바구니에 담고 하루 미루기',
    transport: '가까운 거리는 걸어가기',
  },
  '3000': {
    convenience_store: '내일 편의점 앞에서 10초만 멈춰보기',
    cafe: '내일 카페 결제 한 번 쉬어가기',
    delivery_night: '내일 야식 앱 열기 전에 10분 기다리기',
    shopping: '내일 즉시 구매 대신 찜만 하기',
    transport: '내일 택시 대신 대중교통 한 번 선택하기',
  },
  '5000_plus': {
    convenience_store: '편의점 방문을 하루 두 번 이하로 줄이기',
    cafe: '카페 대신 집이나 사무실 음료 선택하기',
    delivery_night: '내일 배달/야식 하루 쉬기',
    shopping: '내일 새 상품 구매하지 않기',
    transport: '이동 전 최저 비용 경로 확인하기',
  },
  hard: {
    convenience_store: '편의점 결제 전 영수증 탐정 떠올리기',
    cafe: '커피 주문 전 오늘 이미 마셨는지 확인하기',
    delivery_night: '야식 주문 전 배고픔 점수 매기기',
    shopping: '구매 전 필요한 이유 세 줄 적기',
    transport: '이동 전 급한 일정인지 확인하기',
  },
};

export const EXTRA_CLUE_CARDS: ClueCard[] = [
  { kind: 'analysis', title: '위험 시간대', body: '밤 시간대 소비가 사건의 주요 단서일 수 있어요.' },
  { kind: 'analysis', title: '충동구매 신호', body: '계획하지 않은 결제가 사건 현장에 남아 있어요.' },
  { kind: 'analysis', title: '위험 카테고리', body: '작은 반복 지출이 가장 또렷한 흔적을 남겼어요.' },
  { kind: 'mission', title: '10초 멈춤', body: '결제 전 10초만 멈추면 사건이 작아질 수 있어요.' },
  { kind: 'mission', title: '하루 미루기', body: '오늘 사고 싶었던 것을 내일까지 미뤄봐요.' },
  { kind: 'mission', title: '카페 쉬는 날', body: '내일은 커피 한 잔을 쉬어가요.' },
  { kind: 'mission', title: '편의점 패스', body: '내일 편의점 방문을 한 번만 줄여봐요.' },
  { kind: 'analysis', title: '반복 소비', body: '습관처럼 결제한 흔적은 오래 남아요.' },
  { kind: 'analysis', title: '작은 결제', body: '작은 금액도 자주 모이면 사건이 커져요.' },
  { kind: 'mission', title: '물 한 컵', body: '야식 주문 전 물 한 컵으로 신호를 확인해요.' },
  { kind: 'analysis', title: '감정 소비', body: '기분이 지출의 방향을 바꾼 흔적이 보여요.' },
  { kind: 'mission', title: '앱 닫기', body: '결제 앱을 열었다면 한 번 닫고 다시 생각해요.' },
  { kind: 'analysis', title: '점심 후 단서', body: '오후의 작은 보상이 지출로 이어졌을 수 있어요.' },
  { kind: 'mission', title: '대체 보상', body: '소비 대신 산책이나 음악으로 보상을 바꿔봐요.' },
  { kind: 'analysis', title: '배달 흔적', body: '피곤한 날에는 배달 단서가 더 진하게 남아요.' },
  { kind: 'mission', title: '10분 대기', body: '주문 전 10분만 기다려도 단서가 희미해져요.' },
  { kind: 'analysis', title: '쇼핑 흔적', body: '장바구니에 오래 머문 상품이 사건의 열쇠예요.' },
  { kind: 'mission', title: '찜만 하기', body: '구매 대신 찜 목록에만 보관해요.' },
  { kind: 'analysis', title: '교통 단서', body: '급한 이동일수록 비용이 커지는 경향이 있어요.' },
  { kind: 'mission', title: '경로 비교', body: '출발 전 이동 경로를 한 번만 비교해요.' },
  { kind: 'analysis', title: '보상 심리', body: '수고한 날의 보상 결제가 단서로 남았어요.' },
  { kind: 'mission', title: '무료 보상', body: '오늘의 보상은 돈이 들지 않는 것으로 골라봐요.' },
  { kind: 'analysis', title: '아침 결제', body: '바쁜 아침의 자동 결제가 보입니다.' },
  { kind: 'mission', title: '미리 챙기기', body: '내일 아침 소비를 줄일 물건을 밤에 챙겨요.' },
  { kind: 'analysis', title: '저녁 결제', body: '피로가 쌓인 저녁에는 판단이 느슨해질 수 있어요.' },
  { kind: 'mission', title: '밤 결제 금지선', body: '밤 10시 이후 결제는 한 번 더 확인해요.' },
  { kind: 'analysis', title: '단골 루트', body: '자주 가는 동선에 지출 단서가 숨어 있어요.' },
  { kind: 'mission', title: '동선 바꾸기', body: '내일은 유혹이 적은 길로 이동해요.' },
  { kind: 'analysis', title: '묶음 구매', body: '할인처럼 보인 묶음 구매가 지출을 키웠을 수 있어요.' },
  { kind: 'mission', title: '필요 수량', body: '구매 전 정말 필요한 개수를 먼저 정해요.' },
  { kind: 'analysis', title: '오늘의 결론', body: '가장 좋은 단서는 다음 결제 전 잠깐의 멈춤이에요.' },
];

