/* ============================================================
   script.js — 타자 연습 게임 메인 로직
   ============================================================ */

/* ----------------------------------------------------------
   0. API 베이스 URL
   gomcrazy.lol (GitHub Pages) 에서는 Replit 배포 서버로 요청
   ---------------------------------------------------------- */
const API_BASE = (function () {
  const h = window.location.hostname;
  if (h === "localhost" || h.endsWith("replit.dev") || h.endsWith("replit.app")) {
    return "";
  }
  return "https://type-speed-master.replit.app";
})();

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
    "꽃", "별", "달", "해", "비", "눈", "불", "물", "집",
    // +50
    "jam", "tin", "lip", "rib", "hip", "web", "net", "log", "rod", "pin",
    "bin", "mud", "oak", "ark", "elm", "ash", "hub", "jet", "jug", "keg",
    "lab", "lap", "lid", "mop", "nap",
    "길", "산", "강", "밥", "책", "문", "손", "발", "입", "귀",
    "코", "빛", "숲", "땅", "봄", "새", "구름", "돌", "풀", "바람",
    "여름", "하루", "파도", "나비", "오리"
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
    "피자가게", "커피숍", "편의점", "약국",
    // +50
    "amber", "blade", "charm", "depot", "ember", "frost", "globe",
    "hedge", "ivory", "joker", "karma", "lunar", "model", "noble",
    "orbit", "pixel", "quest", "rival", "scout", "solar",
    "track", "valor", "vapor", "waltz", "youth",
    "노트북", "초콜릿", "건강관리", "음악감상", "여행계획",
    "생일파티", "봄소풍", "여름휴가", "가을단풍", "겨울방학",
    "친구관계", "한국음식", "아이스크림", "도시생활", "방학여행",
    "공부하기", "운동하기", "책읽기", "영화보기", "요리하기",
    "사진찍기", "노래듣기", "게임하기", "산책하기", "동네카페"
  ],
  hard: [
    "adventure", "beautiful", "celebrate", "dangerous", "efficient",
    "fantastic", "gorgeous", "happiness", "important", "justified",
    "knowledge", "laughable", "necessary", "orchestra", "perfectly",
    "qualified", "resources", "structure", "telephone", "universal",
    "variation", "wonderful", "algorithm", "benchmark", "carefully",
    "dashboard", "establish", "framework", "gradients", "highlight",
    "interview", "javascript", "keyboards", "lightning", "marketing",
    "nutrition", "objective", "questions", "reference", "technical",
    "인공지능", "빅데이터", "사물인터넷", "클라우드컴퓨팅",
    "프로그래밍", "알고리즘", "데이터베이스", "머신러닝",
    "딥러닝기술", "블록체인", "메타버스", "가상현실",
    // +50
    "accomplish", "community", "completely", "dedicated", "essential",
    "frequency", "guarantee", "hurricane", "implement", "landscape",
    "mechanism", "operation", "otherwise", "potential", "principle",
    "prototype", "recommend", "regarding", "residence", "sensitive",
    "situation", "something", "together", "training", "ultimate",
    "정보통신기술", "오픈소스코드", "신재생에너지", "인공지능기술", "클라우드서비스",
    "빅데이터분석", "사이버보안위협", "증강현실기술", "자율주행자동차", "스마트홈시스템",
    "디지털마케팅", "환경보호운동", "우주항공기술", "나노기술혁신", "양자컴퓨팅기술",
    "로봇공학기술", "전자상거래플랫폼", "스마트팩토리", "핀테크서비스", "바이오기술혁신",
    "딥러닝알고리즘", "소셜네트워크서비스", "친환경에너지기술", "사이버공격방어", "데이터프라이버시"
  ]
};

const DIFF_LABEL = { easy: "쉬움", normal: "보통", hard: "어려움" };
const DIFF_EMOJI = { easy: "🟢", normal: "🟡", hard: "🔴" };

/* ----------------------------------------------------------
   2. 난이도 자동 판별 (서버와 동일 로직)
   ---------------------------------------------------------- */
