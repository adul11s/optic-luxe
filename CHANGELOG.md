# Changelog

## [1.0.0] — 2026-10-28

First tagged release of Optic Luxe, a full-stack optical commerce project.

### Product
- Storefront, product catalogue and checkout.
- **AR virtual try-on** built on Three.js with MediaPipe face landmarks.
- POS and real-time inventory for the in-store side of the business.

### Security & quality
- JWT handling now fails fast on missing/invalid configuration instead of silently degrading.
- Database integration tests (44) run against a PostgreSQL service container in CI.
- Dark theme with a persisted toggle; destructive actions behind explicit confirmation dialogs.
