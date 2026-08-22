// lib/userDb.js
// Simple per-phone, per-section JSON store. index.js's antidelete logic
// calls lib.userDb.getSection/setSection — without this file, antidelete
// silently never turns on. Also exports restoreAllFromRedis as a safe
// no-op since there's no remote store configured for personal use.

const fs = require("fs")
const path = require("path")

const DIR = path.join(__dirname, "..", "data", "userdb")
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true })

function safePhone(p) { return (p || "unknown").replace(/[^a-zA-Z0-9._-]/g, "_") }
function filePath(phone) { return path.join(DIR, `${safePhone(phone)}.json`) }

function loadAll(phone) {
  const file = filePath(phone)
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch (e) {
    console.error("[USERDB] load error:", e.message)
  }
  return {}
}

function saveAll(phone, data) {
  try {
    fs.writeFileSync(filePath(phone), JSON.stringify(data, null, 2))
  } catch (e) {
    console.error("[USERDB] save error:", e.message)
  }
}

function getSection(phone, section) {
  return loadAll(phone)[section] || {}
}

function setSection(phone, section, patch) {
  const all = loadAll(phone)
  all[section] = { ...(all[section] || {}), ...patch }
  saveAll(phone, all)
  return all[section]
}

async function restoreAllFromRedis() { return 0 }

module.exports = { getSection, setSection, restoreAllFromRedis }
