const SITE_URL = "https://yuyeona332.github.io/anime-fandom-test/";
const KAKAO_KEY = "";
const FEEDBACK_ENDPOINT = "";
const FEEDBACK_SUBMITTED_KEY = "anime-fandom-feedback-submitted";

const DATA = window.ANIME_TEST_DATA;

const state = {
  order: [],
  answers: {},
  index: 0,
  currentResult: null,
  isFriendView: false,
  sharedToken: "",
  transitionLocked: false,
  feedbackSubmitted: false
};

const RESULT_HASH_RE = /^#r=([RSX][CWX][FEX][PDX])-(\d{1,3})-(\d{1,3})-(\d{1,3})-(\d{1,3})$/;

function isInAppBrowser() {
  return /KAKAOTALK|Instagram|FBAN|FBAV|NAVER|DaumApps|Line\//i.test(navigator.userAgent);
}

function clearResultHash() {
  const path = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(null, "", path);
}

function buildResultShareToken(result) {
  if (!result || !Array.isArray(result.axisStats) || result.axisStats.length !== 4) {
    return "";
  }

  const values = result.axisStats.map((axis) => {
    const percent = Number(axis.percentA || 0);
    return Math.min(100, Math.max(0, percent));
  });

  return `#r=${result.code}-${values.join("-")}`;
}

function parseResultHash() {
  const hash = window.location.hash || "";
  if (!hash) {
    return null;
  }

  const match = RESULT_HASH_RE.exec(hash);
  if (!match) {
    return null;
  }

  const [, code, p1, p2, p3, p4] = match;
  const values = [p1, p2, p3, p4].map((item) => Number(item));
  if (values.some((value) => value < 0 || value > 100)) {
    return null;
  }

  return {
    code: code.toUpperCase(),
    percentages: values
  };
}

function buildResultFromToken(token) {
  if (!token) {
    return null;
  }

  const code = String(token.code || "XXXX").toUpperCase();
  const percentages = Array.isArray(token.percentages) ? token.percentages : [50, 50, 50, 50];
  const axisStats = DATA.axes.map((axis, index) => {
    const percentA = Number(percentages[index] ?? 50);
    const percentB = 100 - percentA;
    const axisCode = (code[index] || "X").toUpperCase();
    const winner = axisCode === "X" ? "X" : (percentA >= percentB ? "A" : "B");

    return {
      ...axis,
      winner,
      percentA: axisCode === "X" ? 50 : percentA,
      percentB: axisCode === "X" ? 50 : percentB,
      sideAName: axis.sideAName,
      sideBName: axis.sideBName
    };
  });

  const resolvedName = getTypeName(code);
  const meta = DATA.typeMeta[code] || DATA.fallbackType;
  const profile = DATA.typeProfiles?.[code] || {
    koreanName: `${resolvedName[0]} ${resolvedName[1]}`,
    line: meta.tagline || DATA.fallbackType.tagline,
    intro: meta.description || DATA.fallbackType.description,
    summary: meta.description || DATA.fallbackType.description,
    traits: [
      { title: "작품 선택", text: "자기만의 기준으로 작품을 고르는 편이에요." },
      { title: "애정의 깊이", text: "좋아하는 요소를 오래 붙잡고 있는 편이에요." },
      { title: "취향 탐색", text: "기존 취향을 지키며 안정적으로 즐겨요." },
      { title: "덕질 표현", text: "혼자 또는 함께 나누며 자신의 방식으로 즐겨요." }
    ],
    strengths: ["좋아하는 요소를 꾸준히 지키는 편이에요.", "가볍게 흘려보내지 않고 의미를 남겨요.", "자기만의 덕질 루틴을 잘 만들어요."],
    weaknesses: ["가끔 새로운 취향을 시작하는 데 시간이 걸릴 수 있어요.", "한 번 빠지면 기준이 뚜렷해서 다른 선택지를 놓치기 쉬워요."],
    lifestyle: "자신만의 속도로 애니를 즐기며, 한 작품을 오랫동안 의미 있게 사랑하는 편이에요.",
    compatibility: "비슷한 덕질 속도를 가진 팬들과 잘 맞아요. 반대로 급하게 몰입하는 사람들과는 속도 차이가 느껴질 수 있습니다.",
    keywords: ["균형감", "밀착 덕질", "오래 사랑", "개인 스타일"]
  };

  return {
    code,
    name: resolvedName,
    adjective: resolvedName[0],
    noun: resolvedName[1],
    tagline: meta.tagline || DATA.fallbackType.tagline,
    description: meta.description || DATA.fallbackType.description,
    profile,
    axisStats,
    isSharedResult: true
  };
}

function getShareUrl() {
  const baseUrl = SITE_URL.replace(/\/$/, "");
  const token = state.currentResult ? buildResultShareToken(state.currentResult) : state.sharedToken;
  return `${baseUrl}${token || ""}`;
}

const TYPE_CODES = [
  "RCFP", "RCFD", "RCEP", "RCED",
  "RWFP", "RWFD", "RWEP", "RWED",
  "SCFP", "SCFD", "SCEP", "SCED",
  "SWFP", "SWFD", "SWEP", "SWED"
];

const $ = (selector) => document.querySelector(selector);

function normalizeAnswerValue(rawValue) {
  const parsedValue = Number(rawValue);
  if (!Number.isInteger(parsedValue)) {
    return null;
  }

  const validValues = DATA.scale.map((item) => item.value);
  return validValues.includes(parsedValue) ? parsedValue : null;
}

function isQuestionAnswered(questionId) {
  const value = state.answers[questionId];
  return Number.isInteger(value) && value >= 1 && value <= DATA.scale.length;
}

function ensureCurrentAnswerSelected() {
  const question = getCurrentQuestion();
  if (!question) {
    return false;
  }

  if (!isQuestionAnswered(question.id)) {
    showToast("답을 선택해 주세요. 선택 후 다음 질문으로 넘어가요.");
    return false;
  }

  return true;
}

function shuffleArray(items) {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((screen) => {
    const shouldShow = screen.id === name;
    screen.classList.toggle("hidden", !shouldShow);
  });
}

function safeLocalStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

function setFeedbackSubmitted(flag) {
  state.feedbackSubmitted = Boolean(flag);
  if (flag) {
    safeLocalStorageSet(FEEDBACK_SUBMITTED_KEY, "1");
  } else {
    try {
      window.localStorage.removeItem(FEEDBACK_SUBMITTED_KEY);
    } catch (error) {
      // ignore
    }
  }
}

function getFeedbackSubmitted() {
  const saved = safeLocalStorageGet(FEEDBACK_SUBMITTED_KEY);
  return saved === "1" || state.feedbackSubmitted;
}

