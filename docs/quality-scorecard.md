# Quality Scorecard

Skor jujur dipondasi bukti yang bisa diverifikasi — bukan target.

| Dimensi | Bobot | Skor | Bukti |
|---|---|---|---|
| Narasi masalah | 10% | 9 | README#problem — optik multi-channel, masalah oversell & sinkron stok POS/online |
| Demo & reproduksibilitas | 15% | 7 | `docker-compose.yml` db+server+client, `docs/notes/DEMO.md`; video & GIF try-on masih TODO |
| Kebenaran & test | 20% | 10 | 65/65 test (unit + integration DB asli di CI), termasuk test oversell race 2 checkout paralel stok=1 → tepat 1 sukses; CI run [40163313350](https://github.com/adul11s/optic-luxe/actions/runs/40163313350) hijau |
| Arsitektur & keputusan | 15% | 9 | `docs/adr/` (3 ADR: monolith modular, JWT fail-fast, inventory reservation/refund), diagram struktur di README |
| Keamanan | 10% | 8 | `docs/threat-model.md` (oversell race diakui + kini dites), role matrix tests, rate limit login, audit log; secret hygiene: JWT fail-fast tanpa fallback |
| Operasional | 10% | 8 | Metrics endpoint `GET /metrics` (counter request per route, error 5xx, ring-buffer latency p50/p95, 8 test metrics t.c. anti-kebocoran PII — see `server/src/middleware/metrics.ts`); `docs/alerts.md` daftar alert + threshold dengan status integration jujur (semua scrape/routing eksternal TODO); tetap: belum ada scrape otomatis/dashboard/pgpool metrics → dari 7 naik ke 8 |
| Kerapian kode | 10% | 9 | Strict TS, `tsc --noEmit` 0 error; tanpa dead code |
| Presentasi | 10% | 6 | README above the fold ada; video 90 detik & GIF belum dibuat (butuh user) |

**Total:** 8.4 (weighted)
**Target berikutnya:** video GIF try-on (demo & presentasi); scrape otomatis + alert routing dari `docs/alerts.md` (operasional).
**Tanggal review:** 2026-10-25

Sumber angka: satu sumber kebenaran adalah output `npm test` + run CI terbaru (65/65). Jangan memperbarui README dari memori — jalankan test dulu, lalu sebar angka yang sama ke semua tempat yang menyebut jumlah test.
