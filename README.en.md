# cc-buddy-roller

```
  ╭──────────────────────────────────╮
  │  🎰  CC Buddy Roller  🎰        │
  │  Roll until you get the one.     │
  ╰──────────────────────────────────╯
```

> Your Claude Code `/buddy` pet is **not random** — it's derived from a deterministic seed. That means if you know the right seed, you can pick exactly the buddy you want. This tool lets you search millions of seeds to find your perfect companion.

## Why This Exists

When you run `/buddy` in Claude Code, your pet's species, rarity, hat, eyes, shiny status, and stats are all generated from a single seed string. By default, this seed is your `oauthAccount.accountUuid` — so you're stuck with whatever you got.

**cc-buddy-roller** lets you:
- 🔍 Search for seeds that produce the exact traits you want
- 👀 Preview any buddy before committing
- ✍️ Write your chosen seed into the config (with automatic backup)
- 🌐 Use the CLI in English or Chinese

Think of it as a gacha reroll tool — except you don't need to delete your account.

## Install

### One-line install (recommended)

```bash
curl -fsSL https://github.com/liuxiaopai-ai/cc-buddy-roller/raw/refs/heads/main/install.sh | bash
cc-buddy-roller guide
```

**Requirements:** just `bash`, `curl`, and `tar` — the installer handles Bun automatically.

If `cc-buddy-roller` isn't found after install, open a new terminal or run:

```bash
export PATH="$HOME/.bun/bin:$HOME/.local/bin:$PATH"
```

Run the installer again anytime to update.

### Manual install

You need [Bun](https://bun.sh) (not Node.js — Claude Code uses `Bun.hash` internally).

```bash
curl -fsSL https://bun.sh/install | bash
git clone https://github.com/liuxiaopai-ai/cc-buddy-roller.git
cd cc-buddy-roller
bun buddy.mjs guide
```

## Commands

### `guide` — Interactive mode

The recommended way to start. Walks you through picking filters, runs the search, shows results, and optionally writes your favorite to the config.

```bash
cc-buddy-roller guide
```

### `hunt` — Direct search

Skip the prompts and go straight to searching.

```bash
# Find a shiny legendary dragon
cc-buddy-roller hunt --species dragon --rarity legendary --shiny

# Find an epic buddy with all stats above 40
cc-buddy-roller hunt --rarity epic --stat-floor 40

# Keep 5 matches instead of the default
cc-buddy-roller hunt --species cat --rarity rare --limit 5
```

### `inspect` — Check your current buddy

Shows your config path, active seed, and what buddy it produces.

```bash
cc-buddy-roller inspect
```

### `preview` — Try before you buy

Render the full buddy card for any seed without touching your config.

```bash
cc-buddy-roller preview 9ab738bf-fb82-40fb-917d-0020259c8408
```

### `stamp` — Apply a seed

Backs up your config first, then writes the seed.

```bash
cc-buddy-roller stamp f853b71e-3774-4bc7-b4a8-4cc0ed266f9f
```

## Search Filters

| Flag | What it does |
|---|---|
| `--species <name>` | Target species (e.g., `dragon`, `cat`, `axolotl`) |
| `--rarity <tier>` | Target rarity (`common`, `uncommon`, `rare`, `epic`, `legendary`) |
| `--eye <char>` | Target eye style (`·` `✦` `×` `◉` `@` `°`) |
| `--hat <name>` | Target hat (`crown`, `wizard`, `halo`, etc.) |
| `--shiny` | Require shiny |
| `--stat-floor <n>` | Every stat must be at least this value |
| `--limit <n>` | How many matches to keep (default: 1) |
| `--tries <n>` | Search budget — how many seeds to try |
| `--seed-format <uuid\|hex>` | Override seed format |

## Language

```bash
cc-buddy-roller guide --lang zh    # Chinese
cc-buddy-roller guide --lang en    # English
cc-buddy-roller guide --lang auto  # Auto-detect
```

## The Trait Pool

| Trait | Possible Values |
|---|---|
| **Species** | duck, goose, blob, cat, dragon, octopus, owl, penguin, turtle, snail, ghost, axolotl, capybara, cactus, robot, rabbit, mushroom, chonk |
| **Rarity** | common (60%), uncommon (25%), rare (10%), epic (4%), legendary (1%) |
| **Eyes** | `·` `✦` `×` `◉` `@` `°` |
| **Hats** | none, crown, tophat, propeller, halo, wizard, beanie, tinyduck |
| **Stats** | DEBUGGING, PATIENCE, CHAOS, WISDOM, SNARK |
| **Shiny** | yes / no |

## How It Works

Buddy traits are **deterministic** — the same seed always produces the same buddy.

```
seed + "friend-2026-401" → Bun.hash (wyhash) → SplitMix32 PRNG → traits
```

The default seed comes from your Claude config:

```
oauthAccount.accountUuid ?? userID ?? "anon"
```

Only the buddy's **name** and **personality** come from the LLM during `/buddy hatch`. Everything else — species, rarity, hat, eyes, shiny, stats — is seed-driven.

## Config Discovery

The tool looks for your Claude config in this order:

1. `$BUDDY_ROLLER_CONFIG` (env var override)
2. `$CLAUDE_CONFIG_DIR/.claude.json`
3. `~/.claude.json`
4. `~/.claude/.claude.json`

## Legacy Aliases

If you've seen older docs, these still work:

| Old | New |
|---|---|
| `search` | `hunt` |
| `current`, `show` | `inspect` |
| `check`, `peek` | `preview` |
| `apply`, `write` | `stamp` |

## Good to Know

- Claude Code may refresh `oauthAccount.accountUuid` during auth updates — this can revert your buddy. Just `stamp` again.
- The derivation logic matches Claude Code **2.1.89**. If Anthropic changes the salt or generation path, results may shift.
- `stamp` always creates a timestamped backup before editing anything.

## License

MIT