function updateSurveyButtonState() {
  const button = document.getElementById("survey-trigger-btn");
  if (!button) {
    return;
  }

  if (state.isFriendView) {
    button.style.display = "none";
    return;
  }

  button.style.display = "block";
  if (getFeedbackSubmitted()) {
    button.textContent = "설문에 참여해 주셔서 감사합니다.";
    button.disabled = true;
    button.setAttribute("aria-disabled", "true");
    return;
  }

  button.textContent = "결과 평가 설문 남기기";
  button.disabled = false;
  button.removeAttribute("aria-disabled");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function withTimeout(promiseFactory, timeoutMs = 3000, fallbackMessage = "요청 시간이 초과했습니다.") {
  let timerId;

  return Promise.race([
    Promise.resolve().then(() => promiseFactory()),
    new Promise((_, reject) => {
      timerId = setTimeout(() => reject(new Error(fallbackMessage)), timeoutMs);
    })
  ]).finally(() => {
    if (timerId) {
      clearTimeout(timerId);
    }
  });
}

function getQuestionById(id) {
  return DATA.questions.find((question) => question.id === id);
}

function getCurrentQuestion() {
  const id = state.order[state.index];
  return getQuestionById(id);
}

function setHeroArt() {
  const heroArt = document.getElementById("hero-art");
  if (!heroArt) {
    return;
  }

  heroArt.innerHTML = "";
  const heroCodes = ["RCFP", "SCFP", "SWFD"];
  heroCodes.forEach((code, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `hero-character hero-trigger hero-character-${index + 1}`;
    button.setAttribute("aria-label", "테스트 안내 열기");
    button.innerHTML = buildCharacterSvg(code, 170);
    button.addEventListener("click", () => openCharacterModal("intro"));
    heroArt.appendChild(button);
  });
}

function renderAxisGuide() {
  const guide = document.getElementById("axis-guide");
  if (!guide) {
    return;
  }

  const guideCodeMap = {
    "R/S": ["RCFP", "SWED"],
    "C/W": ["RCFP", "SWED"],
    "F/E": ["RCFP", "SWED"],
    "P/D": ["RCFP", "SWED"]
  };

  const axisRows = DATA.axes.map((axis) => {
    const [leftCode, rightCode] = guideCodeMap[axis.label] || ["RCFP", "SWED"];

    return `
      <div class="axis-guide-row">
        <div class="axis-guide-label">${axis.label}</div>
        <div class="axis-guide-pairs">
          <button type="button" class="axis-guide-pill" data-character-code="${leftCode}">
            <span class="axis-guide-sprite">${buildCharacterSvg(leftCode, 42)}</span>
            <span>${axis.sideA} ${axis.sideAName}</span>
          </button>
          <button type="button" class="axis-guide-pill" data-character-code="${rightCode}">
            <span class="axis-guide-sprite">${buildCharacterSvg(rightCode, 42)}</span>
            <span>${axis.sideB} ${axis.sideBName}</span>
          </button>
        </div>
      </div>
    `;
  }).join("");

  guide.innerHTML = axisRows;
  guide.querySelectorAll(".axis-guide-pill").forEach((button) => {
    button.addEventListener("click", () => openCharacterModal(button.dataset.characterCode));
  });
}

function renderTypePreview() {
  const preview = document.getElementById("type-preview");
  if (!preview) {
    return;
  }

  const buttons = TYPE_CODES.map((code) => {
    const name = getTypeName(code);
    const label = Array.isArray(name) ? name.join(" ") : name;
    return `
      <button type="button" class="type-card" data-character-code="${code}" aria-label="${label} 상세 정보 보기">
        <div class="type-card-art" aria-hidden="true">${buildCharacterSvg(code, 84)}</div>
        <span class="label">${label}</span>
        <span class="sub">${code}</span>
      </button>
    `;
  }).join("");

  preview.innerHTML = buttons;
  preview.querySelectorAll(".type-card").forEach((button) => {
    button.addEventListener("click", () => {
      openCharacterModal(button.dataset.characterCode);
    });
  });
}

function getTypeAsset(code, fallback) {
  const candidates = [`assets/types/${code}.png`, `assets/types/${code}.svg`, `assets/types/default.svg`, fallback];
  return candidates.find((path) => path) || fallback;
}

function typeCodeFromAxisLetters(axisLetters) {
  return axisLetters.join("");
}

function getTypeName(code) {
  const normalized = String(code || "").toUpperCase();

  if (DATA.typeDisplayNames && DATA.typeDisplayNames[normalized]) {
    return [DATA.typeDisplayNames[normalized]];
  }

  const adjectivePair = `${normalized[2] || "X"}${normalized[3] || "X"}`;
  const nounPair = `${normalized[0] || "X"}${normalized[1] || "X"}`;

  const adjective = adjectivePair.includes("X")
    ? DATA.fallbackType.adjective
    : DATA.adjectiveByPair[adjectivePair] || DATA.fallbackType.adjective;
  const noun = nounPair.includes("X")
    ? DATA.fallbackType.noun
    : DATA.nounByPair[nounPair] || DATA.fallbackType.noun;

  return [adjective, noun];
}

function calculateAxisScore(axisId) {
  const sideAScore = DATA.questions
    .filter((question) => question.axis === axisId && question.side === "A")
    .reduce((total, question) => total + (state.answers[question.id] || 0), 0);

  const sideBScore = DATA.questions
    .filter((question) => question.axis === axisId && question.side === "B")
    .reduce((total, question) => total + (state.answers[question.id] || 0), 0);

  return {
    sideA: sideAScore,
    sideB: sideBScore,
    percentA: sideAScore + sideBScore === 0 ? 50 : Math.round((sideAScore / (sideAScore + sideBScore)) * 100),
    percentB: sideAScore + sideBScore === 0 ? 50 : 100 - Math.round((sideAScore / (sideAScore + sideBScore)) * 100)
  };
}

function getAxisWinner(axis) {
  const score = calculateAxisScore(axis.id);
  if (score.sideA === score.sideB) {
    return "X";
  }
  return score.sideA > score.sideB ? axis.sideA : axis.sideB;
}

function buildResult() {
  const unansweredQuestions = DATA.questions.filter((question) => !isQuestionAnswered(question.id));
  if (unansweredQuestions.length > 0) {
    const nextQuestion = unansweredQuestions[0];
    showToast(nextQuestion ? "답을 선택해 주세요. 아직 응답하지 않은 문항이 있어요." : "답을 선택해 주세요.");
    if (nextQuestion) {
      const targetIndex = state.order.indexOf(nextQuestion.id);
      if (targetIndex >= 0) {
        state.index = targetIndex;
        renderQuestion();
      }
    }
    return false;
  }

  const axisLetters = DATA.axes.map((axis) => getAxisWinner(axis));
  const code = typeCodeFromAxisLetters(axisLetters);
  const validTypeCode = Object.prototype.hasOwnProperty.call(DATA.typeMeta, code)
    ? code
    : code.includes("X")
      ? code
      : null;

  if (!validTypeCode) {
    showToast("결과를 계산할 수 없었습니다. 응답을 다시 확인해 주세요.");
    return false;
  }

  const axisStats = DATA.axes.map((axis) => {
    const score = calculateAxisScore(axis.id);
    const winnerCode = getAxisWinner(axis);
    const winner = winnerCode === "X" ? "X" : (winnerCode === axis.sideA ? "A" : "B");
    const percentA = score.percentA;
    const percentB = score.percentB;
    return { ...axis, score, winner, percentA, percentB };
  });

  const fallbackMeta = DATA.fallbackType;
  const typeKey = validTypeCode;
  const meta = typeKey ? DATA.typeMeta[typeKey] : fallbackMeta;
  const resolvedName = getTypeName(code);
  const profile = DATA.typeProfiles?.[code] || {
    koreanName: `${resolvedName[0]} ${resolvedName[1]}`,
    line: meta.tagline || fallbackMeta.tagline,
    intro: meta.description || fallbackMeta.description,
    summary: meta.description || fallbackMeta.description,
    traits: [
      { title: "작품 선택", text: "자기만의 기준으로 작품을 고르는 편이에요." },
      { title: "애정의 깊이", text: "좋아하는 요소를 오래 붙잡고 있는 편이에요." },
      { title: "취향 탐색", text: "기존 취향을 지키며 안정적으로 즐겨요." },
      { title: "덕질 표현", text: "혼자 또는 함께 나누며 자신의 방식으로 즐겨요." }
    ],
    strengths: ["좋아하는 요소를 꾸준히 지키는 편이에요.", "가볍게 흘려보내지 않고 의미를 남겨요.", "자기만의 덕질 루틴을 잘 만들어요."],
    weaknesses: ["가끔 새로운 취향을 시작하는 데 시간이 걸릴 수 있어요.", "한 번 빠지면 기준이 뚜렷해서 다른 선택지를 놓치기 쉬워요."],
    lifestyle: "자신만의 속도로 애니를 즐기며, 한 작품을 오랫동안 의미 있게 사랑하는 편이에요.",
    compatibility: "비슷한 덕질 속도를 가진 팬들과 잘 맞아요. 반대로 급하게 몰입하는 사람들과는 속도 차이가 느껴질 수 있습니다.",
    keywords: ["균형감", "밀착 덕질", "오래 사랑", "개인 스타일"]
  };

  state.currentResult = {
    code,
    name: resolvedName,
    adjective: resolvedName[0],
    noun: resolvedName[1],
    tagline: meta.tagline || fallbackMeta.tagline,
    description: meta.description || fallbackMeta.description,
    profile,
    axisStats,
    isSharedResult: false
  };

  state.isFriendView = false;
  state.sharedToken = buildResultShareToken(state.currentResult);
  if (state.sharedToken) {
    const url = `${window.location.pathname}${window.location.search}${state.sharedToken}`;
    try {
      window.history.replaceState(null, "", url);
    } catch (error) {
      console.warn("history.replaceState failed", error);
    }
  }

  showResult();
  return true;
}

function renderQuestion() {
  const question = getCurrentQuestion();
  if (!question) {
    return;
  }

  const total = DATA.questions.length;
  const progress = ((state.index + 1) / total) * 100;

  const questionCounter = document.getElementById("question-counter");
  if (questionCounter) {
    questionCounter.textContent = `${state.index + 1} / ${total}`;
    questionCounter.setAttribute("aria-live", "polite");
  }

  const progressFill = document.getElementById("progress-fill");
  if (progressFill) {
    progressFill.style.width = `${progress}%`;
  }

  const questionText = document.getElementById("question-text");
  if (questionText) {
    questionText.textContent = question.text;
  }

  const prevBtn = document.getElementById("prev-btn");
  if (prevBtn) {
    prevBtn.disabled = state.index === 0 || state.transitionLocked;
  }

  const answerOptions = document.getElementById("answer-options");
  if (!answerOptions) {
    return;
  }

  answerOptions.setAttribute("role", "radiogroup");
  answerOptions.setAttribute("aria-label", "질문 답변 선택");

  const options = DATA.scale
    .map((scaleItem) => {
      const isSelected = state.answers[question.id] === scaleItem.value;
      return `
        <button
          type="button"
          class="answer-option ${isSelected ? "selected" : ""}"
          data-value="${scaleItem.value}"
          role="radio"
          aria-checked="${isSelected ? "true" : "false"}"
          aria-label="${scaleItem.value}. ${scaleItem.label}"
          tabindex="${isSelected ? 0 : -1}"
        >
          <span class="answer-dot" aria-hidden="true"></span>
          <span class="answer-value">${scaleItem.value}</span>
          <span class="answer-label">${scaleItem.label}</span>
        </button>
      `;
    })
    .join("");

  answerOptions.innerHTML = options;
  const optionButtons = [...answerOptions.querySelectorAll(".answer-option")];

  optionButtons.forEach((button) => {
    const selectedValue = normalizeAnswerValue(button.dataset.value);
    if (selectedValue === null) {
      return;
    }

    button.addEventListener("click", () => {
      if (state.transitionLocked) {
        return;
      }

      const nextValue = normalizeAnswerValue(button.dataset.value);
      if (nextValue === null) {
        showToast("답을 선택해 주세요.");
        return;
      }

      state.answers[question.id] = nextValue;
      state.transitionLocked = true;
      setTimeout(() => {
        if (state.index < DATA.questions.length - 1) {
          state.index += 1;
          state.transitionLocked = false;
          renderQuestion();
          return;
        }

        state.transitionLocked = false;
        buildResult();
      }, 200);
    });

    button.addEventListener("keydown", (event) => {
      const key = event.key;
      if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", " ", "Enter"].indexOf(key) === -1) {
        return;
      }

      event.preventDefault();
      if (state.transitionLocked) {
        return;
      }

      const currentIndex = optionButtons.indexOf(button);
      let targetIndex = currentIndex;
      if (key === "ArrowRight" || key === "ArrowDown") {
        targetIndex = Math.min(optionButtons.length - 1, currentIndex + 1);
      } else if (key === "ArrowLeft" || key === "ArrowUp") {
        targetIndex = Math.max(0, currentIndex - 1);
      }

      if (key === " " || key === "Enter") {
        const chosen = normalizeAnswerValue(button.dataset.value);
        if (chosen === null) {
          return;
        }
        state.answers[question.id] = chosen;
        state.transitionLocked = true;
        setTimeout(() => {
          if (state.index < DATA.questions.length - 1) {
            state.index += 1;
          }
          state.transitionLocked = false;
          if (state.index >= DATA.questions.length - 1 && isQuestionAnswered(question.id)) {
            buildResult();
            return;
          }
          renderQuestion();
        }, 200);
        return;
      }

      const targetButton = optionButtons[targetIndex];
      if (!targetButton) {
        return;
      }

      const targetValue = normalizeAnswerValue(targetButton.dataset.value);
      if (targetValue === null) {
        return;
      }
      state.answers[question.id] = targetValue;
      state.transitionLocked = true;
      setTimeout(() => {
        state.transitionLocked = false;
        if (state.index < DATA.questions.length - 1) {
          state.index += 1;
          renderQuestion();
          return;
        }
        buildResult();
      }, 180);
    });
  });
}

