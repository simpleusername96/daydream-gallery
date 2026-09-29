import { WORLDS } from "./worlds.js";

const COPY = {
  ko: {
    title: "Daydream Gallery",
    description: "만들고 싶은 장면을 만들어 모아두는 개인 갤러리입니다.",
    use: "마음에 드는 작품을 골라 감상해 보세요.",
    credit: "모든 장면은 AI로 개발했습니다.",
    source: "GitHub에서 공개 코드 보기",
    panelLabel: "Daydream Gallery 정보",
    summaryTitle: "프로젝트 정보",
    summaryLabel: "프로젝트 정보 보기",
    languageLabel: "설명 언어",
    imageAlt: "노을빛 하늘 아래 연꽃과 물고기가 움직이는 Stillwater 연못 풍경",
    metaDescription: "만들고 싶은 장면을 만들어 모아두는 개인 갤러리입니다. 마음에 드는 작품을 골라 감상해 보세요.",
    locale: "ko_KR"
  },
  en: {
    title: "Daydream Gallery",
    description: "A personal gallery of things I wanted to make.",
    use: "Choose a piece and spend some time with it.",
    credit: "All scenes were developed with AI.",
    source: "View the public code on GitHub",
    panelLabel: "About Daydream Gallery",
    summaryTitle: "About this project",
    summaryLabel: "View project information",
    languageLabel: "Description language",
    imageAlt: "Stillwater pond with lotus flowers and fish beneath a sunset sky",
    metaDescription: "A personal gallery of things I wanted to make. Choose a piece and spend some time with it.",
    locale: "en_US"
  }
};

let currentWorldId = null;
function updateArtworkCredit(worldId = currentWorldId) {
  currentWorldId = worldId;
  const section = document.getElementById("artworkCredit");
  const artwork = WORLDS[worldId]?.artwork;
  section.hidden = !artwork;
  const ko = document.documentElement.lang === "ko";
  const image = document.querySelector(".aboutCard img");
  const source = artwork?.preview || "assets/previews/stillwater.png";
  if (image.getAttribute("src") !== source) image.src = source;
  image.alt = artwork ? artwork.title : COPY[ko ? "ko" : "en"].imageAlt;
  image.style.objectFit = artwork ? "contain" : "cover";
  if (!artwork) return;
  document.getElementById("artworkTitle").textContent = artwork.title;
  document.getElementById("artworkInstitution").textContent = artwork.institution;
  const reflected = artwork.technique === "reflected-artwork";
  document.getElementById("artworkInterpretation").textContent = reflected
    ? (ko ? "〈모란과 괴석〉의 일부를 여덟 방향으로 반사한 만화경입니다. 자주꽃, 붉은꽃, 푸른 괴석을 자동으로 오갑니다. 미술관의 CC0 공개 이미지를 사용한 재구성이며 원작의 복원이 아닙니다."
      : "An eightfold kaleidoscope sampling Peonies and Rocks. It automatically travels through purple peonies, red peonies and blue rocks, using the museum’s CC0 image. This is a contemporary reinterpretation, not a restoration.")
    : ko
    ? "원작의 형태와 색에서 영감을 받아 새로 그린 풍경입니다. 원작 사진을 사용하지 않으며, 원작의 복원이나 재현이 아닙니다."
    : "An original landscape inspired by the artwork’s forms and colors. It uses newly generated art, not the original photograph or a restoration.";
  const original = document.getElementById("artworkOriginal");
  original.href = artwork.preview; original.textContent = reflected ? (ko ? "반사한 장면" : "Reflected scene") : (ko ? "새로 그린 장면" : "Newly authored scene");
  const museum = document.getElementById("artworkMuseum");
  museum.href = artwork.url; museum.textContent = ko ? "영감을 받은 원작" : "Inspiration source";
}

const supportedLanguage = value => value === "ko" || value === "en";
const LANGUAGE_KEY = "daydream-gallery-language";
const LEGACY_LANGUAGE_KEY = "ambient-worlds-language";

export function readStoredLanguage(storage) {
  let language = "";
  try {
    language = storage.getItem(LANGUAGE_KEY);
    if (supportedLanguage(language)) return language;
    language = storage.getItem(LEGACY_LANGUAGE_KEY);
    if (supportedLanguage(language)) {
      storage.setItem(LANGUAGE_KEY, language);
      storage.removeItem(LEGACY_LANGUAGE_KEY);
    }
  } catch { /* Preserve a readable preference even when writes are blocked. */ }
  return supportedLanguage(language) ? language : "";
}

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

  updateArtworkCredit();

  if (persist) {
    try { localStorage.setItem(LANGUAGE_KEY, language); localStorage.removeItem(LEGACY_LANGUAGE_KEY); } catch { /* Preference remains session-only. */ }
  }
}

function initializeLanguage() {
  let storedLanguage = "";
  let timeZone = "";
  try { storedLanguage = readStoredLanguage(localStorage); } catch { /* Use locale detection. */ }
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

if (typeof document !== "undefined") {
  initializeLanguage();
  window.addEventListener("daydream-gallery-world-change", event => updateArtworkCredit(event.detail.world));
}
