# Prompt Master

A Claude Code mod that adds a "✦ Prompt Master" button to the band above
the prompt box. Click it (or press `m` while that band has focus) and it
reads whatever rough draft you've typed into the prompt box, sends it to
the model with a system prompt that rewrites it into a clearer, better
structured prompt, and replaces your draft in place with the result. It
keeps your intent and constraints as given — it only fixes grammar,
ambiguity and structure. If the box is empty it tells you instead of
calling the model.

## Install

At the prompt of a terminal session:

```
/plugin install prompt-master --marketplace mkhantkk/prompt-master
```

From a shell:

```
claude plugin install prompt-master --marketplace mkhantkk/prompt-master
```

In the desktop app: click **+** next to the prompt box, then **Plugins**,
**Add marketplace** with `mkhantkk/prompt-master`, then **Add plugin**.

Installed at the user scope, it loads in every session, including the
desktop app's Code tab.