function prevQuestion() {
  if (state.transitionLocked) {
    return;
  }

  if (state.index > 0) {
    state.index -= 1;
    renderQuestion();
  }
}

function startTest() {
  state.order = shuffleArray(DATA.questions.map((question) => question.id));
  state.answers = {};
  state.index = 0;
  showScreen("test");
  renderQuestion();
}

function renderAxisBreakdown() {
  const container = document.getElementById("axis-breakdown");
  if (!state.currentResult) {
    return;
  }

  container.innerHTML = state.currentResult.axisStats
    .map((axis) => {
      const leftLabel = `${axis.sideAName} ${axis.percentA}%`;
      const rightLabel = `${axis.percentB}% ${axis.sideBName}`;
      const winnerText = axis.winner === "X"
        ? "두 성향이 비슷해요"
        : axis.winner === "A"
          ? axis.sideAName
          : axis.sideBName;

      return `
        <div class="axis-row">
          <div class="axis-head">
            <span>${leftLabel}</span>
            <span>${rightLabel}</span>
          </div>
          <div class="axis-bar" role="img" aria-label="${axis.label}: ${leftLabel} / ${rightLabel}">
            <span class="segment-a" style="width:${axis.percentA}%"></span>
            <span class="segment-b" style="width:${axis.percentB}%"></span>
          </div>
          <p><b>${axis.label}</b> · ${axis.winner === "X" ? "두 성향이 비슷해요" : `${winnerText} 쪽이 조금 더 강하게 드러나요.`}</p>
        </div>
      `;
    })
    .join("");
}