function detectDifficulty(word) {
  const isKorean = /[\uac00-\ud7a3]/.test(word);
  const len = word.length;
  if (isKorean) {
    if (len <= 3) return "easy";
    if (len <= 5) return "normal";
    return "hard";
  } else {
    if (len <= 4) return "easy";
    if (len <= 7) return "normal";
    return "hard";
  }
}

/* ----------------------------------------------------------
   3. 기기 감지
   ---------------------------------------------------------- */
function detectDevice() {
  const touch = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
  const narrow = window.innerWidth <= 768;
  return touch && narrow ? "mobile" : "desktop";
}

let currentDevice = detectDevice();

function applyDevice() {
  currentDevice = detectDevice();
  const isMobile = currentDevice === "mobile";
  const body = document.body;

  if (isMobile) {
    body.classList.add("mobile");
    body.classList.remove("desktop");
  } else {
    body.classList.add("desktop");
    body.classList.remove("mobile");
  }

  /* 배지 & 힌트 업데이트 */
  const badge = document.getElementById("deviceBadge");
  if (badge) {
    badge.textContent = isMobile ? "📱 모바일" : "🖥 PC";
    badge.className = "device-badge device-" + currentDevice;
  }

  const subtitle = document.getElementById("subtitle");
  if (subtitle) subtitle.style.display = isMobile ? "none" : "";

  /* 입력창 placeholder 조정 */
  if (wordInputEl) {
    wordInputEl.placeholder = isGameRunning
      ? (isMobile ? "여기에 입력하고 Enter..." : "단어를 입력하고 Enter 또는 Space...")
      : "단어를 입력하세요...";
  }
}

window.addEventListener("resize", applyDevice);

/* ----------------------------------------------------------
   4. 게임 상태 변수
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
let finalScore        = 0;
let serverWordList    = [];

/* ----------------------------------------------------------
   5. DOM 요소 캐싱
   ---------------------------------------------------------- */
const timerEl             = document.getElementById("timer");
const scoreEl             = document.getElementById("score");
const highScoreEl         = document.getElementById("highScore");
const currentWordEl       = document.getElementById("currentWord");
const wordDisplayEl       = document.getElementById("wordDisplay");
const wordInputEl         = document.getElementById("wordInput");
const feedbackEl          = document.getElementById("feedback");
const startBtn            = document.getElementById("startBtn");
const restartBtn          = document.getElementById("restartBtn");
const gameOverEl          = document.getElementById("gameOverScreen");
const finalScoreEl        = document.getElementById("finalScore");
const highScoreTxtEl      = document.getElementById("highScoreText");
const premiumStatsEl      = document.getElementById("premiumStats");
const difficultySection   = document.getElementById("difficultySection");
const statAccuracy        = document.getElementById("statAccuracy");
const statTotal           = document.getElementById("statTotal");
const statWPM             = document.getElementById("statWPM");
const statCPM             = document.getElementById("statCPM");
const leaderboardEl       = document.getElementById("leaderboard");
const lbRowsEl            = document.getElementById("lbRows");
const rankSubmitEl        = document.getElementById("rankSubmit");
const nicknameInputEl     = document.getElementById("nicknameInput");
const rankSaveBtn         = document.getElementById("rankSaveBtn");
const rankSkipBtn         = document.getElementById("rankSkipBtn");
const rankSavedMsgEl      = document.getElementById("rankSavedMsg");
const viewRankBtn         = document.getElementById("viewRankBtn");
const clearRankBtn        = document.getElementById("clearRankBtn");
const wordSourceBadge     = document.getElementById("wordSourceBadge");
const mobileHint          = document.getElementById("mobileHint");

/* 제안 관련 */
const suggestToggleBtn    = document.getElementById("suggestToggleBtn");
const suggestArrow        = document.getElementById("suggestArrow");
const suggestBody         = document.getElementById("suggestBody");
const suggestInput        = document.getElementById("suggestInput");
const suggestSubmitBtn    = document.getElementById("suggestSubmitBtn");
const suggestStatus       = document.getElementById("suggestStatus");

