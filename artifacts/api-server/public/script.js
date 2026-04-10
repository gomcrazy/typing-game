/* ============================================================
   script.js — 타자 연습 게임 메인 로직
   ============================================================ */

/* ----------------------------------------------------------
   1. 단어 데이터베이스
      - 난이도별로 단어 길이를 명확히 구분
      - easy: 3~4글자 / normal: 5~7글자 / hard: 8~12글자
   ---------------------------------------------------------- */
const WORD_LIST = {
  easy: [
    // 영어 단어 (3~4글자)
    "cat", "dog", "run", "fly", "eat", "sun", "map", "key",
    "cup", "hat", "red", "big", "pen", "box", "arm", "leg",
    "eye", "sky", "sea", "car", "bus", "fan", "bag", "bed",
    "ice", "egg", "ant", "bee", "fox", "owl", "cow", "hen",
    // 한글 단어 (2~3자)
    "사과", "바나나", "고양이", "강아지", "하늘", "바다", "나무",
    "꽃", "별", "달", "해", "비", "눈", "불", "물", "집"
  ],
  normal: [
    // 영어 단어 (5~7글자)
    "apple", "brain", "cloud", "dance", "eagle", "flame", "grape",
    "happy", "image", "juice", "knife", "light", "magic", "night",
    "ocean", "piano", "queen", "river", "sharp", "tiger", "ultra",
    "voice", "water", "xylophone", "yellow", "zipper", "bridge",
    "castle", "dragon", "forest", "garden", "hunter", "island",
    "jungle", "kitten", "lemon", "monkey", "nugget", "orange",
    // 한글 단어 (4~6자)
    "컴퓨터", "키보드", "마우스", "프린터", "모니터", "스마트폰",
    "자동차", "비행기", "기차역", "도서관", "영화관", "수영장",
    "피자가게", "커피숍", "편의점", "약국"
  ],
  hard: [
    // 영어 단어 (8~12글자)
    "adventure", "beautiful", "celebrate", "dangerous", "efficient",
    "fantastic", "gorgeous", "happiness", "important", "justified",
    "knowledge", "laughable", "marijuana", "necessary", "orchestra",
    "perfectly", "qualified", "resources", "structure", "telephone",
    "universal", "variation", "wonderful", "xylophone", "yesterday",
    "algorithm", "benchmark", "carefully", "dashboard", "establish",
    "framework", "gradients", "highlight", "interview", "javascript",
    "keyboards", "lightning", "marketing", "nutrition", "objective",
    "parallelism", "questions", "reference", "startling", "technical",
    "uncertain", "validated", "workspace", "xtremely", "yesterday",
    // 한글 단어 (6~9자)
    "인공지능", "빅데이터", "사물인터넷", "클라우드컴퓨팅",
    "프로그래밍", "알고리즘", "데이터베이스", "머신러닝",
    "딥러닝기술", "블록체인", "메타버스", "가상현실"
  ]
};

/* ----------------------------------------------------------
   2. 게임 상태 변수
   ---------------------------------------------------------- */
let currentWord = "";          // 현재 표시 중인 단어
let score = 0;                 // 현재 게임 점수
let highScore = 0;             // 최고 점수 (localStorage에서 불러옴)
let timeLeft = 60;             // 남은 시간 (초)
let timerInterval = null;      // 타이머 인터벌 ID
let isGameRunning = false;     // 게임 진행 중 여부
let isPremium = false;         // 프리미엄 여부
let currentDifficulty = "easy"; // 현재 선택된 난이도

// 프리미엄 전용 통계 변수
let totalAttempts = 0;         // 총 입력 시도 횟수
let correctAttempts = 0;       // 정답 횟수
let totalCharsTyped = 0;       // 정답 처리된 총 글자 수

// 커스텀 단어 리스트 (프리미엄 전용)
let customWordList = null;

/* ----------------------------------------------------------
   3. Stripe 설정 (실제 배포 시 키와 링크를 교체)
      - STRIPE_PAYMENT_LINK: Stripe Payment Link URL
        (예: https://buy.stripe.com/XXXXXXXXXXXXXXXX)
      - 결제 성공 후 ?session=success 파라미터로 돌아오면
        localStorage에 premium=true 저장
   ---------------------------------------------------------- */
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/PLACEHOLDER_REPLACE_WITH_REAL_LINK";
// 결제 성공 후 리다이렉트 될 URL (현재 페이지 + ?payment=success)
const SUCCESS_URL = `${window.location.origin}${window.location.pathname}?payment=success`;
const CANCEL_URL  = `${window.location.origin}${window.location.pathname}?payment=cancel`;

