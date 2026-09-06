# Dark Theme with Toggle + SweetAlert Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a switchable dark (black) theme across the whole Optic Luxe site (defaulting to dark) plus SweetAlert error popups and confirm-before-action dialogs for all dashboard mutations.

**Architecture:** Flip the `brand-*` Tailwind color scale per theme via CSS variables (`rgb(var(--brand-N) / <alpha-value>)`), toggled by a `dark` class on `<html>`. A `ThemeProvider` context persists the choice in localStorage with a pre-hydration inline script to prevent flash. SweetAlert2 is wrapped in themed helpers (`swal.ts`) and wired into every `useMutation` in the dashboard.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 3.4 (`darkMode: "class"`), sweetalert2, lucide-react (already installed), React Query v5.

**Spec:** `docs/superpowers/specs/2026-09-06-dark-theme-and-swal-design.md`

## Global Constraints

- `darkMode: "class"` in tailwind.config.js — never `"media"`.
- Brand colors defined as `rgb(var(--brand-N) / <alpha-value>)` — never hardcoded hex in component classes.
- Light RGB triplets MUST stay identical to the current hex palette (see Task 1 table).
- Dark triplets MUST match the spec table exactly (monotonic contrast ramp).
- `bg-white` on themed surfaces → `bg-brand-100` (never `dark:bg-*` for surfaces; the flip handles it).
- SweetAlert must import its CSS once in `globals.css` — never per-component.
- All dashboard `useMutation` call sites get: confirm-before-action → success toast → error popup. No mutation left unwired.
- Accent gold stays static in both themes.
- Theme defaults to **dark** on first visit.

---

### Task 1: CSS-variable color scale + dark class strategy

**Files:**
- Modify: `client/tailwind.config.js`
- Modify: `client/src/app/globals.css`

**Interfaces:**
- Produces: `.dark` class on `<html>` toggles the whole palette; `bg-brand-N`, `text-brand-N`, `border-brand-N` etc. resolve per theme.

- [ ] **Step 1: Update tailwind.config.js**

Replace the `colors.brand` block with CSS-variable references and add `darkMode: "class"`:

```js
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "rgb(var(--brand-50) / <alpha-value>)",
          100: "rgb(var(--brand-100) / <alpha-value>)",
          200: "rgb(var(--brand-200) / <alpha-value>)",
          300: "rgb(var(--brand-300) / <alpha-value>)",
          400: "rgb(var(--brand-400) / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
          700: "rgb(var(--brand-700) / <alpha-value>)",
          800: "rgb(var(--brand-800) / <alpha-value>)",
          900: "rgb(var(--brand-900) / <alpha-value>)",
          950: "rgb(var(--brand-950) / <alpha-value>)",
        },
        accent: {
          gold: "#c9a962",
          "gold-light": "#e5d4a1",
          "gold-dark": "#a08840",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Add theme triplets to globals.css**

Append inside `@layer base` (after the existing `:root` block):

```css
:root {
  --brand-50: 250 249 247;
  --brand-100: 245 243 239;
  --brand-200: 232 228 221;
  --brand-300: 212 205 194;
  --brand-400: 184 175 158;
  --brand-500: 154 142 121;
  --brand-600: 133 120 104;
  --brand-700: 109 99 86;
  --brand-800: 90 81 71;
  --brand-900: 74 67 57;
  --brand-950: 40 36 32;
}