/* 관리자 관련 */
const adminToggleBtn      = document.getElementById("adminToggleBtn");
const adminArrow          = document.getElementById("adminArrow");
const adminBody           = document.getElementById("adminBody");
const adminKeyInput       = document.getElementById("adminKeyInput");
const adminLoadBtn        = document.getElementById("adminLoadBtn");
const adminSuggestionsArea = document.getElementById("adminSuggestionsArea");
const suggestionStats     = document.getElementById("suggestionStats");
const selectAllCheck      = document.getElementById("selectAllCheck");
const selectAllLabel      = document.getElementById("selectAllLabel");
const suggestionList      = document.getElementById("suggestionList");
const approveSummary      = document.getElementById("approveSummary");
const approveCountText    = document.getElementById("approveCountText");
const approveBtn          = document.getElementById("approveBtn");
const clearSuggestionsBtn = document.getElementById("clearSuggestionsBtn");
const clearApprovedBtn    = document.getElementById("clearApprovedBtn");
const adminStatus         = document.getElementById("adminStatus");

/* ----------------------------------------------------------
   6. 페이지 전환
   ---------------------------------------------------------- */
function showPage(page) {
  document.getElementById("mainPage").classList.add("hidden");
  document.getElementById("guidePage").classList.add("hidden");
  document.getElementById("privacyPage").classList.add("hidden");
  document.getElementById("updatelogPage").classList.add("hidden");
  if (page === "guide")           document.getElementById("guidePage").classList.remove("hidden");
  else if (page === "privacy")    document.getElementById("privacyPage").classList.remove("hidden");
  else if (page === "updatelog")  document.getElementById("updatelogPage").classList.remove("hidden");
  else { document.getElementById("mainPage").classList.remove("hidden"); renderLeaderboard(); }
  window.scrollTo(0, 0);
}

/* ----------------------------------------------------------
   7. 순위보드
   ---------------------------------------------------------- */
function loadLeaderboard() {
  try { return JSON.parse(localStorage.getItem("typingLeaderboard") || "[]"); }
  catch { return []; }
}
function saveLeaderboardData(entries) {
  localStorage.setItem("typingLeaderboard", JSON.stringify(entries));
}
function escapeHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
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
function submitToLeaderboard() {
  const nick = nicknameInputEl.value.trim();
  if (!nick) { nicknameInputEl.focus(); return; }
  const entries = loadLeaderboard();
  entries.push({ nickname: nick, score: finalScore, difficulty: currentDifficulty,
    date: new Date().toLocaleDateString("ko-KR") });
  entries.sort((a, b) => b.score - a.score);
  saveLeaderboardData(entries.slice(0, 10));
  rankSubmitEl.classList.add("hidden");
  rankSavedMsgEl.classList.remove("hidden");
}

/* ----------------------------------------------------------
   8. 서버 공용 단어 로드
   ---------------------------------------------------------- */
function updateWordSourceBadge() {
  if (serverWordList.length >= 5) {
    wordSourceBadge.textContent = `🌐 공용 단어 ${serverWordList.length}개`;
    wordSourceBadge.className = "word-source-badge badge-server";
    difficultySection.classList.add("hidden");
  } else {
    wordSourceBadge.textContent = "📚 기본 단어";
    wordSourceBadge.className = "word-source-badge";
    if (!isGameRunning) difficultySection.classList.remove("hidden");
  }
}
function loadServerWords() {
  fetch(API_BASE + "/api/words")
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data.words) && data.words.length >= 5) {
        serverWordList = data.words;
        updateWordSourceBadge();
      }
    })
    .catch(() => {});
}

/* ----------------------------------------------------------
   9. 초기화
   ---------------------------------------------------------- */
function init() {
  highScore = parseInt(localStorage.getItem("typingHighScore") || "0", 10);
  highScoreEl.textContent = highScore;
  applyDevice();
  renderLeaderboard();
  loadServerWords();
}

/* ----------------------------------------------------------
   10. 단어 선택
   ---------------------------------------------------------- */
