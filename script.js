/* ============================================================
   script.js — 타자 연습 게임 메인 로직
   ============================================================ */

/* ----------------------------------------------------------
   1. 단어 데이터베이스
   ---------------------------------------------------------- */
const WORD_LIST = {
  easy: [
    "cat", "dog", "run", "fly", "eat", "sun", "map", "key",
    "cup", "hat", "red", "big", "pen", "box", "arm", "leg",
    "eye", "sky", "sea", "car", "bus", "fan", "bag", "bed",
    "ice", "egg", "ant", "bee", "fox", "owl", "cow", "hen",
    "사과", "바나나", "고양이", "강아지", "하늘", "바다", "나무",
    "꽃", "별", "달", "해", "비", "눈", "불", "물", "집"
  ],
  normal: [
    "apple", "brain", "cloud", "dance", "eagle", "flame", "grape",
    "happy", "image", "juice", "knife", "light", "magic", "night",
    "ocean", "piano", "queen", "river", "sharp", "tiger", "ultra",
    "voice", "water", "yellow", "zipper", "bridge", "castle", "dragon",
    "forest", "garden", "hunter", "island", "jungle", "kitten", "lemon",
    "monkey", "nugget", "orange",
    "컴퓨터", "키보드", "마우스", "프린터", "모니터", "스마트폰",
    "자동차", "비행기", "기차역", "도서관", "영화관", "수영장",
    "피자가게", "커피숍", "편의점", "약국"
  ],
  hard: [
    "adventure", "beautiful", "celebrate", "dangerous", "efficient",
    "fantastic", "gorgeous", "happiness", "important", "justified",
    "knowledge", "laughable", "necessary", "orchestra", "perfectly",
    "qualified", "resources", "structure", "telephone", "universal",
    "variation", "wonderful", "algorithm", "benchmark", "carefully",
    "dashboard", "establish", "framework", "gradients", "highlight",
    "interview", "javascript", "keyboards", "lightning", "marketing",
    "nutrition", "objective", "questions", "reference", "startling",
    "technical", "uncertain", "validated", "workspace",
    "인공지능", "빅데이터", "사물인터넷", "클라우드컴퓨팅",
    "프로그래밍", "알고리즘", "데이터베이스", "머신러닝",
    "딥러닝기술", "블록체인", "메타버스", "가상현실"
  ]
};

const DIFF_LABEL = { easy: "쉬움", normal: "보통", hard: "어려움" };

/* ----------------------------------------------------------
   2. 게임 상태 변수
   ---------------------------------------------------------- */
let currentWord       = "";
let score             = 0;
let highScore         = 0;
let timeLeft          = 60;
let timerInterval     = null;
let isGameRunning     = false;
let currentDifficulty = "easy";
let totalAttempts     = 0;
let correctAttempts   = 0;
let totalCharsTyped   = 0;
let customWordList    = null;
let finalScore        = 0;

/* ----------------------------------------------------------
   3. DOM 요소 캐싱
   ---------------------------------------------------------- */
const timerEl            = document.getElementById("timer");
const scoreEl            = document.getElementById("score");
const highScoreEl        = document.getElementById("highScore");
const currentWordEl      = document.getElementById("currentWord");
const wordInputEl        = document.getElementById("wordInput");
const feedbackEl         = document.getElementById("feedback");
const startBtn           = document.getElementById("startBtn");
const restartBtn         = document.getElementById("restartBtn");
const gameOverEl         = document.getElementById("gameOverScreen");
const finalScoreEl       = document.getElementById("finalScore");
const highScoreTxtEl     = document.getElementById("highScoreText");
const customWordsSection = document.getElementById("customWordsSection");
const premiumStatsEl     = document.getElementById("premiumStats");
const difficultySection  = document.getElementById("difficultySection");
const statAccuracy       = document.getElementById("statAccuracy");
const statTotal          = document.getElementById("statTotal");
const statWPM            = document.getElementById("statWPM");
const statCPM            = document.getElementById("statCPM");
const customWordsInput   = document.getElementById("customWordsInput");
const fileUploadEl       = document.getElementById("fileUpload");
const applyCustomWordsEl = document.getElementById("applyCustomWords");
const uploadStatus       = document.getElementById("uploadStatus");
const leaderboardEl      = document.getElementById("leaderboard");
const lbRowsEl           = document.getElementById("lbRows");
const rankSubmitEl       = document.getElementById("rankSubmit");
const nicknameInputEl    = document.getElementById("nicknameInput");
const rankSaveBtn        = document.getElementById("rankSaveBtn");
const rankSkipBtn        = document.getElementById("rankSkipBtn");
const rankSavedMsgEl     = document.getElementById("rankSavedMsg");
const viewRankBtn        = document.getElementById("viewRankBtn");
const clearRankBtn       = document.getElementById("clearRankBtn");

/* ----------------------------------------------------------
   4. 페이지 전환
   ---------------------------------------------------------- */
