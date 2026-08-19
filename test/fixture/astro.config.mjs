// Fixture site — the gate for this theme.
//
// It is a real Astro + Starlight build consuming the theme exactly as a consumer
// does (customCss, the Head override, the ThemeSelect component). Building it in CI
// is what catches a broken selector or a Starlight internals change before a
// consumer's docs site does. The theme restyles Starlight-internal class names, so
// the peer range alone cannot protect it — only a build can.
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  // Keep the build hermetic and quiet — no sitemap, no telemetry-shaped output.
  integrations: [
    starlight({
      title: "fixture",
      // Self-reference by package name: the same specifiers a consumer writes.
      customCss: [
        "@shuttering/starlight",
        "@shuttering/starlight/grounds/paper.css",
        "@shuttering/starlight/palettes/beam.css",
      ],
      components: {
        Head: "@shuttering/starlight/Head.astro",
      },
      pagefind: false,
    }),
  ],
});