function buildCharacterSvg(code, size = 220) {
  if (typeof window !== "undefined" && window.ANIME_PIXEL_SPRITES && typeof window.ANIME_PIXEL_SPRITES.buildSpriteSvg === "function") {
    return window.ANIME_PIXEL_SPRITES.buildSpriteSvg(code, size);
  }

  const fallbackCode = String(code || "XXXX").toUpperCase();
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}" role="img" aria-label="${fallbackCode} pixel sprite" style="image-rendering: pixelated; shape-rendering: crispEdges;">
      <rect x="10" y="12" width="12" height="10" fill="#f6d4bf"/>
      <rect x="9" y="9" width="14" height="6" fill="#79e8d8"/>
      <rect x="11" y="12" width="2" height="2" fill="#2a2a36"/>
      <rect x="19" y="12" width="2" height="2" fill="#2a2a36"/>
      <rect x="10" y="15" width="12" height="2" fill="#5a5bc9"/>
      <rect x="9" y="18" width="14" height="7" fill="#d8d4ff"/>
    </svg>
  `;
}

function fitTextToWidth(text, options = {}) {
  const {
    minSize = 13,
    maxSize = 32,
    targetWidth = 260,
    fontWeight = 900,
    fontFamily = '"Noto Sans KR", "Apple SD Gothic Neo", sans-serif'
  } = options;

  const safeText = String(text || "");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  let size = maxSize;
  while (size >= minSize) {
    context.font = `${fontWeight} ${size}px ${fontFamily}`;
    if (context.measureText(safeText).width <= targetWidth) {
      return size;
    }
    size -= 1;
  }

  return minSize;
}

function buildResultCardSvg(result) {
  const fallbackCode = "RCFP";
  const code = String((result && result.code) || fallbackCode).toUpperCase();
  const baseName = Array.isArray(result && result.name) && result.name.length >= 2
    ? result.name
    : getTypeName(code);
  const adjective = String(baseName[0] || DATA.fallbackType.adjective || "균형 잡힌");
  const noun = String(baseName[1] || DATA.fallbackType.noun || "애니 감상가");

  const paletteOptions = [
    ["#f7dfe8", "#f6f0ff", "#5a5bc9", "#1f2350"],
    ["#dfebff", "#f7ecff", "#5a5bc9", "#1f2350"],
    ["#ffe9d4", "#fff3f9", "#5a5bc9", "#1f2350"],
    ["#dff6ec", "#f8f1ff", "#5a5bc9", "#1f2350"],
    ["#e7e9ff", "#fff1f7", "#5a5bc9", "#1f2350"],
    ["#f8e6d6", "#f4ebff", "#5a5bc9", "#1f2350"],
    ["#fff2de", "#f5ecff", "#5a5bc9", "#1f2350"],
    ["#fbe3ed", "#eef3ff", "#5a5bc9", "#1f2350"]
  ];
  const paletteIndex = TYPE_CODES.indexOf(code);
  const [bgStart, bgEnd, indigo, navy] = paletteOptions[(paletteIndex >= 0 ? paletteIndex : 0) % paletteOptions.length] || paletteOptions[0];

  const adjectiveSize = fitTextToWidth(adjective, { minSize: 13, maxSize: 24, targetWidth: 250, fontWeight: 800 });
  const nounSize = fitTextToWidth(noun, { minSize: 22, maxSize: 38, targetWidth: 250, fontWeight: 900 });

  const axisRows = (result && result.axisStats ? result.axisStats : []).map((axis) => {
    const left = Number(axis.percentA || 0);
    const right = Number(axis.percentB || 0);
    const valueText = axis.winner === "X"
      ? "두 성향이 비슷해요"
      : `${axis.winner === "A" ? axis.sideAName : axis.sideBName} ${Math.max(left, right)}%`;
    const shortLabel = axis.label.replace("감상 습관", "감상")
      .replace("작품 선택 기준", "작품")
      .replace("취향 탐색 방식", "취향")
      .replace("덕질 표현 방식", "표현");

    return `
      <g transform="translate(28 ${338 + result.axisStats.indexOf(axis) * 30})">
        <text x="0" y="0" font-size="9" font-weight="700" fill="#4f5a9f">${shortLabel}</text>
        <text x="304" y="0" text-anchor="end" font-size="9" font-weight="700" fill="#4b507c">${valueText}</text>
        <rect x="0" y="8" width="304" height="7" rx="4" fill="#efe9ff"/>
        <rect x="0" y="8" width="${304 * (left / 100)}" height="7" rx="4" fill="#6b75e9"/>
        <rect x="${304 * (left / 100)}" y="8" width="${304 * (right / 100)}" height="7" rx="4" fill="#f5b9ce"/>
      </g>
    `;
  }).join("");

  const footerUrl = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const axisSummaryText = (result && result.axisStats ? result.axisStats : []).map((axis) => `${axis.label}: ${axis.percentA}% / ${axis.percentB}%`).join(", ");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 520" role="img" aria-label="${code} 유형 결과 카드: ${adjective} ${noun}. ${axisSummaryText}">
      <defs>
        <linearGradient id="cardGradient-${code}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${bgStart}"/>
          <stop offset="1" stop-color="${bgEnd}"/>
        </linearGradient>
      </defs>
      <rect width="360" height="520" rx="30" fill="url(#cardGradient-${code})"/>
      <g opacity="0.7">
        <path d="M30 44 Q52 28 72 44" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="36" cy="90" r="5" fill="#ffffff" opacity="0.7"/>
        <circle cx="326" cy="66" r="5" fill="#ffffff" opacity="0.7"/>
        <circle cx="298" cy="118" r="3.5" fill="#ffffff" opacity="0.7"/>
      </g>
      <text x="180" y="38" text-anchor="middle" font-size="9.5" font-weight="800" fill="#5a5bc9" letter-spacing="2">ANIME FANDOM TEST</text>

      <g transform="translate(0 42)">
        <circle cx="180" cy="112" r="86" fill="rgba(255,255,255,0.55)"/>
        <circle cx="180" cy="112" r="64" fill="rgba(255,255,255,0.72)"/>
        <g transform="translate(40 8)">${buildCharacterSvg(code, 170)}</g>
      </g>

      <rect x="24" y="208" width="312" height="84" rx="22" fill="rgba(255,255,255,0.7)" stroke="rgba(90,91,201,0.18)"/>
      <text x="180" y="236" text-anchor="middle" font-size="${adjectiveSize}" font-weight="800" fill="${indigo}">${adjective}</text>
      <text x="180" y="272" text-anchor="middle" font-size="${nounSize}" font-weight="900" fill="${navy}">${noun}</text>

      <g transform="translate(0 12)">
        <rect x="92" y="290" width="176" height="28" rx="14" fill="${indigo}"/>
        <text x="180" y="310" text-anchor="middle" font-size="12" font-weight="900" fill="#ffffff" letter-spacing="4">${code}</text>
      </g>

      <g>
        ${axisRows}
      </g>

      <text x="180" y="492" text-anchor="middle" font-size="8.5" font-weight="700" fill="#6973b0">${footerUrl}</text>
      <text x="180" y="504" text-anchor="middle" font-size="8" font-weight="800" fill="#8d8fb8">ANIME FANDOM TEST</text>
    </svg>
  `;

  return svg.trim();
}

function updateFriendBanner() {
  const panel = document.querySelector(".result-summary-panel");
  if (!panel) {
    return;
  }

  const existing = panel.querySelector(".friend-banner");

  if (state.isFriendView) {
    if (!existing) {
      const html = `
        <div class="friend-banner" role="status" aria-live="polite">
          <strong>친구가 공유한 덕질 유형이에요 💜</strong>
          <span>앱 설치·로그인 없이 바로 해볼 수 있어요.</span>
          <button type="button" class="btn primary friend-cta" data-share="retry">나도 테스트하기 →</button>
        </div>
      `;
      panel.insertAdjacentHTML("afterend", html);
    }
    return;
  }

  if (existing) {
    existing.remove();
  }
}

