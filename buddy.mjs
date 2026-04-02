#!/usr/bin/env bun
/**
 * CC Buddy Roller
 *
 * A bilingual seed workshop for Claude Code /buddy.
 * Primary commands:
 *   bun buddy.mjs guide
 *   bun buddy.mjs hunt [filters]
 *   bun buddy.mjs inspect
 *   bun buddy.mjs preview <seed>
 *   bun buddy.mjs stamp <seed>
 *
 * Notes:
 * - Bun is required for Bun.hash / wyhash compatibility.
 * - This tool can localize its interface with --lang en|zh.
 */

import { copyFileSync, existsSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import { createInterface } from "readline"

const APP_NAME = "CC Buddy Roller"
const SALT = "friend-2026-401"

const SPECIES_META = {
  duck: { en: "Duck", zh: "鸭子" },
  goose: { en: "Goose", zh: "鹅" },
  blob: { en: "Blob", zh: "果冻团" },
  cat: { en: "Cat", zh: "猫" },
  dragon: { en: "Dragon", zh: "龙" },
  octopus: { en: "Octopus", zh: "章鱼" },
  owl: { en: "Owl", zh: "猫头鹰" },
  penguin: { en: "Penguin", zh: "企鹅" },
  turtle: { en: "Turtle", zh: "乌龟" },
  snail: { en: "Snail", zh: "蜗牛" },
  ghost: { en: "Ghost", zh: "幽灵" },
  axolotl: { en: "Axolotl", zh: "六角恐龙" },
  capybara: { en: "Capybara", zh: "水豚" },
  cactus: { en: "Cactus", zh: "仙人掌" },
  robot: { en: "Robot", zh: "机器人" },
  rabbit: { en: "Rabbit", zh: "兔子" },
  mushroom: { en: "Mushroom", zh: "蘑菇" },
  chonk: { en: "Chonk", zh: "胖墩" },
}

const RARITY_META = {
  common: { en: "Common", zh: "普通", weight: 60, stars: "★" },
  uncommon: { en: "Uncommon", zh: "非凡", weight: 25, stars: "★★" },
  rare: { en: "Rare", zh: "稀有", weight: 10, stars: "★★★" },
  epic: { en: "Epic", zh: "史诗", weight: 4, stars: "★★★★" },
  legendary: { en: "Legendary", zh: "传说", weight: 1, stars: "★★★★★" },
}

const HAT_META = {
  none: { en: "No hat", zh: "无帽子" },
  crown: { en: "Crown", zh: "皇冠" },
  tophat: { en: "Top hat", zh: "礼帽" },
  propeller: { en: "Propeller", zh: "螺旋桨帽" },
  halo: { en: "Halo", zh: "光环" },
  wizard: { en: "Wizard hat", zh: "巫师帽" },
  beanie: { en: "Beanie", zh: "毛线帽" },
  tinyduck: { en: "Tiny duck", zh: "小鸭子" },
}

const STAT_META = {
  DEBUGGING: { en: "Debugging", zh: "调试" },
  PATIENCE: { en: "Patience", zh: "耐心" },
  CHAOS: { en: "Chaos", zh: "混乱" },
  WISDOM: { en: "Wisdom", zh: "智慧" },
  SNARK: { en: "Snark", zh: "毒舌" },
}

const SPECIES = Object.keys(SPECIES_META)
const RARITIES = Object.keys(RARITY_META)
const HATS = Object.keys(HAT_META)
const STAT_NAMES = Object.keys(STAT_META)
const EYES = ["·", "✦", "×", "◉", "@", "°"]

const STAT_FLOOR = {
  common: 5,
  uncommon: 15,
  rare: 25,
  epic: 35,
  legendary: 50,
}

const SPECIES_ART = {
  duck: ["            ", "    __      ", "  <({E} )___  ", "   (  ._>   ", "    `--´    "],
  goose: ["            ", "     ({E}>    ", "     ||     ", "   _(__)_   ", "    ^^^^    "],
  blob: ["            ", "   .----.   ", "  ( {E}  {E} )  ", "  (      )  ", "   `----´   "],
  cat: ["            ", "   /\\_/\\    ", "  ( {E}   {E})  ", "  (  ω  )   ", '  (")_(")   '],
  dragon: ["            ", "  /^\\  /^\\  ", " <  {E}  {E}  > ", " (   ~~   ) ", "  `-vvvv-´  "],
  octopus: ["            ", "   .----.   ", "  ( {E}  {E} )  ", "  (______)  ", "  /\\/\\/\\/\\  "],
  owl: ["            ", "   /\\  /\\   ", "  (({E})({E}))  ", "  (  ><  )  ", "   `----´   "],
  penguin: ["            ", "  .---.     ", "  ({E}>{E})     ", " /(   )\\    ", "  `---´     "],
  turtle: ["            ", "   _,--._   ", "  ( {E}  {E} )  ", " /[______]\\ ", "  ``    ``  "],
  snail: ["            ", " {E}    .--.  ", "  \\  ( @ )  ", "   \\_`--´   ", "  ~~~~~~~   "],
  ghost: ["            ", "   .----.   ", "  / {E}  {E} \\  ", "  |      |  ", "  ~`~``~`~  "],
  axolotl: ["            ", "}~(______)~{", "}~({E} .. {E})~{", "  ( .--. )  ", "  (_/  \\_)  "],
  capybara: ["            ", "  n______n  ", " ( {E}    {E} ) ", " (   oo   ) ", "  `------´  "],
  cactus: ["            ", " n  ____  n ", " | |{E}  {E}| | ", " |_|    |_| ", "   |    |   "],
  robot: ["            ", "   .[||].   ", "  [ {E}  {E} ]  ", "  [ ==== ]  ", "  `------´  "],
  rabbit: ["            ", "   (\\__/)   ", "  ( {E}  {E} )  ", " =(  ..  )= ", '  (")__(")  '],
  mushroom: ["            ", " .-o-OO-o-. ", "(__________)", "   |{E}  {E}|   ", "   |____|   "],
  chonk: ["            ", "  /\\    /\\  ", " ( {E}    {E} ) ", " (   ..   ) ", "  `------´  "],
}

const HAT_ART = {
  none: "",
  crown: "   \\^^^/    ",
  tophat: "   [___]    ",
  propeller: "    -+-     ",
  halo: "   (   )    ",
  wizard: "    /^\\     ",
  beanie: "   (___)    ",
  tinyduck: "    ,>      ",
}

const COLOR = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  shiny: "\x1b[93m",
  rarity: {
    common: "\x1b[90m",
    uncommon: "\x1b[32m",
    rare: "\x1b[35m",
    epic: "\x1b[33m",
    legendary: "\x1b[38;5;208m",
  },
}