/* ----------------------------------------------------------
   4. DOM 요소 캐싱
   ---------------------------------------------------------- */
const timerEl      = document.getElementById("timer");
const scoreEl      = document.getElementById("score");
const highScoreEl  = document.getElementById("highScore");
const currentWordEl = document.getElementById("currentWord");
const wordInputEl  = document.getElementById("wordInput");
const feedbackEl   = document.getElementById("feedback");
const startBtn     = document.getElementById("startBtn");
const restartBtn   = document.getElementById("restartBtn");
const gameOverEl   = document.getElementById("gameOverScreen");
const finalScoreEl = document.getElementById("finalScore");
const highScoreTxtEl = document.getElementById("highScoreText");
const premiumBadge = document.getElementById("premiumBadge");
const premiumSection = document.getElementById("premiumSection");
const adTop        = document.getElementById("adTop");
const adBottom     = document.getElementById("adBottom");
const hardBtn      = document.getElementById("hardBtn");
const customWordsSection = document.getElementById("customWordsSection");
const premiumStatsEl = document.getElementById("premiumStats");
const difficultySection = document.getElementById("difficultySection");

// 프리미엄 통계 DOM
const statAccuracy = document.getElementById("statAccuracy");
const statTotal    = document.getElementById("statTotal");
const statWPM      = document.getElementById("statWPM");
const statCPM      = document.getElementById("statCPM");

// 커스텀 단어 DOM
const customWordsInput = document.getElementById("customWordsInput");
const fileUpload       = document.getElementById("fileUpload");
const applyCustomWords = document.getElementById("applyCustomWords");
const uploadStatus     = document.getElementById("uploadStatus");

/* ----------------------------------------------------------
   5. 초기화 함수 — 페이지 로드 시 실행
   ---------------------------------------------------------- */
function init() {
  // localStorage에서 최고 점수와 프리미엄 여부 불러오기
  highScore = parseInt(localStorage.getItem("typingHighScore") || "0", 10);
  isPremium = localStorage.getItem("premium") === "true";

  // UI 초기 반영
  highScoreEl.textContent = highScore;
  updatePremiumUI();

  // 결제 성공/취소 URL 파라미터 체크
  checkPaymentResult();
}

/* ----------------------------------------------------------
   6. 결제 결과 확인 (Stripe 리다이렉트 후 처리)
      - Stripe Payment Link 성공 시 ?payment=success 추가
      - 실제 서비스에서는 서버 측 webhook으로 검증해야 함
        (지금은 클라이언트 측에서만 처리하는 데모 방식)
   ---------------------------------------------------------- */
function checkPaymentResult() {
  const params = new URLSearchParams(window.location.search);
  const payment = params.get("payment");

  if (payment === "success") {
    // 결제 성공: 프리미엄 활성화 + localStorage 저장
    localStorage.setItem("premium", "true");
    isPremium = true;
    updatePremiumUI();
    alert("🎉 프리미엄 업그레이드 완료! 모든 기능이 해금되었습니다.");
    // URL에서 파라미터 제거
    window.history.replaceState({}, "", window.location.pathname);
  } else if (payment === "cancel") {
    alert("결제가 취소되었습니다.");
    window.history.replaceState({}, "", window.location.pathname);
  }
}

/* ----------------------------------------------------------
   7. 프리미엄 UI 업데이트
      - 프리미엄 여부에 따라 광고 / 배지 / 기능 표시 변경
   ---------------------------------------------------------- */
