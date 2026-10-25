# ADR-002: JWT fail-fast & role matrix

**Tanggal:** 2026-10-25 · **Status:** Accepted

## Konteks
Auth awal memakai fallback secret bawaan (`JWT_SECRET ?? 'dev-secret'`) — aplikasi
jalan mulus di dev tapi bisa diam-diam ter-deploy dengan secret yang mudah ditebak.
Ada juga 6 role (ADMIN, STAFF: kasir/warehouse/supervisor/delivery, CUSTOMER) yang
awalnya diverifikasi ad hoc di tiap controller — mudah bocor satu endpoint.

## Opsi yang dipertimbangkan
1. **Fail-fast (dipilih):** tanpa `JWT_SECRET` env → process menolak start.
2. Fallback secret hanya untuk dev — ditolak (masih menyisakan jalur deploy yang lemah).
3. Session server-side di DB — ditolak.

## Keputusan
- `core/utils/jwt.ts` **tanpa fallback secret** (per plan-portfolio gate): boot gagal
  jelas jika `JWT_SECRET` kosong.
- Otorisasi terpusat di `middleware/role.ts`: satu matriks role × modifier → endpoint
  (ADMIN > STAFF sub-role > CUSTOMER), dites di `__tests__/role.test.ts`.
- JWT expiry 7 hari: trade-off UX retail sehari penuh shift vs jendela pencurian token.

## Konsekuensi
- ✅ Tidak ada deployment dengan secret default; bug konfigurasi terlihat saat
  startup, bukan sebagai insiden di pertengahan hari.
- ✅ Pengecekan role satu file: endpoint baru tidak bisa lewat review tanpa matriks.
- ❌ Secret terleak berarti rotasi + semua user re-login (JWT stateless.
  Mitigasi: expiry 7d + rotasi secret sebagai tombol "revoke semua").
- **Tinjau ulang saat:** butuh SSO/multi-tenant atau refresh-token rotation.

## Alternatif ditolak & alasannya
- Fallback secret dev: pola klasik insiden "ter-deploy dengan dev secret".
- Session store DB: menambah latensi/ops untuk basis pengguna kecil; JWT stateless
  cukup, termasuk untuk POS yang kadang lewat jaringan tidak stabil.
