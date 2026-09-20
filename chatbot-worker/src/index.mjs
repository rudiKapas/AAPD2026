// Setup checkpoint only. No AI calls, writes, or ingestion endpoints yet.
export default {
  async fetch(request, env) {
    const headers = { 'Cache-Control': 'no-store' };
    if (request.method !== 'GET') {
      return Response.json({ error: 'Method not allowed' }, {
        status: 405, headers: { ...headers, Allow: 'GET' }
      });
    }
    if (new URL(request.url).pathname !== '/health') {
      return Response.json({ error: 'Not found' }, { status: 404, headers });
    }
    const bindings = {
      ai: typeof env.AI?.run === 'function',
      cache: typeof env.AAPD_CHAT_CACHE?.get === 'function',
      knowledge: typeof env.VECTORIZE?.query === 'function'
    };
    const ok = Object.values(bindings).every(Boolean);
    return Response.json({
      ok,
      stage: 'configuration-only',
      bindings,
      note: 'Binding availability only; remote access and AI inference are not tested.'
    }, { status: ok ? 200 : 503, headers });
  }
};