const COPY = {
  en: {
    lead: "Guide-first, bilingual seed hunting for the virtual pet behind Claude Code /buddy.",
    usage: "Usage",
    commands: "Primary commands",
    filters: "Hunt filters",
    tuning: "Tuning",
    aliases: "Compatibility aliases",
    examples: "Examples",
    guideDesc: "interactive workshop for choosing traits and stamping a match",
    huntDesc: "search the seed space with trait filters",
    inspectDesc: "inspect the active Claude config and current derived buddy",
    previewDesc: "preview what a seed produces",
    stampDesc: "write a seed into the active config after backing it up",
    langOption: "interface language (en, zh, auto)",
    any: "Skip",
    yes: "yes",
    no: "no",
    traitSheet: "Trait sheet",
    configDetails: "Config details",
    searchBrief: "Hunt brief",
    noFilters: "No filters selected. Nothing to hunt.",
    noMatches: "No matches found within the current search budget.",
    noChanges: "No files were modified.",
    pickResult: "Choose one result to stamp:",
    skipStamp: "Skip writing to config",
    invalidInput: "Invalid input, try again.",
    startSearch: "Start the hunt?",
    applySingle: "Stamp this result into your config?",
    detectedFormat: "Detected config format",
    currentSnapshot: "Current snapshot",
    previewTitle: "Preview",
    inspectTitle: "Active config snapshot",
    stampTitle: "Stamp seed into config",
    restartHint: "Restart Claude Code and run /buddy hatch to refresh the companion.",
    llmNote: "Only the name and personality come from the LLM during /buddy hatch.",
    bunNeed1: "This tool must run with Bun.",
    bunNeed2: "Claude Code depends on Bun.hash (wyhash); Node.js will not reproduce matching buddy traits.",
    bunInstall: "Install Bun: curl -fsSL https://bun.sh/install | bash",
    noConfig: "Could not find a Claude config file.",
    checkedPaths: "Checked paths",
    profile: "Profile",
    rarity: "Rarity",
    species: "Species",
    eyes: "Eyes",
    hat: "Hat",
    shiny: "Shiny",
    stats: "Stats",
    seed: "Seed",
    configPath: "Config path",
    seedField: "Seed field",
    seedValue: "Seed value",
    seedFormat: "Seed format",
    hashMode: "Hash mode",
    hashModeSource: "Hash mode source",
    companionName: "Companion name",
    companionPersonality: "Companion personality",
    attempts: "attempts",
    searched: "searched",
    match: "Match",
    budget: "Budget",
    requested: "Requested results",
    backup: "Backup",
    updatedField: "Updated field",
    minStatPrompt: "Minimum value for every stat (blank to skip): ",
    resultCountPrompt: "How many matches should the guide keep? [3]: ",
    cancelSearch: "Search cancelled.",
    formatError: "Seed format does not match the active config.",
    badSeed: "Seed must be a UUID or a 64-character hex string.",
    helpHint: "Run with --lang zh for Chinese output.",
  },
  zh: {
    lead: "面向 Claude Code /buddy 电子宠物的双语种子搜寻器，以向导流为主。",
    usage: "用法",
    commands: "主命令",
    filters: "搜索筛选项",
    tuning: "调参项",
    aliases: "兼容别名",
    examples: "示例",
    guideDesc: "交互式向导，挑条件并把结果写回配置",
    huntDesc: "按特征筛选搜索种子空间",
    inspectDesc: "查看当前 Claude 配置和现有 buddy 派生结果",
    previewDesc: "预览某个种子会生成什么",
    stampDesc: "先备份再把种子写入当前配置",
    langOption: "界面语言（en、zh、auto）",
    any: "跳过",
    yes: "是",
    no: "否",
    traitSheet: "特征清单",
    configDetails: "配置详情",
    searchBrief: "搜索摘要",
    noFilters: "没有选择任何条件，不执行搜索。",
    noMatches: "在当前搜索预算内没有找到结果。",
    noChanges: "没有修改任何文件。",
    pickResult: "选一个结果写入配置：",
    skipStamp: "不写入配置",
    invalidInput: "输入无效，请重试。",
    startSearch: "开始搜索吗？",
    applySingle: "把这个结果写入配置吗？",
    detectedFormat: "检测到的配置格式",
    currentSnapshot: "当前状态",
    previewTitle: "预览",
    inspectTitle: "当前配置快照",
    stampTitle: "把种子写入配置",
    restartHint: "重启 Claude Code 后再运行 /buddy hatch，就会刷新新伙伴。",
    llmNote: "只有名字和性格来自 /buddy hatch 时的 LLM 调用。",
    bunNeed1: "这个工具必须在 Bun 运行时里执行。",
    bunNeed2: "Claude Code 依赖 Bun.hash（wyhash）；Node.js 算不出一致的 buddy 特征。",
    bunInstall: "安装 Bun：curl -fsSL https://bun.sh/install | bash",
    noConfig: "没有找到 Claude 配置文件。",
    checkedPaths: "已检查路径",
    profile: "概要",
    rarity: "稀有度",
    species: "物种",
    eyes: "眼睛",
    hat: "帽子",
    shiny: "闪光",
    stats: "属性",
    seed: "种子",
    configPath: "配置文件",
    seedField: "种子字段",
    seedValue: "种子值",
    seedFormat: "种子格式",
    hashMode: "哈希模式",
    hashModeSource: "哈希来源",
    companionName: "伙伴名字",
    companionPersonality: "伙伴性格",
    attempts: "次尝试",
    searched: "已搜索",
    match: "命中",
    budget: "搜索预算",
    requested: "目标结果数",
    backup: "备份",
    updatedField: "更新字段",
    minStatPrompt: "每个属性的最低值（直接回车跳过）：",
    resultCountPrompt: "向导保留几个匹配结果？[3]：",
    cancelSearch: "已取消搜索。",
    formatError: "种子格式和当前配置不匹配。",
    badSeed: "种子必须是 UUID 或 64 位十六进制字符串。",
    helpHint: "如果想看英文界面，可加 --lang en。",
  },
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const HEX64_RE = /^[0-9a-f]{64}$/i
const HEX = "0123456789abcdef"
const CARD_WIDTH = 44

function tr(locale, key) {
  return COPY[locale][key] ?? COPY.en[key] ?? key
}

function isZh(locale) {
  return locale === "zh"
}

function formatNumber(locale, value) {
  return new Intl.NumberFormat(isZh(locale) ? "zh-CN" : "en-US").format(value)
}

function detectLocale(choice = "auto") {
  if (!choice || choice === "auto") {
    const hint = `${process.env.LANG || ""} ${process.env.LC_ALL || ""}`.toLowerCase()
    return hint.includes("zh") ? "zh" : "en"
  }
  return choice === "zh" ? "zh" : "en"
}

function cliPrefix() {
  return process.env.CC_BUDDY_ROLLER_LAUNCHER || "bun buddy.mjs"
}

function cliExample(suffix = "") {
  return suffix ? `${cliPrefix()} ${suffix}` : cliPrefix()
}

function fatal(message) {
  console.error(message)
  process.exit(1)
}

function bunHash(input) {
  if (typeof Bun === "undefined") {
    console.error(tr("en", "bunNeed1"))
    console.error(tr("en", "bunNeed2"))
    console.error(tr("en", "bunInstall"))
    process.exit(1)
  }
  return Number(BigInt(Bun.hash(input)) & 0xffffffffn)
}

function fnv1aHash(input) {
  let hash = 2166136261
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function resolveHashMode(configData) {
  const raw = (process.env.CC_BUDDY_HASH_MODE || "auto").trim().toLowerCase()
  if (raw === "bun" || raw === "wyhash") return { mode: "bun", source: `env:${raw}` }
  if (raw === "fnv1a" || raw === "node") return { mode: "fnv1a", source: `env:${raw}` }
  if (raw !== "" && raw !== "auto") fatal(`  CC_BUDDY_HASH_MODE expects auto, bun, or fnv1a (got ${raw})`)

  const installMethod = configData?.installMethod
  if (installMethod === "global" || installMethod === "local") {
    return { mode: "fnv1a", source: `config:installMethod=${installMethod}` }
  }
  if (installMethod === "native") return { mode: "bun", source: "config:installMethod=native" }
  return { mode: "bun", source: "default:bun" }
}

function hash32(input, mode) {
  if (mode === "fnv1a") return fnv1aHash(input)
  return bunHash(input)
}

function splitmix32(seed) {
  let state = seed >>> 0
  return function next() {
    state = (state + 0x6d2b79f5) | 0
    let q = Math.imul(state ^ (state >>> 15), 1 | state)
    q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q
    return ((q ^ (q >>> 14)) >>> 0) / 4294967296
  }
}

function pick(rng, values) {
  return values[Math.floor(rng() * values.length)]
}

function rollRarity(rng) {
  let roll = rng() * 100
  for (const rarity of RARITIES) {
    roll -= RARITY_META[rarity].weight
    if (roll < 0) return rarity
  }
  return "common"
}

function rollStats(rng, rarity) {
  const floor = STAT_FLOOR[rarity]
  const primary = pick(rng, STAT_NAMES)
  let weak = pick(rng, STAT_NAMES)
  while (weak === primary) weak = pick(rng, STAT_NAMES)

  const stats = {}
  for (const name of STAT_NAMES) {
    if (name === primary) stats[name] = Math.min(100, floor + 50 + Math.floor(rng() * 30))
    else if (name === weak) stats[name] = Math.max(1, floor - 10 + Math.floor(rng() * 15))
    else stats[name] = floor + Math.floor(rng() * 40)
  }
  return stats
}

function deriveBuddy(seed, hashMode = "bun") {
  const rng = splitmix32(hash32(seed + SALT, hashMode))
  const rarity = rollRarity(rng)
  const species = pick(rng, SPECIES)
  const eye = pick(rng, EYES)
  const hat = rarity === "common" ? "none" : pick(rng, HATS)
  const shiny = rng() < 0.01
  const stats = rollStats(rng, rarity)
  return { seed, rarity, species, eye, hat, shiny, stats }
}

function randomUUID() {
  let value = ""
  for (let index = 0; index < 32; index++) value += HEX[(Math.random() * 16) | 0]
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-4${value.slice(13, 16)}-${HEX[((Math.random() * 4) | 0) + 8]}${value.slice(17, 20)}-${value.slice(20, 32)}`
}

function randomHex64() {
  let value = ""
  for (let index = 0; index < 64; index++) value += HEX[(Math.random() * 16) | 0]
  return value
}

function getConfigCandidates() {
  const candidates = []

  if (process.env.BUDDY_ROLLER_CONFIG) candidates.push(process.env.BUDDY_ROLLER_CONFIG)
  if (process.env.CLAUDE_CONFIG_DIR) candidates.push(join(process.env.CLAUDE_CONFIG_DIR, ".claude.json"))

  candidates.push(join(homedir(), ".claude.json"))
  candidates.push(join(homedir(), ".claude", ".claude.json"))

  return [...new Set(candidates)]
}

function readConfigBundle() {
  const candidates = getConfigCandidates()
  const path = candidates.find(candidate => existsSync(candidate)) || null
  if (!path) return { path: null, candidates, data: null }

  return {
    path,
    candidates,
    data: JSON.parse(readFileSync(path, "utf-8")),
  }
}

function detectSeedSlot(configData) {
  if (!configData) return { source: "anon", value: "anon", format: "uuid" }

  const uuid = configData.oauthAccount?.accountUuid
  const userId = configData.userID

  if (uuid) return { source: "oauthAccount.accountUuid", value: uuid, format: "uuid" }
  if (userId) return { source: "userID", value: userId, format: "hex" }

  return { source: "anon", value: "anon", format: "uuid" }
}

function seedFormatOf(seed) {
  if (UUID_RE.test(seed)) return "uuid"
  if (HEX64_RE.test(seed)) return "hex"
  return "unknown"
}

function dualLabel(locale, meta, key) {
  const zh = meta[key]?.zh ?? key
  const en = meta[key]?.en ?? key
  return isZh(locale) ? `${zh} / ${en}` : `${en} / ${zh}`
}

function localizedLabel(locale, meta, key) {
  return isZh(locale) ? meta[key]?.zh ?? key : meta[key]?.en ?? key
}

function formatProfileSummary(profile, locale) {
  const parts = [
    dualLabel(locale, RARITY_META, profile.rarity),
    dualLabel(locale, SPECIES_META, profile.species),
  ]

  if (profile.hat !== "none") parts.push(dualLabel(locale, HAT_META, profile.hat))
  if (profile.shiny) parts.push(isZh(locale) ? "闪光 / Shiny" : "Shiny / 闪光")

  return parts.join(" · ")
}

function formatFilterSummary(filters, locale) {
  const parts = []

  if (filters.rarity) parts.push(`${tr(locale, "rarity")}=${dualLabel(locale, RARITY_META, filters.rarity)}`)
  if (filters.species) parts.push(`${tr(locale, "species")}=${dualLabel(locale, SPECIES_META, filters.species)}`)
  if (filters.eye) parts.push(`${tr(locale, "eyes")}=${filters.eye}`)
  if (filters.hat) parts.push(`${tr(locale, "hat")}=${dualLabel(locale, HAT_META, filters.hat)}`)
  if (filters.shiny) parts.push(`${tr(locale, "shiny")}=${isZh(locale) ? "要 / required" : "required / 要"}`)
  if (filters.statFloor) parts.push(`${tr(locale, "stats")}>=${filters.statFloor}`)

  return parts.join(", ")
}

function bar(value, width = 10) {
  const filled = Math.min(width, Math.round((value / 100) * width))
  return "█".repeat(filled) + "░".repeat(width - filled)
}

function padAnsi(text, width) {
  const visible = text.replace(/\x1b\[[0-9;]*m/g, "")
  return text + " ".repeat(Math.max(0, width - visible.length))
}

function centerLine(line, width) {
  if (line.length >= width) return line.slice(0, width)
  const left = Math.floor((width - line.length) / 2)
  const right = width - line.length - left
  return `${" ".repeat(left)}${line}${" ".repeat(right)}`
}

function renderArt(species, eye, hat) {
  const art = (SPECIES_ART[species] || SPECIES_ART.blob).map(line => line.replace(/\{E\}/g, eye))
  if (hat !== "none" && !art[0].trim()) {
    const copy = [...art]
    copy[0] = HAT_ART[hat] || copy[0]
    return copy
  }
  return art
}

function printProfileCard(profile, locale, options = {}) {
  const color = COLOR.rarity[profile.rarity]
  const title = `${RARITY_META[profile.rarity].stars} ${RARITY_META[profile.rarity].en.toUpperCase()} / ${SPECIES_META[profile.species].en.toUpperCase()}`

  console.log()
  if (options.title) console.log(`  ${COLOR.bold}${options.title}${COLOR.reset}`)
  if (options.caption) console.log(`  ${COLOR.dim}${options.caption}${COLOR.reset}`)
  console.log(`  ${COLOR.dim}${tr(locale, "seed")}: ${profile.seed}${COLOR.reset}`)

  console.log(`  ╭${"─".repeat(CARD_WIDTH)}╮`)
  console.log(`  │ ${color}${padAnsi(title, CARD_WIDTH - 2)}${COLOR.reset} │`)
  console.log(`  │${" ".repeat(CARD_WIDTH)}│`)

  for (const line of renderArt(profile.species, profile.eye, profile.hat)) {
    console.log(`  │${color}${centerLine(line, CARD_WIDTH)}${COLOR.reset}│`)
  }

  console.log(`  │${" ".repeat(CARD_WIDTH)}│`)

  if (profile.shiny) {
    const shinyLine = isZh(locale) ? "  ✨ SHINY / 闪光 ✨" : "  ✨ SHINY / 闪光 ✨"
    console.log(`  │${padAnsi(`${COLOR.shiny}${COLOR.bold}${shinyLine}${COLOR.reset}`, CARD_WIDTH)}│`)
    console.log(`  │${" ".repeat(CARD_WIDTH)}│`)
  }

  for (const name of STAT_NAMES) {
    const label = name.padEnd(10)
    const value = profile.stats[name]
    const line = `  ${label} ${bar(value)} ${String(value).padStart(3)}`
    console.log(`  │${line.padEnd(CARD_WIDTH)}│`)
  }

  console.log(`  ╰${"─".repeat(CARD_WIDTH)}╯`)

  console.log(`  ${COLOR.dim}${tr(locale, "profile")}: ${formatProfileSummary(profile, locale)}${COLOR.reset}`)
  console.log(`  ${COLOR.dim}${tr(locale, "hat")}: ${dualLabel(locale, HAT_META, profile.hat)}${COLOR.reset}`)
  console.log(`  ${COLOR.dim}${tr(locale, "eyes")}: ${profile.eye}${COLOR.reset}`)
  console.log(`  ${COLOR.dim}${tr(locale, "shiny")}: ${profile.shiny ? tr(locale, "yes") : tr(locale, "no")}${COLOR.reset}`)
  console.log()
}

function printConfigContext(bundle, info, hashContext, locale) {
  console.log(`  ${COLOR.bold}${tr(locale, "configDetails")}${COLOR.reset}`)
  console.log(`  ${COLOR.dim}${tr(locale, "configPath")}: ${bundle.path}${COLOR.reset}`)
  console.log(`  ${COLOR.dim}${tr(locale, "seedField")}: ${info.source}${COLOR.reset}`)
  console.log(`  ${COLOR.dim}${tr(locale, "seedValue")}: ${info.value}${COLOR.reset}`)
  console.log(`  ${COLOR.dim}${tr(locale, "seedFormat")}: ${info.format}${COLOR.reset}`)
  console.log(`  ${COLOR.dim}${tr(locale, "hashMode")}: ${hashContext.mode}${COLOR.reset}`)
  console.log(`  ${COLOR.dim}${tr(locale, "hashModeSource")}: ${hashContext.source}${COLOR.reset}`)

  if (bundle.data?.companion?.name) {
    console.log(`  ${COLOR.dim}${tr(locale, "companionName")}: ${bundle.data.companion.name}${COLOR.reset}`)
  }

  if (bundle.data?.companion?.personality) {
    const snippet = bundle.data.companion.personality.length > 88
      ? `${bundle.data.companion.personality.slice(0, 88)}...`
      : bundle.data.companion.personality
    console.log(`  ${COLOR.dim}${tr(locale, "companionPersonality")}: ${snippet}${COLOR.reset}`)
  }

  console.log()
}

function validateConfigPresence(bundle, locale) {
  if (bundle.path) return

  console.error(`  ${tr(locale, "noConfig")}`)
  console.error(`  ${tr(locale, "checkedPaths")}:`)
  for (const path of bundle.candidates) console.error(`    ${path}`)
  process.exit(1)
}

function isAffirmative(locale, input) {
  const raw = input.trim().toLowerCase()
  if (!raw) return false
  const yesWords = isZh(locale)
    ? ["y", "yes", "是", "好", "确认", "1"]
    : ["y", "yes", "1"]
  return yesWords.includes(raw)
}

function createPrompt() {
  const rl = createInterface({ input: process.stdin, output: process.stdout })

  return {
    ask(question) {
      return new Promise(resolve => rl.question(question, resolve))
    },
    close() {
      rl.close()
    },
  }
}

function normalizeInput(value) {
  return value.trim().toLowerCase()
}

async function askChoice(prompt, locale, title, values, options = {}) {
  console.log(`\n  ${COLOR.bold}${title}${COLOR.reset}`)

  const entries = []
  if (options.allowSkip !== false) entries.push({ index: 0, value: null, label: tr(locale, "any") })

  values.forEach((value, idx) => {
    const label = options.render ? options.render(value) : value
    const extra = options.extras?.[value] ? `  ${COLOR.dim}(${options.extras[value]})${COLOR.reset}` : ""
    entries.push({ index: idx + 1, value, label, extra })
  })

  const columns = options.columns || 1
  if (columns === 1) {
    for (const entry of entries) console.log(`    ${COLOR.dim}${String(entry.index).padStart(2)}.${COLOR.reset} ${entry.label}${entry.extra || ""}`)
  } else {
    for (let idx = 0; idx < entries.length; idx += columns) {
      const row = entries.slice(idx, idx + columns)
        .map(entry => `${COLOR.dim}${String(entry.index).padStart(2)}.${COLOR.reset} ${entry.label.padEnd(22)}${entry.extra || ""}`)
        .join("  ")
      console.log(`    ${row}`)
    }
  }

  while (true) {
    const raw = (await prompt.ask(`  ${COLOR.dim}>${COLOR.reset} `)).trim()
    if (!raw) continue

    const choice = Number.parseInt(raw, 10)
    if (!Number.isNaN(choice)) {
      if (choice === 0 && options.allowSkip !== false) return null
      if (choice >= 1 && choice <= values.length) return values[choice - 1]
    }

    const normalized = normalizeInput(raw)
    const matched = values.find(value => {
      const labels = [value]
      if (options.aliases?.[value]) labels.push(...options.aliases[value])
      if (options.render) labels.push(options.render(value))
      return labels.some(label => normalizeInput(String(label)) === normalized)
    })

    if (matched) return matched

    if (options.allowSkip !== false && ["skip", "any", "跳过", "任意"].includes(normalized)) return null
    console.log(`    ${tr(locale, "invalidInput")}`)
  }
}

async function askOptionalInteger(prompt, locale, label, fallback = null) {
  while (true) {
    const raw = (await prompt.ask(`\n  ${COLOR.bold}${label}${COLOR.reset}`)).trim()
    if (!raw) return fallback

    const value = Number.parseInt(raw, 10)
    if (Number.isFinite(value) && value > 0) return value
    console.log(`  ${tr(locale, "invalidInput")}`)
  }
}

async function askConfirm(prompt, locale, label) {
  const raw = await prompt.ask(`\n  ${COLOR.bold}${label}${COLOR.reset} [y/N] `)
  return isAffirmative(locale, raw)
}

function searchSeeds(filters, locale) {
  let seedFormat = filters.seedFormat
  let hashContext = null

  if (!seedFormat || !filters.hashMode) {
    const bundle = readConfigBundle()
    const info = detectSeedSlot(bundle.data)
    if (!seedFormat) seedFormat = info.format
    hashContext = filters.hashMode
      ? { mode: filters.hashMode, source: "cli:--hash-mode" }
      : resolveHashMode(bundle.data)
    if (bundle.path) {
      console.log(`  ${COLOR.dim}${tr(locale, "detectedFormat")}: ${info.source} -> ${info.format}${COLOR.reset}`)
    }
  }
  if (!hashContext) {
    hashContext = filters.hashMode
      ? { mode: filters.hashMode, source: "cli:--hash-mode" }
      : resolveHashMode(null)
  }

  const generateSeed = seedFormat === "hex" ? randomHex64 : randomUUID
  const filterSummary = formatFilterSummary(filters, locale)

  console.log(`\n  ${COLOR.bold}${tr(locale, "searchBrief")}${COLOR.reset}`)
  console.log(`  ${COLOR.dim}${tr(locale, "detectedFormat")}: ${seedFormat}${COLOR.reset}`)
  console.log(`  ${COLOR.dim}${tr(locale, "hashMode")}: ${hashContext.mode}${COLOR.reset}`)
  console.log(`  ${COLOR.dim}${tr(locale, "filters")}: ${filterSummary || tr(locale, "any")}${COLOR.reset}`)
  console.log(`  ${COLOR.dim}${tr(locale, "budget")}: ${formatNumber(locale, filters.tries)}${COLOR.reset}`)
  console.log(`  ${COLOR.dim}${tr(locale, "requested")}: ${filters.limit}${COLOR.reset}`)
  console.log()

  const results = []
  const startedAt = performance.now()
  let heartbeatAt = startedAt

  for (let attempt = 0; attempt < filters.tries; attempt++) {
    const now = performance.now()
    if (now - heartbeatAt > 5000) {
      const rate = Math.round((attempt + 1) / ((now - startedAt) / 1000))
      if (isZh(locale)) {
        console.log(`  ${COLOR.dim}... ${tr(locale, "searched")} ${formatNumber(locale, attempt + 1)}，约 ${formatNumber(locale, rate)}/s${COLOR.reset}`)
      } else {
        console.log(`  ${COLOR.dim}... ${formatNumber(locale, attempt + 1)} ${tr(locale, "searched")} (${formatNumber(locale, rate)}/s)${COLOR.reset}`)
      }
      heartbeatAt = now
    }

    const seed = generateSeed()
    const rng = splitmix32(hash32(seed + SALT, hashContext.mode))

    const rarity = rollRarity(rng)
    if (filters.rarity && rarity !== filters.rarity) continue

    const species = pick(rng, SPECIES)
    if (filters.species && species !== filters.species) continue

    const eye = pick(rng, EYES)
    if (filters.eye && eye !== filters.eye) continue

    const hat = rarity === "common" ? "none" : pick(rng, HATS)
    if (filters.hat && hat !== filters.hat) continue

    const shiny = rng() < 0.01
    if (filters.shiny && !shiny) continue

    const stats = rollStats(rng, rarity)
    if (filters.statFloor && !Object.values(stats).every(value => value >= filters.statFloor)) continue

    const profile = { seed, rarity, species, eye, hat, shiny, stats }
    results.push(profile)

    const seconds = ((performance.now() - startedAt) / 1000).toFixed(1)
    if (isZh(locale)) {
      console.log(`  ${COLOR.bold}${tr(locale, "match")} #${results.length}${COLOR.reset} · 第 ${formatNumber(locale, attempt + 1)} 次命中 · ${seconds}s`)
    } else {
      console.log(`  ${COLOR.bold}${tr(locale, "match")} #${results.length}${COLOR.reset} after ${formatNumber(locale, attempt + 1)} ${tr(locale, "attempts")} · ${seconds}s`)
    }
    printProfileCard(profile, locale, { title: tr(locale, "traitSheet") })

    if (results.length >= filters.limit) break
  }

  const total = ((performance.now() - startedAt) / 1000).toFixed(1)
  if (results.length === 0) {
    console.log(`  ${tr(locale, "noMatches")} (${total}s)`)
  } else if (isZh(locale)) {
    console.log(`  ${COLOR.bold}共找到 ${results.length} 个结果${COLOR.reset} · ${total}s`)
  } else {
    console.log(`  ${COLOR.bold}Found ${results.length} result(s)${COLOR.reset} in ${total}s`)
  }

  return results
}

