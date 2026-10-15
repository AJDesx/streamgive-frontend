# Theming & dark mode

There is no `tailwind.config.*` — Tailwind v4 is configured entirely from
CSS, in [`src/app/globals.css`](../src/app/globals.css). This is the
reference for the tokens that live there, the dark-mode mechanism, and how
to extend either.

## Color tokens

The app has not defined any custom tokens (no `@theme` block in
`globals.css` yet) — every color in the codebase is one of Tailwind's
built-in palette utilities (`gray-*`, `green-*`, `red-*`, `black`, `white`,
`teal-*` for focus rings). There is no `--color-brand` or similar custom
property to look up; styling a component means picking directly from
Tailwind's default palette.

The conventions components follow, pairing a light-mode class with its
dark-mode counterpart:

| Purpose | Light | Dark |
| --- | --- | --- |
| Page background / text | `bg-white` / `text-gray-900` | `dark:bg-gray-950` / `dark:text-gray-100` |
| Secondary text | `text-gray-600` or `text-gray-500` | `dark:text-gray-400` |
| Borders / dividers | `border-gray-200` or `border-gray-300` | `dark:border-gray-800` or `dark:border-gray-700` |
| Primary button (inverts) | `bg-black text-white` | `dark:bg-white dark:text-black` |
| Secondary button hover | `hover:bg-gray-50` or `hover:bg-gray-100` | `dark:hover:bg-gray-800` |
| Error text | `text-red-600` | `dark:text-red-400` |
| Verified / success badge | `bg-green-100 text-green-800` | `dark:bg-green-900 dark:text-green-300` |
| Focus ring | `focus-visible:ring-teal-600` | `dark:focus-visible:ring-teal-400` |

Toast backgrounds (`ToastProvider.tsx`) are a deliberate exception: they're
solid, floating boxes with white text, so a single shade (chosen for
contrast — see the comment above `TOAST_STYLES`) works against either
theme without a `dark:` override.

## Dark-mode strategy

Dark mode is **class-based**, not purely `prefers-color-scheme`:

```css
/* globals.css */
@custom-variant dark (&:where(.dark, .dark *));
```

This repoints every `dark:` utility at a `.dark` class on `<html>` instead
of Tailwind's default media-query variant, so the user's explicit choice
(via `ThemeToggle`) can override the OS setting.

- **`src/lib/theme.ts`** holds the `Theme` type, the `localStorage` key, and
  `THEME_INIT_SCRIPT` — a plain string run as an inline `<script>` in
  `<head>` (see `src/app/layout.tsx`) *before* hydration. It reads the
  stored preference (falling back to `matchMedia('(prefers-color-scheme:
  dark)')`) and adds `dark` or `light` to `<html>` immediately, so the page
  never flashes the wrong theme on load.
- **`ThemeToggle.tsx`** (in the header) reads the already-applied class via
  `getAppliedTheme()` and flips it with `applyTheme()`, which toggles the
  `dark`/`light` classes and persists the choice to `localStorage`.
- **`color-scheme`** is set on `<html>` to match — `light dark` by default
  (follow the system, so native form controls/scrollbars agree with
  Tailwind before a choice is made), then pinned to `dark` or `light` once
  `.dark`/`.light` is applied — so native widgets never disagree with the
  toggle.

## Adding a new token

There's no existing `@theme` block to extend — add one directly in
`globals.css`:

```css
@theme {
  --color-brand: oklch(0.6 0.15 200);
}
```

That generates `bg-brand`, `text-brand`, `border-brand`, etc. automatically
— no other file needs updating. Only add a token once a color is reused
across unrelated components; a one-off still belongs as a plain Tailwind
utility.

## Adding a new component style

1. Reach for an existing Tailwind utility (from the table above) before
   introducing a new shade — consistency with the rest of the app matters
   more than a pixel-perfect match to a design file.
2. Every `dark:` utility needs its light-mode counterpart alongside it on
   the same element (see the table above for the standard pairs) — there
   is no default fallback.
3. Check contrast in both themes before committing, especially for
   anything that isn't a simple text/background pair (badges, toasts) —
   the `.dark`/`.light` classes are on `document.documentElement`, so
   toggling `<html class="dark">` in devtools previews either theme
   without needing `prefers-color-scheme` emulation.
