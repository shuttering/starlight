// Drift guard — do not remove.
//
// This theme's grounds and palettes are a TRANSCRIPTION of `@shuttering/tokens`.
// A transcription has no operand: nothing in a standalone stylesheet can tell a
// correct hex from a transposed one, so drift is invisible by construction and
// stays that way. `@shuttering/tokens/contract.json` is the missing operand — the
// published values, diffed here against what the stylesheet actually ships.
//
// Not a snapshot. A snapshot records what the theme says; this records what the
// contract says, so an edit on either side has to be reconciled rather than
// re-blessed.
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const contract = require("@shuttering/tokens/contract.json") as Contract;

interface Contract {
  version: string;
  seams: Record<string, readonly string[]>;
  grounds: Record<string, { light: Scheme; dark: Scheme }>;
  palettes: Record<string, { light: Scheme; dark: Scheme }>;
  deprecated: Record<string, { replacedBy?: string }>;
}
type Scheme = Record<string, string>;

// Starlight's default theme is dark, so the theme writes the dark scheme on bare
// `:root` and the light scheme behind `[data-theme="light"]`. The scheme a block
// belongs to is carried by its SELECTOR — not by file order, and not by which of
// the two blocks comes first. Aligning on order instead reports every value in
// every ground as divergent, and none of them are.
//
// Keyed on the selector with its attribute quoting stripped: quote style is the
// formatter's to choose, and a reformat must not silently unmap a whole scheme.
const SCHEME_FOR: Record<string, "light" | "dark"> = {
  ":root": "dark",
  ":root[data-theme=light]": "light",
};

