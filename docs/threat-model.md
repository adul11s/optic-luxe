# Threat Model — optic-luxe (portfolio depth assessment)

**Scope:** e-commerce admin/POS + AR try-on demo. Storage: Postgres (Prisma), JWT sessions.

## Assets
- Order & payment records (customer identities via checkout payloads)
- Inventory integrity (stock counts, POS vs online channel)
- Admin credentials (role: OWNER / ADMIN / STAFF)
- Activation of uploads (product images, try-on snapshots)

## Actors
- Shop staff (KASIR) — trusted for POS only
- Shop owner/admin — full API access
- Attacker (external) — anonymous user of the public storefront + try-on
- Malicious client script on client side (integrity of WASM/CDN assets is out-of-scope for demo)

## Attack paths
| Attack path | Risk | Mitigation present | Evidence |
|---|---|---|---|
| JWT secret fallback / weak signing | Forged admin token | Fail-fast on missing `JWT_SECRET` (no fallback) | `server/src/core/utils/jwt.ts` + `__tests__/jwt.test.ts` |
| Anonymous browsing of admin APIs | Data leak / inventory tamper | `requireAuth` guard + role middleware (`OWNER/ADMIN` vs `STAFF`) | `__tests__/role.test.ts` + `__tests__/integration.test.ts` (STAFF → 403, unauth → 401) |
| Inventory oversell (race) | Oversell stock negative | Checkout/reservation flow with `confirmReservation` path on inventory service; oversell race test is a TODO (single-threaded in-memory paths tested) | `__tests__/integration.test.ts` |
| Brute-force login | Account takeover | Rate limit login 5 attempts / 5 min per IP → 429 | `server/src/middleware/rateLimit.ts` + `__tests__/rate-limit.test.ts` |
| Audit trail for sensitive actions | Accountability gap | `AuditLog` rows at every sensitive action (KYC/admin CRUD/order status/refund/POS sale) | `__tests__/audit.test.ts` + `server/src/middleware/audit.ts` |
| Unvalidated request shape | Injection / crashes | Global `validation.ts` middleware (whitelisted DTO) | `__tests__/response.test.ts` guards error shape |
| Product upload / AR asset abuse | XSS via content type | Whitelist mime types at upload + try-on is client-side rendering only | `server/src/modules/product/product.controller.ts` |

## Also assumed / out of scope
- HTTPS/WAF terminates upstream (demo runs behind localhost)
- Secrets are env-only — `.env.example` documents all keys, no fallback credentials
- LLM feature (AI sales copy) only calls a stub provider; no prompt-injection surface retained

## Update cadence
Revisit when adding payments (Stripe/xendit), real KYC, or multi-tenant shops.
