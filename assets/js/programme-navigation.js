/* Native <details> works without JS. Add Escape, outside-click and focus handling. */
(() => {
  'use strict';
  const menus = [...document.querySelectorAll('.aapd-programme-menu')];
  const close = (menu, restoreFocus = false) => {
    menu.open = false;
    menu.querySelector('summary')?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) menu.querySelector('summary')?.focus();
  };
  menus.forEach(menu => {
    const summary = menu.querySelector('summary');
    summary?.setAttribute('aria-expanded', String(menu.open));
    menu.addEventListener('toggle', () => {
      summary?.setAttribute('aria-expanded', String(menu.open));
      if (menu.open) menus.filter(other => other !== menu).forEach(other => close(other));
    });
    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.open) {
        event.preventDefault();
        event.stopPropagation();
        close(menu, true);
      }
    });
    menu.addEventListener('focusout', () => {
      setTimeout(() => { if (!menu.contains(document.activeElement)) close(menu); }, 0);
    });
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => close(menu)));
  });
  document.addEventListener('pointerdown', event => {
    menus.forEach(menu => { if (!menu.contains(event.target)) close(menu); });
  });
})();