.dark {
  --brand-50: 15 17 23;
  --brand-100: 24 27 36;
  --brand-200: 30 34 49;
  --brand-300: 37 42 58;
  --brand-400: 86 92 110;
  --brand-500: 107 113 133;
  --brand-600: 154 160 180;
  --brand-700: 169 174 189;
  --brand-800: 195 199 211;
  --brand-900: 213 216 224;
  --brand-950: 232 234 237;
}
```

- [ ] **Step 3: Verify build**

Run: `cd client && npx tsc --noEmit 2>&1 | grep -v "pos/page.tsx"`
Expected: no output (pre-existing pos/page.tsx errors excluded).

Run: `cd client && npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add client/tailwind.config.js client/src/app/globals.css
git commit -m "feat: CSS-variable brand palette with dark class strategy"
```

---

### Task 2: Swap themed surfaces from bg-white to bg-brand-100

**Files:**
- Modify: `client/src/components/ui/card.tsx:24`
- Modify: `client/src/components/ui/input.tsx:39`
- Modify: `client/src/components/ui/select.tsx:43`
- Modify: `client/src/components/ui/textarea.tsx:30`
- Modify: `client/src/components/ui/skeleton.tsx:22,35`
- Modify: `client/src/components/ui/table.tsx:32,69,76`
- Modify: `client/src/components/ui/stat-card.tsx:23`
- Modify: `client/src/components/ui/modal.tsx:42`
- Modify: `client/src/app/(main)/layout.tsx:25,102`
- Modify: `client/src/app/(dashboard)/layout.tsx:151,187,214,270`
- Modify: `client/src/app/(dashboard)/dashboard/pos/page.tsx:173`
- Modify: `client/src/app/(dashboard)/dashboard/warehouse/page.tsx:169`

**Interfaces:**
- Consumes: flipped `brand-*` tokens from Task 1.
- Produces: all light surfaces follow the theme.

- [ ] **Step 1: Replace bg-white in UI components**

In each file, replace `bg-white` with `bg-brand-100` on themed surfaces (keep alpha modifiers where present, e.g. `bg-white/80` → `bg-brand-100/80`):

- `card.tsx` line 24: `bg-white` → `bg-brand-100`
- `input.tsx` line 39: `bg-white` → `bg-brand-100`
- `select.tsx` line 43: `bg-white` → `bg-brand-100`
- `textarea.tsx` line 30: `bg-white` → `bg-brand-100`
- `skeleton.tsx` lines 22, 35: `bg-white` → `bg-brand-100`
- `table.tsx` lines 32, 69, 76: `bg-white` → `bg-brand-100`
- `stat-card.tsx` line 23: `bg-white` → `bg-brand-100`
- `modal.tsx` line 42: `bg-white` → `bg-brand-100`

Do NOT touch `bg-brand-950` buttons or `text-white` on dark surfaces.

- [ ] **Step 2: Replace bg-white in layouts and pages**

- `(main)/layout.tsx` line 25: `bg-white/80` → `bg-brand-100/80` (sticky header)
- `(main)/layout.tsx` line 102: `bg-white` → `bg-brand-100` (mobile menu)
- `(dashboard)/layout.tsx` line 151: `bg-white` → `bg-brand-100` (sidebar)
- `(dashboard)/layout.tsx` line 270: `bg-white/80` → `bg-brand-100/80` (header)
- `(dashboard)/layout.tsx` lines 187, 214: `bg-white` → `bg-brand-100` (search dropdowns)
- `pos/page.tsx` line 173: `bg-white` → `bg-brand-100` (search dropdown)
- `warehouse/page.tsx` line 169: `bg-white` → `bg-brand-100` (alert card)

- [ ] **Step 3: Audit for strays**

Run: `rg -n "bg-white" client/src/components/ui client/src/app --glob '*.tsx'`
Expected: only intentional `bg-white` on non-theme surfaces (e.g. product image areas inside cards) — if any themed surfaces remain, fix them.

- [ ] **Step 4: Verify + commit**

Run: `cd client && npx tsc --noEmit 2>&1 | grep -v "pos/page.tsx"` — no output.
Run: `cd client && npm run build` — succeeds.

```bash
git add client/src/components/ui client/src/app
git commit -m "feat: theme surfaces via brand-100 instead of bg-white"
```

---

### Task 3: ThemeProvider + no-flash script

**Files:**
- Create: `client/src/lib/theme-provider.tsx`
- Modify: `client/src/app/layout.tsx`
- Modify: `client/src/app/providers.tsx`

**Interfaces:**
- Produces: `useTheme()` hook returning `{ theme: "dark" | "light", toggle: () => void }`; exported `ThemeProvider` component.

- [ ] **Step 1: Create theme-provider.tsx**

```tsx
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
});

const STORAGE_KEY = "optic-luxe-theme";

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

- [ ] **Step 2: Add no-flash inline script to root layout**

In `client/src/app/layout.tsx`, add to the `<head>` (before the font preconnects):

```tsx
<head>
  <script
    dangerouslySetInnerHTML={{
      __html: `(function(){try{var t=localStorage.getItem("optic-luxe-theme");var dark=t!=="light";if(dark)document.documentElement.classList.add("dark");}catch(e){document.documentElement.classList.add("dark");}})();`,
    }}
  />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  ...
</head>
```

- [ ] **Step 3: Wrap providers**

In `client/src/app/providers.tsx`, wrap the existing tree:

```tsx
import { ThemeProvider } from "@/lib/theme-provider";
...
return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);
```

- [ ] **Step 4: Verify + commit**

Run: `cd client && npx tsc --noEmit 2>&1 | grep -v "pos/page.tsx"` — no output.
Manual: load any page — page renders dark (default) with no light flash; `localStorage` gets `optic-luxe-theme=dark`.

```bash
git add client/src/lib/theme-provider.tsx client/src/app/layout.tsx client/src/app/providers.tsx
git commit -m "feat: ThemeProvider with localStorage persistence and no-flash script"
```

---

### Task 4: Theme toggle buttons in navbars