function showResultErrorFallback(error) {
  const cardWrap = document.getElementById("result-card-wrap");
  if (!cardWrap) {
    return;
  }

  console.error("결과 카드 렌더링 실패:", error);
  cardWrap.innerHTML = `
    <div class="result-error-panel" role="alert">
      <div class="result-error-mark">!</div>
      <h3>결과를 불러오지 못했어요.</h3>
      <p>다시 시도해 주세요.</p>
      <div class="result-error-actions">
        <button type="button" class="btn secondary" data-action="retry-result">다시 시도</button>
        <button type="button" class="btn" data-action="reset-to-intro">처음으로</button>
      </div>
    </div>
  `;

  cardWrap.querySelector('[data-action="retry-result"]').addEventListener("click", () => {
    if (state.currentResult) {
      showScreen("result");
      renderResult();
    } else {
      resetToIntro();
    }
  });

  cardWrap.querySelector('[data-action="reset-to-intro"]').addEventListener("click", () => {
    resetToIntro();
  });
}

function showResult() {
  showScreen("result");
  try {
    renderResult();
  } catch (error) {
    showResultErrorFallback(error);
  }
}

function getFeedbackPayloadFromForm() {
  const form = document.getElementById("feedback-form");
  if (!form) {
    return null;
  }

  const honeypot = form.querySelector('input[name="website"]');
  if (honeypot && honeypot.value.trim()) {
    return null;
  }

  const q1 = Number(document.querySelector('[data-rating-group="q1_resultMatch"].selected')?.dataset?.value || "");
  const q2 = Number(document.querySelector('[data-rating-group="q2_explanationClarity"].selected')?.dataset?.value || "");
  const q3 = form.querySelector('input[name="q3_bestMatchingAxis"]:checked');
  const q4 = document.getElementById("q4_mismatchReason");
  const q5 = document.getElementById("q5_comments");

  if (!state.currentResult && !window.__lastFeedbackResult) {
    return null;
  }

  const result = state.currentResult || window.__lastFeedbackResult;
  const percentages = Array.isArray(result?.axisStats)
    ? result.axisStats.map((item) => Number(item.percentA || 0))
    : [50, 50, 50, 50];

  return {
    submittedAt: new Date().toISOString(),
    typeCode: result?.code || "",
    percentages,
    q1_resultMatch: q1 || "",
    q2_explanationClarity: q2 || "",
    q3_bestMatchingAxis: q3 ? q3.value : "",
    q4_mismatchReason: q4 ? q4.value.trim() : "",
    q5_comments: q5 ? q5.value.trim() : "",
    userAgentType: window.innerWidth <= 768 ? "mobile" : "desktop",
    appVersion: "anime-fandom-test"
  };
}

function renderFeedbackText() {
  const payload = getFeedbackPayloadFromForm();
  if (!payload) {
    return "";
  }

  return [
    "테스트 결과 평가 설문",
    `submittedAt: ${payload.submittedAt}`,
    `typeCode: ${payload.typeCode}`,
    `percentages: ${payload.percentages.join(" - ")}`,
    `q1_resultMatch: ${payload.q1_resultMatch}`,
    `q2_explanationClarity: ${payload.q2_explanationClarity}`,
    `q3_bestMatchingAxis: ${payload.q3_bestMatchingAxis}`,
    `q4_mismatchReason: ${payload.q4_mismatchReason}`,
    `q5_comments: ${payload.q5_comments}`,
    `userAgentType: ${payload.userAgentType}`,
    `appVersion: ${payload.appVersion}`
  ].join("\n");
}

async function copyFeedbackText() {
  const text = renderFeedbackText();
  if (!text) {
    showToast("복사할 응답이 없어요.");
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      showToast("응답 내용을 복사했어요.");
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    showToast("응답 내용을 복사했어요.");
  } catch (error) {
    const manual = window.prompt("응답 내용을 복사해 주세요.", text);
    if (manual !== null) {
      showToast("응답 내용을 준비했어요.");
    }
  }
}

function showFeedbackError(fieldName) {
  const field = document.querySelector(`[data-field="${fieldName}"]`);
  if (!field) {
    return;
  }

  field.classList.add("has-error");
  const error = field.querySelector(".form-error");
  if (error) {
    error.style.display = "block";
  }

  const focusTarget = field.querySelector(".rating-btn, input[name='q3_bestMatchingAxis'], .survey-textarea") || field.querySelector("input");
  if (focusTarget && typeof focusTarget.focus === "function") {
    focusTarget.focus();
  }
}

function clearFeedbackErrors() {
  document.querySelectorAll(".survey-field").forEach((field) => field.classList.remove("has-error"));
}

function validateFeedbackForm() {
  clearFeedbackErrors();

  const q1 = document.querySelector('[data-rating-group="q1_resultMatch"].selected');
  const q2 = document.querySelector('[data-rating-group="q2_explanationClarity"].selected');
  const q3 = document.querySelector('input[name="q3_bestMatchingAxis"]:checked');

  let firstInvalid = null;
  if (!q1) {
    showFeedbackError("q1_resultMatch");
    firstInvalid = firstInvalid || "q1_resultMatch";
  }
  if (!q2) {
    showFeedbackError("q2_explanationClarity");
    firstInvalid = firstInvalid || "q2_explanationClarity";
  }
  if (!q3) {
    showFeedbackError("q3_bestMatchingAxis");
    firstInvalid = firstInvalid || "q3_bestMatchingAxis";
  }

  if (firstInvalid) {
    const firstField = document.querySelector(`[data-field="${firstInvalid}"]`);
    if (firstField) {
      firstField.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusTarget = firstField.querySelector(".rating-btn, input[name='q3_bestMatchingAxis']");
      if (focusTarget && typeof focusTarget.focus === "function") {
        focusTarget.focus();
      }
    }
    return false;
  }

  return true;
}

function attachRatingSelectionHandlers() {
  document.querySelectorAll(".rating-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.dataset.ratingGroup;
      const value = button.dataset.value;
      document.querySelectorAll(`.rating-btn[data-rating-group="${group}"]`).forEach((item) => {
        const selected = item.dataset.value === value;
        item.classList.toggle("selected", selected);
        item.setAttribute("aria-checked", selected ? "true" : "false");
      });
      const readout = document.getElementById(`${group}_readout`);
      const scoreLabels = {
        1: "1점 전혀 그렇지 않다",
        2: "2점 그렇지 않다",
        3: "3점 보통이다",
        4: "4점 그렇다",
        5: "5점 매우 그렇다"
      };
      if (readout) {
        readout.textContent = `선택: ${scoreLabels[value] || value}`;
      }
      const field = document.querySelector(`[data-field="${group}"]`);
      if (field) {
        field.classList.remove("has-error");
      }
    });

    button.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " " && event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "ArrowDown" && event.key !== "ArrowUp") {
        return;
      }
      event.preventDefault();
      const group = button.dataset.ratingGroup;
      const buttons = [...document.querySelectorAll(`.rating-btn[data-rating-group="${group}"]`)];
      const currentIndex = buttons.indexOf(button);
      let targetIndex = currentIndex;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        targetIndex = Math.min(buttons.length - 1, currentIndex + 1);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        targetIndex = Math.max(0, currentIndex - 1);
      }
      const nextButton = buttons[targetIndex];
      if (nextButton) {
        nextButton.click();
        nextButton.focus();
      }
    });
  });
}

function attachTextareaCounters() {
  document.querySelectorAll(".survey-textarea").forEach((textarea) => {
    const countEl = document.getElementById(`${textarea.id}_count`);
    const sync = () => {
      if (countEl) {
        countEl.textContent = String(textarea.value.length);
      }
    };
    textarea.addEventListener("input", sync);
    sync();
  });
}

function markFeedbackSubmitted() {
  setFeedbackSubmitted(true);
  updateSurveyButtonState();
}

function showThankYouScreen() {
  showScreen("thanks");
}

