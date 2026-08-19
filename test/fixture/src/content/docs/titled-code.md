---
title: Titled code block
description: >
  The regression case. Expressive-code emits its own `.header` element for a code
  block with a title, which is what collided with the theme's page-header
  `view-transition-name` and aborted every page transition.
---

A code block *with a title*, which is the case that broke:

```ts title="example.ts"
export const value = 1;
```

And one without a title, for contrast:

```ts
export const other = 2;
```
