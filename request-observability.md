Canlı Demo Linkleri
Test Request Sayfaları

Bu sayfalar farklı endpoint’lere test request göndermek için kullanılır:

https://request-observability.pages.dev/

https://request-observability.pages.dev/page1

https://request-observability.pages.dev/page2

https://request-observability.pages.dev/page3

Bu sayfalara yapılan her istek sistem tarafından loglanır.



Monitoring Dashboard (UI)

Gerçek zamanlı metriklerin görüntülendiği arayüz:

https://request-observability-dashboard.pages.dev/



Dashboard özellikleri:

Path bazlı toplam request sayısı

Hata oranı

Ortalama latency

P95 latency

Cursor pagination ile log listeleme

Polling tabanlı near real-time güncelleme



Write & Read Path (Request Ingestion)

Client → Worker API → Queue → Worker API → ClickHouse → Worker API → UI


Akış Açıklaması

- Client istek gönderir.

- Worker API request’i alır ve Queue’ya gönderir.

- Queue’daki mesaj Worker tarafından işlenir.

- Veriler ClickHouse’a yazılır.

- Dashboard Worker üzerinden veriyi çeker.

- UI polling ile belirli aralıklarla güncellenir.


KULLANILLAN TEKNOLOJİLER

Backend

- Cloudflare Pages

- Cloudflare Workers

- Cloudflare Queues

- ClickHouse

Frontend

- React (Vite)

- Recharts

- Cursor pagination

- Polling ile yenileme