async function submitFeedbackForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const honeypot = form.querySelector('input[name="website"]');
  if (honeypot && honeypot.value.trim()) {
    return;
  }

  if (!validateFeedbackForm()) {
    return;
  }

  const payload = getFeedbackPayloadFromForm();
  if (!payload) {
    showToast("응답을 준비하지 못했어요.");
    return;
  }

  const button = document.getElementById("feedback-submit-btn");
  const status = document.getElementById("feedback-status");
  const copyButton = document.getElementById("feedback-copy-btn");
  button.disabled = true;
  button.textContent = "보내는 중...";
  if (status) {
    status.textContent = "";
  }

  if (!FEEDBACK_ENDPOINT) {
    console.warn("FEEDBACK_ENDPOINT is not configured. Survey fallback copy mode enabled.");
    if (status) {
      status.textContent = "설문 전송 설정이 아직 끝나지 않았어요.";
    }
    if (copyButton) {
      copyButton.style.display = "block";
    }
    button.disabled = false;
    button.textContent = "응답 제출";
    return;
  }

  try {
    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    markFeedbackSubmitted();
    showThankYouScreen();
  } catch (error) {
    if (status) {
      status.textContent = "전송하지 못했어요. 잠시 후 다시 시도해 주세요.";
    }
    if (copyButton) {
      copyButton.style.display = "block";
    }
    button.disabled = false;
    button.textContent = "응답 제출";
    showToast("전송하지 못했어요. 잠시 후 다시 시도해 주세요.");
    console.warn("Feedback send failed:", error);
  }
}

function attachSurveyEvents() {
  const surveyBack = document.getElementById("survey-back-btn");
  if (surveyBack) {
    surveyBack.addEventListener("click", () => {
      showScreen("result");
      if (state.currentResult) {
        renderResult();
      }
    });
  }

  const form = document.getElementById("feedback-form");
  if (form) {
    form.addEventListener("submit", submitFeedbackForm);
  }

  const copyButton = document.getElementById("feedback-copy-btn");
  if (copyButton) {
    copyButton.addEventListener("click", copyFeedbackText);
  }

  const thanksResult = document.getElementById("thanks-result-btn");
  if (thanksResult) {
    thanksResult.addEventListener("click", () => {
      showScreen("result");
      if (state.currentResult) {
        renderResult();
      }
    });
  }

  const thanksHome = document.getElementById("thanks-home-btn");
  if (thanksHome) {
    thanksHome.addEventListener("click", () => {
      resetToIntro();
    });
  }

  const surveyTrigger = document.getElementById("survey-trigger-btn");
  if (surveyTrigger) {
    surveyTrigger.addEventListener("click", () => {
      if (getFeedbackSubmitted()) {
        showThankYouScreen();
        return;
      }
      showScreen("survey");
    });
  }
}

function renderResult() {
  if (!state.currentResult) {
    return;
  }

  try {
    const cardWrap = document.getElementById("result-card-wrap");
    if (!cardWrap) {
      throw new Error("result-card-wrap missing");
    }

    cardWrap.innerHTML = buildResultCardSvg(state.currentResult);
  } catch (error) {
    console.error("결과 카드 렌더링 실패:", error);
    showResultErrorFallback(error);
    return;
  }

  try {
    renderAxisBreakdown();
  } catch (error) {
    console.error("축별 분석 렌더링 실패:", error);
  }

  try {
    renderDetailedReport();
  } catch (error) {
    console.error("상세 결과 렌더링 실패:", error);
  }

  try {
    updateSurveyButtonState();
    updateFriendBanner();
    const friendButton = document.querySelector(".friend-cta");
    if (friendButton) {
      friendButton.addEventListener("click", () => {
        clearResultHash();
        state.isFriendView = false;
        state.sharedToken = "";
        state.answers = {};
        state.index = 0;
        state.currentResult = null;
        showScreen("intro");
      });
    }
  } catch (error) {
    console.error("공유 배너 렌더링 실패:", error);
  }
}

function renderDetailedReport() {
  const report = document.getElementById("result-report");
  if (!report || !state.currentResult) {
    return;
  }

  const profile = state.currentResult.profile;
  const traits = (profile.traits || []).map((trait) => `
    <div class="trait-item">
      <strong>${trait.title}</strong>
      <span>${trait.text}</span>
    </div>
  `).join("");

  const strengths = (profile.strengths || []).map((item) => `
    <div class="strength-item">
      <strong>장점</strong>
      <span>${item}</span>
    </div>
  `).join("");

  const weaknesses = (profile.weaknesses || []).map((item) => `
    <div class="weak-item">
      <strong>상대적으로 자주 보이는 습관</strong>
      <span>${item}</span>
    </div>
  `).join("");

  const axisSummary = state.currentResult.axisStats.map((axis) => {
    const leftLabel = `${axis.sideAName} ${axis.percentA}%`;
    const rightLabel = `${axis.percentB}% ${axis.sideBName}`;
    const note = axis.winner === "X"
      ? "두 성향이 비슷하게 드러나요."
      : `${axis.winner === "A" ? axis.sideAName : axis.sideBName} 쪽이 조금 더 강하게 나타나요.`;

    return `
      <div class="axis-summary-row">
        <div class="axis-summary-top">
          <span>${axis.label}</span>
          <span>${leftLabel} / ${rightLabel}</span>
        </div>
        <div class="axis-summary-bar" aria-label="${axis.label}: ${leftLabel} / ${rightLabel}">
          <span class="segment-a" style="width:${axis.percentA}%"></span>
          <span class="segment-b" style="width:${axis.percentB}%"></span>
        </div>
      </div>
    `;
  }).join("");

  const keywords = (profile.keywords || []).map((keyword) => `<span class="keyword-pill">${keyword}</span>`).join("");

  report.innerHTML = `
    <article class="result-article">
      <section class="report-hero">
        <div class="report-hero-art">${buildCharacterSvg(state.currentResult.code, 260)}</div>
        <div class="report-copy">
          <span class="result-badge">${state.currentResult.code}</span>
          <h3>${profile.koreanName || state.currentResult.name.join(" ")}</h3>
          <p class="result-line">${profile.line}</p>
          <p class="result-intro">${profile.intro}</p>
          <div class="keyword-row">${keywords}</div>
        </div>
      </section>

      <section class="report-section">
        <h4>성격 소개</h4>
        <p>${profile.summary}</p>
      </section>

      <section class="report-section">
        <h4>핵심 특성</h4>
        <div class="trait-grid">${traits}</div>
      </section>

      <section class="report-section">
        <h4>강점과 매력</h4>
        <div class="strength-grid">${strengths}</div>
      </section>

      <section class="report-section">
        <h4>가볍게 알아볼 수 있는 습관</h4>
        <div class="weak-grid">${weaknesses}</div>
      </section>

      <section class="report-section">
        <h4>애니 덕질 라이프스타일</h4>
        <p>${profile.lifestyle}</p>
      </section>

      <section class="report-section">
        <h4>호흡이 잘 맞는 팬 유형</h4>
        <p>${profile.compatibility}</p>
      </section>

      <section class="report-section">
        <h4>시각적 성향 요약</h4>
        <div class="axis-summary">${axisSummary}</div>
        <p class="axis-summary-note">수치와 설명은 서로를 보완하는 도구예요. 한 유형의 매력을 이해하는 데는 감정과 취향이 더 중요합니다.</p>
      </section>
    </article>
  `;
}

