# cc-buddy-roller

```
  ╭──────────────────────────────────╮
  │  🎰  CC Buddy Roller  🎰        │
  │  Roll until you get the one.     │
  ╰──────────────────────────────────╯

     (\___/)    ≋ legendary ≋
     (  ✦ ✦)    species: dragon
      / > 🎩    hat: crown
     "shiny!"   stats: all 90+
```

[English](README.en.md) | [简体中文](README.zh-CN.md)

Your Claude Code `/buddy` pet is determined by a seed. Don't like yours? **Roll a new one.**

不满意你的 Claude Code 宠物？**重新抽，直到出货。**

## 30 Seconds to Your Dream Buddy

```bash
# Install (auto-installs Bun if needed)
curl -fsSL https://github.com/liuxiaopai-ai/cc-buddy-roller/raw/refs/heads/main/install.sh | bash

# Start rolling
cc-buddy-roller guide
```

## What Can It Do?

| Command | What it does |
|---|---|
| `guide` | Interactive gacha — pick filters, roll, preview, apply |
| `hunt` | Batch search for seeds matching your criteria |
| `inspect` | See your current buddy |
| `preview` | Preview any seed before committing |
| `stamp` | Write a seed into your config (with auto-backup) |

## Roll Examples

```bash
# I want a shiny legendary dragon
cc-buddy-roller hunt --species dragon --rarity legendary --shiny

# All stats above 40, epic rarity
cc-buddy-roller hunt --rarity epic --stat-floor 40

# What do I have right now?
cc-buddy-roller inspect
```

## Docs

- [Full English docs →](README.en.md)
- [完整中文文档 →](README.zh-CN.md)

## License

MIT
