// lib/sessionBackup.js
// Backs up the Baileys auth-state files (sessions/<phone>/*.json — creds,
// signal keys, etc) to Upstash so an ephemeral host redeploy doesn't wipe
// a session you already paired. Every function below is a safe no-op when
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN aren't set — the bot
// falls back to whatever's on local disk, same as before.

const fs   = require("fs")
const path = require("path")
const upstash = require("./upstash")

const SESS_ROOT = path.join(__dirname, "..", "sessions")

function safePhone(p) { return (p || "unknown").replace(/[^a-zA-Z0-9._-]/g, "_") }

// Tracks every phone this process has touched, so pushAll()/restoreAll()
// (called without a specific number) know what to loop over.
const knownPhones = new Set()

function readSessionFiles(phone) {
  const dir = path.join(SESS_ROOT, phone)
  if (!fs.existsSync(dir)) return null
  const out = {}
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".json")) continue
    try { out[file] = fs.readFileSync(path.join(dir, file), "utf8") }
    catch (e) { console.error(`[SESSION-BACKUP] read error (${phone}/${file}):`, e.message) }
  }
  return out
}

function writeSessionFiles(phone, files) {
  const dir = path.join(SESS_ROOT, phone)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  for (const [name, content] of Object.entries(files)) {
    try { fs.writeFileSync(path.join(dir, name), content) }
    catch (e) { console.error(`[SESSION-BACKUP] write error (${phone}/${name}):`, e.message) }
  }
}

async function pushImmediate(phone) {
  knownPhones.add(phone)
  if (!upstash.ENABLED) return
  const files = readSessionFiles(phone)
  if (!files || !Object.keys(files).length) return
  await upstash.set(`cyberx:authstate:${safePhone(phone)}`, JSON.stringify(files))
}

const pushDebounce = new Map()
function schedulePush(phone) {
  knownPhones.add(phone)
  if (!upstash.ENABLED) return
  clearTimeout(pushDebounce.get(phone))
  pushDebounce.set(phone, setTimeout(() => pushImmediate(phone).catch(() => {}), 3000))
}

async function pushAll() {
  if (!upstash.ENABLED) return
  await Promise.all([...knownPhones].map(p => pushImmediate(p)))
}

// Removes the auth-state backup from Upstash. Called on logout, and also
// by the SESSION-GUARD watchdog when a session never finished pairing
// within 60s — a session that never connected has nothing worth keeping.
async function deleteSession(phone) {
  knownPhones.delete(phone)
  if (!upstash.ENABLED) return
  await upstash.del(`cyberx:authstate:${safePhone(phone)}`)
  console.log(`[SESSION-BACKUP] 🗑️ Removed ${phone}'s auth state from Upstash`)
}

async function restore(phone) {
  if (!upstash.ENABLED) return false
  const raw = await upstash.get(`cyberx:authstate:${safePhone(phone)}`)
  if (!raw) return false
  let files
  try { files = JSON.parse(raw) } catch { return false }
  writeSessionFiles(phone, files)
  knownPhones.add(phone)
  console.log(`[SESSION-BACKUP] ✔ Restored WhatsApp auth state for ${phone} from Upstash`)
  return true
}

// index.js falls back to this if restore(BOT_PHONE) returns falsy — kept
// for that fallback chain, but restore(phone) above is the real path for
// personal edition's single session.
async function restoreAll() { return 0 }

module.exports = { pushImmediate, schedulePush, pushAll, deleteSession, restore, restoreAll }