function updatePremiumUI() {
  if (isPremium) {
    // 광고 숨김
    adTop.classList.add("hidden");
    adBottom.classList.add("hidden");

    // 프리미엄 배지 표시
    premiumBadge.classList.remove("hidden");

    // Hard 난이도 해금
    hardBtn.classList.add("unlocked");
    hardBtn.textContent = "어려움 ⚡";

    // 커스텀 단어 업로드 섹션 표시
    customWordsSection.classList.remove("hidden");

    // 프리미엄 업그레이드 카드 숨김 (이미 프리미엄이므로)
    premiumSection.classList.add("hidden");
  } else {
    // 광고 표시
    adTop.classList.remove("hidden");
    adBottom.classList.remove("hidden");

    // 프리미엄 배지 숨김
    premiumBadge.classList.add("hidden");

    // Hard 난이도 잠금
    hardBtn.classList.remove("unlocked");
    hardBtn.textContent = "어려움 🔒";

    // 커스텀 단어 업로드 섹션 숨김
    customWordsSection.classList.add("hidden");

    // 프리미엄 업그레이드 카드 표시
    premiumSection.classList.remove("hidden");
  }
}

/* ----------------------------------------------------------
   8. 단어 가져오기
      - 커스텀 리스트가 있으면 사용, 없으면 현재 난이도 단어 사용
      - 현재 단어와 다른 단어가 나오도록 보장
   ---------------------------------------------------------- */
function getRandomWord() {
  let list;

  // 프리미엄 + 커스텀 단어가 설정된 경우 커스텀 리스트 우선
  if (isPremium && customWordList && customWordList.length > 0) {
    list = customWordList;
  } else {
    list = WORD_LIST[currentDifficulty];
  }

  // 현재 단어와 다른 단어 반환 (같은 단어 연속 방지)
  let word;
  do {
    word = list[Math.floor(Math.random() * list.length)];
  } while (word === currentWord && list.length > 1);

  return word;
}

/* ----------------------------------------------------------
   9. 새 단어 표시
   ---------------------------------------------------------- */
function showNewWord() {
  currentWord = getRandomWord();
  currentWordEl.textContent = currentWord;

  // 단어 등장 애니메이션
  currentWordEl.classList.remove("word-anim");
  void currentWordEl.offsetWidth; // 리플로우 강제 → 애니메이션 재실행
  currentWordEl.classList.add("word-anim");
}

/* ----------------------------------------------------------
   10. 게임 시작
   ---------------------------------------------------------- */
function startGame() {
  // 상태 초기화
  score = 0;
  timeLeft = 60;
  totalAttempts = 0;
  correctAttempts = 0;
  totalCharsTyped = 0;

  // UI 초기화
  scoreEl.textContent = "0";
  timerEl.textContent = "60";
  timerEl.classList.remove("danger");
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
  wordInputEl.value = "";
  wordInputEl.disabled = false;
  wordInputEl.focus();

  // 게임 화면 전환
  gameOverEl.classList.add("hidden");
  startBtn.classList.add("hidden");
  difficultySection.classList.add("hidden");

  // 첫 단어 표시
  isGameRunning = true;
  showNewWord();

  // 타이머 시작
  timerInterval = setInterval(tick, 1000);
}

/* ----------------------------------------------------------
   11. 타이머 tick (1초마다 호출)
   ---------------------------------------------------------- */
function tick() {
  timeLeft--;
  timerEl.textContent = timeLeft;

  // 5초 이하일 때 위험 표시
  if (timeLeft <= 5) {
    timerEl.classList.add("danger");
  }

  // 시간 종료
  if (timeLeft <= 0) {
    endGame();
  }
}

/* ----------------------------------------------------------
   12. 게임 종료
   ---------------------------------------------------------- */
function endGame() {
  // 타이머 중지
  clearInterval(timerInterval);
  timerInterval = null;
  isGameRunning = false;

  // 입력창 비활성화
  wordInputEl.disabled = true;
  wordInputEl.value = "";

  // 최고 점수 갱신
  const isNewHighScore = score > highScore;
  if (isNewHighScore) {
    highScore = score;
    localStorage.setItem("typingHighScore", String(highScore));
    highScoreEl.textContent = highScore;
  }

  // 종료 화면 표시
  finalScoreEl.textContent = score;
  highScoreTxtEl.textContent = isNewHighScore
    ? "🏆 새로운 최고 기록!"
    : `최고 기록: ${highScore}점`;

  // 프리미엄 통계 표시
  if (isPremium) {
    const accuracy = totalAttempts > 0
      ? Math.round((correctAttempts / totalAttempts) * 100)
      : 0;
    // WPM: 1분 기준 (60초 게임)
    const wpm = correctAttempts;
    // CPM: 분당 타수 (정답 처리된 글자 수)
    const cpm = totalCharsTyped;

    statAccuracy.textContent = `${accuracy}%`;
    statTotal.textContent = totalAttempts;
    statWPM.textContent = wpm;
    statCPM.textContent = cpm;
    premiumStatsEl.classList.remove("hidden");
  } else {
    premiumStatsEl.classList.add("hidden");
  }

  // 종료 화면 보이기
  gameOverEl.classList.remove("hidden");
  startBtn.classList.remove("hidden");
  difficultySection.classList.remove("hidden");

  // 시작 버튼을 종료 화면 안 버튼으로 교체
  startBtn.classList.add("hidden");
}