function getActiveList() {
  return serverWordList.length >= 5 ? serverWordList : WORD_LIST[currentDifficulty];
}
function getRandomWord() {
  const list = getActiveList();
  let word;
  do { word = list[Math.floor(Math.random() * list.length)]; }
  while (word === currentWord && list.length > 1);
  return word;
}
function showNewWord() {
  currentWord = getRandomWord();
  currentWordEl.textContent = currentWord;
  currentWordEl.classList.remove("word-anim");
  void currentWordEl.offsetWidth;
  currentWordEl.classList.add("word-anim");
  /* 모바일: 단어 바뀔 때 input 포커스 유지 */
  if (currentDevice === "mobile") setTimeout(() => wordInputEl.focus(), 50);
}

/* ----------------------------------------------------------
   11. 게임 시작 / tick / 종료
   ---------------------------------------------------------- */
function startGame() {
  score = 0; timeLeft = 60;
  totalAttempts = 0; correctAttempts = 0; totalCharsTyped = 0; finalScore = 0;
  scoreEl.textContent = "0";
  timerEl.textContent = "60";
  timerEl.classList.remove("danger");
  feedbackEl.textContent = ""; feedbackEl.className = "feedback";
  wordInputEl.value = ""; wordInputEl.disabled = false;
  wordInputEl.placeholder = currentDevice === "mobile"
    ? "여기에 입력하고 Enter..."
    : "단어를 입력하고 Enter 또는 Space...";
  gameOverEl.classList.add("hidden");
  leaderboardEl.classList.add("hidden");
  startBtn.classList.add("hidden");
  difficultySection.classList.add("hidden");
  isGameRunning = true;

  /* 모바일 힌트 표시 */
  if (mobileHint) {
    if (currentDevice === "mobile") mobileHint.classList.remove("hidden");
    else mobileHint.classList.add("hidden");
  }

  showNewWord();
  setTimeout(() => wordInputEl.focus(), 80);
  timerInterval = setInterval(tick, 1000);
}
function tick() {
  timeLeft--;
  timerEl.textContent = timeLeft;
  if (timeLeft <= 5) timerEl.classList.add("danger");
  if (timeLeft <= 0) endGame();
}
function endGame() {
  clearInterval(timerInterval); timerInterval = null; isGameRunning = false;
  wordInputEl.disabled = true; wordInputEl.value = "";
  if (mobileHint) mobileHint.classList.add("hidden");
  const isNewHigh = score > highScore;
  if (isNewHigh) { highScore = score; localStorage.setItem("typingHighScore", String(highScore)); highScoreEl.textContent = highScore; }
  finalScore = score;
  finalScoreEl.textContent = score;
  highScoreTxtEl.textContent = isNewHigh ? "🏆 새로운 최고 기록!" : `최고 기록: ${highScore}점`;
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
  statAccuracy.textContent = `${accuracy}%`;
  statTotal.textContent = totalAttempts;
  statWPM.textContent = correctAttempts;
  statCPM.textContent = totalCharsTyped;
  premiumStatsEl.classList.remove("hidden");
  nicknameInputEl.value = "";
  rankSubmitEl.classList.remove("hidden");
  rankSavedMsgEl.classList.add("hidden");
  gameOverEl.classList.remove("hidden");
  startBtn.classList.add("hidden");
  updateWordSourceBadge();
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
    if (!typed) return;
    totalAttempts++;
    if (typed === currentWord) {
      correctAttempts++; totalCharsTyped += currentWord.length; score++;
      scoreEl.textContent = score;
      feedbackEl.textContent = "✓ 정답!"; feedbackEl.className = "feedback correct";
      wordDisplayEl.classList.add("flash-correct");
      setTimeout(() => wordDisplayEl.classList.remove("flash-correct"), 350);
      wordInputEl.value = ""; wordInputEl.style.borderColor = "";
      showNewWord();
    } else {
      feedbackEl.textContent = "✗ 틀렸습니다"; feedbackEl.className = "feedback wrong";
      wordInputEl.classList.add("shake-wrong");
      setTimeout(() => wordInputEl.classList.remove("shake-wrong"), 300);
      wordInputEl.value = ""; wordInputEl.style.borderColor = "";
    }
    setTimeout(() => { feedbackEl.textContent = ""; feedbackEl.className = "feedback"; }, 700);
    return;
  }
  wordInputEl.style.borderColor = typed.length > 0
    ? (currentWord.startsWith(typed) ? "var(--color-success)" : "var(--color-error)") : "";
}

