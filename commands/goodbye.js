// commands/goodbye.js
const fs = require("fs")
const path = require("path")

const DIR = path.join(__dirname, "..", "data", "greet")
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true })

function safePhone(p) { return (p || "unknown").replace(/[^a-zA-Z0-9._-]/g, "_") }
function filePath(phone) { return path.join(DIR, `${safePhone(phone)}.json`) }

function loadAll(phone) {
  const file = filePath(phone)
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch (e) {
    console.error("[GREET] load error:", e.message)
  }
  return {}
}

function saveAll(phone, data) {
  try {
    fs.writeFileSync(filePath(phone), JSON.stringify(data, null, 2))
  } catch (e) {
    console.error("[GREET] save error:", e.message)
  }
}

// Same data file as welcome.js (shared per-group greet config) —
// called directly by index.js: cmdModule.loadGreet(phone, groupId)
function loadGreet(phone, groupId) {
  const all = loadAll(phone)
  const g = all[groupId] || {}
  return {
    welcome: g.welcome || { enabled: false, message: "" },
    goodbye: g.goodbye || { enabled: false, message: "" },
  }
}

function setGreet(phone, groupId, type, patch) {
  const all = loadAll(phone)
  if (!all[groupId]) all[groupId] = {}
  all[groupId][type] = { ...(all[groupId][type] || {}), ...patch }
  saveAll(phone, all)
}

module.exports = {
  pattern: "goodbye",
  alias: ["bye"],
  category: "group",
  desc: "Toggle goodbye messages, or set a custom one, for this group",
  usage: ".goodbye on | .goodbye off | .goodbye set <message>",
  loadGreet,
  setGreet,

  async run({ sock, from, msg, args, isGroup, isAdmin, isOwner, helper }) {
    if (!isGroup) return helper.reply(sock, msg, "❌ This command only works in groups.")
    if (!isAdmin && !isOwner) return helper.reply(sock, msg, "❌ Only group admins can use this.")

    const sub = (args[0] || "").toLowerCase()
    const phone = (sock.user?.id || "").split("@")[0].split(":")[0]

    if (sub === "on") {
      setGreet(phone, from, "goodbye", { enabled: true })
      return helper.reply(sock, msg, "✅ Goodbye messages *enabled* for this group.")
    }
    if (sub === "off") {
      setGreet(phone, from, "goodbye", { enabled: false })
      return helper.reply(sock, msg, "🚫 Goodbye messages *disabled* for this group.")
    }
    if (sub === "set") {
      const text = args.slice(1).join(" ")
      if (!text) {
        return helper.reply(
          sock, msg,
          "❌ Usage: .goodbye set <message>\nPlaceholders: {tag} {group} {members}"
        )
      }
      setGreet(phone, from, "goodbye", { message: text })
      return helper.reply(sock, msg, "✅ Custom goodbye message saved.")
    }

    const current = loadGreet(phone, from).goodbye
    return helper.reply(
      sock, msg,
      `*Goodbye settings*\nStatus: ${current.enabled ? "✅ ON" : "🚫 OFF"}\n\nUsage:\n.goodbye on\n.goodbye off\n.goodbye set <message>`
    )
  },
}
