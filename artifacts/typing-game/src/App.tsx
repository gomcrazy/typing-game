import { useEffect, useRef, useState, useCallback } from "react";
import "./game.css";

/* ============================================================
   단어 데이터베이스
   - easy: 영어 3~4자 / 한글 2~3자 단어
   - normal: 영어 5~7자 / 한글 4~6자 단어
   - hard: 영어 8~12자 / 한글 6~9자 단어 (프리미엄 전용)
   ============================================================ */
const WORD_LIST = {
  easy: [
    "cat", "dog", "run", "fly", "eat", "sun", "map", "key",
    "cup", "hat", "red", "big", "pen", "box", "arm", "leg",
    "eye", "sky", "sea", "car", "bus", "fan", "bag", "bed",
    "ice", "egg", "ant", "bee", "fox", "owl", "cow", "hen",
    "사과", "바나나", "고양이", "강아지", "하늘", "바다", "나무",
    "꽃", "별", "달", "해", "비", "눈", "불", "물", "집",
  ],
  normal: [
    "apple", "brain", "cloud", "dance", "eagle", "flame", "grape",
    "happy", "image", "juice", "knife", "light", "magic", "night",
    "ocean", "piano", "queen", "river", "sharp", "tiger",
    "voice", "water", "yellow", "zipper", "bridge",
    "castle", "dragon", "forest", "garden", "hunter", "island",
    "jungle", "kitten", "lemon", "monkey", "orange",
    "컴퓨터", "키보드", "마우스", "프린터", "모니터", "스마트폰",
    "자동차", "비행기", "기차역", "도서관", "영화관", "수영장",
    "피자가게", "커피숍", "편의점", "약국",
  ],
  hard: [
    "adventure", "beautiful", "celebrate", "dangerous", "efficient",
    "fantastic", "gorgeous", "happiness", "important", "justified",
    "knowledge", "necessary", "orchestra",
    "perfectly", "qualified", "resources", "structure", "telephone",
    "universal", "variation", "wonderful",
    "algorithm", "benchmark", "carefully", "dashboard", "establish",
    "framework", "gradients", "highlight", "interview", "javascript",
    "keyboards", "lightning", "marketing", "nutrition", "objective",
    "reference", "technical",
    "인공지능", "빅데이터", "사물인터넷", "클라우드컴퓨팅",
    "프로그래밍", "알고리즘", "데이터베이스", "머신러닝",
    "블록체인", "메타버스", "가상현실",
  ],
};

type Difficulty = "easy" | "normal" | "hard";

/* ============================================================
   Stripe 결제 설정
   - 실제 배포 시 STRIPE_PAYMENT_LINK를 교체하세요
   - Stripe 대시보드에서 Payment Link 생성 후 URL을 여기에 입력
   ============================================================ */
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/PLACEHOLDER_REPLACE_WITH_REAL_LINK";

/* ============================================================
   메인 앱 컴포넌트
   ============================================================ */
