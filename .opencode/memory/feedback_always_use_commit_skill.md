---
name: always invoke /commit skill when committing
description: Never run `git commit` directly - always invoke the `commit` skill via the Skill tool when the user asks to commit
originSessionId: 630c3ac1-31e6-4b00-942d-a2624ea063e0
---

## type: feedback

When the user asks to commit (or approves a commit), **always invoke the `commit` skill** via the Skill tool. Do not run `git commit` directly through Bash.

The `commit` skill produces **granular, detailed commits with single-line messages**. This means: split related-but-distinct work into separate commits rather than bundling everything into one omnibus commit. The skill itself handles the message style and granularity.

**Why**: the user maintains a custom commit workflow encoded in the skill (granular splits, single-line messages, likely co-author trailer handling). Manual `git commit` invocations bypass that workflow and produce commits in the wrong shape.

**How to apply**:

- Trigger: user says "commit", "yes commit", "commit this", or otherwise approves committing.
- Action: call `Skill` with `skill: "commit"`. Pass any context as `args` if relevant.
- Do not pre-stage with `git add` and then call `git commit` - let the skill drive staging and message authoring.
- Bare `git commit` is acceptable only when the skill is unavailable or the user explicitly requests manual control.
