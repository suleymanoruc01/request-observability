export default {
  async fetch(request, env) {
    const startTime = performance.now();
    const requestId = crypto.randomUUID();

    const url = new URL(request.url);

    const rawRequest = {
      id: requestId,
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      pathname: url.pathname,
      search: url.search,
      protocol: url.protocol,
      headers: Object.fromEntries(request.headers),
      body: request.body ? await request.clone().text() : null,
      cf: request.cf ?? null,
    };

    const PAGES_ORIGIN = "https://request-observability.pages.dev";
    const targetUrl = PAGES_ORIGIN + url.pathname + url.search;

    const proxyRequest = new Request(targetUrl, request.clone());
    const response = await fetch(proxyRequest);

    const endTime = performance.now();

    const rawResponse = {
      status: response.status,
      headers: Object.fromEntries(response.headers),
    };

    const timing = {
      start_ms: startTime,
      end_ms: endTime,
      latency_ms: Math.round(endTime - startTime),
    };

    const rawLog = {
      request: rawRequest,
      response: rawResponse,
      timing,
    };

    // 🚚 QUEUE'YA GÖNDER
    await env.RAW_LOG_QUEUE.send(rawLog);

    return response;
  },
};
