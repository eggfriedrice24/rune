---
name: write semantic HTML, don't double-wrap shadcn components
description: Many shadcn primitives already render semantic elements - never wrap them in the same element again
type: feedback
originSessionId: 630c3ac1-31e6-4b00-942d-a2624ea063e0
---

When using a shadcn primitive, **check what HTML element it renders before wrapping it**. Many shadcn components are typed as `React.ComponentProps<"main">`, `"nav">`, `"aside">`, `"section">`, etc. and render that element directly. Putting a `<main>` (or `<nav>`, `<aside>`, etc.) inside such a component creates invalid, double-wrapped semantic HTML.

Concrete examples to remember:

- `SidebarInset` renders `<main>`. Put content directly inside it; do not wrap with another `<main>`.
- `Sidebar` renders an `<aside>`-equivalent surface - don't add an `<aside>` wrapper.
- `NavigationMenu` already provides nav semantics.

**Why**: nested landmark elements (two `<main>`, two `<nav>`, etc.) are invalid HTML, hurt screen-reader navigation, and trigger lint/a11y warnings. The shadcn type signature `React.ComponentProps<"main">` is the canonical signal of what the component renders.

**How to apply**:

- Before adding `<main>`, `<nav>`, `<aside>`, `<header>`, `<footer>`, `<section>`, `<article>` around or inside a shadcn component, check its definition: `grep "function ComponentName" path/to/component.tsx` and look at the `React.ComponentProps<"...">` type.
- Pass layout/spacing classes via `className` on the shadcn component itself instead of a nested wrapper element.
- This rule applies to user-authored components too: don't double-wrap landmarks.