function runInspect(locale) {
  const bundle = readConfigBundle()
  validateConfigPresence(bundle, locale)

  const info = detectSeedSlot(bundle.data)
  const hashContext = resolveHashMode(bundle.data)
  const profile = deriveBuddy(info.value, hashContext.mode)

  console.log(`\n  ${COLOR.bold}${tr(locale, "inspectTitle")}${COLOR.reset}`)
  printConfigContext(bundle, info, hashContext, locale)
  printProfileCard(profile, locale, { title: tr(locale, "currentSnapshot") })

  if (info.source === "oauthAccount.accountUuid") {
    if (isZh(locale)) console.log(`  ${COLOR.dim}当前账号以 OAuth 的 accountUuid 作为种子源。${COLOR.reset}\n`)
    else console.log(`  ${COLOR.dim}The active account is using oauthAccount.accountUuid as the seed source.${COLOR.reset}\n`)
  }
}

function runPreview(seed, locale) {
  const bundle = readConfigBundle()
  const hashContext = resolveHashMode(bundle.data)
  const profile = deriveBuddy(seed, hashContext.mode)
  printProfileCard(profile, locale, {
    title: tr(locale, "previewTitle"),
    caption: isZh(locale)
      ? `输入种子：${seed}（${tr(locale, "hashMode")}=${hashContext.mode}）`
      : `Input seed: ${seed} (${tr(locale, "hashMode")}=${hashContext.mode})`,
  })
}