function generateResultImageBlob() {
  return new Promise(async (resolve, reject) => {
    if (!state.currentResult) {
      reject(new Error("결과가 준비되지 않았습니다."));
      return;
    }

    const svgMarkup = buildResultCardSvg(state.currentResult);
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    try {
      if (document.fonts && typeof document.fonts.load === "function") {
        try {
          await withTimeout(() => document.fonts.load('900 38px "Noto Sans KR"'), 3000, "폰트 로딩 타임아웃");
          await withTimeout(() => document.fonts.load('800 24px "Noto Sans KR"'), 3000, "폰트 로딩 타임아웃");
          await withTimeout(() => document.fonts.ready, 3000, "폰트 준비 타임아웃");
        } catch (error) {
          console.warn("Font load failed; continuing without blocking result render.", error);
        }
      }

      const image = await new Promise((imageResolve, imageReject) => {
        const img = new Image();
        img.onload = () => imageResolve(img);
        img.onerror = () => imageReject(new Error("결과 이미지를 생성하지 못했습니다."));
        img.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1560;
      const context = canvas.getContext("2d");
      context.fillStyle = "#f6f2ff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((pngBlob) => {
        URL.revokeObjectURL(url);
        if (pngBlob) {
          resolve(pngBlob);
          return;
        }
        reject(new Error("PNG 생성에 실패했습니다."));
      }, "image/png");
    } catch (error) {
      URL.revokeObjectURL(url);
      reject(error);
    }
  });
}

function getShareText() {
  const code = state.currentResult.code;
  const name = state.currentResult.name.join(" ");
  return `나의 덕질 유형은 "${name}" (${code})! 너의 덕질 유형도 확인해봐`;
}

function showResultImageOverlay(blob) {
  const overlay = document.getElementById("image-overlay");
  if (!overlay) {
    const root = document.createElement("div");
    root.id = "image-overlay";
    root.className = "image-overlay";
    root.innerHTML = `
      <div class="image-overlay-backdrop" aria-hidden="true"></div>
      <div class="image-overlay-dialog" role="dialog" aria-modal="true" aria-label="결과 이미지 저장">
        <button type="button" class="image-overlay-close" aria-label="닫기">✕</button>
        <p class="image-overlay-copy">이미지를 길게 눌러 저장하세요</p>
        <img alt="결과 이미지" class="image-overlay-preview" />
      </div>
    `;
    document.body.appendChild(root);

    root.querySelector(".image-overlay-close").addEventListener("click", () => root.remove());
    root.addEventListener("click", (event) => {
      if (event.target === root || event.target.classList.contains("image-overlay-backdrop")) {
        root.remove();
      }
    });
  }

  const overlayNode = document.getElementById("image-overlay");
  const preview = overlayNode.querySelector(".image-overlay-preview");
  const url = URL.createObjectURL(blob);
  preview.src = url;
  preview.onload = () => URL.revokeObjectURL(url);
  overlayNode.classList.add("show");
}

