(() => {
  const html = document.documentElement;
  const body = document.body;
  const key = 'natalia-site-lang';
  const langButtons = document.querySelectorAll('[data-set-lang]');
  const langMenus = document.querySelectorAll('[data-lang-menu]');
  const langMenuToggles = document.querySelectorAll('[data-lang-menu-toggle]');
  const currentLangLabels = document.querySelectorAll('[data-current-lang]');
  const nav = document.querySelector('#site-nav');
  const navToggle = document.querySelector('.nav-toggle');

  function storedLang() {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function saveLang(lang) {
    try {
      localStorage.setItem(key, lang);
    } catch (error) {
      // localStorage may be unavailable in some privacy modes.
    }
  }

  function setMeta(selector, value) {
    const node = document.querySelector(selector);
    if (node && value) node.setAttribute('content', value);
  }

  const intro = document.querySelector('#intro');
  const desktopIntroLayout = window.matchMedia('(min-width: 981px)');
  let introMediaHeight = null;

  function syncIntroMediaHeight() {
    if (!intro) return;

    if (!desktopIntroLayout.matches) {
      intro.style.removeProperty('--intro-media-height');
      introMediaHeight = null;
      return;
    }

    const eyebrow = intro.querySelector('.eyebrow');
    const chips = intro.querySelector('.mini-list');
    if (!eyebrow || !chips) return;

    const height = Math.ceil(chips.getBoundingClientRect().bottom - eyebrow.getBoundingClientRect().top);
    if (height > 0 && height !== introMediaHeight) {
      introMediaHeight = height;
      intro.style.setProperty('--intro-media-height', `${height}px`);
    }
  }

  function scheduleIntroMediaHeightSync() {
    window.requestAnimationFrame(syncIntroMediaHeight);
  }

  function closeLangMenus() {
    langMenus.forEach((menu) => {
      menu.classList.remove('is-open');
      const toggle = menu.querySelector('[data-lang-menu-toggle]');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
  }

  function setLang(lang) {
    const safeLang = lang === 'en' ? 'en' : 'pl';
    html.lang = safeLang;
    body.classList.toggle('lang-en', safeLang === 'en');
    body.classList.toggle('lang-pl', safeLang === 'pl');
    saveLang(safeLang);

    langButtons.forEach((button) => {
      const active = button.dataset.setLang === safeLang;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-selected', String(active));
    });
    currentLangLabels.forEach((label) => {
      label.textContent = safeLang.toUpperCase();
    });

    document.querySelectorAll('[data-text-pl]').forEach((node) => {
      node.textContent = safeLang === 'en' ? node.dataset.textEn : node.dataset.textPl;
    });
    document.querySelectorAll('[data-placeholder-pl]').forEach((node) => {
      node.setAttribute('placeholder', safeLang === 'en' ? node.dataset.placeholderEn : node.dataset.placeholderPl);
    });
    document.querySelectorAll('[data-alt-pl]').forEach((node) => {
      node.setAttribute('alt', safeLang === 'en' ? node.dataset.altEn : node.dataset.altPl);
    });
    document.querySelectorAll('[data-href-pl]').forEach((node) => {
      node.setAttribute('href', safeLang === 'en' ? node.dataset.hrefEn : node.dataset.hrefPl);
    });

    if (body.dataset.titlePl && body.dataset.titleEn) {
      document.title = safeLang === 'en' ? body.dataset.titleEn : body.dataset.titlePl;
    }
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = safeLang === 'en' ? description.dataset.descriptionEn : description.dataset.descriptionPl;
    }
    const ogTitle = document.querySelector('[data-og-title-pl]');
    const ogDescription = document.querySelector('[data-og-description-pl]');
    if (ogTitle) ogTitle.content = safeLang === 'en' ? ogTitle.dataset.ogTitleEn : ogTitle.dataset.ogTitlePl;
    if (ogDescription) ogDescription.content = safeLang === 'en' ? ogDescription.dataset.ogDescriptionEn : ogDescription.dataset.ogDescriptionPl;
    setMeta('[data-og-locale]', safeLang === 'en' ? 'en_IE' : 'pl_PL');
    scheduleIntroMediaHeightSync();
  }

  setLang(storedLang() || 'pl');
  langButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setLang(button.dataset.setLang);
      closeLangMenus();
      if (nav && navToggle) {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });
  langMenuToggles.forEach((toggle) => {
    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const menu = toggle.closest('[data-lang-menu]');
      const open = !menu?.classList.contains('is-open');
      closeLangMenus();
      if (menu && open) {
        menu.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-lang-menu]')) closeLangMenus();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLangMenus();
  });

  if (nav && navToggle) {
    navToggle.addEventListener('click', () => {
      const open = !nav.classList.contains('is-open');
      closeLangMenus();
      nav.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
    });
  }

  window.addEventListener('resize', scheduleIntroMediaHeightSync);
  window.addEventListener('load', scheduleIntroMediaHeightSync);
  if (intro && 'ResizeObserver' in window) {
    new ResizeObserver(scheduleIntroMediaHeightSync).observe(intro);
  }

  document.querySelectorAll('[data-booking-form]').forEach((form) => {
    const status = form.querySelector('[data-form-status]');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const lang = html.lang === 'en' ? 'en' : 'pl';

      if (!form.reportValidity()) return;

      const data = new FormData(form);
      const labels = lang === 'en'
        ? {
            subject: 'Nutrition consultation request',
            name: 'Name',
            email: 'Email',
            phone: 'Phone',
            preferredLanguage: 'Preferred language',
            type: 'Consultation type',
            message: 'Message',
            consent: 'Consent to contact'
          }
        : {
            subject: 'Zapytanie o konsultację żywieniową',
            name: 'Imię i nazwisko',
            email: 'Email',
            phone: 'Telefon',
            preferredLanguage: 'Preferowany język',
            type: 'Typ konsultacji',
            message: 'Wiadomość',
            consent: 'Zgoda na kontakt'
          };

      const lines = [
        `${labels.name}: ${data.get('name') || ''}`,
        `${labels.email}: ${data.get('email') || ''}`,
        `${labels.phone}: ${data.get('phone') || ''}`,
        `${labels.preferredLanguage}: ${data.get('preferred_language') || ''}`,
        `${labels.type}: ${data.get('type') || ''}`,
        `${labels.consent}: yes`,
        '',
        `${labels.message}:`,
        `${data.get('message') || ''}`
      ];

      const mailto = `mailto:Dietolozki@gmail.com?subject=${encodeURIComponent(labels.subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
      if (status) status.textContent = lang === 'en' ? 'Opening your email app...' : 'Otwieram aplikację mailową...';
      window.location.href = mailto;
    });
  });
})();