/* ----------------------------------------------------------
   13. 입력 처리 — 사용자가 입력할 때마다 호출
   ---------------------------------------------------------- */
function handleInput(e) {
  if (!isGameRunning) return;

  const typed = wordInputEl.value.trim();

  // 스페이스바 또는 엔터로 제출
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    submitWord(typed);
    return;
  }

  // 실시간 맞춤 여부 시각적 피드백 (입력 중)
  if (typed.length > 0) {
    if (currentWord.startsWith(typed)) {
      wordInputEl.style.borderColor = "var(--color-success)";
    } else {
      wordInputEl.style.borderColor = "var(--color-error)";
    }
  } else {
    wordInputEl.style.borderColor = "";
  }
}

/* ----------------------------------------------------------
   14. 단어 제출 처리
   ---------------------------------------------------------- */
function submitWord(typed) {
  if (!typed) return;

  totalAttempts++;

  if (typed === currentWord) {
    // 정답 처리
    correctAttempts++;
    totalCharsTyped += currentWord.length;
    score++;
    scoreEl.textContent = score;

    // 정답 피드백 표시
    feedbackEl.textContent = "✓ 정답!";
    feedbackEl.className = "feedback correct";

    // 단어 표시 영역 플래시
    const wordDisplay = document.querySelector(".word-display");
    wordDisplay.classList.add("flash-correct");
    setTimeout(() => wordDisplay.classList.remove("flash-correct"), 350);

    // 입력창 초기화 후 새 단어
    wordInputEl.value = "";
    wordInputEl.style.borderColor = "";
    showNewWord();

  } else {
    // 오답 처리
    feedbackEl.textContent = "✗ 틀렸습니다";
    feedbackEl.className = "feedback wrong";

    // 입력창 흔들기 애니메이션
    wordInputEl.classList.add("shake-wrong");
    setTimeout(() => wordInputEl.classList.remove("shake-wrong"), 300);

    // 오답 시 입력창 내용 지우기 (즉시 재입력 가능하게)
    wordInputEl.value = "";
    wordInputEl.style.borderColor = "";
  }

  // 피드백 메시지 일정 시간 후 지우기
  setTimeout(() => {
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
  }, 700);
}

/* ----------------------------------------------------------
   15. 난이도 버튼 클릭 처리
   ---------------------------------------------------------- */
