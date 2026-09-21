(() => {
  'use strict';
  if (window.__AAPD_CHAT_WIDGET__) return;
  window.__AAPD_CHAT_WIDGET__ = true;

  const ENDPOINT = 'https://aapd-chatbot.aapd2026-assistant.workers.dev/chat';
  const HISTORY_KEY = 'aapd-chat-history-v1';
  const SESSION_KEY = 'aapd-chat-session-v1';
  const host = document.createElement('div');
  host.id = 'aapd-chat-widget';
  document.body.append(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      :host{--ink:#0f172a;--muted:#5f6b7c;--line:#e2e7ee;--soft:#f6f7fb;--teal:#08766c;--amber:#fbac45;font-family:Inter,"Segoe UI",system-ui,-apple-system,sans-serif;color:var(--ink)}
      *{box-sizing:border-box}button,textarea{font:inherit}button{cursor:pointer}button:focus-visible,textarea:focus-visible,a:focus-visible{outline:3px solid #b66b08;outline-offset:2px}
      .launcher{position:fixed;right:24px;bottom:max(24px,env(safe-area-inset-bottom));z-index:2147483001;display:flex;align-items:center;gap:9px;border:0;border-radius:999px;background:var(--ink);color:#fff;padding:13px 17px 13px 13px;box-shadow:0 14px 34px rgba(15,23,42,.26);font-weight:700;letter-spacing:.01em;transition:transform .18s ease,box-shadow .18s ease}
      .launcher:hover{transform:translateY(-2px);box-shadow:0 18px 38px rgba(15,23,42,.3)}.launcher-mark{width:29px;height:29px;border-radius:10px;background:var(--amber);color:var(--ink);display:grid;place-items:center;font-size:16px}.launcher[aria-expanded="true"]{opacity:0;pointer-events:none;transform:translateY(8px)}
      .scrim{display:none}.panel{position:fixed;right:24px;bottom:max(24px,env(safe-area-inset-bottom));z-index:2147483002;width:min(400px,calc(100vw - 32px));height:min(650px,calc(100dvh - 48px));background:#fff;border:1px solid var(--line);border-radius:22px;box-shadow:0 24px 70px rgba(15,23,42,.24);overflow:hidden;display:flex;flex-direction:column;opacity:0;visibility:hidden;transform:translateY(16px) scale(.98);transform-origin:bottom right;transition:opacity .18s ease,transform .18s ease,visibility .18s}
      .panel.open{opacity:1;visibility:visible;transform:none}.head{min-height:70px;padding:13px 14px 13px 17px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:11px}.brand{width:38px;height:38px;border-radius:13px;background:var(--ink);color:var(--amber);display:grid;place-items:center;font-weight:800}.title{min-width:0;flex:1}.title strong{display:block;font-size:14px}.title span{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:11px}.dot{width:7px;height:7px;border-radius:50%;background:#16a34a}.icon-btn{border:1px solid var(--line);background:#fff;color:var(--muted);border-radius:10px;width:40px;height:40px;display:grid;place-items:center;font-size:19px}.icon-btn:hover{background:var(--soft);color:var(--ink)}
      .messages{flex:1;overflow:auto;padding:18px 17px 10px;scroll-behavior:smooth}.welcome{padding:3px 1px 10px}.spark{width:42px;height:42px;border-radius:14px;background:#fff2df;color:#8d570e;display:grid;place-items:center;font-size:21px}.welcome h2{font-size:21px;line-height:1.25;margin:13px 0 7px;letter-spacing:-.025em}.welcome p{font-size:13px;line-height:1.55;color:var(--muted);margin:0}.suggestions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:17px 0 11px}.suggestions button{text-align:left;border:1px solid var(--line);background:var(--soft);color:var(--ink);border-radius:12px;padding:10px 11px;min-height:58px;font-size:12px;line-height:1.4}.suggestions button:hover{border-color:var(--teal);background:#f0f8f6}.notice{font-size:10px!important;line-height:1.45!important}
      .message{margin:15px 0;max-width:92%;overflow-wrap:anywhere}.message.user{margin-left:auto;background:#eaf3f2;border-radius:15px 15px 4px 15px;padding:10px 13px}.message.assistant{margin-right:auto}.label{color:var(--muted);font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px}.bubble{font-size:13px;line-height:1.55;white-space:pre-wrap}.error{background:#fff4e5;border:1px solid #f0cf9d;border-radius:12px;padding:11px}.sources{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.sources a{font-size:10px;text-decoration:none;color:var(--teal);background:var(--soft);border:1px solid var(--line);border-radius:8px;padding:5px 7px}.sources a:hover{text-decoration:underline}.typing{display:flex;gap:5px;padding:8px 2px}.typing i{width:6px;height:6px;border-radius:50%;background:#8b96a5;animation:pulse 1.1s infinite ease-in-out}.typing i:nth-child(2){animation-delay:.16s}.typing i:nth-child(3){animation-delay:.32s}@keyframes pulse{0%,70%,100%{transform:translateY(0);opacity:.35}35%{transform:translateY(-4px);opacity:1}}
      .status{min-height:18px;padding:0 17px;color:var(--teal);font-size:10px}.composer{border-top:1px solid var(--line);padding:11px 12px max(10px,env(safe-area-inset-bottom));background:#fff}.input{border:1px solid #c9d1dc;border-radius:13px;padding:7px;display:flex;align-items:flex-end;gap:6px}.input:focus-within{border-color:var(--teal);box-shadow:0 0 0 2px rgba(8,118,108,.1)}textarea{border:0;outline:0!important;resize:none;background:transparent;color:var(--ink);width:100%;min-height:39px;max-height:94px;padding:7px;font-size:13px;line-height:1.45}.send{border:0;background:var(--ink);color:#fff;border-radius:10px;min-width:44px;height:42px;display:grid;place-items:center;font-size:18px}.send:disabled{opacity:.5;cursor:wait}.fine{display:flex;justify-content:space-between;color:var(--muted);font-size:9px;margin:7px 3px 0}.retry{margin-top:9px;border:1px solid #d7aa6e;background:#fff;color:var(--ink);border-radius:8px;padding:6px 9px;font-size:10px}
      @media(max-width:520px){.launcher{right:15px;bottom:max(17px,env(safe-area-inset-bottom));padding:12px 15px 12px 12px}.scrim.open{display:block;position:fixed;inset:0;z-index:2147483001;background:rgba(15,23,42,.28);backdrop-filter:blur(2px)}.panel{right:0;bottom:0;width:100%;height:min(82dvh,720px);border-radius:22px 22px 0 0;transform-origin:bottom center;transform:translateY(30px);border-bottom:0}.panel.open{transform:none}.messages{padding-top:15px}.suggestions{gap:7px}.suggestions button{min-height:53px;padding:9px}.head{min-height:64px}}
      @media(max-width:340px){.suggestions{grid-template-columns:1fr}.launcher-label{display:none}.launcher{padding-right:12px}}
      @media(prefers-reduced-motion:reduce){.panel,.launcher{transition:none}.messages{scroll-behavior:auto}.typing i{animation:none}}
    </style>
    <button class="launcher" type="button" aria-expanded="false" aria-controls="aapd-chat-panel" aria-label="Open AAPD conference assistant"><span class="launcher-mark" aria-hidden="true">✦</span><span class="launcher-label">Ask AAPD</span></button>
    <div class="scrim"></div>
    <section class="panel" id="aapd-chat-panel" role="dialog" aria-label="AAPD 2026 Conference Assistant" aria-hidden="true">
      <header class="head"><span class="brand" aria-hidden="true">A</span><div class="title"><strong>AAPD Assistant</strong><span><i class="dot"></i> Conference information</span></div><button class="icon-btn clear" type="button" title="Start a new chat" aria-label="Start a new chat">↻</button><button class="icon-btn close" type="button" title="Minimise chat" aria-label="Minimise chat">×</button></header>
      <div class="messages" role="log" aria-live="polite" aria-relevant="additions">
        <div class="welcome"><div class="spark" aria-hidden="true">✦</div><h2>How can I help?</h2><p>Ask about AAPD 2026 in English or Bahasa Melayu. Follow-up questions are welcome.</p><div class="suggestions"><button type="button">How do I register?</button><button type="button">Which workshops can I attend?</button><button type="button">What are the abstract requirements?</button><button type="button">Bila bengkel pra-persidangan?</button></div><p class="notice">Please verify important arrangements with the organisers. Don’t share personal, payment or health information.</p></div>
      </div>
      <div class="status" role="status" aria-live="polite"></div>
      <form class="composer"><div class="input"><textarea rows="1" maxlength="800" aria-label="Ask about AAPD 2026" placeholder="Ask about AAPD 2026…" required></textarea><button class="send" type="submit" aria-label="Send question">↑</button></div><div class="fine"><span>AI-assisted · Website sources</span><span class="count">0 / 800</span></div></form>
    </section>`;

  const $ = selector => root.querySelector(selector);
  const launcher = $('.launcher');
  const panel = $('.panel');
  const scrim = $('.scrim');
  const messages = $('.messages');
  const question = $('textarea');
  const send = $('.send');
  const status = $('.status');
  let busy = false;
  let history = loadHistory();
  let lastQuestion = '';
  let sessionId = '';
  try { sessionId = localStorage.getItem(SESSION_KEY) || ''; } catch { /* Storage is optional. */ }
  if (!sessionId || !/^[A-Za-z0-9_-]{16,80}$/.test(sessionId)) {
    sessionId = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/[^A-Za-z0-9_-]/g, '');
    try { localStorage.setItem(SESSION_KEY, sessionId); } catch { /* Storage is optional. */ }
  }

  function loadHistory() {
    try {
      const value = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || '[]');
      return Array.isArray(value) ? value.filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string').slice(-6) : [];
    } catch { return []; }
  }
  function saveHistory() {
    try { sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-6))); } catch { /* Storage is optional. */ }
  }
  function openChat() {
    panel.classList.add('open'); scrim.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); launcher.setAttribute('aria-expanded', 'true');
    setTimeout(() => question.focus(), 180);
  }
  function closeChat() {
    panel.classList.remove('open'); scrim.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); launcher.setAttribute('aria-expanded', 'false'); launcher.focus();
  }
  function setBusy(value) {
    busy = value; send.disabled = value; root.querySelectorAll('.suggestions button,.clear').forEach(b => b.disabled = value); messages.setAttribute('aria-busy', String(value));
  }
  function addSources(node, items) {
    if (!Array.isArray(items) || !items.length) return;
    const wrap = document.createElement('div'); wrap.className = 'sources';
    const labels = { 'index.html': 'Conference & registration', 'preConferenceWorkshops.html': 'Workshops', 'programmeSchedule.html': 'Programme', 'abstractSubmission.html': 'Abstracts', 'aboutus.html': 'About AAPD', 'sponsors.html': 'Sponsors', 'registration.html': 'Registration', 'eventGallery.html': 'Gallery' };
    for (const item of items) {
      try {
        const url = new URL(item.url); if (url.origin !== 'https://aapd2026.com') continue;
        const link = document.createElement('a'); link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = `[${item.id}] ${labels[url.pathname.split('/').pop()] || 'Conference source'}`; wrap.append(link);
      } catch { /* Ignore malformed model metadata. */ }
    }
    node.append(wrap);
  }
  function addMessage(role, text, sourceItems = [], error = false) {
    const node = document.createElement('div'); node.className = `message ${role}${error ? ' error' : ''}`;
    const label = document.createElement('div'); label.className = 'label'; label.textContent = role === 'user' ? 'You' : error ? 'Unable to answer' : 'AAPD Assistant';
    const bubble = document.createElement('div'); bubble.className = 'bubble'; bubble.textContent = text;
    node.append(label, bubble); addSources(node, sourceItems); messages.append(node); node.scrollIntoView({ block: 'nearest' }); return node;
  }
  function typing(show) {
    $('.typing')?.remove();
    if (!show) return;
    const node = document.createElement('div'); node.className = 'typing'; node.setAttribute('aria-label', 'Assistant is preparing an answer'); node.innerHTML = '<i></i><i></i><i></i>'; messages.append(node); node.scrollIntoView({ block: 'nearest' });
  }
  async function ask(value, showUser = true) {
    const text = value.trim(); if (!text || busy) return;
    lastQuestion = text; const prior = history.slice(-6); setBusy(true); status.textContent = 'Reading the conference information…'; $('.welcome').hidden = true; if (showUser) addMessage('user', text); question.value = ''; $('.count').textContent = '0 / 800'; typing(true);
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: text, history: prior, sessionId, pagePath: location.pathname }), signal: controller.signal });
      let data; try { data = await response.json(); } catch { data = { error: 'The assistant returned an unexpected response. Please try again.' }; }
      if (!response.ok) { const problem = new Error(data.error || 'Please try again.'); problem.sources = data.sources; throw problem; }
      typing(false); addMessage('assistant', data.answer, data.sources); history.push({ role: 'user', content: text }, { role: 'assistant', content: data.answer }); history = history.slice(-6); saveHistory(); status.textContent = data.cached ? 'Answer loaded.' : 'Answer ready.';
    } catch (error) {
      typing(false); const node = addMessage('assistant', error.name === 'AbortError' ? 'The request took too long. Please try again.' : error.message, error.sources, true);
      const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'retry'; retry.textContent = 'Retry'; retry.addEventListener('click', () => { if (!busy) { retry.disabled = true; ask(lastQuestion, false); } }); node.append(retry); status.textContent = 'Your question was not lost.';
    } finally { clearTimeout(timeout); setBusy(false); question.focus(); }
  }

  launcher.addEventListener('click', openChat); $('.close').addEventListener('click', closeChat); scrim.addEventListener('click', closeChat);
  $('.clear').addEventListener('click', () => { if (busy) return; history = []; saveHistory(); messages.querySelectorAll('.message,.typing').forEach(n => n.remove()); $('.welcome').hidden = false; status.textContent = 'New conversation started.'; question.focus(); });
  $('.composer').addEventListener('submit', event => { event.preventDefault(); ask(question.value); });
  question.addEventListener('input', () => { $('.count').textContent = `${question.value.length} / 800`; question.style.height = 'auto'; question.style.height = `${Math.min(question.scrollHeight, 94)}px`; });
  question.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); $('.composer').requestSubmit(); } });
  root.querySelectorAll('.suggestions button').forEach(button => button.addEventListener('click', () => ask(button.textContent)));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && panel.classList.contains('open')) closeChat(); });
  if (history.length) {
    $('.welcome').hidden = true;
    history.forEach(item => addMessage(item.role, item.content));
    status.textContent = 'Conversation restored for this browsing session.';
  }
})();
