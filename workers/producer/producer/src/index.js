export default {
  async fetch(request) {
    const startTime = performance.now();
    const requestId = crypto.randomUUID();

    const url = new URL(request.url);

    // 🔹 1. REQUEST SNAPSHOT (RAW)
    const rawRequest = {
      id: requestId,
      timestamp: new Date().toISOString(),

      method: request.method,
      url: request.url,
      pathname: url.pathname,
      search: url.search,
      protocol: url.protocol,

      headers: Object.fromEntries(request.headers),

      // body sadece string olarak, parse YOK
      body: request.body
        ? await request.clone().text()
        : null,

      cf: request.cf ?? null,
    };

    // 🔹 2. PROXY → PAGES
    const PAGES_ORIGIN = "https://request-observability.pages.dev";
    const targetUrl = PAGES_ORIGIN + url.pathname + url.search;

    const proxyRequest = new Request(targetUrl, request.clone());
    const response = await fetch(proxyRequest);

    const endTime = performance.now();

    // 🔹 3. RESPONSE SNAPSHOT (RAW)
    const rawResponse = {
      status: response.status,
      headers: Object.fromEntries(response.headers),
    };

    // 🔹 4. TIMING
    const timing = {
      start_ms: startTime,
      end_ms: endTime,
      latency_ms: Math.round(endTime - startTime),
    };

    // 🔹 5. FINAL RAW LOG (TEK OBJE)
    const rawLog = {
      request: rawRequest,
      response: rawResponse,
      timing,
    };

    // 🔹 ŞİMDİLİK SADECE LOG (SONRA QUEUE)
    console.log(JSON.stringify(rawLog));

    // 🔹 Response’u aynen geri dön
    return response;
  },
};
