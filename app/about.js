const COPY = {
  ko: {
    title: "Ambient Worlds — 평화로운 풍경 플레이어",
    description: "평화로운 풍경을 감상할 수 있는 비주얼 플레이어입니다.",
    use: "명상, 집중, 휴식 또는 조용한 배경이 필요할 때 재생해 보세요.",
    credit: "사람의 아트 디렉션과 선택을 바탕으로 GPT와 협업을 통해 만들었습니다.",
    source: "GitHub에서 공개 코드 보기",
    panelLabel: "Ambient Worlds 정보",
    summaryTitle: "프로젝트 정보",
    summaryLabel: "프로젝트 정보 보기",
    languageLabel: "설명 언어",
    imageAlt: "노을빛 하늘 아래 연꽃과 물고기가 움직이는 Stillwater 연못 풍경",
    metaDescription: "평화로운 풍경을 감상할 수 있는 비주얼 플레이어입니다. 명상, 집중, 휴식 또는 조용한 배경이 필요할 때 재생해 보세요.",
    locale: "ko_KR"
  },
  en: {
    title: "Ambient Worlds — Peaceful landscape player",
    description: "A visual player for peaceful landscapes.",
    use: "Play it for meditation, focus, rest, or a quiet background.",
    credit: "Made in collaboration with GPT, guided by human art direction and selection.",
    source: "View the public code on GitHub",
    panelLabel: "About Ambient Worlds",
    summaryTitle: "About this project",
    summaryLabel: "View project information",
    languageLabel: "Description language",
    imageAlt: "Stillwater pond with lotus flowers and fish beneath a sunset sky",
    metaDescription: "A visual player for peaceful landscapes. Play it for meditation, focus, rest, or a quiet background.",
    locale: "en_US"
  }
};

const supportedLanguage = value => value === "ko" || value === "en";

export function chooseLanguage({ queryLanguage, storedLanguage, languages = [], timeZone = "" } = {}) {
  if (supportedLanguage(queryLanguage)) return queryLanguage;
  if (supportedLanguage(storedLanguage)) return storedLanguage;
  const usesKorean = languages.some(language => String(language).toLowerCase().startsWith("ko"));
  return usesKorean || timeZone === "Asia/Seoul" ? "ko" : "en";
}

function setMeta(selector, attribute, value) {
  document.querySelector(selector)?.setAttribute(attribute, value);
}

function applyLanguage(language, persist = false) {
  const copy = COPY[language];
  document.documentElement.lang = language;
  document.title = copy.title;
  document.querySelector('[data-copy="description"]').textContent = copy.description;
  document.querySelector('[data-copy="use"]').textContent = copy.use;
  document.querySelector('[data-copy="credit"]').textContent = copy.credit;
  document.querySelector('[data-copy="source"]').textContent = copy.source;

  const panel = document.getElementById("aboutPanel");
  const summary = panel.querySelector("summary");
  const languageSwitch = panel.querySelector(".languageSwitch");
  const image = panel.querySelector("img");
  panel.setAttribute("aria-label", copy.panelLabel);
  summary.title = copy.summaryTitle;
  summary.setAttribute("aria-label", copy.summaryLabel);
  languageSwitch.setAttribute("aria-label", copy.languageLabel);
  image.alt = copy.imageAlt;
  for (const button of languageSwitch.querySelectorAll("button[data-language]")) {
    button.setAttribute("aria-pressed", String(button.dataset.language === language));
  }

  setMeta('meta[name="description"]', "content", copy.metaDescription);
  setMeta('meta[property="og:locale"]', "content", copy.locale);
  setMeta('meta[property="og:title"]', "content", copy.title);
  setMeta('meta[property="og:description"]', "content", copy.metaDescription);
  setMeta('meta[name="twitter:title"]', "content", copy.title);
  setMeta('meta[name="twitter:description"]', "content", copy.description);

  if (persist) {
    try { localStorage.setItem("ambient-worlds-language", language); } catch { /* Preference remains session-only. */ }
  }
}

function initializeLanguage() {
  let storedLanguage = "";
  let timeZone = "";
  try { storedLanguage = localStorage.getItem("ambient-worlds-language") || ""; } catch { /* Use locale detection. */ }
  try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* Use browser language. */ }
  const language = chooseLanguage({
    queryLanguage: new URLSearchParams(location.search).get("lang") || "",
    storedLanguage,
    languages: navigator.languages || [navigator.language],
    timeZone
  });
  applyLanguage(language);
  for (const button of document.querySelectorAll("button[data-language]")) {
    button.addEventListener("click", () => applyLanguage(button.dataset.language, true));
  }
}

if (typeof document !== "undefined") initializeLanguage();