function runStamp(seed, locale) {
  const bundle = readConfigBundle()
  validateConfigPresence(bundle, locale)

  const format = seedFormatOf(seed)
  if (format === "unknown") fatal(`  ${tr(locale, "badSeed")}`)

  const info = detectSeedSlot(bundle.data)
  const hashContext = resolveHashMode(bundle.data)
  if (info.format !== format) fatal(`  ${tr(locale, "formatError")} (${info.format} expected, got ${format})`)

  const profile = deriveBuddy(seed, hashContext.mode)
  console.log(`\n  ${COLOR.bold}${tr(locale, "stampTitle")}${COLOR.reset}`)
  printConfigContext(bundle, info, hashContext, locale)
  printProfileCard(profile, locale)

  const backupPath = `${bundle.path}.backup-${Date.now()}`
  copyFileSync(bundle.path, backupPath)

  if (info.source === "oauthAccount.accountUuid") bundle.data.oauthAccount.accountUuid = seed
  else bundle.data.userID = seed

  delete bundle.data.companion
  writeFileSync(bundle.path, `${JSON.stringify(bundle.data, null, 2)}\n`)

  console.log(`  ${COLOR.dim}${tr(locale, "backup")}: ${backupPath}${COLOR.reset}`)
  console.log(`  ${COLOR.dim}${tr(locale, "updatedField")}: ${info.source}${COLOR.reset}`)
  console.log(`  ${COLOR.bold}${tr(locale, "restartHint")}${COLOR.reset}`)
  console.log(`  ${COLOR.dim}${tr(locale, "llmNote")}${COLOR.reset}`)
}

