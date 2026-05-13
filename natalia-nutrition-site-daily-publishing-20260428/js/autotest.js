import {
  buildSummary,
  classifySelfCheck,
  copy,
  getAnsweredUrgentFlags,
  getEmergingDomains,
  getVisibleQuestions,
  pruneHiddenAnswers,
  selfCheckQuestions,
  supportResources
} from './autotest-config.mjs?v=20260426';

const root = document.querySelector('[data-self-check]');

if (root) {
  const answers = {};
  let currentIndex = 0;
  let mode = 'safety';

  const els = {
    safety: root.querySelector('[data-self-check-safety]'),
    safetyContinue: root.querySelector('[data-safety-continue]'),
    quiz: root.querySelector('[data-self-check-quiz]'),
    results: root.querySelector('[data-self-check-results]'),
    progressText: root.querySelector('[data-progress-text]'),
    progress: root.querySelector('[data-progress]'),
    progressBar: root.querySelector('[data-progress-bar]'),
    form: root.querySelector('[data-self-check-form]'),
    questionArea: root.querySelector('[data-question-area]'),
    live: root.querySelector('[data-self-check-live]'),
    error: root.querySelector('[data-step-error]'),
    back: root.querySelector('[data-back-step]'),
    next: root.querySelector('[data-next-step]'),
    reset: root.querySelectorAll('[data-reset-self-check]')
  };

  const getLang = () => document.documentElement.lang === 'en' ? 'en' : 'pl';
  const t = (key) => copy[getLang()][key];
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function urlLang() {
    try {
      const lang = new URLSearchParams(window.location.search).get('lang');
      return lang === 'en' || lang === 'pl' ? lang : null;
    } catch (error) {
      return null;
    }
  }

  function applyAutotestUrlLang() {
    const lang = urlLang();
    if (!lang) return;

    document.documentElement.lang = lang;
    document.body.classList.toggle('lang-en', lang === 'en');
    document.body.classList.toggle('lang-pl', lang === 'pl');
    document.querySelectorAll('[data-set-lang]').forEach((button) => {
      const active = button.dataset.setLang === lang;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('[data-current-lang]').forEach((label) => {
      label.textContent = lang.toUpperCase();
    });

    const description = document.querySelector('meta[name="description"]');
    if (description?.dataset.descriptionPl && description?.dataset.descriptionEn) {
      description.content = lang === 'en' ? description.dataset.descriptionEn : description.dataset.descriptionPl;
    }
    const ogTitle = document.querySelector('[data-og-title-pl]');
    const ogDescription = document.querySelector('[data-og-description-pl]');
    if (ogTitle) ogTitle.content = lang === 'en' ? ogTitle.dataset.ogTitleEn : ogTitle.dataset.ogTitlePl;
    if (ogDescription) ogDescription.content = lang === 'en' ? ogDescription.dataset.ogDescriptionEn : ogDescription.dataset.ogDescriptionPl;
    const ogLocale = document.querySelector('[data-og-locale]');
    if (ogLocale) ogLocale.content = lang === 'en' ? 'en_IE' : 'pl_PL';
    if (document.body.dataset.titlePl && document.body.dataset.titleEn) {
      document.title = lang === 'en' ? document.body.dataset.titleEn : document.body.dataset.titlePl;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function interpolate(template, values) {
    return Object.entries(values).reduce((text, [key, value]) => {
      return text.replace(`{${key}}`, String(value));
    }, template);
  }

  function setHidden(node, hidden) {
    if (node) node.hidden = hidden;
  }

  function scrollToNode(node) {
    node?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
  }

  function scrollToQuizProgress() {
    if (!els.quiz) return;
    const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
    const top = els.quiz.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
    window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotion() ? 'auto' : 'smooth' });
  }

  function focusCurrentQuestion() {
    window.requestAnimationFrame(() => {
      const focusTarget = root.querySelector('[data-current-question]');
      focusTarget?.focus({ preventScroll: true });
    });
  }

  function showMode(nextMode) {
    mode = nextMode;
    setHidden(els.safety, nextMode !== 'safety');
    setHidden(els.quiz, nextMode !== 'quiz');
    setHidden(els.results, nextMode !== 'results');
  }

  function startQuiz() {
    showMode('quiz');
    currentIndex = 0;
    renderQuestion();
    focusCurrentQuestion();
    window.requestAnimationFrame(scrollToQuizProgress);
  }

  function resetSelfCheck() {
    Object.keys(answers).forEach((id) => delete answers[id]);
    currentIndex = 0;
    showMode('safety');
    if (els.error) els.error.textContent = '';
    if (els.live) els.live.textContent = '';
    scrollToNode(els.safety);
    els.safetyContinue?.focus({ preventScroll: true });
  }

  applyAutotestUrlLang();

  function answerFor(question) {
    return answers[question.id];
  }

  function isAnswered(question) {
    return Object.prototype.hasOwnProperty.call(answers, question.id);
  }

  function serializeOptionValue(option) {
    if (typeof option.value === 'boolean') return option.value ? 'true' : 'false';
    return String(option.value);
  }

  function optionFromInput(question, input) {
    const index = Number(input.dataset.optionIndex);
    return question.options[index];
  }

  function renderOption(question, option, index) {
    const lang = getLang();
    const optionId = `${question.id}-${index}`;
    const selected = isAnswered(question) && answerFor(question) === option.value;
    const checked = selected ? ' checked' : '';
    const helper = option.helper?.[lang]
      ? `<span class="self-check-option-helper">${escapeHtml(option.helper[lang])}</span>`
      : '';

    return `
      <label class="self-check-option" for="${optionId}">
        <input
          id="${optionId}"
          type="${question.kind === 'multi_select' ? 'checkbox' : 'radio'}"
          name="${escapeHtml(question.id)}"
          value="${escapeHtml(serializeOptionValue(option))}"
          data-option-index="${index}"
          ${checked}
        >
        <span class="self-check-option-mark" aria-hidden="true"></span>
        <span class="self-check-option-copy">
          <span class="self-check-option-label">${escapeHtml(option.label[lang])}</span>
          ${helper}
        </span>
      </label>`;
  }

  function renderQuestion() {
    pruneHiddenAnswers(answers);
    const visibleQuestions = getVisibleQuestions(answers);
    const total = visibleQuestions.length;

    if (currentIndex >= total) currentIndex = Math.max(total - 1, 0);
    const question = visibleQuestions[currentIndex];
    const lang = getLang();
    const progressText = interpolate(t('progress'), { current: currentIndex + 1, total });
    const progressValue = total ? Math.round(((currentIndex + 1) / total) * 100) : 0;

    if (els.progressText) els.progressText.textContent = progressText;
    if (els.progress) {
      els.progress.setAttribute('aria-valuemin', '1');
      els.progress.setAttribute('aria-valuemax', String(total));
      els.progress.setAttribute('aria-valuenow', String(currentIndex + 1));
      els.progress.setAttribute('aria-label', progressText);
    }
    if (els.progressBar) els.progressBar.style.width = `${progressValue}%`;
    if (els.live) els.live.textContent = progressText;
    if (els.error) els.error.textContent = '';

    const intro = question.intro?.[lang]
      ? `<p class="self-check-question-intro">${escapeHtml(question.intro[lang])}</p>`
      : '';
    const options = question.options.map((option, index) => renderOption(question, option, index)).join('');

    els.questionArea.innerHTML = `
      <fieldset class="self-check-question-card">
        <legend id="${question.id}-legend" tabindex="-1" data-current-question>
          ${escapeHtml(question.text[lang])}
        </legend>
        ${intro}
        <div class="self-check-options" data-option-kind="${question.kind}">
          ${options}
        </div>
      </fieldset>`;

    els.questionArea.querySelectorAll('input').forEach((input) => {
      input.addEventListener('change', () => {
        const selectedOption = optionFromInput(question, input);
        if (!selectedOption) return;
        answers[question.id] = selectedOption.value;
        pruneHiddenAnswers(answers);
        if (els.error) els.error.textContent = '';
      });
    });

    if (els.back) {
      els.back.textContent = t('back');
      els.back.disabled = currentIndex === 0;
    }
    if (els.next) {
      els.next.textContent = currentIndex === total - 1 ? t('showResult') : t('next');
    }
  }

  function validateCurrentQuestion() {
    const question = getVisibleQuestions(answers)[currentIndex];
    if (question && isAnswered(question)) return true;

    if (els.error) els.error.textContent = t('required');
    const firstInput = els.questionArea.querySelector('input');
    firstInput?.focus();
    return false;
  }

  function goNext() {
    if (!validateCurrentQuestion()) return;

    const visibleQuestions = getVisibleQuestions(answers);
    if (currentIndex >= visibleQuestions.length - 1) {
      renderResults();
      return;
    }

    currentIndex += 1;
    renderQuestion();
    focusCurrentQuestion();
  }

  function goBack() {
    if (currentIndex === 0) return;
    currentIndex -= 1;
    renderQuestion();
    focusCurrentQuestion();
  }

  function renderDomainList(domains) {
    if (!domains.length) {
      return `<p>${escapeHtml(t('noDomains'))}</p>`;
    }

    return `
      <ul class="self-check-domain-list">
        ${domains.map((domain) => `<li><span aria-hidden="true"></span>${escapeHtml(domain.label)}</li>`).join('')}
      </ul>`;
  }

  function renderSupportCards({ compact = false } = {}) {
    const lang = getLang();
    const resources = compact
      ? supportResources.filter((resource) => ['emergency', 'bodywhys', 'findahelpline'].includes(resource.id))
      : supportResources;

    return resources.map((resource) => {
      const content = `
        <article class="support-card${resource.id === 'emergency' ? ' support-card-urgent' : ''}">
          <span class="support-region">${escapeHtml(resource.region[lang])}</span>
          <h3>${escapeHtml(resource.title[lang])}</h3>
          <p>${escapeHtml(resource.description[lang])}</p>
          ${resource.url
            ? `<a class="read-more" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(resource.cta[lang])}<span class="sr-only">, ${escapeHtml(t('external'))}</span></a>`
            : ''}
        </article>`;
      return content;
    }).join('');
  }

  function renderResults() {
    const lang = getLang();
    const level = classifySelfCheck(answers);
    const domains = getEmergingDomains(answers, lang);
    const urgentFlags = getAnsweredUrgentFlags(answers, lang);
    const levelCopy = copy[lang].levels[level];
    const urgentPanel = level === 'urgent'
      ? `
        <section class="result-urgent-panel" aria-labelledby="urgent-result-title">
          <h3 id="urgent-result-title">${escapeHtml(t('urgentTitle'))}</h3>
          <p>${escapeHtml(t('urgentBody'))}</p>
          ${urgentFlags.length ? `<ul>${urgentFlags.map((flag) => `<li>${escapeHtml(flag)}</li>`).join('')}</ul>` : ''}
        </section>`
      : '';

    showMode('results');
    els.results.innerHTML = `
      <div class="result-shell">
        <div class="result-heading">
          <span class="eyebrow">${escapeHtml(t('resultsEyebrow'))}</span>
          <h2 tabindex="-1" data-current-question>${escapeHtml(levelCopy.title)}</h2>
          <p>${escapeHtml(levelCopy.body)}</p>
          <p>${escapeHtml(t('resultsIntro'))}</p>
        </div>
        ${urgentPanel}
        <div class="result-summary-grid">
          <section class="result-card" aria-labelledby="result-domains-title">
            <h3 id="result-domains-title">${escapeHtml(t('domainsTitle'))}</h3>
            ${renderDomainList(domains)}
          </section>
          <section class="result-card" aria-labelledby="result-next-title">
            <h3 id="result-next-title">${escapeHtml(t('nextStepsTitle'))}</h3>
            <ul class="self-check-next-list">
              ${t('nextSteps').map((step) => `<li>${escapeHtml(step)}</li>`).join('')}
            </ul>
          </section>
        </div>
        <section class="result-card result-consultation" aria-labelledby="result-consultation-title">
          <h3 id="result-consultation-title">${escapeHtml(t('consultationTitle'))}</h3>
          <p>${escapeHtml(t('consultationBody'))}</p>
          <div class="result-actions">
            <a class="btn btn-primary" href="index.html#booking">${escapeHtml(t('book'))}</a>
            <a class="btn btn-secondary" href="#support-resources">${escapeHtml(t('resources'))}</a>
          </div>
        </section>
        <section class="result-card result-summary-copy" aria-labelledby="result-summary-title">
          <h3 id="result-summary-title">${escapeHtml(copy[lang].summaryTitle)}</h3>
          <pre data-summary-text>${escapeHtml(buildSummary(answers, lang))}</pre>
          <div class="result-actions">
            <button class="btn btn-secondary" type="button" data-copy-summary>${escapeHtml(t('copySummary'))}</button>
            <button class="btn btn-secondary" type="button" data-print-summary>${escapeHtml(t('printSummary'))}</button>
            <button class="btn btn-secondary" type="button" data-result-reset>${escapeHtml(t('reset'))}</button>
          </div>
          <p class="copy-status" data-copy-status aria-live="polite"></p>
        </section>
        <section class="result-support" aria-labelledby="result-support-title">
          <h3 id="result-support-title">${escapeHtml(t('supportTitle'))}</h3>
          <div class="resource-grid">${renderSupportCards({ compact: level === 'urgent' })}</div>
        </section>
      </div>`;

    if (els.live) els.live.textContent = `${t('resultsEyebrow')}: ${levelCopy.title}`;
    wireResultButton('[data-copy-summary]', copySummary);
    wireResultButton('[data-print-summary]', () => window.print());
    wireResultButton('[data-result-reset]', resetSelfCheck);
    scrollToNode(els.results);
    focusCurrentQuestion();
  }

  function wireResultButton(selector, handler) {
    const button = els.results.querySelector(selector);
    if (!button) return;

    const run = (event) => {
      event.preventDefault();
      handler();
    };

    button.addEventListener('click', run);
    button.addEventListener('pointerup', run);
    button.addEventListener('keyup', (event) => {
      if (event.key === 'Enter' || event.key === ' ') run(event);
    });
  }

  async function copySummary() {
    const status = els.results.querySelector('[data-copy-status]');
    const summary = buildSummary(answers, getLang());
    if (status) status.textContent = t('copying');

    try {
      if (navigator.clipboard?.writeText) {
        await withTimeout(navigator.clipboard.writeText(summary), 800);
      } else {
        fallbackCopy(summary);
      }
      if (status) status.textContent = t('copied');
    } catch (error) {
      try {
        fallbackCopy(summary);
        if (status) status.textContent = t('copied');
      } catch (fallbackError) {
        if (status) status.textContent = t('copyFailed');
      }
    }
  }

  function withTimeout(promise, milliseconds) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error('Clipboard timeout')), milliseconds);
      })
    ]);
  }

  function fallbackCopy(value) {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }

  els.safetyContinue?.addEventListener('click', startQuiz);
  els.form?.addEventListener('submit', (event) => {
    event.preventDefault();
    goNext();
  });
  els.back?.addEventListener('click', goBack);
  els.next?.addEventListener('click', goNext);
  els.reset.forEach((button) => button.addEventListener('click', resetSelfCheck));
  const languageObserver = new MutationObserver(() => {
    if (mode === 'quiz') renderQuestion();
    if (mode === 'results') renderResults();
  });

  languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
}
