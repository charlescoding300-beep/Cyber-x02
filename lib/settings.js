// lib/settings.js
// Global (non-per-session) settings store. index.js only reads the
// "owners" key from this today, but get/set are generic so you can
// stash anything else global here later.

const fs = require("fs")
const path = require("path")

const FILE = path.join(__dirname, "..", "data", "global-settings.json")
if (!fs.existsSync(path.dirname(FILE))) fs.mkdirSync(path.dirname(FILE), { recursive: true })

function loadAll() {
  try {
    if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, "utf8"))
  } catch (e) {
    console.error("[SETTINGS] load error:", e.message)
  }
  return {}
}

function saveAll(data) {
  try {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
  } catch (e) {
    console.error("[SETTINGS] save error:", e.message)
  }
}

function get(key) {
  return loadAll()[key]
}

function set(key, val) {
  const data = loadAll()
  data[key] = val
  saveAll(data)
  return val
}

module.exports = { get, set }