async function runGuide(locale) {
  const prompt = createPrompt()

  try {
    console.log(`\n  ${COLOR.bold}${APP_NAME}${COLOR.reset}`)
    console.log(`  ${COLOR.dim}${tr(locale, "lead")}${COLOR.reset}`)
    console.log(`  ${COLOR.dim}${tr(locale, "helpHint")}${COLOR.reset}`)

    const bundle = readConfigBundle()
    if (bundle.path) {
      const info = detectSeedSlot(bundle.data)
      const hashContext = resolveHashMode(bundle.data)
      const current = deriveBuddy(info.value, hashContext.mode)
      const brief = `${localizedLabel(locale, RARITY_META, current.rarity)} ${localizedLabel(locale, SPECIES_META, current.species)}${current.shiny ? ` (${isZh(locale) ? "闪光" : "shiny"})` : ""}`
      console.log(`\n  ${COLOR.dim}${tr(locale, "currentSnapshot")}: ${brief} via ${info.source}, ${tr(locale, "hashMode")}=${hashContext.mode}${COLOR.reset}`)
    }

    const filters = {}
    const rarityExtras = Object.fromEntries(RARITIES.map(rarity => [rarity, `${RARITY_META[rarity].weight}%`]))

    filters.rarity = await askChoice(prompt, locale, isZh(locale) ? "先选稀有度：" : "Pick a rarity:", RARITIES, {
      render: value => dualLabel(locale, RARITY_META, value),
      extras: rarityExtras,
    })

    filters.species = await askChoice(prompt, locale, isZh(locale) ? "再选物种：" : "Pick a species:", SPECIES, {
      columns: 2,
      render: value => dualLabel(locale, SPECIES_META, value),
    })

    const wantShiny = await askConfirm(prompt, locale, isZh(locale) ? "要闪光吗？" : "Require shiny?")
    if (wantShiny) filters.shiny = true

    if (filters.rarity !== "common") {
      filters.hat = await askChoice(prompt, locale, isZh(locale) ? "想要什么帽子：" : "Pick a hat:", HATS, {
        columns: 2,
        render: value => dualLabel(locale, HAT_META, value),
      })
    }

    filters.eye = await askChoice(prompt, locale, isZh(locale) ? "挑一个眼睛样式：" : "Pick an eye style:", EYES)
    filters.statFloor = await askOptionalInteger(prompt, locale, tr(locale, "minStatPrompt"))

    const limit = await askOptionalInteger(prompt, locale, tr(locale, "resultCountPrompt"), 3)
    filters.limit = limit ?? 3
    filters.tries = 10_000_000
    filters.seedFormat = null

    if (!filters.rarity && !filters.species && !filters.shiny && !filters.hat && !filters.eye && !filters.statFloor) {
      console.log(`\n  ${tr(locale, "noFilters")}`)
      return
    }

    const brief = formatFilterSummary(filters, locale)
    console.log(`\n  ${COLOR.bold}${tr(locale, "searchBrief")}${COLOR.reset}`)
    console.log(`  ${COLOR.dim}${brief}${COLOR.reset}`)

    const confirmed = await askConfirm(prompt, locale, tr(locale, "startSearch"))
    if (!confirmed) {
      console.log(`  ${tr(locale, "cancelSearch")}`)
      return
    }

    const results = searchSeeds(filters, locale)
    if (results.length === 0) return

    let chosen = null
    if (results.length === 1) {
      const shouldStamp = await askConfirm(prompt, locale, tr(locale, "applySingle"))
      if (shouldStamp) chosen = results[0]
    } else {
      console.log(`\n  ${COLOR.bold}${tr(locale, "pickResult")}${COLOR.reset}`)
      results.forEach((profile, index) => {
        console.log(`    ${COLOR.dim}${index + 1}.${COLOR.reset} ${formatProfileSummary(profile, locale)} ${COLOR.dim}${profile.seed.slice(0, 24)}...${COLOR.reset}`)
      })
      console.log(`    ${COLOR.dim}0.${COLOR.reset} ${tr(locale, "skipStamp")}`)

      while (true) {
        const raw = (await prompt.ask(`  ${COLOR.dim}>${COLOR.reset} `)).trim()
        const choice = Number.parseInt(raw, 10)
        if (choice === 0) break
        if (choice >= 1 && choice <= results.length) {
          chosen = results[choice - 1]
          break
        }
        console.log(`    ${tr(locale, "invalidInput")}`)
      }
    }

    if (!chosen) {
      console.log(`  ${tr(locale, "noChanges")}`)
      for (const profile of results) {
        console.log(`  ${COLOR.dim}${cliExample(`stamp ${profile.seed}`)}${COLOR.reset}`)
      }
      return
    }

    runStamp(chosen.seed, locale)
  } finally {
    prompt.close()
  }
}

