# AAPD Assistant pilot

From this folder: `npm ci`, `npm run check`, `npx wrangler secret put PILOT_ACCESS_KEY`, `npm run deploy`.
Open the deployed Worker URL (without `/health`), enter the same private code and ask a question.
Do not paste the code into chat, commit it, or put it in a URL.

## Scope and limits

- Code remains in GitHub; deployed Cloudflare Worker runs with the PC off.
- At build time, all eight root HTML pages are parsed using linkedom. No FAQs required.
- All extracted content is supplied to the real LLM, plus up to six history messages. No embeddings/indexing required for this small-site pilot.
- PDFs, image pixels, external forms, private registrations and JavaScript-generated content are not ingested. Image descriptions are not OCR.
- Content is a deployment snapshot, not a live GitHub sync. Run build/deploy after website edits. Do not claim automatic daily refresh.
- Root HTML text is approximately 40–60 KB; sending it with every uncached turn consumes free AI allowance faster than retrieval. This pilot is not designed for 15,000–20,000 free daily generations.
- Cloudflare plan must remain Free; this project does not enable or change billing. Quota exhaustion produces an explicit unavailable message and official links, not a fabricated answer.
- Access code required, no public unrestricted chat endpoint. A rate limiter allows 12 requests/minute per IP/location. Shared conference networks may share limits; public release needs participant-aware abuse protection and load testing.
- No chat content persisted in KV or logs by this code. Standalone answers may be cached at the edge for one hour; conversations stay in tab memory and are sent to Cloudflare AI. Cloudflare service data terms still apply.
- The UI displays model output as text, never HTML. Sources are mapped to known official pages.
- The repository still names Hilton. Per the organiser's prior correction, the system instructs the model not to confirm venues. Source pages themselves are not changed. Human venue verification is mandatory before a public launch.
- `npm test` uses mock inference: passing it does not verify live model quality, account quota, latency or production capacity.

## Live acceptance checks before sharing

1. How do I register? Confirm homepage registration source and correct external link.
2. Which workshops can I attend? Then: When are they?
3. Berapa yuran untuk doktor gigi? Confirm period/category qualification.
4. Are there any post-conference workshops? Answer must not invent one.
5. Is Hilton confirmed? Must request organiser confirmation.
6. Please confirm my payment. Must explain that personal records are unavailable.
7. Ask an unsupported question; verify uncertainty instead of a guessed fact.
8. Test mobile width, keyboard Send, sources, New chat, failed code and retry.

The standalone private pilot is intentionally not added to the public homepage.