function handleDifficultyClick(e) {
  const btn = e.target.closest(".diff-btn");
  if (!btn) return;
  if (isGameRunning) return; // 게임 중에는 난이도 변경 불가

  const level = btn.dataset.level;

  // Hard 난이도는 프리미엄 전용
  if (level === "hard" && !isPremium) {
    alert("Hard 난이도는 프리미엄 전용 기능입니다.\n아래 '프리미엄 업그레이드' 버튼을 클릭하세요.");
    return;
  }

  // 기존 active 제거 후 새 버튼에 active 적용
  document.querySelectorAll(".diff-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentDifficulty = level;
}

/* ----------------------------------------------------------
   16. Stripe 결제 버튼 클릭 처리
      - 실제 Stripe Payment Link로 이동
      - 성공 시 ?payment=success, 취소 시 ?payment=cancel로 돌아옴
   ---------------------------------------------------------- */
function handleStripePayment() {
  // Payment Link에 success_url 파라미터 추가 (Stripe 대시보드에서 설정 가능)
  // 현재는 placeholder URL이므로 안내 메시지 표시
  if (STRIPE_PAYMENT_LINK.includes("PLACEHOLDER")) {
    alert(
      "결제 시스템 안내\n\n" +
      "실제 배포 시 Stripe 대시보드에서 Payment Link를 생성하고\n" +
      "script.js의 STRIPE_PAYMENT_LINK 변수를 교체하세요.\n\n" +
      "[데모용] 아래 '프리미엄 토글' 버튼으로 프리미엄 기능을 체험해보세요."
    );
    return;
  }

  // 실제 결제 페이지로 이동
  // Stripe Payment Link에 redirect URL 파라미터 추가
  const url = `${STRIPE_PAYMENT_LINK}?success_url=${encodeURIComponent(SUCCESS_URL)}&cancel_url=${encodeURIComponent(CANCEL_URL)}`;
  window.location.href = url;
}

/* ----------------------------------------------------------
   17. 데모 프리미엄 토글 (테스트용)
      - 실제 서비스 배포 시 이 버튼/기능을 제거하세요
   ---------------------------------------------------------- */
function handleDemoToggle() {
  isPremium = !isPremium;
  localStorage.setItem("premium", isPremium ? "true" : "false");
  updatePremiumUI();

  if (isPremium) {
    alert("✨ [데모] 프리미엄 모드가 활성화되었습니다!");
  } else {
    alert("[데모] 프리미엄 모드가 비활성화되었습니다.");
  }
}

/* ----------------------------------------------------------
   18. 커스텀 단어 파일 업로드 처리 (프리미엄 전용)
   ---------------------------------------------------------- */
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.name.endsWith(".txt")) {
    uploadStatus.textContent = "⚠ .txt 파일만 업로드 가능합니다.";
    uploadStatus.style.color = "var(--color-error)";
    return;
  }

  const reader = new FileReader();
  reader.onload = function(ev) {
    customWordsInput.value = ev.target.result;
    uploadStatus.textContent = `✓ '${file.name}' 파일을 불러왔습니다.`;
    uploadStatus.style.color = "var(--color-success)";
  };
  reader.readAsText(file, "UTF-8");
}

/* ----------------------------------------------------------
   19. 커스텀 단어 적용 (프리미엄 전용)
   ---------------------------------------------------------- */
function handleApplyCustomWords() {
  const raw = customWordsInput.value.trim();
  if (!raw) {
    uploadStatus.textContent = "⚠ 단어를 입력하거나 파일을 업로드하세요.";
    uploadStatus.style.color = "var(--color-error)";
    return;
  }

  // 줄바꿈으로 분리, 빈 줄과 공백 제거
  const words = raw
    .split("\n")
    .map(w => w.trim())
    .filter(w => w.length > 0);

  if (words.length < 5) {
    uploadStatus.textContent = "⚠ 최소 5개 이상의 단어를 입력하세요.";
    uploadStatus.style.color = "var(--color-error)";
    return;
  }

  customWordList = words;
  uploadStatus.textContent = `✓ ${words.length}개 단어가 적용되었습니다. 게임에서 사용됩니다!`;
  uploadStatus.style.color = "var(--color-success)";
}

/* ----------------------------------------------------------
   20. 이벤트 리스너 등록
   ---------------------------------------------------------- */

// 게임 시작 버튼
startBtn.addEventListener("click", startGame);

// 다시 시작 버튼
restartBtn.addEventListener("click", () => {
  gameOverEl.classList.add("hidden");
  startBtn.classList.remove("hidden");
  difficultySection.classList.remove("hidden");
  startGame();
});

// 입력창 키 이벤트
wordInputEl.addEventListener("keydown", handleInput);
wordInputEl.addEventListener("input", handleInput);

// 난이도 버튼 (이벤트 위임)
document.querySelector(".difficulty-buttons")
  .addEventListener("click", handleDifficultyClick);

// Stripe 결제 버튼
document.getElementById("stripeBtn").addEventListener("click", handleStripePayment);

// 데모 프리미엄 토글
document.getElementById("demoToggle").addEventListener("click", handleDemoToggle);

// 커스텀 단어 파일 업로드
fileUpload.addEventListener("change", handleFileUpload);

// 커스텀 단어 적용
applyCustomWords.addEventListener("click", handleApplyCustomWords);

// 입력창 스페이스바 기본 동작 방지 (스크롤 방지)
wordInputEl.addEventListener("keydown", (e) => {
  if (e.key === " ") e.preventDefault();
});

/* ----------------------------------------------------------
   21. 페이지 로드 시 초기화 실행
   ---------------------------------------------------------- */
init();
