# Quality Scorecard

Skor jujur dipondasi bukti yang bisa diverifikasi — bukan target.

| Dimensi | Bobot | Skor | Bukti |
|---|---|---|---|
| Narasi masalah | 10% | 9 | README#problem — optik multi-channel, masalah oversell & sinkron stok POS/online |
| Demo & reproduksibilitas | 15% | 7 | `docker-compose.yml` db+server+client, `docs/notes/DEMO.md`; video & GIF try-on masih TODO |
| Kebenaran & test | 20% | 10 | 57/57 test (unit + integration DB asli di CI), termasuk test oversell race 2 checkout paralel stok=1 → tepat 1 sukses; CI run [40163313350](https://github.com/adul11s/optic-luxe/actions/runs/40163313350) hijau |
| Arsitektur & keputusan | 15% | 9 | `docs/adr/` (3 ADR: monolith modular, JWT fail-fast, inventory reservation/refund), diagram struktur di README |
| Keamanan | 10% | 8 | `docs/threat-model.md` (oversell race diakui + kini dites), role matrix tests, rate limit login, audit log; secret hygiene: JWT fail-fast tanpa fallback |
| Operasional | 10% | 7 | Structured logs (pino, request id), healthcheck docker; belum ada metrics endpoint/alert/runbook |
| Kerapian kode | 10% | 9 | Strict TS, `tsc --noEmit` 0 error; tanpa dead code |
| Presentasi | 10% | 6 | README above the fold ada; video 90 detik & GIF belum dibuat (butuh user) |

**Total:** 8.1 (weighted)
**Target berikutnya:** video GIF try-on (demo & presentasi), metrics endpoint + alert (operasional).
**Tanggal review:** 2026-10-25

Sumber angka: satu sumber kebenaran adalah output `npm test` + run CI terbaru (57/57). Jangan memperbarui README dari memori — jalankan test dulu, lalu sebar angka yang sama ke semua tempat yang menyebut jumlah test.
