import { describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { spawnSync } from "child_process"

const CLI_PATH = join(import.meta.dir, "..", "buddy.mjs")
const TARGET_SEED = "29c6aedc-5463-411c-991c-a386d9a93570"

function stripAnsi(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, "")
}

function runInspectWithConfig(config) {
  const dir = mkdtempSync(join(tmpdir(), "cc-buddy-roller-test-"))
  const configPath = join(dir, ".claude.json")
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8")

  try {
    const result = spawnSync("bun", [CLI_PATH, "inspect", "--lang", "en"], {
      env: { ...process.env, BUDDY_ROLLER_CONFIG: configPath },
      encoding: "utf8",
    })

    if (result.error) throw result.error
    if (result.status !== 0) {
      throw new Error(`inspect exited ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`)
    }
    return stripAnsi(result.stdout)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe("hash compatibility", () => {
  test("uses Claude npm/global hash behavior for inspect derivation", () => {
    const output = runInspectWithConfig({
      installMethod: "global",
      oauthAccount: { accountUuid: TARGET_SEED },
    })

    expect(output).toContain("LEGENDARY / DRAGON")
    expect(output).toContain("SHINY /")
    expect(output).toContain("Top hat")
  })
})
