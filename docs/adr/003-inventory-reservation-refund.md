# ADR-003: Inventory reservation / refund design

**Tanggal:** 2026-10-25 · **Status:** Accepted

## Konteks
Stok dibagi dua channel (online checkout + POS offline). Tanpa desain khusus, dua
customer bisa meng-checkout unit terakhir bersamaan (oversell), dan refund
mengembalikan stok yang tidak konsisten. Dibutuhkan keputusan: kapan stok
"dikurangkan", dan bagaimana operasi konkuren tetap benar.

## Opsi yang dipertimbangkan
1. **Reserve → confirm (dipilih):** checkout menahan stok (`reservedQty`), confirm
   saat payment VERIFIED, release saat cancel; POS langsung deduct.
2. Deduct langsung saat checkout — ditolak (order dibatalkan berarti stoknya harus
   dikembalikan — mudah bocor dan sulit direkonsiliasi).
3. Row-level lock (`SELECT ... FOR UPDATE`) — dipilih sebagai komponen, bukan strategi.

## Keputusan
- `core/services/inventory.service.ts` satu pintu untuk semua mutasi stok:
  - `reserveStock`: guard atomik via **optimistic locking** — update kolom `version`
    dengan `WHERE version = <dibaca>`; lari paralel yang update 0 baris = conflict →
    `ConcurrentUpdateError` (HTTP 409), stok kurang → `InsufficientStockError` (400).
    Dibuktikan test `__tests__/oversell-race.test.ts`: 2 checkout paralel stok=1 →
    tepat 1 sukses, stok tidak minus.
  - `confirmReservation` (payment VERIFIED), `releaseReservation` (cancel/refund
    gagal bayar), `deductStock` (POS), `restoreStock` (refund) — semuanya menulis
    `InventoryMovement` (audit trail dengan balanceBefore/After).
- Reservation TTL 30 menit: order PENDING tidak menahan stok selamanya.

## Konsekuensi
- ✅ Invariant stok dijaga satu DB transaction Postgres (sesuai ADR-001: monolith).
- ✅ Setiap perubahan stok punya jejak movement → bisa direkonsiliasi.
- ❌ Optimistic lock butuh retry di sisi client (409) — sudah ditangani controller.
- ❌ Kolom `version` wajib dijaga: update manual rawan melewati guard.
- **Tinjau ulang saat:** throughput checkout tinggi (conflict rate > ~10%) —
  maka pertimbangkan atomic SQL conditional update atau `SKIP LOCKED` queue.

## Alternatif ditolak & alasannya
- Deduct langsung di checkout: kalah batal → restock manual, sumber oversell.
- Distributed lock (Redis): dependency tambahan tanpa kebutuhan skala saat ini.