**Files:**
- Modify: `client/src/app/(main)/layout.tsx` (desktop icons row + mobile menu)
- Modify: `client/src/app/(dashboard)/layout.tsx` (sidebar)

**Interfaces:**
- Consumes: `useTheme()` from Task 3.

- [ ] **Step 1: Toggle in main header**

In `client/src/app/(main)/layout.tsx`:
- Add imports: `import { useTheme } from "@/lib/theme-provider";` and `Moon, Sun` to the lucide import.
- Inside the component: `const { theme, toggle } = useTheme();`
- Insert before the wishlist Link (line ~55):

```tsx
<button
  onClick={toggle}
  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
  className="p-2 text-brand-600 hover:text-brand-950 transition-colors"
>
  {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
</button>
```

- Add the same button at the top of the mobile menu (inside `container-wide py-4 space-y-2`, before the nav links):

```tsx
<button
  onClick={() => { toggle(); setIsMobileMenuOpen(false); }}
  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg"
>
  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
  {theme === "dark" ? "Light mode" : "Dark mode"}
</button>
```

- [ ] **Step 2: Toggle in dashboard sidebar**

In `client/src/app/(dashboard)/layout.tsx`:
- Add `import { useTheme } from "@/lib/theme-provider";` and `Sun, Moon` to the lucide import.
- Inside the sidebar (near the bottom, after nav links, before the sidebar closes):

```tsx
<button
  onClick={toggle}
  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-brand-600 hover:text-brand-950 transition-colors"
>
  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
  {theme === "dark" ? "Light mode" : "Dark mode"}
</button>
```

- [ ] **Step 3: Verify + commit**

Run: `cd client && npx tsc --noEmit 2>&1 | grep -v "pos/page.tsx"` — no output.
Manual: toggle on both main site and dashboard; refresh — choice persists; light and dark both render correctly.

```bash
git add "client/src/app/(main)/layout.tsx" "client/src/app/(dashboard)/layout.tsx"
git commit -m "feat: theme toggle buttons in main navbar and dashboard sidebar"
```

---

### Task 5: SweetAlert2 — package + themed helpers

**Files:**
- Modify: `client/package.json`
- Create: `client/src/lib/swal.ts`
- Modify: `client/src/app/globals.css`

**Interfaces:**
- Produces: `swalConfirm({ title, text, danger }): Promise<boolean>`, `swalError(message: string)`, `swalSuccess(message: string)` — all theme-aware via CSS variables.

- [ ] **Step 1: Install sweetalert2**

Run: `cd client && npm install sweetalert2`

- [ ] **Step 2: Create swal.ts**

```ts
"use client";

import Swal from "sweetalert2";

const base = {
  background: "rgb(var(--brand-100))",
  color: "rgb(var(--brand-950))",
  confirmButtonColor: "#c9a962",
  confirmButtonText: "OK",
  cancelButtonColor: "rgb(var(--brand-500))",
  cancelButtonText: "Cancel",
  customClass: {
    popup: "rounded-2xl",
    confirmButton: "rounded-lg font-medium",
    cancelButton: "rounded-lg font-medium",
  },
};

export async function swalConfirm({
  title,
  text,
  danger = false,
  confirmText = "Yes, save",
}: {
  title: string;
  text: string;
  danger?: boolean;
  confirmText?: string;
}): Promise<boolean> {
  const result = await Swal.fire({
    ...base,
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    confirmButtonColor: danger ? "#e17055" : "#c9a962",
    focusCancel: true,
  });
  return result.isConfirmed;
}

export function swalError(message: string) {
  return Swal.fire({
    ...base,
    icon: "error",
    title: "Something went wrong",
    text: message || "Please try again.",
    confirmButtonColor: "#e17055",
  });
}

export function swalSuccess(message: string) {
  return Swal.fire({
    ...base,
    icon: "success",
    title: "Success",
    text: message,
    timer: 2000,
    showConfirmButton: false,
  });
}
```

- [ ] **Step 3: Import SweetAlert CSS globally**

In `client/src/app/globals.css`, add at the top (after the Tailwind directives):

```css
@import "sweetalert2/dist/sweetalert2.min.css";
```

Also add dark-mode scoping so SweetAlert follows the theme:

```css
@layer components {
  .dark .swal2-popup {
    background: rgb(var(--brand-100)) !important;
    color: rgb(var(--brand-950)) !important;
  }
  .dark .swal2-title,
  .dark .swal2-html-container {
    color: rgb(var(--brand-950)) !important;
  }
}
```

- [ ] **Step 4: Verify + commit**

Run: `cd client && npx tsc --noEmit 2>&1 | grep -v "pos/page.tsx"` — no output.
Manual: temporary call `swalSuccess("test")` in any page → styled popup appears.

