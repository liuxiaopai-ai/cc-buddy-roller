# cc-buddy-roller

一个给 Claude Code `/buddy` 命令里的电子宠物用的双语种子工作台。

这个仓库采用 guide-first 的命令模型，README 拆成独立中英文文件，CLI 也支持语言切换，适合直接作为 `cc-buddy-roller` 的开源仓库说明。

## 项目用途

`cc-buddy-roller` 用来处理 Claude Code `/buddy` 电子宠物背后的确定性种子。

它可以：

- 查看当前 Claude 配置和当前 buddy 派生结果
- 在真正写入前先预览任意种子
- 按特征条件搜索匹配的种子
- 自动备份后把种子写回配置
- 通过 `--lang` 在中文和英文界面之间切换

## 安装

### 一键安装

如果很多用户本机还没有 Bun，推荐直接用安装脚本。它会在需要时自动安装 Bun，把项目源码同步到本地，并生成一个可重复使用的 `cc-buddy-roller` 启动命令。

```bash
curl -fsSL https://github.com/liuxiaopai-ai/cc-buddy-roller/raw/refs/heads/main/install.sh | bash
cc-buddy-roller guide
```

如果当前这个 shell 里还找不到 `cc-buddy-roller`，开一个新终端，或者先执行：

```bash
export PATH="$HOME/.bun/bin:$HOME/.local/bin:$PATH"
```

标准安装路径下，用户不需要预先安装 Bun，也不需要先装 Git。安装脚本会自己安装 Bun，并直接从 GitHub 下载源码包。通常只要系统里有 `bash`、`curl`、`tar` 就够了；大多数 macOS 和 Linux 环境默认都有。

后面想更新本地安装，也可以直接再跑一次这条命令。

### 手动安装

需要先安装 [Bun](https://bun.sh)。因为 Claude Code 使用的是 `Bun.hash`，只用 Node.js 无法算出一致的 buddy 特征。

```bash
curl -fsSL https://bun.sh/install | bash
git clone https://github.com/liuxiaopai-ai/cc-buddy-roller.git
cd cc-buddy-roller
bun buddy.mjs guide
```

## 命令结构

| 命令 | 作用 |
|---|---|
| `bun buddy.mjs guide` | 进入交互式向导，选条件、跑搜索、挑结果、决定是否写入 |
| `bun buddy.mjs hunt [filters]` | 直接按参数搜索种子 |
| `bun buddy.mjs inspect` | 查看当前配置路径、有效种子字段和当前 buddy |
| `bun buddy.mjs preview <seed>` | 预览单个种子 |
| `bun buddy.mjs stamp <seed>` | 先备份，再把种子写入当前有效字段 |

## 语言支持

CLI 支持：

- `--lang en`
- `--lang zh`
- `--lang auto`

示例：

```bash
bun buddy.mjs guide --lang zh
bun buddy.mjs inspect --lang en
```

## 使用示例

```bash
# 进入向导
bun buddy.mjs guide

# 搜一个闪光传说龙，并保留两个结果
bun buddy.mjs hunt --species dragon --rarity legendary --shiny --limit 2

# 要求所有属性都不低于 40
bun buddy.mjs hunt --rarity epic --stat-floor 40

# 先预览，再决定要不要写
bun buddy.mjs preview 9ab738bf-fb82-40fb-917d-0020259c8408

# 把种子写入当前配置
bun buddy.mjs stamp f853b71e-3774-4bc7-b4a8-4cc0ed266f9f

# 如果你用 install.sh 装过，也可以直接这样跑
cc-buddy-roller inspect --lang zh
```

## 搜索参数

| 参数 | 说明 |
|---|---|
| `--species <name>` | 指定物种 |
| `--rarity <tier>` | 指定稀有度 |
| `--eye <char>` | 指定眼睛样式 |
| `--hat <name>` | 指定帽子 |
| `--shiny` | 要求闪光 |
| `--stat-floor <n>` | 要求每项属性都不少于 `n` |
| `--limit <n>` | 保留多少个结果 |
| `--tries <n>` | 搜索预算 |
| `--seed-format <uuid|hex>` | 手动覆盖种子格式 |

## 配置文件查找顺序

工具会依次尝试：

1. `BUDDY_ROLLER_CONFIG`
2. `CLAUDE_CONFIG_DIR/.claude.json`
3. `~/.claude.json`
4. `~/.claude/.claude.json`

## 种子模型

buddy 的特征来自单一字符串种子：

```text
seed + "friend-2026-401" -> Bun.hash (wyhash) -> SplitMix32 -> traits
```

实际读取顺序是：

```text
oauthAccount.accountUuid ?? userID ?? "anon"
```

只有名字和性格来自 `/buddy hatch` 时的 LLM；物种、稀有度、帽子、眼睛、闪光、属性点数，都由种子确定。

## 可调特征

| 特征 | 值 |
|---|---|
| 物种 | duck, goose, blob, cat, dragon, octopus, owl, penguin, turtle, snail, ghost, axolotl, capybara, cactus, robot, rabbit, mushroom, chonk |
| 稀有度 | common, uncommon, rare, epic, legendary |
| 眼睛 | `·` `✦` `×` `◉` `@` `°` |
| 帽子 | none, crown, tophat, propeller, halo, wizard, beanie, tinyduck |
| 属性 | DEBUGGING, PATIENCE, CHAOS, WISDOM, SNARK |

## 兼容别名

文档主推的是新命令结构，不过程序仍兼容一些旧别名：

- `search` -> `hunt`
- `current` 或 `show` -> `inspect`
- `check` 或 `peek` -> `preview`
- `apply` 或 `write` -> `stamp`

## 注意事项

- Claude Code 在认证刷新时可能会重写 `oauthAccount.accountUuid`，buddy 可能因此恢复原样。
- 这里的派生逻辑基于 Claude Code 2.1.89 的行为；如果 Anthropic 以后改了盐值或生成流程，结果也会跟着变。
- `stamp` 在修改配置前一定会生成带时间戳的备份文件。

## License

MIT