function printHelp(locale) {
  const speciesList = SPECIES.join(", ")
  const rarityList = RARITIES.join(", ")
  const hatList = HATS.join(", ")
  const eyeList = EYES.join("  ")

  console.log(`
${COLOR.bold}${APP_NAME}${COLOR.reset}
${tr(locale, "lead")}

${COLOR.bold}${tr(locale, "usage")}:${COLOR.reset}
  ${cliExample("guide")}
  ${cliExample("hunt [filters]")}
  ${cliExample("inspect")}
  ${cliExample("preview <seed>")}
  ${cliExample("stamp <seed>")}

${COLOR.bold}${tr(locale, "commands")}:${COLOR.reset}
  guide                 ${tr(locale, "guideDesc")}
  hunt                  ${tr(locale, "huntDesc")}
  inspect               ${tr(locale, "inspectDesc")}
  preview <seed>        ${tr(locale, "previewDesc")}
  stamp <seed>          ${tr(locale, "stampDesc")}

${COLOR.bold}${tr(locale, "filters")}:${COLOR.reset}
  --species <name>      ${speciesList}
  --rarity <tier>       ${rarityList}
  --eye <char>          ${eyeList}
  --hat <name>          ${hatList}
  --shiny               ${isZh(locale) ? "要求闪光" : "require shiny"}
  --stat-floor <n>      ${isZh(locale) ? "要求所有属性 >= n" : "require every stat >= n"}

${COLOR.bold}${tr(locale, "tuning")}:${COLOR.reset}
  --limit <n>           ${isZh(locale) ? "保留多少个结果（默认 3）" : "how many matches to keep (default 3)"}
  --tries <n>           ${isZh(locale) ? "最大尝试次数（默认 10,000,000）" : "max attempts (default 10,000,000)"}
  --seed-format <fmt>   ${isZh(locale) ? "覆盖种子格式：uuid 或 hex" : "override seed format: uuid or hex"}
  --hash-mode <mode>    ${isZh(locale) ? "覆盖哈希模式：auto、bun、fnv1a" : "override hash mode: auto, bun, fnv1a"}
  --lang <value>        ${tr(locale, "langOption")}

${COLOR.bold}${tr(locale, "aliases")}:${COLOR.reset}
  search -> hunt
  current/show -> inspect
  check/peek -> preview
  apply/write -> stamp

${COLOR.bold}${tr(locale, "examples")}:${COLOR.reset}
  ${cliExample("guide --lang zh")}
  ${cliExample("hunt --species dragon --rarity legendary --shiny --limit 2")}
  ${cliExample("inspect --lang en")}
  ${cliExample("preview 9ab738bf-fb82-40fb-917d-0020259c8408")}
  ${cliExample("stamp f853b71e-3774-4bc7-b4a8-4cc0ed266f9f")}
`)
}