function showPage(page) {
  document.getElementById("mainPage").classList.add("hidden");
  document.getElementById("guidePage").classList.add("hidden");
  document.getElementById("privacyPage").classList.add("hidden");

  if (page === "guide")        document.getElementById("guidePage").classList.remove("hidden");
  else if (page === "privacy") document.getElementById("privacyPage").classList.remove("hidden");
  else {
    document.getElementById("mainPage").classList.remove("hidden");
    renderLeaderboard();
  }
  window.scrollTo(0, 0);
}

/* ----------------------------------------------------------
   5. 순위보드
   ---------------------------------------------------------- */
function loadLeaderboard() {
  try { return JSON.parse(localStorage.getItem("typingLeaderboard") || "[]"); }
  catch { return []; }
}

function saveLeaderboardData(entries) {
  localStorage.setItem("typingLeaderboard", JSON.stringify(entries));
}

function renderLeaderboard() {
  const entries = loadLeaderboard();
  if (entries.length === 0) { leaderboardEl.classList.add("hidden"); return; }
  leaderboardEl.classList.remove("hidden");
  lbRowsEl.innerHTML = "";
  entries.forEach((entry, i) => {
    const row = document.createElement("div");
    const medalClass = i === 0 ? "lb-gold" : i === 1 ? "lb-silver" : i === 2 ? "lb-bronze" : "";
    row.className = "lb-row" + (medalClass ? " " + medalClass : "");
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : String(i + 1);
    row.innerHTML = `
      <span class="lb-rank">${medal}</span>
      <span class="lb-nick">${escapeHtml(entry.nickname)}</span>
      <span class="lb-diff">${DIFF_LABEL[entry.difficulty] || entry.difficulty}</span>
      <span class="lb-score">${entry.score}</span>
      <span class="lb-date">${entry.date}</span>
    `;
    lbRowsEl.appendChild(row);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function submitToLeaderboard() {
  const nick = nicknameInputEl.value.trim();
  if (!nick) { nicknameInputEl.focus(); return; }
  const entries = loadLeaderboard();
  entries.push({
    nickname: nick,
    score: finalScore,
    difficulty: currentDifficulty,
    date: new Date().toLocaleDateString("ko-KR"),
  });
  entries.sort((a, b) => b.score - a.score);
  saveLeaderboardData(entries.slice(0, 10));
  rankSubmitEl.classList.add("hidden");
  rankSavedMsgEl.classList.remove("hidden");
}

/* ----------------------------------------------------------
   6. 초기화
   ---------------------------------------------------------- */
function init() {
  highScore = parseInt(localStorage.getItem("typingHighScore") || "0", 10);
  highScoreEl.textContent = highScore;
  renderLeaderboard();
}

/* ----------------------------------------------------------
   7. 랜덤 단어 선택
   ---------------------------------------------------------- */
function getRandomWord() {
  const list = (customWordList && customWordList.length > 0)
    ? customWordList : WORD_LIST[currentDifficulty];
  let word;
  do { word = list[Math.floor(Math.random() * list.length)]; }
  while (word === currentWord && list.length > 1);
  return word;
}

/* ----------------------------------------------------------
   8. 새 단어 표시
   ---------------------------------------------------------- */
function showNewWord() {
  currentWord = getRandomWord();
  currentWordEl.textContent = currentWord;
  currentWordEl.classList.remove("word-anim");
  void currentWordEl.offsetWidth;
  currentWordEl.classList.add("word-anim");
}

/* ----------------------------------------------------------
   9. 게임 시작
   ---------------------------------------------------------- */
function startGame() {
  score = 0; timeLeft = 60;
  totalAttempts = 0; correctAttempts = 0; totalCharsTyped = 0; finalScore = 0;

  scoreEl.textContent = "0";
  timerEl.textContent = "60";
  timerEl.classList.remove("danger");
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
  wordInputEl.value = "";
  wordInputEl.disabled = false;
  wordInputEl.focus();

  gameOverEl.classList.add("hidden");
  leaderboardEl.classList.add("hidden");
  startBtn.classList.add("hidden");
  difficultySection.classList.add("hidden");

  isGameRunning = true;
  showNewWord();
  timerInterval = setInterval(tick, 1000);
}

/* ----------------------------------------------------------
   10. 타이머 tick
   ---------------------------------------------------------- */
function tick() {
  timeLeft--;
  timerEl.textContent = timeLeft;
  if (timeLeft <= 5) timerEl.classList.add("danger");
  if (timeLeft <= 0) endGame();
}

/* ----------------------------------------------------------
   11. 게임 종료
   ---------------------------------------------------------- */
function endGame() {
  clearInterval(timerInterval);
  timerInterval = null;
  isGameRunning = false;

  wordInputEl.disabled = true;
  wordInputEl.value = "";

  const isNewHigh = score > highScore;
  if (isNewHigh) {
    highScore = score;
    localStorage.setItem("typingHighScore", String(highScore));
    highScoreEl.textContent = highScore;
  }

  finalScore = score;
  finalScoreEl.textContent = score;
  highScoreTxtEl.textContent = isNewHigh
    ? "🏆 새로운 최고 기록!"
    : `최고 기록: ${highScore}점`;

  const accuracy = totalAttempts > 0
    ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
  statAccuracy.textContent = `${accuracy}%`;
  statTotal.textContent    = totalAttempts;
  statWPM.textContent      = correctAttempts;
  statCPM.textContent      = totalCharsTyped;
  premiumStatsEl.classList.remove("hidden");

  nicknameInputEl.value = "";
  rankSubmitEl.classList.remove("hidden");
  rankSavedMsgEl.classList.add("hidden");

  gameOverEl.classList.remove("hidden");
  startBtn.classList.add("hidden");
  difficultySection.classList.remove("hidden");

  setTimeout(() => nicknameInputEl.focus(), 100);
}

/* ----------------------------------------------------------
   12. 입력 처리
   ---------------------------------------------------------- */
function handleInput(e) {
  if (!isGameRunning) return;
  const typed = wordInputEl.value.trim();
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    submitWord(typed);
    return;
  }
  wordInputEl.style.borderColor = typed.length > 0
    ? (currentWord.startsWith(typed) ? "var(--color-success)" : "var(--color-error)")
    : "";
}

/* ----------------------------------------------------------
   13. 단어 제출
   ---------------------------------------------------------- */
function submitWord(typed) {
  if (!typed) return;
  totalAttempts++;
  if (typed === currentWord) {
    correctAttempts++;
    totalCharsTyped += currentWord.length;
    score++;
    scoreEl.textContent = score;
    feedbackEl.textContent = "✓ 정답!";
    feedbackEl.className = "feedback correct";
    const wd = document.querySelector(".word-display");
    wd.classList.add("flash-correct");
    setTimeout(() => wd.classList.remove("flash-correct"), 350);
    wordInputEl.value = "";
    wordInputEl.style.borderColor = "";
    showNewWord();
  } else {
    feedbackEl.textContent = "✗ 틀렸습니다";
    feedbackEl.className = "feedback wrong";
    wordInputEl.classList.add("shake-wrong");
    setTimeout(() => wordInputEl.classList.remove("shake-wrong"), 300);
    wordInputEl.value = "";
    wordInputEl.style.borderColor = "";
  }
  setTimeout(() => { feedbackEl.textContent = ""; feedbackEl.className = "feedback"; }, 700);
}

/* ----------------------------------------------------------
   14. 난이도 버튼
   ---------------------------------------------------------- */
function handleDifficultyClick(e) {
  const btn = e.target.closest(".diff-btn");
  if (!btn || isGameRunning) return;
  document.querySelectorAll(".diff-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentDifficulty = btn.dataset.level;
}

/* ----------------------------------------------------------
   15. 커스텀 단어
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
  reader.onload = ev => {
    customWordsInput.value = ev.target.result;
    uploadStatus.textContent = `✓ '${file.name}' 파일을 불러왔습니다.`;
    uploadStatus.style.color = "var(--color-success)";
  };
  reader.readAsText(file, "UTF-8");
}

function handleApplyCustomWords() {
  const words = customWordsInput.value.trim().split("\n").map(w => w.trim()).filter(w => w.length > 0);
  if (words.length < 5) {
    uploadStatus.textContent = "⚠ 최소 5개 이상의 단어를 입력하세요.";
    uploadStatus.style.color = "var(--color-error)";
    return;
  }
  customWordList = words;
  uploadStatus.textContent = `✓ ${words.length}개 단어가 적용되었습니다!`;
  uploadStatus.style.color = "var(--color-success)";
}

/* ----------------------------------------------------------
   16. 이벤트 등록
   ---------------------------------------------------------- */
startBtn.addEventListener("click", startGame);

restartBtn.addEventListener("click", () => {
  gameOverEl.classList.add("hidden");
  startBtn.classList.remove("hidden");
  difficultySection.classList.remove("hidden");
  renderLeaderboard();
  startGame();
});

wordInputEl.addEventListener("keydown", handleInput);
wordInputEl.addEventListener("input", handleInput);
wordInputEl.addEventListener("keydown", e => { if (e.key === " ") e.preventDefault(); });

document.querySelector(".difficulty-buttons").addEventListener("click", handleDifficultyClick);
fileUploadEl.addEventListener("change", handleFileUpload);
applyCustomWordsEl.addEventListener("click", handleApplyCustomWords);

rankSaveBtn.addEventListener("click", submitToLeaderboard);
nicknameInputEl.addEventListener("keydown", e => { if (e.key === "Enter") submitToLeaderboard(); });
rankSkipBtn.addEventListener("click", () => {
  gameOverEl.classList.add("hidden");
  startBtn.classList.remove("hidden");
  renderLeaderboard();
});
viewRankBtn.addEventListener("click", () => {
  gameOverEl.classList.add("hidden");
  startBtn.classList.remove("hidden");
  renderLeaderboard();
});
clearRankBtn.addEventListener("click", () => {
  if (confirm("순위보드를 초기화할까요?")) {
    saveLeaderboardData([]);
    renderLeaderboard();
  }
});

/* ----------------------------------------------------------
   17. 시작
   ---------------------------------------------------------- */
init();
