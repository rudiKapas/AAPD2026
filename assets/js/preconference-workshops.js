(() => {
  'use strict';
  const toggle = document.getElementById('navToggle');
  const mobile = document.getElementById('mobileMenu');
  const setMobile = open => {
    if (!toggle || !mobile) return;
    mobile.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (!open) mobile.querySelectorAll('details[open]').forEach(item => { item.open = false; });
  };
  toggle?.addEventListener('click', () => setMobile(!mobile?.classList.contains('open')));
  mobile?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMobile(false)));
  document.addEventListener('pointerdown', event => {
    if (mobile?.classList.contains('open') && !mobile.contains(event.target) && !toggle?.contains(event.target)) setMobile(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobile?.classList.contains('open')) { setMobile(false); toggle?.focus(); }
  });
  const wide = matchMedia('(min-width:1181px)');
  wide.addEventListener('change', event => { if (event.matches) setMobile(false); });
  const toast = document.getElementById('ws-status');
  let toastTimer;
  document.querySelectorAll('[data-copy-workshop]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', async () => {
      const url = new URL(location.href);
      url.hash = button.dataset.copyWorkshop;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(url.href);
        toast.textContent = 'Workshop link copied.';
      } catch {
        // No deprecated clipboard APIs or hidden text fields.
        location.hash = button.dataset.copyWorkshop;
        toast.textContent = 'Copy this workshop link from your browser address bar.';
      }
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toast.textContent = ''; }, 4500);
    });
  });
  let printOpen = [];
  addEventListener('beforeprint', () => {
    printOpen = [...document.querySelectorAll('.ws-disclosure:not([open])')];
    printOpen.forEach(item => { item.open = true; });
  });
  addEventListener('afterprint', () => {
    printOpen.forEach(item => { item.open = false; });
    printOpen = [];
  });
})();
