# ADR-001: Monolith modular vs microservices

**Tanggal:** 2026-10-25 · **Status:** Accepted

## Konteks
Optic-luxe adalah toko kacamata kecil-menengah: satu tim pengembang, traffic rendah,
tapi butuh konsistensi stok lintas channel (online checkout + POS offline).
Pertanyaannya: bangun microservices per domain, atau satu Express app modular?

## Opsi yang dipertimbangkan
1. **Monolith modular (dipilih)** — satu Express process dengan `src/modules/<domain>/`
  (order, pos, refund, warehouse, …) plus `src/core/services/inventory.service.ts`
   sebagai kontrak antar-modul.
2. Microservices (order-svc, inventory-svc, pos-svc) — ditolak.
3. Serverless/Next.js fullstack — ditolak.

## Keputusan
Monolith modular. Alasan: stok adalah invariant lintas domain; memecahnya antar service
memaksa distributed transaction yang justru menambah peluang oversell. Operasi tunggal
tim pengembang kecil tidak menjustifikasi overhead infrastruktur (antrean, service mesh),
dan portfolio ini perlu bisa di-clone & dijalankan dalam satu `docker compose up`.

## Konsekuensi
- ✅ Satu DB transaction Postgres cukup untuk menjaga invariant stok (lihat ADR-003).
- ✅ Refactor path tersedia: modul sudah terpisah batasnya, bisa diekstrak nanti.
- ❌ Skala homogeneous: satu titik deploy/hotspot untuk semua modul.
- ❌ Deploy kecil pun merilis semuanya.
- **Tinjau ulang saat:** traffic POS + online melebihi satu App server, atau tim > 5 dev.

## Alternatif ditolak & alasannya
- Microservices: biaya konsistensi (saga/outbox) > keuntungan, tanpa load yang membutuhkannya.
- Serverless: cold start mengganggu alur POS; Prisma + long-lived pool lebih cocok pada Node server.
