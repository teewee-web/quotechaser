import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function filesIn(relativePath: string): string[] {
  const absolute = join(root, relativePath);
  return readdirSync(absolute).flatMap((name) => {
    const file = join(absolute, name);
    return statSync(file).isDirectory()
      ? filesIn(join(relativePath, name))
      : [file];
  });
}

describe("public branding", () => {
  it("contains no legacy Quote Align branding in customer-facing sources", () => {
    const files = ["app", "components", "public", "supabase/templates"]
      .flatMap(filesIn)
      .filter((file) => /\.(tsx?|html|svg|webmanifest|js)$/.test(file));

    for (const file of files) {
      const contents = readFileSync(file, "utf8");
      expect(contents, file).not.toMatch(/quote[ -]?align/i);
      expect(contents, file).not.toMatch(/support@quotealign\.com/i);
    }
  });

  it("uses the canonical Quote-Chaser support address and domain", () => {
    const legal = readFileSync(join(root, "components/legal-page.tsx"), "utf8");
    const layout = readFileSync(join(root, "app/layout.tsx"), "utf8");
    expect(legal).toContain("support@quote-chaser.com");
    expect(layout).toContain("https://quote-chaser.com");
    expect(layout).toContain("Quote-Chaser");
  });
});