/* ----------------------------------------------------------
   13. 난이도 버튼
   ---------------------------------------------------------- */
function handleDifficultyClick(e) {
  const btn = e.target.closest(".diff-btn");
  if (!btn || isGameRunning) return;
  document.querySelectorAll(".diff-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentDifficulty = btn.dataset.level;
}

/* ----------------------------------------------------------
   14. 단어 디스플레이 탭 (모바일: 포커스 이동)
   ---------------------------------------------------------- */
function handleWordDisplayTap() {
  if (isGameRunning) wordInputEl.focus();
}

/* ----------------------------------------------------------
   15. 단어 제안 (사용자)
   ---------------------------------------------------------- */
function setStatus(el, msg, ok) {
  el.textContent = msg;
  el.style.color = ok ? "var(--color-success)" : "var(--color-error)";
}

async function handleSuggestSubmit() {
  const words = suggestInput.value.split(/[\n,]+/).map(w => w.trim()).filter(w => w.length > 0);
  if (words.length === 0) { setStatus(suggestStatus, "⚠ 단어를 입력하세요.", false); return; }
  suggestSubmitBtn.disabled = true;
  try {
    const res = await fetch(API_BASE + "/api/words/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      const dup = data.duplicates ? ` (이미 있는 단어 ${data.duplicates}개 제외)` : "";
      setStatus(suggestStatus, `✅ ${data.added}개 단어를 제안했습니다!${dup}`, true);
      suggestInput.value = "";
    } else { setStatus(suggestStatus, `⚠ ${data.error || "제안 실패"}`, false); }
  } catch { setStatus(suggestStatus, "⚠ 서버 연결 실패", false); }
  finally { suggestSubmitBtn.disabled = false; }
}

/* ----------------------------------------------------------
   16. 관리자 패널
   ---------------------------------------------------------- */
let allSuggestions = [];
let selectedIds = new Set();

function renderSuggestions() {
  const counts = { easy: 0, normal: 0, hard: 0 };
  allSuggestions.forEach(s => counts[s.difficulty]++);
  suggestionStats.innerHTML =
    `전체 ${allSuggestions.length}개 &nbsp;·&nbsp; ` +
    `${DIFF_EMOJI.easy} 쉬움 ${counts.easy} &nbsp; ` +
    `${DIFF_EMOJI.normal} 보통 ${counts.normal} &nbsp; ` +
    `${DIFF_EMOJI.hard} 어려움 ${counts.hard}`;
  updateSelectAllLabel();
  suggestionList.innerHTML = "";
  ["easy", "normal", "hard"].forEach(diff => {
    const group = allSuggestions.filter(s => s.difficulty === diff);
    if (group.length === 0) return;
    const groupEl = document.createElement("div");
    groupEl.className = "suggestion-group";
    groupEl.innerHTML = `<p class="suggestion-group-title">${DIFF_EMOJI[diff]} ${DIFF_LABEL[diff]} (${group.length}개)</p>`;
    const chips = document.createElement("div");
    chips.className = "suggestion-chips";
    group.forEach(s => {
      const chip = document.createElement("label");
      chip.className = `suggestion-chip chip-${diff}${selectedIds.has(s.id) ? " chip-checked" : ""}`;
      chip.dataset.id = s.id;
      chip.innerHTML = `<input type="checkbox" ${selectedIds.has(s.id) ? "checked" : ""} /><span>${escapeHtml(s.word)}</span>`;
      chip.querySelector("input").addEventListener("change", () => {
        if (chip.querySelector("input").checked) { selectedIds.add(s.id); chip.classList.add("chip-checked"); }
        else { selectedIds.delete(s.id); chip.classList.remove("chip-checked"); }
        updateSelectAllLabel();
        updateApproveSummary();
      });
      chips.appendChild(chip);
    });
    groupEl.appendChild(chips);
    suggestionList.appendChild(groupEl);
  });
  updateApproveSummary();
}
function updateSelectAllLabel() {
  selectAllCheck.checked = selectedIds.size === allSuggestions.length;
  selectAllLabel.textContent = `전체 선택 (${selectedIds.size}/${allSuggestions.length})`;
}
function updateApproveSummary() {
  if (selectedIds.size === 0) { approveSummary.classList.add("hidden"); return; }
  approveSummary.classList.remove("hidden");
  const sel = allSuggestions.filter(s => selectedIds.has(s.id));
  const sc = { easy: 0, normal: 0, hard: 0 };
  sel.forEach(s => sc[s.difficulty]++);
  approveCountText.textContent =
    `선택: ${selectedIds.size}개  (${DIFF_EMOJI.easy}${sc.easy}  ${DIFF_EMOJI.normal}${sc.normal}  ${DIFF_EMOJI.hard}${sc.hard})`;
  approveBtn.textContent = `✅ 선택한 ${selectedIds.size}개 전체 적용`;
}
selectAllCheck.addEventListener("change", () => {
  if (selectAllCheck.checked) {
    allSuggestions.forEach(s => selectedIds.add(s.id));
    document.querySelectorAll(".suggestion-chip").forEach(c => {
      c.classList.add("chip-checked"); c.querySelector("input").checked = true;
    });
  } else {
    selectedIds.clear();
    document.querySelectorAll(".suggestion-chip").forEach(c => {
      c.classList.remove("chip-checked"); c.querySelector("input").checked = false;
    });
  }
  updateSelectAllLabel(); updateApproveSummary();
});

async function adminLoadSuggestions() {
  const key = adminKeyInput.value.trim();
  if (!key) { setStatus(adminStatus, "⚠ 관리자 키를 먼저 입력하세요.", false); return; }
  adminLoadBtn.disabled = true;
  setStatus(adminStatus, "", true);
  try {
    const res = await fetch(API_BASE + "/api/words/suggestions", { headers: { "x-admin-key": key } });
    const data = await res.json();
    if (res.ok && data.suggestions) {
      allSuggestions = data.suggestions;
      selectedIds = new Set(allSuggestions.map(s => s.id));
      adminSuggestionsArea.classList.remove("hidden");
      renderSuggestions();
      if (allSuggestions.length === 0) {
        suggestionList.innerHTML = `<p style="text-align:center;padding:16px 0;color:var(--color-text-muted)">아직 제안된 단어가 없습니다.</p>`;
      }
    } else { setStatus(adminStatus, `⚠ ${data.error || "불러오기 실패"}`, false); }
  } catch { setStatus(adminStatus, "⚠ 서버 연결 실패", false); }
  finally { adminLoadBtn.disabled = false; }
}
async function handleApprove() {
  if (selectedIds.size === 0) { setStatus(adminStatus, "⚠ 적용할 단어를 선택하세요.", false); return; }
  const key = adminKeyInput.value.trim();
  approveBtn.disabled = true;
  try {
    const res = await fetch(API_BASE + "/api/words/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ ids: [...selectedIds] }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setStatus(adminStatus, `✅ ${data.count}개 단어가 전체 사용자에게 즉시 적용됐습니다!`, true);
      serverWordList = data.words;
      updateWordSourceBadge();
    } else { setStatus(adminStatus, `⚠ ${data.error || "적용 실패"}`, false); }
  } catch { setStatus(adminStatus, "⚠ 서버 연결 실패", false); }
  finally { approveBtn.disabled = false; }
}
async function handleClearSuggestions() {
  if (!confirm("제안 목록을 모두 삭제할까요?")) return;
  const key = adminKeyInput.value.trim();
  try {
    const res = await fetch(API_BASE + "/api/words/suggestions", { method: "DELETE", headers: { "x-admin-key": key } });
    const data = await res.json();
    if (res.ok && data.success) {
      allSuggestions = []; selectedIds.clear();
      adminSuggestionsArea.classList.add("hidden");
      setStatus(adminStatus, "✅ 제안 목록이 삭제됐습니다.", true);
    } else { setStatus(adminStatus, `⚠ ${data.error || "삭제 실패"}`, false); }
  } catch { setStatus(adminStatus, "⚠ 서버 연결 실패", false); }
}
async function handleClearApproved() {
  if (!confirm("현재 적용 중인 공용 단어를 초기화하고 기본 단어로 되돌릴까요?")) return;
  const key = adminKeyInput.value.trim();
  try {
    const res = await fetch(API_BASE + "/api/words", { method: "DELETE", headers: { "x-admin-key": key } });
    const data = await res.json();
    if (res.ok && data.success) {
      serverWordList = []; updateWordSourceBadge();
      setStatus(adminStatus, "✅ 공용 단어가 초기화됐습니다. 기본 단어를 사용합니다.", true);
    } else { setStatus(adminStatus, `⚠ ${data.error || "초기화 실패"}`, false); }
  } catch { setStatus(adminStatus, "⚠ 서버 연결 실패", false); }
}

/* ----------------------------------------------------------
   17. 이벤트 등록
   ---------------------------------------------------------- */
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", () => {
  gameOverEl.classList.add("hidden");
  startBtn.classList.remove("hidden");
  updateWordSourceBadge();
  renderLeaderboard();
  startGame();
});
wordInputEl.addEventListener("keydown", handleInput);
wordInputEl.addEventListener("input", handleInput);
wordInputEl.addEventListener("keydown", e => { if (e.key === " ") e.preventDefault(); });
wordInputEl.addEventListener("focus", () => {
  if (mobileHint && isGameRunning) mobileHint.classList.add("mobile-hint-active");
});
wordInputEl.addEventListener("blur", () => {
  if (mobileHint) mobileHint.classList.remove("mobile-hint-active");
});
wordDisplayEl.addEventListener("click", handleWordDisplayTap);

