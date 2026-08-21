// ─────────────────────────────────────────────────────────────────────────────
// lib/session.js — CYBER X (personal edition) PERSISTENCE ENGINE
//
// Problem this solves: every setting the owner changes — antilink toggles,
// antitag, antistatus, custom commands, prefix, private-mode, warnings —
// gets written to a JSON file under data/ immediately. That's fine on a VPS
// with a real disk. But on Render (and most free hosts), the disk is
// EPHEMERAL: every redeploy or restart wipes it, and all of that comes back
// blank even though the bot itself reconnects fine.
//
// This module is the fix. It:
//   1. Gathers every per-feature JSON file into one snapshot object.
//   2. Pushes that snapshot somewhere durable — Upstash Redis (REST API,
//      no extra npm install needed) if UPSTASH_REDIS_REST_URL /
//      UPSTASH_REDIS_REST_TOKEN are set in .env, otherwise a local backup
//      file (still useful on hosts with a real persistent disk).
//   3. On boot, pulls the snapshot back down and writes it into the exact
//      files index.js already expects to find — so nothing else in the
//      bot needs to know this module exists. Settings just "are there"
//      again after a restart, like they never left.
//
// No Redis creds set? Everything still works — you just get local-file
// persistence instead of cross-redeploy persistence, and a one-time log
// line telling you how to upgrade to real persistence if you want it.
// ─────────────────────────────────────────────────────────────────────────────

const fs   = require("fs")
const path = require("path")

const ROOT           = path.join(__dirname, "..")
const DATA_DIR        = path.join(ROOT, "data")
const SETTINGS_DIR    = path.join(DATA_DIR, "settings")
const ANTILINK_DIR    = path.join(DATA_DIR, "antilink")
const ANTITAG_DIR     = path.join(DATA_DIR, "antitag")
const ANTISTATUS_DIR  = path.join(DATA_DIR, "antistatus")
const CUSTOMCMD_DIR   = path.join(DATA_DIR, "customcmds")
const LOCAL_BACKUP_DIR = path.join(DATA_DIR, "backup")

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL   || ""
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || ""
const REDIS_READY = !!(REDIS_URL && REDIS_TOKEN)

const KEY_PREFIX = process.env.SESSION_BACKUP_KEY_PREFIX || "cyberx:personal"

if (!REDIS_READY) {
  console.log(
    "[SESSION] ℹ Running with local-file persistence only (no UPSTASH_REDIS_REST_URL/TOKEN set). " +
    "Fine on a VPS with a real disk — on Render/ephemeral hosts, settings will reset on redeploy " +
    "unless you add Upstash Redis env vars for permanent persistence."
  )
}

function safePhone(phone) { return (phone || "unknown").replace(/[^a-zA-Z0-9._-]/g, "_") }

function readJsonSafe(file, fallback) {
  try { if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8")) } catch {}
  return fallback
}

function writeJsonSafe(file, data) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
    return true
  } catch (e) {
    console.error(`[SESSION] ✗ write failed for ${file}:`, e.message)
    return false
  }
}

// ── Gather every per-feature file this bot writes into one object ─────────
function buildSnapshot(phone) {
  const p = safePhone(phone)
  return {
    savedAt:    Date.now(),
    settings:   readJsonSafe(path.join(SETTINGS_DIR,   `${phone}.json`), {}),
    antilink:   readJsonSafe(path.join(ANTILINK_DIR,   `${p}.json`),     { groups: {}, warnings: {} }),
    antitag:    readJsonSafe(path.join(ANTITAG_DIR,    `${p}.json`),     { groups: {} }),
    antistatus: readJsonSafe(path.join(ANTISTATUS_DIR, `${p}.json`),     { groups: {}, warnings: {} }),
    customcmds: readJsonSafe(path.join(CUSTOMCMD_DIR,  `${p}.json`),     {}),
  }
}