async function saveResultImage() {
  if (!state.currentResult) {
    return;
  }

  try {
    const blob = await generateResultImageBlob();

    if (isInAppBrowser()) {
      showResultImageOverlay(blob);
      showToast("이미지를 길게 눌러 저장해 주세요.");
      return;
    }

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `anime-fandom-${state.currentResult.code}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("이미지를 저장했어요.");
  } catch (error) {
    showToast("이미지 저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
  }
}

async function shareToInstagram() {
  try {
    const blob = await generateResultImageBlob();
    const file = new File([blob], `anime-fandom-${state.currentResult.code}.png`, { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        text: `${getShareText()} ${getShareUrl()}`
      });
      return;
    }

    if (isInAppBrowser()) {
      showResultImageOverlay(blob);
      showToast("이미지를 길게 눌러 저장해 주세요.");
      return;
    }

    await saveResultImage();
    showToast("이미지를 저장했어요. 인스타그램 스토리나 게시물에 올려 주세요.");
  } catch (error) {
    showToast("공유를 위해 이미지를 저장해 주세요.");
  }
}

function shareToX() {
  const shareUrl = getShareUrl();
  const text = `${getShareText()} ${shareUrl}`;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

async function shareToKakao() {
  const value = getShareUrl();
  const text = `${getShareText()} ${value}`;

  if (KAKAO_KEY) {
    if (!window.Kakao) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";
        script.onload = resolve;
        script.onerror = () => reject(new Error("Kakao SDK 로드 실패"));
        document.head.appendChild(script);
      }).catch((error) => {
        console.warn("Kakao SDK load failed:", error);
      });
    }

    try {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_KEY);
      }

      if (window.Kakao && typeof window.Kakao.Share?.sendDefault === "function") {
        window.Kakao.Share.sendDefault({
          objectType: "text",
          text: getShareText(),
          link: {
            mobileWebUrl: value,
            webUrl: value
          }
        });
        return;
      }
    } catch (error) {
      console.warn("Kakao share failed:", error);
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: "애니 덕질 성향 테스트",
        text: getShareText(),
        url: value
      });
      return;
    } catch (error) {
      showToast("공유를 위해 링크를 복사해 주세요.");
    }
  }

  try {
    await withTimeout(async () => navigator.clipboard.writeText(text), 3000, "클립보드 쓰기 타임아웃");
    showToast("공유 문구를 복사했어요. 카카오톡에 붙여넣어 주세요.");
  } catch (error) {
    const manualValue = window.prompt("링크를 복사해 주세요", text);
    if (manualValue !== null) {
      showToast("공유 문구를 준비해 두었어요.");
    } else {
      showToast("공유 문구를 복사하지 못했어요. 내용을 직접 복사해 주세요.");
    }
  }
}

async function copyLink() {
  const value = getShareUrl();
  try {
    await withTimeout(async () => navigator.clipboard.writeText(value), 3000, "링크 복사 타임아웃");
    showToast("링크를 복사했어요.");
  } catch (error) {
    const manualValue = window.prompt("링크를 복사해 주세요", value);
    if (manualValue !== null) {
      showToast("링크를 수동으로 복사해 주세요.");
    } else {
      showToast("복사하지 못했어요. 주소창의 링크를 직접 복사해 주세요.");
    }
  }
}

function resetToIntro() {
  clearResultHash();
  state.order = [];
  state.answers = {};
  state.index = 0;
  state.currentResult = null;
  state.isFriendView = false;
  state.sharedToken = "";
  showScreen("intro");
}

function bindEvents() {
  const startButton = document.getElementById("start-btn");
  if (startButton) {
    startButton.addEventListener("click", startTest);
  }

  const prevButton = document.getElementById("prev-btn");
  if (prevButton) {
    prevButton.addEventListener("click", prevQuestion);
  }

  document.querySelectorAll("[data-share]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.share;
      if (action === "instagram") {
        await shareToInstagram();
      } else if (action === "x") {
        shareToX();
      } else if (action === "kakao") {
        await shareToKakao();
      } else if (action === "save") {
        await saveResultImage();
      } else if (action === "copy") {
        await copyLink();
      } else if (action === "retry") {
        resetToIntro();
      }
    });
  });
}

function createHeroButton() {
  const heroArt = document.getElementById("hero-art");
  if (!heroArt) {
    return;
  }

  heroArt.innerHTML = "";
  const heroCodes = ["RCFP", "SCFP", "SWFD"];
  heroCodes.forEach((code, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `hero-character hero-trigger hero-character-${index + 1}`;
    button.setAttribute("aria-label", "테스트 안내 열기");
    button.innerHTML = buildCharacterSvg(code, 170);
    button.addEventListener("click", () => openCharacterModal("intro"));
    heroArt.appendChild(button);
  });
}

function getModalTypeCodes() {
  return TYPE_CODES;
}

function openCharacterModal(code) {
  const modalId = "character-info-modal";

  let existing = document.getElementById(modalId);
  if (existing) {
    existing.remove();
  }

  const isIntro = code === "intro";
  const codes = getModalTypeCodes();
  const initialIndex = isIntro ? 0 : codes.indexOf(String(code).toUpperCase());
  const initialCode = isIntro ? codes[0] : codes[initialIndex] || codes[0];

  const modal = document.createElement("div");
  modal.id = modalId;
  modal.className = "character-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "character-modal-title");

  const typeName = isIntro ? ["애니 덕질", "테스트 안내"] : getTypeName(initialCode);
  const meta = isIntro ? {
    tagline: "24문항으로 나를 알아보는 덕질 테스트",
    description: "평소의 애니 감상 습관과 덕질 방식을 살펴보고, 나만의 유형을 한 번에 확인할 수 있어요.",
    traits: ["24문항", "약 3~5분", "앱 설치 없이 바로 공유"]
  } : DATA.typeMeta[initialCode] || DATA.fallbackType;

  const content = isIntro ? `
    <div class="character-modal-body">
      <button type="button" class="character-modal-close" aria-label="닫기">✕</button>
      <div class="character-modal-hero">
        ${buildCharacterSvg(initialCode, 220)}
      </div>
      <div class="character-modal-copy">
        <span class="character-modal-badge">안내</span>
        <h3 id="character-modal-title">애니 덕질 테스트</h3>
        <p class="character-modal-tagline">${meta.tagline}</p>
        <p class="character-modal-description">${meta.description}</p>
        <ul class="character-modal-list">
          <li>24개의 질문으로 나의 덕질 습관을 체크해요.</li>
          <li>대략 3~5분 안에 결과를 확인할 수 있어요.</li>
          <li>앱 설치 없이 링크나 이미지로 쉽게 공유할 수 있어요.</li>
        </ul>
        <div class="character-modal-actions">
          <button type="button" class="btn primary character-modal-start" data-close="true">나도 테스트하기 →</button>
        </div>
      </div>
    </div>
  ` : `
    <div class="character-modal-body">
      <button type="button" class="character-modal-close" aria-label="닫기">✕</button>
      <div class="character-modal-hero">
        ${buildCharacterSvg(initialCode, 220)}
      </div>
      <div class="character-modal-copy">
        <span class="character-modal-badge">${initialCode}</span>
        <h3 id="character-modal-title">${typeName[0]} ${typeName[1]}</h3>
        <p class="character-modal-tagline">${meta.tagline || DATA.fallbackType.tagline}</p>
        <p class="character-modal-description">${meta.description || DATA.fallbackType.description}</p>
        <div class="character-modal-chips">
          ${(DATA.axes || []).map((axis) => `<span class="trait-chip">${axis.sideAName}</span>`).slice(0, 4).join("")}
        </div>
        <div class="character-modal-actions">
          <button type="button" class="btn secondary character-modal-prev" aria-label="이전 유형">←</button>
          <button type="button" class="btn primary character-modal-start" data-close="true">나도 테스트하기 →</button>
          <button type="button" class="btn secondary character-modal-next" aria-label="다음 유형">→</button>
        </div>
      </div>
    </div>
  `;

  modal.innerHTML = content;
  document.body.appendChild(modal);
  document.body.classList.add("modal-open");

  const close = () => {
    document.removeEventListener("keydown", trapHandler);
    modal.remove();
    document.body.classList.remove("modal-open");
  };

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      close();
    }
  });

  const closeButton = modal.querySelector(".character-modal-close");
  if (closeButton) {
    closeButton.addEventListener("click", close);
  }

  const startButton = modal.querySelector(".character-modal-start");
  if (startButton) {
    startButton.addEventListener("click", () => {
      close();
      startTest();
    });
  }

  const focusables = modal.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
  const firstFocusable = focusables[0];
  if (firstFocusable) {
    firstFocusable.focus();
  }

  const trapHandler = (event) => {
    if (event.key === "Escape") {
      close();
      return;
    }

    if (event.key !== "Tab" || !focusables.length) {
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  document.addEventListener("keydown", trapHandler);
  modal.addEventListener("beforeunload", () => {
    document.removeEventListener("keydown", trapHandler);
  });

  const prevArrow = modal.querySelector(".character-modal-prev");
  const nextArrow = modal.querySelector(".character-modal-next");
  if (prevArrow || nextArrow) {
    let currentIndex = initialIndex;
    const walk = (direction) => {
      const nextIndex = (currentIndex + direction + codes.length) % codes.length;
      currentIndex = nextIndex;
      const nextCode = codes[nextIndex];
      const nextName = getTypeName(nextCode);
      const nextMeta = DATA.typeMeta[nextCode] || DATA.fallbackType;
      const modalBody = modal.querySelector(".character-modal-body");
      modalBody.innerHTML = `
        <button type="button" class="character-modal-close" aria-label="닫기">✕</button>
        <div class="character-modal-hero">
          ${buildCharacterSvg(nextCode, 220)}
        </div>
        <div class="character-modal-copy">
          <span class="character-modal-badge">${nextCode}</span>
          <h3 id="character-modal-title">${nextName[0]} ${nextName[1]}</h3>
          <p class="character-modal-tagline">${nextMeta.tagline || DATA.fallbackType.tagline}</p>
          <p class="character-modal-description">${nextMeta.description || DATA.fallbackType.description}</p>
          <div class="character-modal-chips">
            ${(DATA.axes || []).map((axis) => `<span class="trait-chip">${axis.sideAName}</span>`).slice(0, 4).join("")}
          </div>
          <div class="character-modal-actions">
            <button type="button" class="btn secondary character-modal-prev" aria-label="이전 유형">←</button>
            <button type="button" class="btn primary character-modal-start" data-close="true">나도 테스트하기 →</button>
            <button type="button" class="btn secondary character-modal-next" aria-label="다음 유형">→</button>
          </div>
        </div>
      `;

      modalBody.querySelector(".character-modal-close").addEventListener("click", close);
      modalBody.querySelector(".character-modal-start").addEventListener("click", () => {
        close();
        startTest();
      });
      modalBody.querySelector(".character-modal-prev").addEventListener("click", () => walk(-1));
      modalBody.querySelector(".character-modal-next").addEventListener("click", () => walk(1));
      modalBody.querySelector(".character-modal-close").focus();
    };

    prevArrow.addEventListener("click", () => walk(-1));
    nextArrow.addEventListener("click", () => walk(1));
  }
}

function runDebugSelfCheck() {
  try {
    const codes = [...TYPE_CODES, "XXXX", "RCFX", "XCFP"];
    codes.forEach((code) => {
      try {
        const name = getTypeName(code);
        const svg = buildResultCardSvg({
          code,
          name,
          axisStats: DATA.axes.map((axis, index) => ({
            ...axis,
            winner: "X",
            percentA: 50,
            percentB: 50,
            label: axis.label,
            sideAName: axis.sideAName,
            sideBName: axis.sideBName
          }))
        });
        console.log(`debug:${code}: PASS`, Boolean(svg && svg.includes("<svg")));
      } catch (error) {
        console.error(`debug:${code}: FAIL`, error);
      }
    });
  } catch (error) {
    console.error("debug self-check failed", error);
  }
}

function initialize() {
  setHeroArt();
  renderTypePreview();
  bindEvents();
  attachRatingSelectionHandlers();
  attachTextareaCounters();
  attachSurveyEvents();

  state.feedbackSubmitted = safeLocalStorageGet(FEEDBACK_SUBMITTED_KEY) === "1";

  const shouldDebug = new URLSearchParams(window.location.search).get("debug") === "1";
  if (shouldDebug) {
    runDebugSelfCheck();
  }

  const token = parseResultHash();
  if (token) {
    const result = buildResultFromToken(token);
    if (result) {
      state.currentResult = result;
      state.isFriendView = true;
      state.sharedToken = buildResultShareToken(result);
      showResult();
      return;
    }
  }

  showScreen("intro");
}

document.addEventListener("DOMContentLoaded", initialize);
