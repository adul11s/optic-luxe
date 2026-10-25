# Suggested Alerts (docs/alerts.md)

Daftar alert yang disarankan untuk optik multi-channel ini, dengan threshold,
basis metrik (endpoint `GET /metrics` yang baru ditambahkan), dan **status
integration yang jujur**.

> Prinsip: alert hanya berguna kalau sinyalnya nyata. Metrik-ring-buffer
> in-process saat ini bersifat single-process; semua integration eksternal
> (Prometheus/Loki/uptime checker) masih **TODO — belum terpasang**. Angka di
> bawah adalah rekomendasi awal, bukan hasil tuning produksi.

## 1. Service-level alert

| Alert | Metrik (dari `GET /metrics`) | Threshold | Status integration |
|---|---|---|---|
| **5xx rate tinggi** | `errors5xxTotal` / `requestsTotal` per window 5 menit | > 1% request `NON_2XX` selama ≥ 5 menit (dan ≥ 20request dalam window, hindari noise di traffic tipis) | TODO — belum dipipe ke Prometheus/Alertmanager; endpoint JSON hanya bisa di-scrape/cek manual |
| **p99/p95 latency** | `latencyMs.p95` per route (ring buffer 256 sampel terakhir) | p95 > 1000ms berturut 3 sampel scrape → warning; p95 > 3000ms → critical | TODO — ring buffer in-process; perlu long-term store (Prometheus/Mimir) yang belum ada |
| **Endpoint 404/unmatched traffic** | route `… unmatched` | > 5% total | TODO — berguna untuk deteksi scanner; belum di-scrape otomatis |

## 2. Database alert

| Alert | Metrik | Threshold | Status integration |
|---|---|---|---|
| **DB connection pool habis** | Prisma pool size / waiting (belum diekspos di `/metrics`) | waiting > 10 atau ping DB > 1 s | TODO — counter koneksi Prisma belum dimasukkan ke metrics; perlu instrumentasi `prisma.$on('query'|'error')` |
| **DB down / ping gagal** | healthcheck `/health` | 3 ping gagal berturut-turut (interval 30 s) | TODO — `/health` sudah ada, tapi tidak ada uptime checker eksternal yang memantau |
| **Slow query** | durasi query > 500 ms | > 10/menit | TODO — butuh Prisma logging/exporter |

## 3. Infra alert

| Alert | Metrik | Threshold | Status integration |
|---|---|---|---|
| **Disk penuh** | host `used%` disk dengan Postgres volume | > 85% selama 10 menit → warning; > 95% → critical | TODO — perlu node-exporter / agen host; belum ada sama sekali |
| **Memory server** | RSS process server | > 512 MB selama 15 menit | TODO — belum diekspos dari `process.memoryUsage()` keluar `GET /metrics` |
| **Container restart loop** | Docker restart count dalam 1 jam | ≥ 2 restart | TODO — perlu integrasi Docker/Compose events |
| **Rate limit pemicu tinggi** | hitungan 429 (belum counter khusus) | > 50/5 menit dari 1 sumber | TODO — berpotensi brute-force login; butuh counter 429 widget di `rateLimit.ts` |

## 4. Alert routing (siapa yang ditagih)

| Severity | Channel | Status |
|---|---|---|
| critical (DB down, disk > 95%, 5xx > 10%) | Slack #optic-luxe-ops + Paging | TODO — tidak ada webhook/Opsgenie yang terpasang |
| warning (latency, disk warning) | Slack #optic-luxe-ops | TODO |
| Info | Weekly digest email | TODO |

## Runbook minimum singkatan (TODO)

1. 5xx spike → `kubectl logs`/`docker logs` server, cek `errorHandler` output,
   lihat `pino` line `event` terakhir sebelum error (audit-log / order flow sering).
2. DB conn → cek `docker-compose.yml` service `db`, walau compose ini
   **LOCAL-ONLY** (JWT_SECRET placeholder), jangan tunjukkan sebagai prod-ready.
3. Disk → vacuum Postgres, cek retention log.

## Ringkasan status (jujur)

- ✅ Metrik in-process + endpoint `/metrics` (counters per route, 5xx, ring
  buffer 256 sampel p50/p95) — ada testnya.
- ❌ Scrape otomatis / alert routing / dashboard — **belum ada sama sekali**.
- ❌ Metrik DB koneksi, disk, memori — **belum diekspos**.
