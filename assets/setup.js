/* Setup wizard: transient page state only; no account requests or saved form data. */
(() => {
  "use strict";

  const STEP_COUNT = 7;
  const PROJECT_ID_PATTERN = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const SERVICES = {
    tasks: { name: "Google Tasks", scopes: ["https://www.googleapis.com/auth/tasks"] },
    drive: {
      name: "Google Drive",
      scopes: [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/drive.file",
      ],
    },
    gmail: { name: "Gmail", scopes: ["https://www.googleapis.com/auth/gmail.readonly"] },
  };

  function initialize() {
    const localPreview = location.hostname.toLowerCase() !== "gokayg.github.io";
    document.querySelectorAll("[data-local-preview]").forEach((element) => { element.hidden = !localPreview; });
    const panels = [...document.querySelectorAll("[data-step-panel]")];
    if (!panels.length) return;

    const stepLinks = [...document.querySelectorAll("[data-step-link]")];
    const previousButton = document.querySelector("#wizard-prev");
    const nextButton = document.querySelector("#wizard-next");
    const progress = document.querySelector("#wizard-progress");
    const status = document.querySelector("#wizard-status");
    const projectInput = document.querySelector("#setup-project-id");
    const emailInput = document.querySelector("#setup-email");
    const serviceInputs = [...document.querySelectorAll('input[name="google-service"]')];
    const projectLinks = [...document.querySelectorAll("[data-project-link]")].map((link) => ({
      link,
      template: link.dataset.projectUrl || link.getAttribute("href") || "https://console.cloud.google.com/",
    }));
    const projectValues = [...document.querySelectorAll("[data-project-id-value]")].map((element) => ({
      element,
      placeholder: element.dataset.placeholder || readValue(element).trim() || "proje-kimligin",
    }));
    const copyFeedback = new WeakMap();
    let activeStep = stepFromHash() ?? 1;
    let statusRevision = 0;
    let statusTimer;

    if (status) {
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      status.setAttribute("aria-atomic", "true");
    }

    function stepFromHash() {
      const match = /^#step-([1-7])$/.exec(location.hash);
      return match ? Number(match[1]) : null;
    }

    function stepDescription() {
      const panel = panels.find((item) => Number(item.dataset.stepPanel) === activeStep);
      const title = panel?.dataset.stepTitle?.trim();
      return `Adım ${activeStep} / ${STEP_COUNT}${title ? `: ${title}` : ""}`;
    }

    // A newer navigation/copy action owns the live-region message.
    function announce(message, resetAfterDelay = false) {
      const revision = ++statusRevision;
      clearTimeout(statusTimer);
      if (status) status.textContent = message;
      if (resetAfterDelay) {
        statusTimer = setTimeout(() => {
          if (status && revision === statusRevision) status.textContent = stepDescription();
        }, 6000);
      }
      return revision;
    }

    function showStep(step, focusPanel = false, updateHash = true) {
      if (!Number.isInteger(step) || step < 1 || step > STEP_COUNT) return;
      activeStep = step;
      let activePanel;
      panels.forEach((panel) => {
        const selected = Number(panel.dataset.stepPanel) === step;
        panel.hidden = !selected;
        panel.setAttribute("tabindex", "-1");
        if (selected) activePanel = panel;
      });
      stepLinks.forEach((link) => {
        if (Number(link.dataset.stepLink) === step) link.setAttribute("aria-current", "step");
        else link.removeAttribute("aria-current");
      });
      if (previousButton) previousButton.disabled = step === 1;
      if (nextButton) nextButton.textContent = step === STEP_COUNT ? "Başa dön" : "Sonraki adım";
      if (progress) progress.textContent = `Adım ${step} / ${STEP_COUNT}`;
      if (updateHash && location.hash !== `#step-${step}`) {
        try {
          history.replaceState(history.state, "", `#step-${step}`);
        } catch {
          // Some local-file previews restrict history changes; navigation still works.
        }
      }
      announce(stepDescription());
      if (focusPanel && activePanel) activePanel.focus();
    }

    function updateValidation(input, errorSelector, message) {
      const invalid = Boolean(message);
      const error = document.querySelector(errorSelector);
      if (input) {
        input.setAttribute("aria-invalid", String(invalid));
        input.setCustomValidity(message);
      }
      if (error) {
        error.textContent = message;
        error.hidden = !invalid;
      }
    }

    function updateProject() {
      const entered = projectInput?.value.trim() || "";
      const valid = PROJECT_ID_PATTERN.test(entered);
      const projectId = valid ? entered : "";
      updateValidation(projectInput, "#project-id-error", entered && !valid
        ? "Proje kimliği 6–30 karakter olmalı; küçük harfle başlamalı, yalnız küçük harf, rakam ve tire içermeli, tireyle bitmemeli."
        : "");

      projectValues.forEach(({ element, placeholder }) => {
        if (element !== projectInput) writeValue(element, projectId || placeholder);
      });
      projectLinks.forEach(({ link, template }) => {
        try {
          const url = new URL(template.replace(/\{project\}/g, projectId), location.href);
          // Only an explicit Google Console link receives the entered project ID.
          if (url.protocol !== "https:" || !["console.cloud.google.com", "console.developers.google.com"].includes(url.hostname)) return;
          if (projectId) url.searchParams.set("project", projectId);
          else url.searchParams.delete("project");
          link.href = url.href;
        } catch {
          // Preserve the authored link when its template cannot be parsed.
        }
      });
    }

    function updateEmail() {
      const entered = emailInput?.value.trim() || "";
      const valid = EMAIL_PATTERN.test(entered);
      updateValidation(emailInput, "#setup-email-error", entered && !valid
        ? "E-posta adresini ad@ornek.com biçiminde yazın. Google bağlantısında kullanacağınız hesabı girin."
        : "");
      document.querySelectorAll("[data-own-email]").forEach((element) => {
        if (element === emailInput) return;
        writeValue(element, valid ? entered : "");
        if (element.matches("input, textarea")) element.placeholder = "1. adımda kendi e-postanı yaz";
      });
    }

    function updateScopes() {
      const selected = Object.keys(SERVICES).filter((service) =>
        serviceInputs.some((input) => input.value === service && input.checked));
      const scopes = ["openid", "https://www.googleapis.com/auth/userinfo.email", ...selected.flatMap((service) => SERVICES[service].scopes)];
      const output = document.querySelector("#scope-values");
      if (output) {
        writeValue(output, scopes.join(", "));
        output.readOnly = true;
      }
      const summary = document.querySelector("#scope-selection-summary");
      if (summary) summary.textContent = selected.map((service) => SERVICES[service].name).join(", ") || "Yalnız Google hesap kimliği";
      const warning = document.querySelector("#scope-warning");
      if (warning) {
        warning.hidden = !selected.some((service) => service === "drive" || service === "gmail");
        warning.textContent = "Drive veya Gmail izinleri hassas ya da kısıtlı kapsamlar içerebilir. Çok sayıda kullanıcıya açık kullanım için Google doğrulaması gerekebilir.";
      }
      document.querySelectorAll("[data-service-api]").forEach((element) => {
        const services = element.dataset.serviceApi.split(/\s+/);
        element.hidden = !selected.some((service) => services.includes(service));
      });
      // Optional list in the page: one exact scope per line for the Google selector.
      document.querySelectorAll("[data-scope-list]").forEach((list) => {
        const items = scopes.map((scope) => {
          const item = document.createElement("li");
          const code = document.createElement("code");
          code.textContent = scope;
          item.append(code);
          return item;
        });
        list.replaceChildren(...items);
      });
    }

    function selectForManualCopy(target) {
      try {
        if (typeof target.select === "function") {
          target.focus();
          target.select();
        } else {
          const selection = window.getSelection();
          if (!selection) return false;
          const range = document.createRange();
          range.selectNodeContents(target);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        return true;
      } catch {
        return false;
      }
    }

    function showCopyFeedback(button, message) {
      const feedback = copyFeedback.get(button);
      if (!feedback) return;
      clearTimeout(feedback.timer);
      button.textContent = message;
      feedback.timer = setTimeout(() => {
        button.textContent = feedback.originalText;
        feedback.timer = undefined;
      }, 2000);
    }

    async function copyTarget(button) {
      let target;
      try { target = document.querySelector(button.dataset.copyTarget); } catch { /* Invalid authored selector. */ }
      if (!target) {
        announce("Kopyalanacak alan bulunamadı.", true);
        return;
      }
      if (target.hasAttribute("data-own-email") && !EMAIL_PATTERN.test(emailInput?.value.trim() || "")) {
        announce("Önce 1. adımda kendi e-posta adresini yaz.", true);
        return;
      }
      const text = readValue(target).trim();
      if (!text) {
        announce("Bu alanda henüz kopyalanacak bir değer yok.", true);
        return;
      }
      const revision = announce("Kopyalanıyor…");
      button.disabled = true;
      try {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(text);
        showCopyFeedback(button, "Kopyalandı");
        if (revision === statusRevision) announce("Kopyalandı. İlgili alana yapıştırabilirsiniz.", true);
      } catch {
        if (revision === statusRevision) {
          const selected = selectForManualCopy(target);
          showCopyFeedback(button, selected ? "Ctrl+C" : "Kopyalanamadı");
          announce(selected
            ? "Tarayıcı panoya erişemedi. Metin seçildi; Ctrl+C ile kopyalayabilirsiniz."
            : "Tarayıcı panoya erişemedi. Metni seçip Ctrl+C ile kopyalayabilirsiniz.", true);
        }
      } finally {
        button.disabled = false;
      }
    }

    stepLinks.forEach((link) => link.addEventListener("click", (event) => {
      event.preventDefault();
      showStep(Number(link.dataset.stepLink), true);
    }));
    previousButton?.addEventListener("click", (event) => {
      event.preventDefault();
      showStep(activeStep - 1, true);
    });
    nextButton?.addEventListener("click", (event) => {
      event.preventDefault();
      showStep(activeStep === STEP_COUNT ? 1 : activeStep + 1, true);
    });
    window.addEventListener("hashchange", () => {
      const step = stepFromHash();
      if (step !== null) showStep(step, true, false);
    });
    projectInput?.addEventListener("input", updateProject);
    emailInput?.addEventListener("input", updateEmail);
    serviceInputs.forEach((input) => input.addEventListener("change", updateScopes));
    document.querySelectorAll("[data-copy-target]").forEach((button) => {
      copyFeedback.set(button, { originalText: button.textContent, timer: undefined });
      button.addEventListener("click", (event) => {
        event.preventDefault();
        void copyTarget(button);
      });
    });

    if (!serviceInputs.some((input) => input.checked)) {
      const tasks = serviceInputs.find((input) => input.value === "tasks");
      if (tasks) tasks.checked = true;
    }
    updateProject();
    updateEmail();
    updateScopes();
    // Keep page anchors such as #sources intact on first load.
    showStep(activeStep, false, false);
  }

  function readValue(element) {
    return element.matches("input, textarea, select") ? element.value : element.textContent || "";
  }

  function writeValue(element, value) {
    if (element.matches("input, textarea, select")) element.value = value;
    else element.textContent = value;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