function normalizeCommand(raw) {
  const aliases = {
    guide: "guide",
    guided: "guide",
    wizard: "guide",
    hunt: "hunt",
    search: "hunt",
    inspect: "inspect",
    current: "inspect",
    show: "inspect",
    preview: "preview",
    peek: "preview",
    check: "preview",
    stamp: "stamp",
    apply: "stamp",
    write: "stamp",
    help: "help",
  }
  return aliases[raw] || null
}

function parsePositiveNumber(raw, locale, flag) {
  const value = Number.parseInt(raw, 10)
  if (!Number.isFinite(value) || value <= 0) fatal(`  ${flag} expects a positive integer`)
  return value
}

function parseHuntOptions(args, locale) {
  const options = {
    rarity: null,
    species: null,
    eye: null,
    hat: null,
    shiny: false,
    statFloor: null,
    limit: 3,
    tries: 10_000_000,
    seedFormat: null,
    hashMode: null,
  }

  for (let index = 0; index < args.length; index++) {
    const flag = args[index]
    switch (flag) {
      case "--species":
        options.species = args[++index]?.toLowerCase()
        break
      case "--rarity":
        options.rarity = args[++index]?.toLowerCase()
        break
      case "--eye":
        options.eye = args[++index]
        break
      case "--hat":
        options.hat = args[++index]?.toLowerCase()
        break
      case "--shiny":
        options.shiny = true
        break
      case "--stat-floor":
      case "--min-stats":
        options.statFloor = parsePositiveNumber(args[++index], locale, flag)
        break
      case "--limit":
      case "--count":
        options.limit = parsePositiveNumber(args[++index], locale, flag)
        break
      case "--tries":
      case "--max":
        options.tries = parsePositiveNumber(args[++index], locale, flag)
        break
      case "--seed-format":
      case "--format": {
        const value = args[++index]
        if (value !== "uuid" && value !== "hex") fatal(`  ${flag} expects uuid or hex`)
        options.seedFormat = value
        break
      }
      case "--hash-mode": {
        const value = args[++index]?.toLowerCase()
        if (!["auto", "bun", "fnv1a"].includes(value)) fatal(`  ${flag} expects auto, bun, or fnv1a`)
        options.hashMode = value === "auto" ? null : value
        break
      }
      default:
        fatal(`  Unknown flag: ${flag}`)
    }
  }

  if (options.species && !SPECIES.includes(options.species)) {
    fatal(`  Unknown species: ${options.species}`)
  }
  if (options.rarity && !RARITIES.includes(options.rarity)) {
    fatal(`  Unknown rarity: ${options.rarity}`)
  }
  if (options.eye && !EYES.includes(options.eye)) {
    fatal(`  Unknown eye: ${options.eye}`)
  }
  if (options.hat && !HATS.includes(options.hat)) {
    fatal(`  Unknown hat: ${options.hat}`)
  }

  return options
}