// ── Write a snapshot back into the individual files everything else reads
function applySnapshot(phone, snap) {
  if (!snap || typeof snap !== "object") return false
  const p = safePhone(phone)
  if (snap.settings)   writeJsonSafe(path.join(SETTINGS_DIR,   `${phone}.json`), snap.settings)
  if (snap.antilink)   writeJsonSafe(path.join(ANTILINK_DIR,   `${p}.json`),     snap.antilink)
  if (snap.antitag)    writeJsonSafe(path.join(ANTITAG_DIR,    `${p}.json`),     snap.antitag)
  if (snap.antistatus) writeJsonSafe(path.join(ANTISTATUS_DIR, `${p}.json`),     snap.antistatus)
  if (snap.customcmds) writeJsonSafe(path.join(CUSTOMCMD_DIR,  `${p}.json`),     snap.customcmds)
  return true
}

// ── Redis REST helpers (Upstash) — plain fetch, no client library needed ──
async function redisSet(key, value) {
  const res = await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(value),
  })
  if (!res.ok) throw new Error(`Redis SET failed: HTTP ${res.status}`)
}

async function redisGet(key) {
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  })
  if (!res.ok) throw new Error(`Redis GET failed: HTTP ${res.status}`)
  const data = await res.json()
  if (!data?.result) return null
  try { return JSON.parse(data.result) } catch { return null }
}

// ── Public: push current state to durable storage ──────────────────────────
async function pushSnapshot(phone) {
  const snap = buildSnapshot(phone)
  if (REDIS_READY) {
    try {
      await redisSet(`${KEY_PREFIX}:${safePhone(phone)}`, snap)
      return true
    } catch (e) {
      console.error("[SESSION] ✗ Redis backup push failed, falling back to local file:", e.message)
    }
  }
  writeJsonSafe(path.join(LOCAL_BACKUP_DIR, `${safePhone(phone)}.snapshot.json`), snap)
  return true
}

// ── Public: pull durable state and restore it into the live files ─────────
async function restoreSnapshot(phone) {
  let snap = null
  if (REDIS_READY) {
    try { snap = await redisGet(`${KEY_PREFIX}:${safePhone(phone)}`) }
    catch (e) { console.error("[SESSION] ✗ Redis restore failed, checking local backup:", e.message) }
  }
  if (!snap) {
    snap = readJsonSafe(path.join(LOCAL_BACKUP_DIR, `${safePhone(phone)}.snapshot.json`), null)
  }
  if (!snap) {
    console.log(`[SESSION] ℹ No prior backup found for ${phone} — starting fresh`)
    return false
  }
  applySnapshot(phone, snap)
  const savedAgo = snap.savedAt ? Math.round((Date.now() - snap.savedAt) / 1000) : "?"
  console.log(`[SESSION] ✔ Restored settings/antilink/antitag/antistatus/customcmds for ${phone} (backup was ${savedAgo}s old, source: ${REDIS_READY ? "Redis" : "local file"})`)
  return true
}

// ── Public: periodic autosave so you never lose more than N seconds ───────
let autoSaveTimer = null
function startAutoSave(phone, intervalMs = 60000) {
  if (autoSaveTimer) clearInterval(autoSaveTimer)
  autoSaveTimer = setInterval(() => {
    pushSnapshot(phone).catch(e => console.error("[SESSION] autosave error:", e.message))
  }, intervalMs)
  console.log(`[SESSION] 💾 Autosave active every ${Math.round(intervalMs / 1000)}s (${REDIS_READY ? "Redis-backed — survives redeploys" : "local file — survives restarts, not fresh Render redeploys"})`)
}

function stopAutoSave() {
  if (autoSaveTimer) { clearInterval(autoSaveTimer); autoSaveTimer = null }
}

module.exports = {
  redisReady: REDIS_READY,
  buildSnapshot, applySnapshot,
  pushSnapshot, restoreSnapshot,
  startAutoSave, stopAutoSave,
}
