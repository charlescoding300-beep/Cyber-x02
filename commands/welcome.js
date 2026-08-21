// commands/welcome.js
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

// Called directly by index.js: cmdModule.loadGreet(phone, groupId)
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
  pattern: "welcome",
  alias: ["welc"],
  category: "group",
  desc: "Toggle welcome messages, or set a custom one, for this group",
  usage: ".welcome on | .welcome off | .welcome set <message>",
  loadGreet,
  setGreet,

  async run({ sock, from, msg, args, isGroup, isAdmin, isOwner, helper }) {
    if (!isGroup) return helper.reply(sock, msg, "❌ This command only works in groups.")
    if (!isAdmin && !isOwner) return helper.reply(sock, msg, "❌ Only group admins can use this.")

    const sub = (args[0] || "").toLowerCase()
    const phone = (sock.user?.id || "").split("@")[0].split(":")[0]

    if (sub === "on") {
      setGreet(phone, from, "welcome", { enabled: true })
      return helper.reply(sock, msg, "✅ Welcome messages *enabled* for this group.")
    }
    if (sub === "off") {
      setGreet(phone, from, "welcome", { enabled: false })
      return helper.reply(sock, msg, "🚫 Welcome messages *disabled* for this group.")
    }
    if (sub === "set") {
      const text = args.slice(1).join(" ")
      if (!text) {
        return helper.reply(
          sock, msg,
          "❌ Usage: .welcome set <message>\nPlaceholders: {tag} {group} {members}"
        )
      }
      setGreet(phone, from, "welcome", { message: text })
      return helper.reply(sock, msg, "✅ Custom welcome message saved.")
    }

    const current = loadGreet(phone, from).welcome
    return helper.reply(
      sock, msg,
      `*Welcome settings*\nStatus: ${current.enabled ? "✅ ON" : "🚫 OFF"}\n\nUsage:\n.welcome on\n.welcome off\n.welcome set <message>`
    )
  },
}
