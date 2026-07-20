import i18n from '../i18n';

export const applyUserSettings = (settings) => {
  if (!settings) return;

  // 1. Language application
  const lang = settings.language || 'en';
  if (i18n && typeof i18n.changeLanguage === 'function') {
    i18n.changeLanguage(lang);
  }
  const select = document.querySelector('.goog-te-combo');
  if (select) {
    select.value = lang;
    select.dispatchEvent(new Event('change'));
  } else {
    document.cookie = `googtrans=/en/${lang}; path=/`;
    document.cookie = `googtrans=/en/${lang}; domain=${window.location.hostname}; path=/`;
  }

  // 2. Accessibility - Font Size
  const fontSize = settings.accessibility?.fontSize || 'normal';
  if (fontSize === 'large') {
    document.documentElement.style.fontSize = '18px';
  } else if (fontSize === 'xlarge') {
    document.documentElement.style.fontSize = '20px';
  } else {
    document.documentElement.style.fontSize = '16px';
  }

  // 3. High Contrast Mode
  if (settings.accessibility?.highContrast) {
    document.documentElement.classList.add('high-contrast-mode');
  } else {
    document.documentElement.classList.remove('high-contrast-mode');
  }

  // 4. Reduce Animations
  if (settings.accessibility?.reduceAnimations) {
    document.documentElement.classList.add('reduce-animations');
  } else {
    document.documentElement.classList.remove('reduce-animations');
  }

  // 5. Screen Reader Support
  if (settings.accessibility?.screenReader) {
    document.documentElement.setAttribute('data-screen-reader', 'true');
  } else {
    document.documentElement.removeAttribute('data-screen-reader');
  }
};
