---
name: always use /shadcn skill for shadcn work
description: Never run shadcn CLI commands directly via Bash - always invoke the `shadcn` skill via the Skill tool
type: feedback
originSessionId: 630c3ac1-31e6-4b00-942d-a2624ea063e0
---

For any shadcn-related work (adding components, composing UI, theming, debugging, registry questions, scaffolding layouts), **invoke the `shadcn` skill via the Skill tool**. Do not run `shadcn`, `bunx shadcn`, or `npx shadcn` directly through Bash.

If the skill fails on a first attempt (e.g., monorepo detection issues), re-invoke it with more explicit context (workspace path, the `-c` flag the CLI suggests, etc.) rather than working around it manually. The skill exists to keep shadcn work consistent and compatible with the current registry/CLI behavior.

**Why**: the user has installed and customized the shadcn skill specifically to drive component additions and UI composition. Direct CLI invocations bypass that workflow and produce inconsistent results.

**How to apply**:

- Trigger: user mentions shadcn, asks for a component, or work clearly involves the shadcn registry/CLI.
- Action: call `Skill` with `skill: "shadcn"`. In monorepo contexts, tell the skill explicitly which workspace path (e.g., `apps/desktop`) it should target so it passes `-c <path>` to the underlying CLI.
- Acceptable manual usage: only when the user explicitly says to bypass the skill, or the skill is genuinely unavailable.
