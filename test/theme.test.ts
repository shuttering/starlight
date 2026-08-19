// Drift guard — do not remove.
//
// `view-transition-name` must be unique per document. If two elements resolve the
// same name, the browser aborts the ENTIRE view transition — not just that group —
// so a single over-broad selector silently kills the theme's headline feature.
//
// That is exactly what shipped in 0.2.0: `.header { view-transition-name: sh-header }`
// was unscoped, and expressive-code emits its own `.header` for any code block with a
// title. Every docs page containing a titled code block lost all page transitions, and
// nothing detected it because the theme had no build and no tests.
//
// These assertions run against the BUILT fixture, not the source, because the
// collision only exists once Starlight and expressive-code have emitted their markup.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, it } from "vitest";

const themeCss = readFileSync(fileURLToPath(new URL("../src/theme.css", import.meta.url)), "utf8");

// Every built route. The collision is not confined to the page with a code block —
// Starlight nests a `.header` inside its own site header, so a bare `.header` selector
// claims the name twice on a page with no code block at all.
const PAGES = ["index.html", "404.html", "titled-code/index.html"] as const;
const pagePath = (p: string) => fileURLToPath(new URL(`./fixture/dist/${p}`, import.meta.url));
const docFor = (p: string) => new JSDOM(readFileSync(pagePath(p), "utf8")).window.document;
const builtPage = pagePath("titled-code/index.html");

/** Every `view-transition-name` declaration in the theme, with the selector that owns it. */
const transitionRules = (): { selector: string; name: string }[] => {
  const out: { selector: string; name: string }[] = [];
  // Selector list, then a block containing `view-transition-name: <name>`.
  const re = /([^{}]+)\{([^{}]*view-transition-name\s*:\s*([\w-]+)[^{}]*)\}/g;
  for (const m of themeCss.matchAll(re)) {
    const selector = (m[1] ?? "").trim().split("\n").pop()?.trim() ?? "";
    out.push({ selector, name: m[3] ?? "" });
  }
  return out;
};

describe("view-transition-name", () => {
  let doc: Document;

  beforeAll(() => {
    doc = new JSDOM(readFileSync(builtPage, "utf8")).window.document;
  });

  it("the fixture built and rendered the collision case", () => {
    // Anchor. Without this an empty/failed build would let every assertion below
    // pass vacuously — the same class of bug this file exists to catch.
    expect(doc.querySelectorAll("*").length).toBeGreaterThan(50);
    expect(doc.querySelectorAll(".expressive-code").length).toBeGreaterThan(0);
  });

  it("expressive-code still emits its own .header (why these selectors must be scoped)", () => {
    // If this ever fails, Starlight/expressive-code changed their markup and the
    // scoping below can be revisited — but do not loosen it on a hunch.
    expect(doc.querySelectorAll(".expressive-code .header").length).toBeGreaterThan(0);
  });

  it("declares at least one transition group", () => {
    expect(transitionRules().length).toBeGreaterThan(0);
  });

  // The invariant is that a transition name is never claimed twice. Two elements
  // resolving one name aborts every transition on the page, not just that group. Zero
  // is benign — the group simply does not apply, which is the case for the sidebar on
  // a page that has none.
  it.each(PAGES)("no transition name is claimed twice on %s", (page) => {
    const d = docFor(page);
    for (const { selector, name } of transitionRules()) {
      expect({ [name]: d.querySelectorAll(selector).length }).toEqual({
        [name]: expect.any(Number),
      });
      expect(d.querySelectorAll(selector).length).toBeLessThanOrEqual(1);
    }
  });

  it("every declared group resolves on the page that carries it", () => {
    // Anchor: a selector that matches nothing anywhere is dead, and the cap above
    // would pass it vacuously.
    for (const { selector, name } of transitionRules()) {
      const total = PAGES.reduce((n, p) => n + docFor(p).querySelectorAll(selector).length, 0);
      expect({ [name]: total }).not.toEqual({ [name]: 0 });
    }
  });

  it("assigns each transition name only once", () => {
    const names = transitionRules().map((r) => r.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
