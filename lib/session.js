// lib/session.js
// Bundles every per-phone JSON store this bot keeps locally — settings,
// antilink, antitag, antistatus, custom commands, bans, the antidelete
// userDb, and welcome/goodbye greet config — into one snapshot per phone
// and pushes it to Upstash. Covers changes made in DMs and group chats
// alike, since all of it lands in one of these folders regardless of
// where the command was run. Safe no-op when Upstash env vars aren't set.

const fs   = require("fs")
const path = require("path")
const upstash = require("./upstash")

const DATA_ROOT = path.join(__dirname, "..", "data")

const SECTIONS = ["settings", "antilink", "antitag", "antistatus", "customcmds", "bans", "userdb", "greet"]

function safePhone(p) { return (p || "unknown").replace(/[^a-zA-Z0-9._-]/g, "_") }

function readSectionFile(section, phone) {
  const file = path.join(DATA_ROOT, section, `${safePhone(phone)}.json`)
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch (e) {
    console.error(`[SESSION-PERSIST] read error (${section}/${phone}):`, e.message)
  }
  return null
}

function writeSectionFile(section, phone, data) {
  const dir  = path.join(DATA_ROOT, section)
  const file = path.join(dir, `${safePhone(phone)}.json`)
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
  } catch (e) {
    console.error(`[SESSION-PERSIST] write error (${section}/${phone}):`, e.message)
  }
}

async function pushSnapshot(phone) {
  if (!upstash.ENABLED) return
  const snapshot = {}
  for (const section of SECTIONS) {
    const data = readSectionFile(section, phone)
    if (data !== null) snapshot[section] = data
  }
  if (!Object.keys(snapshot).length) return
  await upstash.set(`cyberx:snapshot:${safePhone(phone)}`, JSON.stringify(snapshot))
}

async function restoreSnapshot(phone) {
  if (!upstash.ENABLED) {
    console.log("[SESSION] ℹ Running with local-file persistence only (no UPSTASH_REDIS_REST_URL/TOKEN set). Fine on a VPS with a real disk — on Render/ephemeral hosts, settings will reset on redeploy unless you add Upstash Redis env vars for permanent persistence.")
    return
  }
  const raw = await upstash.get(`cyberx:snapshot:${safePhone(phone)}`)
  if (!raw) { console.log(`[SESSION-PERSIST] no snapshot found in Upstash for ${phone} — starting fresh`); return }
  let snapshot
  try { snapshot = JSON.parse(raw) } catch (e) { console.error("[SESSION-PERSIST] corrupt snapshot:", e.message); return }
  const restoredSections = []
  for (const section of SECTIONS) {
    if (snapshot[section] !== undefined) {
      writeSectionFile(section, phone, snapshot[section])
      restoredSections.push(section)
    }
  }
  console.log(`[SESSION-PERSIST] ✔ Restored snapshot for ${phone} from Upstash (${restoredSections.join(", ") || "empty"})`)
}

const autoSaveTimers = new Map()

function startAutoSave(phone, intervalMs) {
  if (autoSaveTimers.has(phone)) return
  const timer = setInterval(() => { pushSnapshot(phone).catch(() => {}) }, intervalMs)
  autoSaveTimers.set(phone, timer)
}

module.exports = { pushSnapshot, restoreSnapshot, startAutoSave }

