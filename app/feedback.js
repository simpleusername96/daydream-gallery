import { feedbackEndpoint, feedbackSiteKey } from "./feedback-config.js?v=split-20261007";
export const feedbackCopy = {
  ko: { title:"의견 보내기", label:"의견", placeholder:"불편한 점이나 제안을 남겨 주세요.", send:"보내기", close:"닫기", sending:"보내는 중…", sent:"의견을 보냈습니다. 감사합니다.", error:"전송 결과를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.", rate:"잠시 후 다시 보내 주세요.", verify:"봇 확인을 다시 진행해 주세요.", unavailable:"지금은 의견을 보낼 수 없어요. 잠시 후 다시 시도해 주세요." },
  en: { title:"Send feedback", label:"Feedback", placeholder:"Share a suggestion or something that did not work.", send:"Send", close:"Close", sending:"Sending…", sent:"Feedback sent. Thank you.", error:"We could not confirm delivery. Please try again shortly.", rate:"Please wait a moment before sending again.", verify:"Please complete the bot check again.", unavailable:"Feedback is unavailable right now. Please try again later." },
  ja: { title:"意見を送る", label:"ご意見", placeholder:"改善の提案や不便に感じた点をお聞かせください。", send:"送信", close:"閉じる", sending:"送信中…", sent:"ご意見を送信しました。ありがとうございます。", error:"送信結果を確認できませんでした。しばらくしてからお試しください。", rate:"しばらくしてから再度送信してください。", verify:"ボット確認をもう一度行ってください。", unavailable:"現在、ご意見を送信できません。しばらくしてからお試しください。" },
  "zh-cn": { title:"发送意见", label:"意见", placeholder:"请留下建议或遇到的问题。", send:"发送", close:"关闭", sending:"发送中…", sent:"意见已发送，谢谢。", error:"无法确认发送结果，请稍后重试。", rate:"请稍后再次发送。", verify:"请重新完成机器人验证。", unavailable:"暂时无法发送意见，请稍后重试。" }
};
let scriptPromise;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    const timer = setTimeout(() => { script.remove(); scriptPromise = null; reject(new Error("timeout")); }, 12000);
    script.onload = () => { clearTimeout(timer); resolve(window.turnstile); };
    script.onerror = () => { clearTimeout(timer); script.remove(); scriptPromise = null; reject(new Error("load")); };
    document.head.append(script);
  });
  return scriptPromise;
}
export function createFeedback({ targets, triggerClass = "", onOpen = () => {}, onClose = () => {} }) {
  const dialog = document.createElement("dialog");
  dialog.id = "feedback-dialog"; dialog.className = "feedback-dialog";
  dialog.setAttribute("aria-labelledby", "feedback-title");
  // Only constant markup is interpolated. Submitted text never becomes HTML.
  dialog.innerHTML = '<div class="feedback-heading"><h2 id="feedback-title"></h2><button type="button" class="feedback-close"></button></div>' +
    '<form class="feedback-form"><label for="feedback-message"></label><textarea id="feedback-message" name="message" maxlength="4000" rows="5" required aria-describedby="feedback-status"></textarea>' +
    '<div class="feedback-verification"></div><p id="feedback-status" role="status" aria-live="polite"></p><button class="feedback-send" type="submit"></button></form>';
  document.body.append(dialog);
  const form = dialog.querySelector("form"), message = dialog.querySelector("textarea");
  const send = dialog.querySelector(".feedback-send"), closeButton = dialog.querySelector(".feedback-close");
  const status = dialog.querySelector("#feedback-status"), verification = dialog.querySelector(".feedback-verification");
  const triggers = [], language = () => {
    const key = document.documentElement.dataset.locale || document.documentElement.lang.toLowerCase();
    return feedbackCopy[key] ? key : key.startsWith("ko") ? "ko" : "en";
  };
  let copy = feedbackCopy[language()], token = "", widget = null, busy = false, focusTarget = null, epoch = 0;
  const update = () => { send.disabled = busy || !token || !message.value.trim(); send.textContent = busy ? copy.sending : copy.send; };
  const removeWidget = () => { epoch++; if (widget !== null) window.turnstile?.remove(widget); widget = null; token = ""; update(); };
  const refreshCopy = () => {
    copy = feedbackCopy[language()];
    dialog.querySelector("h2").textContent = copy.title;
    dialog.querySelector("label").textContent = copy.label;
    message.placeholder = copy.placeholder; closeButton.textContent = copy.close;
    for (const trigger of triggers) { trigger.title = copy.title; trigger.setAttribute("aria-label", copy.title); }
    update();
  };
  async function open(trigger) {
    if (dialog.open) return;
    onOpen(); refreshCopy(); focusTarget = trigger;
    status.textContent = busy ? copy.sending : "";
    dialog.showModal(); message.focus({ preventScroll: true });
    if (!feedbackSiteKey) { status.textContent = copy.unavailable; return; }
    const current = ++epoch;
    try {
      const turnstile = await loadTurnstile();
      if (!dialog.open || current !== epoch) return;
      widget = turnstile.render(verification, {
        sitekey: feedbackSiteKey, action: "feedback", theme: "auto", size: verification.clientWidth < 300 ? "compact" : "flexible",
        language: language() === "zh-cn" ? "zh-CN" : language(), appearance: "interaction-only",
        callback: value => { token = value; update(); },
        "expired-callback": () => { token = ""; update(); },
        "timeout-callback": () => { token = ""; status.textContent = copy.verify; update(); },
        "error-callback": () => { token = ""; status.textContent = copy.verify; update(); }
      });
    } catch { if (dialog.open && current === epoch) status.textContent = copy.unavailable; }
  }
  for (const target of targets.filter(Boolean)) {
    const trigger = document.createElement("button");
    trigger.type = "button"; trigger.className = "feedback-trigger " + triggerClass;
    trigger.setAttribute("aria-haspopup", "dialog"); trigger.setAttribute("aria-controls", dialog.id);
    trigger.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></svg>';
    trigger.addEventListener("click", () => { void open(trigger); });
    target.prepend(trigger); triggers.push(trigger);
  }
  refreshCopy();
  const observer = new MutationObserver(refreshCopy);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "data-locale"] });
  message.addEventListener("input", update);
  dialog.addEventListener("pointerdown", event => event.stopPropagation());
  dialog.addEventListener("keydown", event => event.stopPropagation());
  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    removeWidget();
    if (focusTarget?.getClientRects().length) focusTarget.focus({ preventScroll: true });
    onClose();
  });
  dialog.addEventListener("click", event => {
    event.stopPropagation();
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)
      dialog.close();
  });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (busy || !token || !message.value.trim() || !form.reportValidity()) return;
    busy = true; status.textContent = copy.sending; update();
    try {
      const response = await fetch(feedbackEndpoint, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit",
        body: JSON.stringify({ message: message.value, token }), signal: AbortSignal.timeout(20000)
      });
      if (!response.ok) {
        let reason; try { reason = (await response.json()).error; } catch {}
        status.textContent = reason === "rate" ? copy.rate : reason === "verification" ? copy.verify : copy.error;
      } else {
        message.value = ""; status.textContent = copy.sent;
      }
    } catch { status.textContent = copy.error; }
    finally {
      busy = false; token = ""; update();
      if (widget !== null && dialog.open) window.turnstile?.reset(widget);
    }
  });
  window.addEventListener("pagehide", () => { observer.disconnect(); removeWidget(); }, { once: true });
  return { close: () => { if (dialog.open) dialog.close(); }, get open() { return dialog.open; } };
}
