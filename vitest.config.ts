import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Node: these tests read the theme's CSS and the fixture's built output off
    // disk. There is no DOM to render — the assertions are about what shipped.
    environment: "node",
    globals: true,
  },
});
