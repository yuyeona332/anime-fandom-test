const SITE_URL = "https://yuyeon-a.github.io/connection-care/";
const KAKAO_KEY = "";

const DATA = window.ANIME_TEST_DATA;

const state = {
  order: [],
  answers: {},
  index: 0,
  currentResult: null,
  isFriendView: false,
  sharedToken: ""
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

function renderTypePreview() {
  const preview = document.getElementById("type-preview");
  if (!preview) {
    return;
  }

  const buttons = TYPE_CODES.map((code) => {
    const name = getTypeName(code);
    return `
      <button type="button" class="type-card" data-character-code="${code}" aria-label="${name[0]} ${name[1]} 상세 정보 보기">
        <div class="type-card-art" aria-hidden="true">${buildCharacterSvg(code, 110)}</div>
        <span class="label">${name[1]}</span>
        <span class="sub">${name[0]}</span>
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
    prevBtn.disabled = state.index === 0;
  }

  const nextBtn = document.getElementById("next-btn");
  if (nextBtn) {
    const isAnswered = isQuestionAnswered(question.id);
    nextBtn.disabled = !isAnswered;
    nextBtn.textContent = state.index === total - 1 ? "결과 보기" : "다음 →";
    nextBtn.setAttribute("aria-label", state.index === total - 1 ? "결과 보기" : "다음 질문");
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
    button.addEventListener("click", () => {
      const selectedValue = normalizeAnswerValue(button.dataset.value);
      if (selectedValue === null) {
        showToast("답을 선택해 주세요.");
        return;
      }

      state.answers[question.id] = selectedValue;
      renderQuestion();
    });

    button.addEventListener("keydown", (event) => {
      const key = event.key;
      if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", " ", "Enter"].indexOf(key) === -1) {
        return;
      }

      event.preventDefault();
      const currentIndex = optionButtons.indexOf(button);
      let targetIndex = currentIndex;

      if (key === "ArrowRight" || key === "ArrowDown") {
        targetIndex = Math.min(optionButtons.length - 1, currentIndex + 1);
      } else if (key === "ArrowLeft" || key === "ArrowUp") {
        targetIndex = Math.max(0, currentIndex - 1);
      } else if (key === " " || key === "Enter") {
        const selectedValue = normalizeAnswerValue(button.dataset.value);
        if (selectedValue !== null) {
          state.answers[question.id] = selectedValue;
          renderQuestion();
        }
        return;
      }

      const targetButton = optionButtons[targetIndex];
      if (!targetButton) {
        return;
      }

      const selectedValue = normalizeAnswerValue(targetButton.dataset.value);
      if (selectedValue === null) {
        return;
      }

      state.answers[question.id] = selectedValue;
      renderQuestion();
      setTimeout(() => {
        const focusTarget = answerOptions.querySelector(`.answer-option[data-value="${selectedValue}"]`);
        if (focusTarget) {
          focusTarget.focus();
        }
      }, 0);
    });
  });
}

function nextQuestion() {
  const question = getCurrentQuestion();
  if (!question) {
    return;
  }

  if (!isQuestionAnswered(question.id)) {
    showToast("답을 선택해 주세요.");
    const firstOption = document.querySelector(".answer-option");
    if (firstOption) {
      firstOption.focus();
    }
    return;
  }

  if (state.index < DATA.questions.length - 1) {
    state.index += 1;
    renderQuestion();
    return;
  }

  buildResult();
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
  const normalized = Array.isArray(code) ? code.join("").toUpperCase() : String(code || "RCFP").toUpperCase();

  const mascotMap = {
    RCFP: { animal: "cat", palette: ["#fbe7f0", "#ffc9dc", "#fff1d9", "#f9a9c6", "#7b6bd6"], accessory: "bow", expression: "spark", outline: "#604f7d" },
    RCFD: { animal: "rabbit", palette: ["#f7eaff", "#dcd5ff", "#ffe9c8", "#b6a8ff", "#7d76ea"], accessory: "heart", expression: "happy", outline: "#5b4ea0" },
    RCEP: { animal: "bear", palette: ["#fde2c0", "#f7b578", "#fff8ec", "#f4d6a4", "#d57d5e"], accessory: "star", expression: "sleepy", outline: "#68523d" },
    RCED: { animal: "hamster", palette: ["#dfeeff", "#b8d7ff", "#fff3d9", "#8ab7ff", "#4d8af4"], accessory: "glasses", expression: "curious", outline: "#4d5c96" },
    RWFP: { animal: "puppy", palette: ["#f9e7d0", "#f4cc9d", "#fbead8", "#f0b788", "#8e7ce4"], accessory: "scarf", expression: "spark", outline: "#655c54" },
    RWFD: { animal: "mouse", palette: ["#e9f3ff", "#d2defd", "#fceae8", "#a5c5ff", "#7a91e3"], accessory: "flower", expression: "happy", outline: "#4e5c88" },
    RWEP: { animal: "fox", palette: ["#ffe7d8", "#ffb58c", "#fff0df", "#ff9b73", "#f87262"], accessory: "badge", expression: "sleepy", outline: "#7c4037" },
    RWED: { animal: "panda", palette: ["#f4f5fb", "#d9def2", "#f4e7d2", "#a8b4d6", "#4c5b87"], accessory: "ribbon", expression: "curious", outline: "#4a4d62" },
    SCFP: { animal: "cat", palette: ["#f7dff0", "#ffbfd7", "#fefaf2", "#f5aecc", "#7f7de0"], accessory: "bow", expression: "happy", outline: "#5e5b8d" },
    SCFD: { animal: "rabbit", palette: ["#e9e7ff", "#c8d0ff", "#fff3d7", "#a8b0ff", "#7f77d4"], accessory: "heart", expression: "spark", outline: "#4d4c7f" },
    SCEP: { animal: "hamster", palette: ["#fdf2d9", "#f4d4a5", "#fffaf3", "#e8b46b", "#d88255"], accessory: "star", expression: "sleepy", outline: "#6a5848" },
    SCED: { animal: "mouse", palette: ["#e8f7ff", "#c5efff", "#fff7da", "#9adcf8", "#4ca9d9"], accessory: "badge", expression: "curious", outline: "#4b6f93" },
    SWFP: { animal: "puppy", palette: ["#f5efe2", "#efddbe", "#fffaf0", "#d9c9a7", "#b88c5e"], accessory: "bell", expression: "spark", outline: "#6d5e52" },
    SWFD: { animal: "fox", palette: ["#ffe7df", "#ffbf9d", "#fff8e8", "#ff9e86", "#d5644e"], accessory: "ribbon", expression: "happy", outline: "#7b4b45" },
    SWEP: { animal: "bear", palette: ["#e7f4db", "#bbcfa6", "#fef9ef", "#9ec98c", "#76a965"], accessory: "flower", expression: "sleepy", outline: "#4d6b45" },
    SWED: { animal: "rabbit", palette: ["#ffe9ec", "#ffc4d7", "#fff7ee", "#ffa8cf", "#d777a6"], accessory: "bow", expression: "curious", outline: "#724d62" }
  };

  const profile = mascotMap[normalized] || mascotMap.RCFP;
  const [fur, accent, cheek, ear, line] = profile.palette;

  const accessoryMap = {
    bow: `<g transform="translate(110 25)"><path d="M-15 8 C-15 -8 -2 -10 0 0 C2 -10 15 -8 15 8 C15 18 6 18 0 12 C-6 18 -15 18 -15 8Z" fill="#f7d9ef" stroke="${line}" stroke-width="3" stroke-linejoin="round"/></g>`,
    heart: `<g transform="translate(110 28)"><path d="M0 8 C0 -6 16 -12 26 0 C36 -12 52 -6 52 8 C52 24 28 38 26 40 C24 38 0 24 0 8Z" fill="#ffbfd5" stroke="${line}" stroke-width="3" stroke-linejoin="round" transform="scale(0.55) translate(-26 -18)"/></g>`,
    star: `<g transform="translate(110 24)"><path d="M0 -18 L6 -4 L20 -4 L9 4 L13 18 L0 9 L-13 18 L-9 4 L-20 -4 L-6 -4 Z" fill="#fbe7a1" stroke="${line}" stroke-width="3" stroke-linejoin="round"/></g>`,
    scarf: `<g transform="translate(104 136)"><path d="M-26 0 L26 0 Q34 10 26 20 L-26 20 Q-34 10 -26 0Z" fill="#ec8bbf" stroke="${line}" stroke-width="3"/><path d="M-8 18 L-2 36 M8 18 L2 36" stroke="${line}" stroke-width="3" stroke-linecap="round"/></g>`,
    flower: `<g transform="translate(110 24)"><circle cx="0" cy="0" r="7" fill="#f7d9a4" stroke="${line}" stroke-width="3"/><circle cx="0" cy="-18" r="5" fill="#f7d9a4" stroke="${line}" stroke-width="3"/><circle cx="18" cy="0" r="5" fill="#f7d9a4" stroke="${line}" stroke-width="3"/><circle cx="0" cy="18" r="5" fill="#f7d9a4" stroke="${line}" stroke-width="3"/><circle cx="-18" cy="0" r="5" fill="#f7d9a4" stroke="${line}" stroke-width="3"/></g>`,
    glasses: `<g transform="translate(110 94)"><rect x="-20" y="-8" width="18" height="18" rx="6" fill="rgba(255,255,255,0.8)" stroke="${line}" stroke-width="3"/><rect x="2" y="-8" width="18" height="18" rx="6" fill="rgba(255,255,255,0.8)" stroke="${line}" stroke-width="3"/><path d="M-2 -1 H2" stroke="${line}" stroke-width="3" stroke-linecap="round"/></g>`,
    badge: `<g transform="translate(110 26)"><circle r="12" fill="#f3f0ff" stroke="${line}" stroke-width="3"/><circle cx="0" cy="0" r="4" fill="#ffc9d8" stroke="${line}" stroke-width="2"/></g>`,
    bell: `<g transform="translate(110 26)"><path d="M-8 0 Q0 -14 8 0 L8 10 Q8 18 0 18 Q-8 18 -8 10 Z" fill="#f8d77d" stroke="${line}" stroke-width="3"/><circle cx="0" cy="18" r="5" fill="#fef3ba" stroke="${line}" stroke-width="2"/></g>`,
    ribbon: `<g transform="translate(110 28)"><path d="M0 -10 V18" stroke="${line}" stroke-width="3" stroke-linecap="round"/><path d="M-10 0 Q0 -16 10 0 Q0 12 -10 0Z" fill="#c7ceff" stroke="${line}" stroke-width="3" stroke-linejoin="round"/></g>`
  };

  const speciesBody = {
    cat: {
      body: `<path d="M72 152 C68 128 82 112 109 112 C137 112 150 128 148 152 L146 175 Q110 188 74 175 Z" fill="${fur}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>`,
      earLeft: `<path d="M78 60 L66 26 L95 54 Z" fill="${ear}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>`,
      earRight: `<path d="M142 60 L154 26 L125 54 Z" fill="${ear}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>`,
      tail: `<path d="M152 140 C182 138 184 170 165 186 C159 170 158 156 152 140Z" fill="${fur}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>`,
      paws: `<path d="M90 170 L80 190 M130 170 L140 190" stroke="${line}" stroke-width="4" stroke-linecap="round"/>`,
      outfit: `<path d="M74 146 Q110 128 146 146 L141 176 Q110 186 79 176 Z" fill="${accent}" opacity="0.42"/>`
    },
    rabbit: {
      body: `<ellipse cx="110" cy="148" rx="52" ry="43" fill="${fur}" stroke="${line}" stroke-width="4"/>`,
      earLeft: `<path d="M84 60 L76 20 L108 48 Z" fill="${ear}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/><path d="M90 58 L84 34 L100 48 Z" fill="#ffe9f3" opacity="0.8"/>`,
      earRight: `<path d="M136 60 L144 20 L112 48 Z" fill="${ear}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/><path d="M130 58 L136 34 L120 48 Z" fill="#ffe9f3" opacity="0.8"/>`,
      tail: `<circle cx="164" cy="174" r="10" fill="${fur}" stroke="${line}" stroke-width="3"/>`,
      paws: `<path d="M92 176 L86 192 M128 176 L134 192" stroke="${line}" stroke-width="4" stroke-linecap="round"/>`,
      outfit: `<path d="M82 154 Q110 142 138 154 L136 182 Q110 188 84 182 Z" fill="${accent}" opacity="0.38"/>`
    },
    bear: {
      body: `<ellipse cx="110" cy="150" rx="58" ry="46" fill="${fur}" stroke="${line}" stroke-width="4"/>`,
      earLeft: `<circle cx="82" cy="64" r="12" fill="${ear}" stroke="${line}" stroke-width="4"/>`,
      earRight: `<circle cx="138" cy="64" r="12" fill="${ear}" stroke="${line}" stroke-width="4"/>`,
      tail: `<path d="M154 164 C174 170 182 182 176 196 C164 192 154 178 154 164 Z" fill="${fur}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>`,
      paws: `<path d="M88 174 L80 192 M132 174 L140 192" stroke="${line}" stroke-width="4" stroke-linecap="round"/>`,
      outfit: `<path d="M76 150 Q110 134 144 150 L140 182 Q110 190 80 182 Z" fill="${accent}" opacity="0.42"/>`
    },
    hamster: {
      body: `<ellipse cx="110" cy="150" rx="58" ry="42" fill="${fur}" stroke="${line}" stroke-width="4"/>`,
      earLeft: `<path d="M82 64 L76 36 L98 54 Z" fill="${ear}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>`,
      earRight: `<path d="M138 64 L144 36 L122 54 Z" fill="${ear}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>`,
      tail: `<path d="M160 160 C182 166 186 184 168 194 C156 188 154 176 160 160 Z" fill="${fur}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>`,
      paws: `<path d="M90 176 L82 188 M130 176 L138 188" stroke="${line}" stroke-width="4" stroke-linecap="round"/>`,
      outfit: `<path d="M80 156 Q110 136 140 156 L136 182 Q110 190 84 182 Z" fill="${accent}" opacity="0.38"/>`
    },
    puppy: {
      body: `<ellipse cx="110" cy="153" rx="55" ry="44" fill="${fur}" stroke="${line}" stroke-width="4"/>`,
      earLeft: `<path d="M82 66 L72 42 L98 54 Z" fill="${ear}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>`,
      earRight: `<path d="M138 66 L148 42 L122 54 Z" fill="${ear}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>`,
      tail: `<path d="M156 146 C176 144 184 162 176 180 C166 176 158 162 156 146 Z" fill="${fur}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>`,
      paws: `<path d="M90 176 L82 192 M130 176 L138 192" stroke="${line}" stroke-width="4" stroke-linecap="round"/>`,
      outfit: `<path d="M80 154 Q110 138 140 154 L137 182 Q110 191 83 182 Z" fill="${accent}" opacity="0.38"/>`
    },
    mouse: {
      body: `<ellipse cx="110" cy="152" rx="56" ry="42" fill="${fur}" stroke="${line}" stroke-width="4"/>`,
      earLeft: `<circle cx="88" cy="64" r="10" fill="${ear}" stroke="${line}" stroke-width="4"/>`,
      earRight: `<circle cx="132" cy="64" r="10" fill="${ear}" stroke="${line}" stroke-width="4"/>`,
      tail: `<path d="M152 150 C184 152 196 180 176 194" fill="none" stroke="${fur}" stroke-width="8" stroke-linecap="round"/>`,
      paws: `<path d="M92 176 L82 192 M128 176 L138 192" stroke="${line}" stroke-width="4" stroke-linecap="round"/>`,
      outfit: `<path d="M76 154 Q110 138 144 154 L138 180 Q110 190 82 180 Z" fill="${accent}" opacity="0.38"/>`
    },
    fox: {
      body: `<ellipse cx="110" cy="148" rx="57" ry="44" fill="${fur}" stroke="${line}" stroke-width="4"/>`,
      earLeft: `<path d="M82 64 L68 22 L98 58 Z" fill="${ear}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>`,
      earRight: `<path d="M138 64 L152 22 L122 58 Z" fill="${ear}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>`,
      tail: `<path d="M152 138 C182 130 188 160 170 184 C160 172 154 158 152 138 Z" fill="${fur}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>`,
      paws: `<path d="M90 176 L82 190 M130 176 L138 190" stroke="${line}" stroke-width="4" stroke-linecap="round"/>`,
      outfit: `<path d="M80 150 Q110 136 140 150 L138 182 Q110 190 82 182 Z" fill="${accent}" opacity="0.42"/>`
    },
    panda: {
      body: `<ellipse cx="110" cy="152" rx="56" ry="44" fill="${fur}" stroke="${line}" stroke-width="4"/>`,
      earLeft: `<circle cx="84" cy="62" r="11" fill="${fur}" stroke="${line}" stroke-width="4"/>`,
      earRight: `<circle cx="136" cy="62" r="11" fill="${fur}" stroke="${line}" stroke-width="4"/>`,
      tail: `<path d="M154 144 C178 144 188 168 172 184 C164 178 160 164 154 144 Z" fill="${fur}" stroke="${line}" stroke-width="4" stroke-linejoin="round"/>`,
      paws: `<path d="M90 176 L80 192 M130 176 L140 192" stroke="${line}" stroke-width="4" stroke-linecap="round"/>`,
      outfit: `<path d="M76 154 Q110 138 144 154 L138 182 Q110 188 82 182 Z" fill="${accent}" opacity="0.38"/>`
    }
  };

  const speciesStyle = speciesBody[profile.animal] || speciesBody.cat;
  const eyeMap = {
    spark: `<g><ellipse cx="92" cy="103" rx="8" ry="10" fill="${line}"/><ellipse cx="128" cy="103" rx="8" ry="10" fill="${line}"/><circle cx="89" cy="100" r="2.4" fill="#ffffff"/><circle cx="131" cy="100" r="2.4" fill="#ffffff"/></g>`,
    happy: `<g><circle cx="92" cy="104" r="8" fill="${line}"/><circle cx="128" cy="104" r="8" fill="${line}"/><circle cx="89" cy="101" r="2.4" fill="#ffffff"/><circle cx="131" cy="101" r="2.4" fill="#ffffff"/></g>`,
    sleepy: `<g><path d="M84 108 Q92 99 100 108" stroke="${line}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M120 108 Q128 99 136 108" stroke="${line}" stroke-width="4" fill="none" stroke-linecap="round"/></g>`,
    curious: `<g><path d="M84 108 Q92 98 100 108" stroke="${line}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M120 108 Q128 98 136 108" stroke="${line}" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="88" cy="100" r="2.2" fill="#ffffff"/><circle cx="132" cy="100" r="2.2" fill="#ffffff"/></g>`
  };

  const mouthMap = {
    spark: `<path d="M100 124 Q110 132 120 124" stroke="#d87a91" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    happy: `<path d="M98 122 Q110 136 122 122" stroke="#d87a91" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    sleepy: `<path d="M102 126 H118" stroke="#d87a91" stroke-width="4" stroke-linecap="round"/>`,
    curious: `<path d="M100 124 Q110 129 120 124" stroke="#d87a91" stroke-width="4" fill="none" stroke-linecap="round"/>`
  };

  const accessory = accessoryMap[profile.accessory] || accessoryMap.bow;
  const blush = `<g><circle cx="78" cy="116" r="8" fill="${cheek}" opacity="0.85"/><circle cx="142" cy="116" r="8" fill="${cheek}" opacity="0.85"/></g>`;
  const sparkles = `<g opacity="0.8"><path d="M42 44 L46 54 L56 58 L46 62 L42 72 L38 62 L28 58 L38 54 Z" fill="#fff7b0"/><path d="M166 32 L169 41 L178 44 L169 47 L166 56 L163 47 L154 44 L163 41 Z" fill="#fff7b0"/><path d="M174 82 L177 90 L185 93 L177 96 L174 104 L171 96 L163 93 L171 90 Z" fill="#ffe3ee"/></g>`;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="${size}" height="${size}" role="img" aria-label="${normalized} 캐릭터">
      <defs>
        <linearGradient id="mascot-bg-${normalized}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${fur}"/>
          <stop offset="1" stop-color="${accent}"/>
        </linearGradient>
      </defs>
      <ellipse cx="110" cy="194" rx="62" ry="16" fill="rgba(112,120,175,0.16)"/>
      ${sparkles}
      ${speciesStyle.tail}
      <g>
        ${speciesStyle.earLeft}
        ${speciesStyle.earRight}
        <circle cx="110" cy="106" r="62" fill="url(#mascot-bg-${normalized})" stroke="${line}" stroke-width="4"/>
        <path d="M78 110 Q90 88 110 88 Q130 88 142 110" fill="${accent}" opacity="0.58"/>
        ${speciesStyle.outfit || ""}
        ${speciesStyle.body}
        ${blush}
        ${eyeMap[profile.expression] || eyeMap.spark}
        <path d="M88 118 Q110 124 132 118" stroke="${line}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>
        ${mouthMap[profile.expression] || mouthMap.happy}
        ${speciesStyle.paws}
        ${accessory}
      </g>
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

function prevQuestion() {
  if (state.index > 0) {
    state.index -= 1;
    renderQuestion();
  }
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
  return `나의 덕질 유형은 "${name}" (${code})! 너의 덕질 유형도 확인해봐 👉`;
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
  document.getElementById("start-btn").addEventListener("click", startTest);
  document.getElementById("prev-btn").addEventListener("click", prevQuestion);
  document.getElementById("next-btn").addEventListener("click", nextQuestion);

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