function extractGlobals(argv) {
  let langChoice = "auto"
  let showHelp = false
  const rest = []

  for (let index = 0; index < argv.length; index++) {
    const token = argv[index]
    if (token === "--lang") {
      const value = argv[++index]
      if (!value || !["auto", "en", "zh"].includes(value)) fatal("  --lang expects auto, en, or zh")
      langChoice = value
      continue
    }
    if (token === "--help" || token === "-h") {
      showHelp = true
      continue
    }
    rest.push(token)
  }

  return { langChoice, showHelp, rest }
}

async function main() {
  const { langChoice, showHelp, rest } = extractGlobals(process.argv.slice(2))
  const locale = detectLocale(langChoice)

  if (showHelp) {
    printHelp(locale)
    return
  }

  if (rest.length === 0) {
    await runGuide(locale)
    return
  }

  let command = null
  let args = rest

  if (rest[0].startsWith("-")) {
    command = "hunt"
  } else {
    command = normalizeCommand(rest[0])
    args = rest.slice(1)
  }

  if (!command) fatal(`  Unknown command: ${rest[0]}`)

  switch (command) {
    case "help":
      printHelp(locale)
      break
    case "guide":
      await runGuide(locale)
      break
    case "hunt": {
      const options = parseHuntOptions(args, locale)
      if (!options.rarity && !options.species && !options.eye && !options.hat && !options.shiny && !options.statFloor) {
        fatal(`  ${tr(locale, "noFilters")}`)
      }
      const results = searchSeeds(options, locale)
      if (results.length > 0) {
        for (const profile of results) {
          console.log(`  ${COLOR.dim}${cliExample(`stamp ${profile.seed}`)}${COLOR.reset}`)
        }
      }
      break
    }
    case "inspect":
      runInspect(locale)
      break
    case "preview": {
      const seed = args[0]
      if (!seed) fatal(`  ${isZh(locale) ? "用法：preview <seed>" : "Usage: preview <seed>"}`)
      runPreview(seed, locale)
      break
    }
    case "stamp": {
      const seed = args[0]
      if (!seed) fatal(`  ${isZh(locale) ? "用法：stamp <seed>" : "Usage: stamp <seed>"}`)
      runStamp(seed, locale)
      break
    }
    default:
      fatal(`  Unknown command: ${command}`)
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
