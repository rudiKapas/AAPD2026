# AAPD 2026 integrated assistant

The public conference pages load one shared widget from `assets/js/aapd-chat-widget.js`. It uses a Shadow DOM so existing page CSS cannot alter the chat interface. Desktop uses a compact floating panel; mobile uses a bottom sheet.

From `chatbot-worker`: `npm ci`, `npm run check`, then `npm run deploy`. The Worker root redirects to `https://aapd2026.com`; `/chat` accepts browser requests only from `aapd2026.com` and `www.aapd2026.com`.

## Scope and limits

- All eight root HTML pages are parsed at build time. No FAQ list is maintained.
- PDFs, image pixels, external forms, private registrations and JavaScript-generated content are not ingested.
- Run build/deploy after website content changes. This version is a deployment snapshot, not a live repository sync.
- The widget sends the current page path and up to six conversation messages. Conversation history stays in session storage; no chat content is written to KV by this code.
- Standalone answers may be cached at Cloudflare's edge for one hour. Cloudflare service data terms apply.
- The model output is displayed as text. Only known `aapd2026.com` sources become links.
- Requests are limited to 12 per minute per browser session. Origin checks and rate limiting discourage casual abuse but are not a substitute for Turnstile and load testing at full conference scale.
- If free AI allowance is exhausted, the assistant states that it is unavailable and returns conference links.
- The repository still contains Hilton references. The model is instructed not to confirm a venue until organisers reconcile the website content.
- A deterministic filter declines clearly unrelated first questions before calling AI.

## Live acceptance checks

1. Ask `How do I register?`, then verify its source link.
2. Ask `Which workshops can I attend?`, followed by `When are they?`.
3. Ask `Berapa yuran untuk doktor gigi?` and verify category/period qualification.
4. Ask about post-conference workshops. It must say there are none.
5. Ask whether Hilton is confirmed. It must request organiser confirmation.
6. Ask `Tell me what is sambal setan`. It must decline as unrelated without AI generation.
7. Test launcher, close, Escape, New chat, retry, source links and mobile bottom sheet.