document.querySelector(".difficulty-buttons").addEventListener("click", handleDifficultyClick);

rankSaveBtn.addEventListener("click", submitToLeaderboard);
nicknameInputEl.addEventListener("keydown", e => { if (e.key === "Enter") submitToLeaderboard(); });
rankSkipBtn.addEventListener("click", () => {
  gameOverEl.classList.add("hidden");
  startBtn.classList.remove("hidden");
  updateWordSourceBadge();
  renderLeaderboard();
});
viewRankBtn.addEventListener("click", () => {
  gameOverEl.classList.add("hidden");
  startBtn.classList.remove("hidden");
  updateWordSourceBadge();
  renderLeaderboard();
});
clearRankBtn.addEventListener("click", () => {
  if (confirm("순위보드를 초기화할까요?")) { saveLeaderboardData([]); renderLeaderboard(); }
});

/* 접기/펼치기 — 단어 제안 */
suggestToggleBtn.addEventListener("click", () => {
  const hidden = suggestBody.classList.toggle("hidden");
  suggestArrow.textContent = hidden ? "▼" : "▲";
});
suggestSubmitBtn.addEventListener("click", handleSuggestSubmit);

/* 접기/펼치기 — 관리자 */
adminToggleBtn.addEventListener("click", () => {
  const hidden = adminBody.classList.toggle("hidden");
  adminArrow.textContent = hidden ? "▼" : "▲";
});
adminLoadBtn.addEventListener("click", adminLoadSuggestions);
adminKeyInput.addEventListener("keydown", e => { if (e.key === "Enter") adminLoadSuggestions(); });
approveBtn.addEventListener("click", handleApprove);
clearSuggestionsBtn.addEventListener("click", handleClearSuggestions);
clearApprovedBtn.addEventListener("click", handleClearApproved);

/* ----------------------------------------------------------
   18. 시작
   ---------------------------------------------------------- */
init();