export default function App() {
  /* ---------- 상태 ---------- */
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem("premium") === "true");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [phase, setPhase] = useState<"idle" | "playing" | "gameover">("idle");
  const [currentWord, setCurrentWord] = useState("시작을 눌러주세요");
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem("typingHighScore") || "0", 10));
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState<"" | "correct" | "wrong">("");
  const [wordAnim, setWordAnim] = useState(false);
  const [customWordList, setCustomWordList] = useState<string[] | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [customTextarea, setCustomTextarea] = useState("");

  /* ---------- 통계 (프리미엄 전용) ---------- */
  const totalAttemptsRef = useRef(0);
  const correctAttemptsRef = useRef(0);
  const totalCharsRef = useRef(0);
  const [finalStats, setFinalStats] = useState({ accuracy: 0, total: 0, wpm: 0, cpm: 0 });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wordRef = useRef(currentWord);
  wordRef.current = currentWord;

  /* ---------- 결제 성공 URL 체크 ---------- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (payment === "success") {
      localStorage.setItem("premium", "true");
      setIsPremium(true);
      alert("🎉 프리미엄 업그레이드 완료! 모든 기능이 해금되었습니다.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (payment === "cancel") {
      alert("결제가 취소되었습니다.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  /* ---------- 랜덤 단어 선택 ---------- */
  const getRandomWord = useCallback((prev: string) => {
    const list = (isPremium && customWordList && customWordList.length >= 5)
      ? customWordList
      : WORD_LIST[difficulty];
    let word: string;
    do {
      word = list[Math.floor(Math.random() * list.length)];
    } while (word === prev && list.length > 1);
    return word;
  }, [difficulty, isPremium, customWordList]);

  /* ---------- 새 단어 표시 ---------- */
  const showNewWord = useCallback((prev: string) => {
    const next = getRandomWord(prev);
    setCurrentWord(next);
    setWordAnim(false);
    requestAnimationFrame(() => setWordAnim(true));
    return next;
  }, [getRandomWord]);

  /* ---------- 게임 시작 ---------- */
  const startGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    totalAttemptsRef.current = 0;
    correctAttemptsRef.current = 0;
    totalCharsRef.current = 0;

    setScore(0);
    setTimeLeft(60);
    setInput("");
    setFeedback("");
    setPhase("playing");

    const firstWord = getRandomWord("");
    setCurrentWord(firstWord);
    setWordAnim(true);
    setTimeout(() => inputRef.current?.focus(), 80);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [getRandomWord]);

  /* ---------- 시간 종료 처리 ---------- */
  useEffect(() => {
    if (phase === "playing" && timeLeft === 0) {
      setPhase("gameover");
      setInput("");
      const correct = correctAttemptsRef.current;
      const total = totalAttemptsRef.current;
      const chars = totalCharsRef.current;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      setFinalStats({ accuracy, total, wpm: correct, cpm: chars });

      setHighScore(prev => {
        const newHigh = Math.max(prev, score);
        localStorage.setItem("typingHighScore", String(newHigh));
        return newHigh;
      });
    }
  }, [timeLeft, phase, score]);

  /* ---------- 입력 처리 ---------- */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (phase !== "playing") return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const typed = input.trim();
      if (!typed) return;

      totalAttemptsRef.current++;

      if (typed === wordRef.current) {
        correctAttemptsRef.current++;
        totalCharsRef.current += wordRef.current.length;
        setScore(s => s + 1);
        setFeedback("correct");
        setInput("");
        showNewWord(wordRef.current);
      } else {
        setFeedback("wrong");
        setInput("");
      }
      setTimeout(() => setFeedback(""), 650);
    }
  }, [phase, input, showNewWord]);

  /* ---------- 난이도 변경 ---------- */
  const selectDifficulty = (d: Difficulty) => {
    if (phase === "playing") return;
    if (d === "hard" && !isPremium) {
      alert("Hard 난이도는 프리미엄 전용 기능입니다.\n아래 '프리미엄 업그레이드' 버튼을 클릭하세요.");
      return;
    }
    setDifficulty(d);
  };

  /* ---------- Stripe 결제 ---------- */
  const handleStripePayment = () => {
    if (STRIPE_PAYMENT_LINK.includes("PLACEHOLDER")) {
      alert(
        "결제 시스템 안내\n\n" +
        "실제 배포 시 Stripe 대시보드에서 Payment Link를 생성하고\n" +
        "App.tsx의 STRIPE_PAYMENT_LINK 변수를 교체하세요.\n\n" +
        "[데모용] 아래 '데모 프리미엄 토글' 버튼으로 프리미엄 기능을 체험해보세요."
      );
      return;
    }
    const origin = window.location.origin + window.location.pathname;
    const successUrl = `${origin}?payment=success`;
    const cancelUrl  = `${origin}?payment=cancel`;
    window.location.href = `${STRIPE_PAYMENT_LINK}?success_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;
  };

  /* ---------- 데모 프리미엄 토글 ---------- */
  const togglePremiumDemo = () => {
    const next = !isPremium;
    setIsPremium(next);
    localStorage.setItem("premium", next ? "true" : "false");
    alert(next ? "✨ [데모] 프리미엄 모드 활성화!" : "[데모] 프리미엄 모드 비활성화.");
  };

  /* ---------- 커스텀 단어 파일 업로드 ---------- */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".txt")) {
      setUploadStatus("⚠ .txt 파일만 업로드 가능합니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setCustomTextarea(text);
      setUploadStatus(`✓ '${file.name}' 파일을 불러왔습니다.`);
    };
    reader.readAsText(file, "UTF-8");
  };

  /* ---------- 커스텀 단어 적용 ---------- */
  const applyCustomWords = () => {
    const words = customTextarea.split("\n").map(w => w.trim()).filter(w => w.length > 0);
    if (words.length < 5) {
      setUploadStatus("⚠ 최소 5개 이상의 단어를 입력하세요.");
      return;
    }
    setCustomWordList(words);
    setUploadStatus(`✓ ${words.length}개 단어가 적용되었습니다!`);
  };

  /* ---------- 입력 실시간 색상 피드백 ---------- */
  const inputBorderColor = input.length === 0
    ? undefined
    : currentWord.startsWith(input)
      ? "var(--g-success)"
      : "var(--g-error)";

  /* ---------- 타이머 위험 표시 ---------- */
  const timerDanger = phase === "playing" && timeLeft <= 5;

  /* ---------- 렌더 ---------- */
  return (
    <div className="g-page">

      {/* ===== 상단 광고 배너 (무료 사용자 전용) ===== */}
      {!isPremium && (
        <div className="g-ad-banner g-ad-top">
          <span className="g-ad-label">광고</span>
          <span>여기에 광고가 들어갑니다 (상단 배너)</span>
        </div>
      )}

      <div className="g-container">

        {/* ===== 헤더 ===== */}
        <header className="g-header">
          {isPremium && <span className="g-premium-badge">✦ PREMIUM</span>}
          <h1 className="g-title">⌨️ 타자 연습</h1>
          <p className="g-subtitle">얼마나 빠르게 입력할 수 있을까요?</p>
        </header>

        {/* ===== 점수판 ===== */}
        <div className="g-scoreboard">
          <div className="g-score-item">
            <span className="g-score-label">남은 시간</span>
            <span className={`g-score-value${timerDanger ? " g-danger" : ""}`}>{timeLeft}</span>
          </div>
          <div className="g-score-item">
            <span className="g-score-label">현재 점수</span>
            <span className="g-score-value">{score}</span>
          </div>
          <div className="g-score-item">
            <span className="g-score-label">최고 점수</span>
            <span className="g-score-value">{highScore}</span>
          </div>
        </div>

        {/* ===== 난이도 선택 (게임 중이 아닐 때) ===== */}
        {phase !== "playing" && (
          <div className="g-difficulty-section">
            <p className="g-difficulty-label">난이도 선택</p>
            <div className="g-difficulty-buttons">
              {(["easy", "normal", "hard"] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => selectDifficulty(d)}
                  className={[
                    "g-diff-btn",
                    d === difficulty ? "g-active" : "",
                    d === "hard" && !isPremium ? "g-locked" : "",
                    d === "hard" && isPremium ? "g-hard-unlocked" : "",
                  ].filter(Boolean).join(" ")}
                >
                  {d === "easy" && "쉬움"}
                  {d === "normal" && "보통"}
                  {d === "hard" && (isPremium ? "어려움 ⚡" : "어려움 🔒")}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== 게임 영역 ===== */}
        <div className="g-game-area">

          {/* 단어 표시 */}
          <div className={`g-word-display${feedback === "correct" ? " g-flash-correct" : ""}${feedback === "wrong" ? " g-flash-wrong" : ""}`}>
            <span className={`g-current-word${wordAnim ? " g-word-anim" : ""}`}>
              {currentWord}
            </span>
          </div>

          {/* 입력창 */}
          <input
            ref={inputRef}
            type="text"
            className="g-word-input"
            placeholder={phase === "playing" ? "단어를 입력하고 Enter 또는 Space..." : "게임을 시작하세요"}
            value={input}
            onChange={e => phase === "playing" && setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={phase !== "playing"}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            style={{ borderColor: phase === "playing" ? inputBorderColor : undefined }}
          />

          {/* 피드백 */}
          <div className={`g-feedback${feedback ? ` g-feedback-${feedback}` : ""}`}>
            {feedback === "correct" && "✓ 정답!"}
            {feedback === "wrong" && "✗ 틀렸습니다"}
          </div>
        </div>

        {/* ===== 시작 버튼 (idle 상태) ===== */}
        {phase === "idle" && (
          <button className="g-btn-start" onClick={startGame}>
            게임 시작
          </button>
        )}

        {/* ===== 게임 종료 화면 ===== */}
        {phase === "gameover" && (
          <div className="g-gameover">
            <h2>게임 종료!</h2>
            <p className="g-final-score-text">
              최종 점수: <strong>{score}</strong>
            </p>
            <p className="g-highscore-text">
              {score >= highScore && score > 0
                ? "🏆 새로운 최고 기록!"
                : `최고 기록: ${highScore}점`}
            </p>

            {/* 프리미엄 전용 통계 */}
            {isPremium && (
              <div className="g-premium-stats">
                <h3>상세 통계 (프리미엄)</h3>
                <div className="g-stats-grid">
                  <div className="g-stat-item">
                    <span className="g-stat-label">정확도</span>
                    <span className="g-stat-value">{finalStats.accuracy}%</span>
                  </div>
                  <div className="g-stat-item">
                    <span className="g-stat-label">총 시도</span>
                    <span className="g-stat-value">{finalStats.total}</span>
                  </div>
                  <div className="g-stat-item">
                    <span className="g-stat-label">분당 단어(WPM)</span>
                    <span className="g-stat-value">{finalStats.wpm}</span>
                  </div>
                  <div className="g-stat-item">
                    <span className="g-stat-label">분당 타수(CPM)</span>
                    <span className="g-stat-value">{finalStats.cpm}</span>
                  </div>
                </div>
              </div>
            )}

            <button className="g-btn-start" onClick={startGame}>
              다시 시작하기
            </button>
          </div>
        )}

        {/* ===== 프리미엄 업그레이드 카드 (비프리미엄 전용) ===== */}
        {!isPremium && (
          <div className="g-premium-section">
            <div className="g-premium-card">
              <h3>🚀 프리미엄으로 업그레이드</h3>
              <ul className="g-premium-features">
                <li>✅ 광고 완전 제거</li>
                <li>✅ Hard 난이도 해금</li>
                <li>✅ 상세 통계 (정확도, WPM, CPM)</li>
                <li>✅ 커스텀 단어 리스트 업로드</li>
              </ul>
              <p className="g-premium-price">₩4,900 / 월</p>
              <button className="g-btn-premium" onClick={handleStripePayment}>
                💳 프리미엄 업그레이드
              </button>
              <button className="g-btn-demo" onClick={togglePremiumDemo}>
                [데모] 프리미엄 토글
              </button>
            </div>
          </div>
        )}

        {/* 프리미엄 사용자: 설정 해제 버튼 */}
        {isPremium && (
          <div className="g-premium-active-section">
            <p className="g-premium-active-text">✦ 프리미엄 이용 중</p>
            <button className="g-btn-demo" onClick={togglePremiumDemo}>
              [데모] 프리미엄 해제
            </button>
          </div>
        )}

        {/* ===== 커스텀 단어 업로드 (프리미엄 전용) ===== */}
        {isPremium && (
          <div className="g-custom-words">
            <h3>커스텀 단어 리스트 업로드 (프리미엄)</h3>
            <p className="g-upload-hint">한 줄에 하나씩 단어를 입력하거나 .txt 파일을 업로드하세요</p>
            <textarea
              className="g-custom-textarea"
              placeholder={"apple\nbanana\ncherry\n..."}
              value={customTextarea}
              onChange={e => setCustomTextarea(e.target.value)}
              rows={5}
            />
            <div className="g-upload-actions">
              <label className="g-btn-upload">
                파일 업로드
                <input type="file" accept=".txt" style={{ display: "none" }} onChange={handleFileUpload} />
              </label>
              <button className="g-btn-apply" onClick={applyCustomWords}>적용하기</button>
            </div>
            {uploadStatus && (
              <p className={`g-upload-status${uploadStatus.startsWith("⚠") ? " g-upload-error" : ""}`}>
                {uploadStatus}
              </p>
            )}
          </div>
        )}

      </div>

      {/* ===== 하단 광고 배너 (무료 사용자 전용) ===== */}
      {!isPremium && (
        <div className="g-ad-banner g-ad-bottom">
          <span className="g-ad-label">광고</span>
          <span>여기에 광고가 들어갑니다 (하단 배너)</span>
        </div>
      )}
    </div>
  );
}
