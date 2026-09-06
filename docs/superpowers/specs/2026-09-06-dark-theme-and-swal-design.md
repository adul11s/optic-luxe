# Dark Theme with Toggle + SweetAlert Integration — Design

Date: 2026-09-06
Status: Approved (2026-09-06)

## 1. Problem

The Optic Luxe client (Next.js 15, Tailwind 3.4, React 19) is light-only. Hardcoded
light-theme utilities (`bg-white`, `text-brand-950`, `border-brand-100`, …) appear
across 37 files. The user wants the black theme from `presentation.html` applied to
the **whole site** (customer pages + dashboard), switchable via a toggle, defaulting
to dark.

Additionally, all 15 dashboard mutations currently have **no error handling**
(`onError` is never used) — failures fail silently. The user wants SweetAlert-style
error popups and confirmation dialogs before every create, edit, and delete action.

## 2. Approach

### 2.1 Dark theme via CSS-variable palette flip

Instead of adding `dark:` variants to every element, remap the `brand` color scale
itself per theme. The site already uses `brand-*` tokens everywhere, so flipping the
scale flips the whole site with minimal churn.

**tailwind.config.js:**
- `darkMode: "class"`
- `brand` colors become `rgb(var(--brand-50) / <alpha-value>)` … `rgb(var(--brand-950) / <alpha-value>)`
- `accent.gold` stays static (brand identity)

**globals.css:**
- `:root` — light RGB triplets (current hex values: `--brand-50: 250 249 247`, … `--brand-950: 40 36 32`)
- `.dark` — presentation.html-inspired triplets:

| Token | Light (today) | Dark |
|---|---|---|
| brand-50 (page bg) | `#faf9f7` | `#0f1117` |
| brand-100 (card surface) | `#f5f3ef` | `#181b24` |
| brand-200 (borders) | `#e8e4dd` | `#1e2231` |
| brand-300 (stronger border / hover) | `#d4cdc2` | `#252a3a` |
| brand-400 (icon / placeholder) | `#b8af9e` | `#565c6e` |
| brand-500 (muted text) | `#9a8e79` | `#6b7185` |
| brand-600 (body text) | `#857868` | `#9aa0b4` |
| brand-700 (strong text) | `#6d6356` | `#a9aebd` |
| brand-800 | `#5a5147` | `#c3c7d3` |
| brand-900 | `#4a4339` | `#d5d8e0` |
| brand-950 (primary text) | `#282420` | `#e8eaed` |

The ramp stays monotonic in both themes (400 < 500 < 600 < … < 950 in contrast), so
icons/placeholders (`brand-400`), muted text (`brand-500`), body text (`brand-600`)
and headings (`brand-950`) remain legible in dark mode.

Because the scale inverts, headings (`text-brand-950`), body text (`text-brand-600`),
page backgrounds (`bg-brand-50`), surfaces (`bg-brand-100`), and borders flip
automatically. Primary buttons (`bg-brand-950 text-brand-50`) invert into light-on-dark
buttons — still readable, consistent emphasis.

**Surface swaps (shared UI components):** replace `bg-white` with `bg-brand-100` in
`card.tsx`, `input.tsx`, `select.tsx`, `table.tsx`, `modal.tsx`, `button.tsx`,
`badge.tsx`, `pagination.tsx`, `stat-card.tsx`, `skeleton.tsx`. Remaining `bg-white`
occurrences in page files fixed during implementation (audit with `rg`).

**Accent:** gold (`#c9a962`) is kept in both themes; on dark it reads well as-is.

### 2.2 Theme provider + toggle

- **`client/src/lib/theme-provider.tsx`** — React context; applies/removes `dark`
  class on `document.documentElement`; persists choice in `localStorage`
  (`optic-luxe-theme`); **defaults to dark**; no flash of light theme (inline script
  in `layout.tsx` head that reads localStorage before hydration).
- **`providers.tsx`** — wrap app in `ThemeProvider`.
- **Toggle buttons** (Sun/Moon icons from lucide):
  - `client/src/app/(main)/layout.tsx` header (desktop + mobile menu)
  - `client/src/app/(dashboard)/layout.tsx` sidebar
- Toggle updates state, persists, flips the class.

### 2.3 SweetAlert integration

- **Add `sweetalert2`** dependency; import its CSS once in `globals.css`.
- **`client/src/lib/swal.ts`** — themed helpers (colors from CSS variables so they
  follow the active theme):
  - `swalError(message)` — error popup (red accent)
  - `swalConfirm({ title, text, danger })` — confirmation dialog; resolves `true`
    when confirmed (danger styling for deletes)
  - `swalSuccess(message)` — success toast
- **Wire all 15 dashboard mutations** (products, users, categories, inventory,
  warehouse, orders status update, settings, POS sale, …):
  - Before action: `swalConfirm`
  - On success: `swalSuccess` toast
  - On error: `swalError(err.message)` — extract message from axios error
  - No `onError` handlers exist today; add them to every `useMutation`.

## 3. Files touched

| File | Change |
|---|---|
| `client/tailwind.config.js` | `darkMode`, CSS-var brand colors |
| `client/src/app/globals.css` | `:root`/`.dark` triplets, swal CSS import, theme-tinted swal styles |
| `client/src/lib/theme-provider.tsx` | **new** — context + persistence |
| `client/src/app/providers.tsx` | wrap in ThemeProvider |
| `client/src/app/layout.tsx` | pre-hydration inline theme script |
| `client/src/app/(main)/layout.tsx` | toggle button (header + mobile menu) |
| `client/src/app/(dashboard)/layout.tsx` | toggle button (sidebar) |
| `client/src/lib/swal.ts` | **new** — themed helpers |
| `client/src/components/ui/*` | `bg-white` → `bg-brand-100` (card, input, select, table, modal, button, badge, pagination, stat-card, skeleton) |
| Dashboard pages (15 mutation sites) | confirm-before-action + error popup + success toast |
| `client/package.json` | `sweetalert2` |

## 4. Edge cases

- **No-flash on load:** inline script in `<head>` sets `dark` class before first paint.
- **Inputs/selects in dark:** `bg-white` removed from their base classes; text/placeholder
  colors come from flipped tokens.
- **Focus rings:** `focus:ring-brand-950/10` and borders follow flipped tokens.
- **Images with light backgrounds:** product images render inside white-ish cards in
  light theme; in dark mode cards go dark — acceptable, images keep their own bg.
- **SweetAlert in dark mode:** swal container styled with CSS variables; confirm
  button uses gold accent; danger uses red.
- **Confirmation on create/edit:** dialogs say `Yes, save` / `Cancel` (danger wording
  only for deletes).

## 5. Verification

- `npx tsc --noEmit` (client) — clean
- `npm run build` (client) — passes
- Manual: toggle on main site + dashboard; check home, shop, product, cart, checkout,
  orders, products, users, POS, settings in both themes
- Manual: create/edit/delete each with confirm → success toast; trigger a server error
  (e.g. duplicate email) → error popup
- `rg` audit: no stray `bg-white` on themed surfaces