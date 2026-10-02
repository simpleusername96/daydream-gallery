import { WORLDS } from "./worlds.js";
import { createAboutSurface } from "./about-surface.js";

const COPY = {
  ko: {
    title: "Daydream Gallery",
    description: "만들고 싶은 장면을 만들어 모아두는 개인 갤러리입니다.",
    use: "마음에 드는 작품을 골라 감상해 보세요.",
    credit: "모든 시각적 결과물은 AI를 활용해 제작했습니다.\n배경음악은 공개 라이선스로 제공된 곡을 사용했습니다.",
    source: "GitHub에서 공개 코드 보기",
    panelLabel: "Daydream Gallery 정보",
    triggerTitle: "프로젝트 정보",
    triggerLabel: "프로젝트 정보 보기",
    closeLabel: "닫기",
    languageLabel: "설명 언어",
    metaDescription: "만들고 싶은 장면을 만들어 모아두는 개인 갤러리입니다. 마음에 드는 작품을 골라 감상해 보세요.",
    locale: "ko_KR"
  },
  en: {
    title: "Daydream Gallery",
    description: "A personal gallery of things I wanted to make.",
    use: "Choose a piece and spend some time with it.",
    credit: "All visuals were created with the help of AI.\nThe background music uses tracks released under open licenses.",
    source: "View the public code on GitHub",
    panelLabel: "About Daydream Gallery",
    triggerTitle: "About this project",
    triggerLabel: "View project information",
    closeLabel: "Close",
    languageLabel: "Description language",
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
  const trigger = document.getElementById("aboutToggle");
  const dialog = document.getElementById("aboutDialog");
  const languageSwitch = dialog.querySelector(".languageSwitch");
  panel.setAttribute("aria-label", copy.panelLabel);
  trigger.title = copy.triggerTitle;
  trigger.setAttribute("aria-label", copy.triggerLabel);
  dialog.setAttribute("aria-label", copy.panelLabel);
  const closeButton = document.getElementById("closeAbout");
  closeButton.setAttribute("aria-label", copy.closeLabel);
  closeButton.title = copy.closeLabel;
  languageSwitch.setAttribute("aria-label", copy.languageLabel);
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

// The native modal owns focus containment and makes the live scene inert.
export function createAboutModal({ onOpen, onClose, getScene }) {
  const dialog = document.getElementById('aboutDialog');
  const trigger = document.getElementById('aboutToggle');
  const surface = createAboutSurface({ dialog, getScene });
  let restoreFocus = true, pointer = null;
  function close(restore = true) {
    if (!dialog.open) return;
    restoreFocus = restore;
    surface.stop();
    dialog.close(); dialog.inert = true;
    trigger.setAttribute('aria-expanded', 'false');
  }
  trigger.addEventListener('click', () => {
    if (dialog.open) return;
    onOpen();
    restoreFocus = true;
    dialog.inert = false; dialog.showModal();
    surface.start();
    trigger.setAttribute('aria-expanded', 'true');
  });
  document.getElementById('closeAbout').addEventListener('click', () => close());
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('close', () => {
    surface.stop();
    trigger.setAttribute('aria-expanded', 'false');
    // Native dialog restoration is supplemented only while its trigger is visible.
    if (restoreFocus && trigger.getClientRects().length && !document.body.classList.contains('chromeHidden')) trigger.focus({ preventScroll:true });
    onClose();
  });
  dialog.addEventListener('pointerdown', event => { pointer = { x:event.clientX, y:event.clientY }; });
  dialog.addEventListener('click', event => {
    if (event.target.closest('button,a') || event.defaultPrevented) return;
    if (pointer && Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)>8) return;
    if (!window.getSelection()?.isCollapsed) return;
    close();
  });
  window.addEventListener('pagehide', () => surface.destroy(), { once: true });
  return { close, get open() { return dialog.open; } };
}