const schemeKey = (selector: string) => selector.replace(/["']/g, "");

// The theme names its palettes for the consumer that asked for them; the contract
// names its own. Mapped by hand because the two vocabularies are independent — a
// derived alias would silently absorb a rename on either side.
//
// `beam` is nanohype's brand blue and has no contract counterpart. It is listed
// here as `null` rather than omitted so that adding a palette without deciding
// which side owns it fails the coverage assertion below.
const PALETTE_SOURCE: Record<string, string | null> = {
  beam: null,
  indigo: "indigo",
  steel: "slate",
};

const srcDir = (kind: string) => fileURLToPath(new URL(`../src/${kind}/`, import.meta.url));
const fileNames = (kind: string) =>
  readdirSync(srcDir(kind))
    .filter((f) => f.endsWith(".css"))
    .map((f) => f.replace(/\.css$/, ""))
    .sort();

/** Every `--name: value` in one stylesheet, grouped by the scheme its selector selects. */
function parse(kind: string, name: string): Record<"light" | "dark", Scheme> {
  const css = readFileSync(`${srcDir(kind)}${name}.css`, "utf8");
  const out: Record<"light" | "dark", Scheme> = { light: {}, dark: {} };
  for (const [, rawSelector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    // A block is preceded by whatever came before it — a comment, a prior block's
    // close. The selector is the last line of that run.
    const selector = (rawSelector.split("\n").pop() ?? "").trim();
    const scheme = SCHEME_FOR[schemeKey(selector)];
    expect(
      scheme,
      `${kind}/${name}.css: no scheme mapped for selector \`${selector}\``,
    ).toBeDefined();
    for (const [, prop, value] of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
      out[scheme as "light" | "dark"][prop] = value.trim();
    }
  }
  return out;
}

const GROUNDS = fileNames("grounds");
const PALETTES = fileNames("palettes");
const SCHEMES = ["light", "dark"] as const;

describe("grounds match the contract", () => {
  it("covers every ground file", () => {
    // Every ground the theme ships is a contract ground. A ground with no
    // counterpart would otherwise be compared against nothing and pass.
    expect(GROUNDS.filter((g) => !contract.grounds[g])).toEqual([]);
  });

  for (const ground of GROUNDS) {
    for (const scheme of SCHEMES) {
      const source = contract.grounds[ground]?.[scheme];
      if (!source) continue;
      const shipped = parse("grounds", ground);

      it(`${ground} / ${scheme}`, () => {
        for (const [prop, value] of Object.entries(shipped[scheme])) {
          expect(
            source,
            `--${prop} is not named by the contract (ground ${ground}, ${scheme} scheme)`,
          ).toHaveProperty(prop);
          expect(
            value,
            `--${prop} drifted — ground ${ground}, ${scheme} scheme: theme has ${value}, @shuttering/tokens ${contract.version} has ${source[prop]}`,
          ).toBe(source[prop]);
        }
      });
    }
  }
});

describe("palettes match the contract", () => {
  it("covers every palette file, and names no palette that is gone", () => {
    // An unlisted palette file is undecided, not exempt.
    expect(PALETTES.filter((p) => !(p in PALETTE_SOURCE))).toEqual([]);
    // The reverse: a stale entry keeps a deleted palette's mapping alive and would
    // quietly re-adopt the name if it ever came back meaning something else.
    expect(Object.keys(PALETTE_SOURCE).filter((p) => !PALETTES.includes(p))).toEqual([]);
  });

  it("every mapped palette names a contract palette", () => {
    const mapped = Object.entries(PALETTE_SOURCE).filter(([, source]) => source !== null);
    expect(mapped.filter(([, source]) => !contract.palettes[source as string])).toEqual([]);
  });

  for (const palette of PALETTES) {
    const source = PALETTE_SOURCE[palette];
    if (!source) continue;
    for (const scheme of SCHEMES) {
      const values = contract.palettes[source]?.[scheme];
      if (!values) continue;
      const shipped = parse("palettes", palette);

      it(`${palette} / ${scheme}`, () => {
        for (const [prop, value] of Object.entries(shipped[scheme])) {
          expect(
            values,
            `--${prop} is not named by the contract (palette ${palette} → ${source}, ${scheme} scheme)`,
          ).toHaveProperty(prop);
          expect(
            value,
            `--${prop} drifted — palette ${palette} → ${source}, ${scheme} scheme: theme has ${value}, @shuttering/tokens ${contract.version} has ${values[prop]}`,
          ).toBe(values[prop]);
        }
      });
    }
  }
});

describe("contract vocabulary", () => {
  it("uses no retired name", () => {
    // The theme fills a subset of the contract — Starlight's own CSS consumes the
    // surface set and one accent, not the status or popover tokens — so an omission
    // is a choice and is not asserted. A RETIRED name is different: it means the
    // theme is filling a slot the contract no longer has.
    const retired = Object.keys(contract.deprecated);
    const shipped = [
      ...GROUNDS.flatMap((g) => SCHEMES.flatMap((s) => Object.keys(parse("grounds", g)[s]))),
      ...PALETTES.flatMap((p) => SCHEMES.flatMap((s) => Object.keys(parse("palettes", p)[s]))),
    ];
    const used = retired.filter((name) => shipped.includes(name));
    expect(
      used.map(
        (name) => `--${name} → ${contract.deprecated[name]?.replacedBy ?? "(no replacement)"}`,
      ),
    ).toEqual([]);
  });

  it("every shipped property belongs to a seam", () => {
    // Catches a typo that lands in both the theme and nothing else — a property the
    // contract happens not to name for this ground reads as an omission above, but a
    // name no seam declares at all is a mistake.
    const seamed = new Set(Object.values(contract.seams).flat());
    const shipped = new Set([
      ...GROUNDS.flatMap((g) => SCHEMES.flatMap((s) => Object.keys(parse("grounds", g)[s]))),
      ...PALETTES.flatMap((p) => SCHEMES.flatMap((s) => Object.keys(parse("palettes", p)[s]))),
    ]);
    expect([...shipped].filter((prop) => !seamed.has(prop)).sort()).toEqual([]);
  });
});