```bash
git add client/package.json client/package-lock.json client/src/lib/swal.ts client/src/app/globals.css
git commit -m "feat: themed SweetAlert helpers (confirm, error, success)"
```

---

### Task 6: Wire dashboard mutations — confirm, error, success

**Files:**
- Modify: `client/src/app/(dashboard)/dashboard/products/page.tsx` (deleteProduct)
- Modify: `client/src/app/(dashboard)/dashboard/users/page.tsx` (updateUser, deleteUser)
- Modify: `client/src/app/(dashboard)/dashboard/inventory/page.tsx` (updateStock)
- Modify: `client/src/app/(dashboard)/dashboard/warehouse/page.tsx` (adjustStock)
- Modify: `client/src/app/(dashboard)/dashboard/orders/page.tsx` (updateStatus)
- Modify: `client/src/app/(dashboard)/dashboard/settings/page.tsx` (saveMutation)
- Modify: `client/src/app/(dashboard)/dashboard/pos/page.tsx` (createSale)

**Interfaces:**
- Consumes: `swalConfirm`, `swalError`, `swalSuccess` from Task 5.
- Produces: every mutation confirms before firing, toasts on success, pops an error on failure.

- [ ] **Step 1: Add the import to every file**

```ts
import { swalConfirm, swalError, swalSuccess } from "@/lib/swal";
```

- [ ] **Step 2: Wrap each mutation call with confirmation**

Wrap the `mutate(...)` call sites (NOT inside `mutationFn`) with `swalConfirm`. Pattern (danger deletes):

```tsx
const ok = await swalConfirm({
  title: "Delete product?",
  text: "This action cannot be undone.",
  danger: true,
  confirmText: "Yes, delete",
});
if (!ok) return;
deleteProduct.mutate(product.id);
```

Per site:

- `products/page.tsx` — delete: danger confirm "Delete product?" / "This action cannot be undone."
- `users/page.tsx` — deleteUser: danger confirm "Delete user?" / "This action cannot be undone."
- `users/page.tsx` — updateUser (role change / edit): confirm "Save changes?" / "This will update the user account."
- `inventory/page.tsx` — updateStock: confirm "Update stock?" / `Update ${variant.name} stock to ${stockQty}?`
- `warehouse/page.tsx` — adjustStock: confirm "Adjust stock?" / "This will adjust the inventory level."
- `orders/page.tsx` — updateStatus: confirm "Update order status?" / `Set order ${orderNumber} to ${formatOrderStatus(status)}?`
- `settings/page.tsx` — saveMutation: confirm "Save settings?" / "This will update the site configuration."
- `pos/page.tsx` — createSale: confirm "Complete sale?" / "Confirm the total of {total} and complete the sale."

- [ ] **Step 3: Add onError to every useMutation**

Add `onError` to each `useMutation` config (the existing `onSuccess` stays). Pattern:

```tsx
onError: (err: any) => {
  const message = err?.response?.data?.message || err?.message || "Something went wrong";
  swalError(message);
},
```

For `updateStatus` in `orders/page.tsx` the current `onSuccess` closes the modal; keep it and add `onError` the same way.

- [ ] **Step 4: Add success toasts**

Add to each `onSuccess` (after existing logic):

```tsx
swalSuccess("Product deleted");
```

Messages: "Product deleted", "User updated", "User deleted", "Stock updated", "Stock adjusted", "Order status updated", "Settings saved", "Sale completed".

- [ ] **Step 5: Verify + commit**

Run: `cd client && npx tsc --noEmit 2>&1 | grep -v "pos/page.tsx"` — no output.
Manual (against running server):
- Delete a product → confirm dialog → success toast; cancel → nothing happens
- Duplicate-email user create attempt (or any server 400) → error popup with server message
- Role change on users page → confirm → toast
- Order status change → confirm → toast
- Both themes: popups render correctly

```bash
git add "client/src/app/(dashboard)/dashboard"
git commit -m "feat: confirm-before-action, error popups and success toasts for dashboard mutations"
```

---

## Self-Review Notes

- Spec coverage: palette flip (Task 1), surface swaps (Task 2), provider + no-flash + default dark (Task 3), toggles in both navbars (Task 4), swal package + themed helpers (Task 5), all 8 actual mutation call sites wired (Task 6). The spec's "15 mutations" count included `useMutation` imports; the plan wires every actual `mutate()` call site.
- Placeholder scan: no TBD/TODO; every step has concrete code or commands.
- Type consistency: `useTheme()` returns `{ theme: "dark" | "light", toggle: () => void }`; `swalConfirm` returns `Promise<boolean>`; `swalError`/`swalSuccess` return the Swal promise. All consumed names match Task 3/5 definitions.