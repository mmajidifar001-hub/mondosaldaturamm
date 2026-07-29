/**
 * FORGE WELD — Main JavaScript
 * Handles: language switching, navigation, form security, scroll effects
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'forgeweld-lang';
  let currentLang = localStorage.getItem(STORAGE_KEY) || 'it';
  const SERVICE_LABELS = {
    structural: 'form.service1',
    artistic: 'form.service2',
    repair: 'form.service3',
    other: 'form.service4',
  };

  function getServiceLabel(serviceKey) {
    const labelKey = SERVICE_LABELS[serviceKey] || 'form.service4';
    return translations[currentLang][labelKey] || serviceKey;
  }

  /* --- Language Switching --- */
  function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (translations[lang][key]) {
        el.placeholder = translations[lang][key];
      }
    });

    const langLabel = document.getElementById('lang-label');
    if (langLabel) langLabel.textContent = lang === 'it' ? 'EN' : 'IT';

    document.title = lang === 'it'
      ? 'Forge Weld | Saldatura Professionale & Lavorazione Metalli'
      : 'Forge Weld | Professional Welding & Metal Fabrication';
  }

  /* --- Mobile Menu --- */
  function initMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('mobile-menu');
    const iconOpen = document.getElementById('icon-open');
    const iconClose = document.getElementById('icon-close');
    if (!toggle || !menu) return;

    function closeMenu() {
      menu.classList.add('hidden');
      menu.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      iconOpen.classList.remove('hidden');
      iconClose.classList.add('hidden');
    }

    toggle.addEventListener('click', () => {
      const isOpen = !menu.classList.contains('hidden');
      if (isOpen) {
        closeMenu();
      } else {
        menu.classList.remove('hidden');
        menu.setAttribute('aria-hidden', 'false');
        toggle.setAttribute('aria-expanded', 'true');
        iconOpen.classList.add('hidden');
        iconClose.classList.remove('hidden');
      }
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });
  }

  /* --- Header Scroll Effect --- */
  function initHeaderScroll() {
    const header = document.getElementById('site-header');
    if (!header) return;

    function updateHeader() {
      header.classList.toggle('is-scrolled', window.scrollY > 50);
    }

    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  /* --- XSS Sanitization --- */
  function sanitizeInput(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML.trim();
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* --- Contact Form --- */
  function initContactForm() {
    const form = document.getElementById('contact-form');
    const statusEl = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const honeypot = form.querySelector('[name="_gotcha"]');
      if (honeypot && honeypot.value) return;

      const name = sanitizeInput(form.querySelector('#name').value);
      const email = sanitizeInput(form.querySelector('#email').value);
      const phone = sanitizeInput(form.querySelector('#phone').value);
      const service = form.querySelector('#service').value;
      const message = sanitizeInput(form.querySelector('#message').value);

      form.querySelectorAll('.form-input').forEach((input) => {
        input.classList.remove('is-invalid');
      });

      let hasError = false;
      if (!name || name.length < 2) {
        form.querySelector('#name').classList.add('is-invalid');
        hasError = true;
      }
      if (!isValidEmail(email)) {
        form.querySelector('#email').classList.add('is-invalid');
        hasError = true;
      }
      if (!service) {
        form.querySelector('#service').classList.add('is-invalid');
        hasError = true;
      }
      if (!message || message.length < 10) {
        form.querySelector('#message').classList.add('is-invalid');
        hasError = true;
      }
      const privacy = form.querySelector('#privacy');
      if (privacy && !privacy.checked) {
        privacy.closest('.form-consent').classList.add('is-invalid');
        hasError = true;
      } else if (privacy) {
        privacy.closest('.form-consent').classList.remove('is-invalid');
      }
      if (hasError) return;

      submitBtn.disabled = true;
      submitBtn.textContent = translations[currentLang]['form.sending'];

      const formData = new FormData();
      formData.append('access_key', form.querySelector('[name="access_key"]').value);
      formData.append('subject', form.querySelector('[name="subject"]').value);
      formData.append('from_name', form.querySelector('[name="from_name"]').value);
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('service', getServiceLabel(service));
      formData.append('message', message);

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' },
        });

        statusEl.classList.remove('hidden', 'form-status--success', 'form-status--error');

        if (response.ok) {
          statusEl.textContent = translations[currentLang]['form.success'];
          statusEl.classList.add('form-status--success');
          form.reset();
        } else {
          throw new Error('Form submission failed');
        }
      } catch {
        statusEl.textContent = translations[currentLang]['form.error'];
        statusEl.classList.add('form-status--error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = translations[currentLang]['form.submit'];
        statusEl.classList.remove('hidden');
      }
    });
  }

  /* --- Service Card Hover --- */
  function initServiceCards() {
    const cards = document.querySelectorAll('.service-card');
    cards.forEach((card) => {
      card.addEventListener('mouseenter', () => {
        cards.forEach((c) => c.classList.remove('service-card--active'));
        card.classList.add('service-card--active');
      });
    });
  }

  /* --- Opening Hours & Live Status --- */
  function initOpeningHours() {
    const today = new Date().getDay(); // 0: Sun, 1: Mon, ... 6: Sat
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // Highlight current day row
    document.querySelectorAll('[data-day]').forEach((row) => {
      const dayNum = parseInt(row.getAttribute('data-day'), 10);
      if (dayNum === today) {
        row.classList.add('bg-forge-steel/60', 'font-semibold', 'text-white', 'rounded-md');
        const badge = row.querySelector('.today-badge');
        if (badge) badge.classList.remove('hidden');
      }
    });

    // Determine if open right now
    let isOpen = false;
    if (today >= 1 && today <= 5) {
      // Mon - Fri: 08:30 - 12:00 (510 - 720 mins) & 13:00 - 17:30 (780 - 1050 mins)
      if ((currentMins >= 510 && currentMins < 720) || (currentMins >= 780 && currentMins < 1050)) {
        isOpen = true;
      }
    } else if (today === 6) {
      // Sat: 08:00 - 12:00 (480 - 720 mins)
      if (currentMins >= 480 && currentMins < 720) {
        isOpen = true;
      }
    }

    const badgeEl = document.getElementById('live-status-pill');
    if (badgeEl) {
      if (isOpen) {
        badgeEl.className = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
        badgeEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span><span data-i18n="hours.openStatus">Aperto Ora</span>';
      } else {
        badgeEl.className = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40';
        badgeEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-400"></span><span data-i18n="hours.closedStatus">Chiuso Ora</span>';
      }
    }
  }

  /* --- Init --- */
  document.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLang);

    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
      langToggle.addEventListener('click', () => {
        setLanguage(currentLang === 'it' ? 'en' : 'it');
        initOpeningHours();
      });
    }

    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    initMobileMenu();
    initHeaderScroll();
    initContactForm();
    initServiceCards();
    initOpeningHours();
  });
})();
