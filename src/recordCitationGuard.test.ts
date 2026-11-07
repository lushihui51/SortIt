import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

const root = process.cwd();

function readStatuses(): Map<string, string> {
  const statuses = new Map<string, string>();
  for (const [type, folder] of [
    ["ADR", "docs/adrs"],
    ["PDR", "docs/pdrs"],
  ]) {
    for (const name of readdirSync(join(root, folder))) {
      const number = /^(\d{3})-.*\.md$/.exec(name)?.[1];
      if (number === undefined) continue;
      const lines = readFileSync(join(root, folder, name), "utf8").split(
        /\r?\n/,
      );
      const heading = lines.indexOf("## Status");
      const status =
        heading === -1
          ? ""
          : (
              lines.slice(heading + 1).find((line) => line.trim() !== "") ?? ""
            ).trim();
      statuses.set(`${type} ${number}`, status);
    }
  }
  return statuses;
}

test("every record citation outside the records names an active record", () => {
  const statuses = readStatuses();
  // The records and the dockets must cite records that are no longer active, so
  // only files outside docs/ and the backlog are read as live sites.
  const paths = execFileSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\0")
    .filter(
      (path) =>
        path !== "" &&
        (!path.startsWith("docs/") || path === "docs/backlog.md"),
    );

  const lines: string[] = [];
  for (const path of paths) {
    const text = readFileSync(join(root, path), "utf8");
    for (const [, type, number] of text.matchAll(/\b(ADR|PDR) (\d{3})\b/g)) {
      const cited = `${type} ${number}`;
      const status = statuses.get(cited);
      if (status === undefined) lines.push(`${path}: ${cited} names no record`);
      else if (status !== "Active")
        lines.push(`${path}: ${cited} is ${status}`);
    }
  }

  expect(lines.join("\n")).toBe("");
});
