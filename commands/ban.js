// commands/ban.js
const fs = require("fs")
const path = require("path")

const DIR = path.join(__dirname, "..", "data", "bans")
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true })

function safePhone(p) { return (p || "unknown").replace(/[^a-zA-Z0-9._-]/g, "_") }
function filePath(phone) { return path.join(DIR, `${safePhone(phone)}.json`) }

function loadAll(phone) {
  const file = filePath(phone)
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch (e) {
    console.error("[BAN] load error:", e.message)
  }
  return {}
}

function saveAll(phone, data) {
  try {
    fs.writeFileSync(filePath(phone), JSON.stringify(data, null, 2))
  } catch (e) {
    console.error("[BAN] save error:", e.message)
  }
}

function normalizeNum(raw = "") {
  return String(raw).replace(/@.+$/, "").replace(/:\d+$/, "").replace(/\D/g, "").trim()
}

// Called directly by index.js as lib.isBanned(sessionPhone, targetPhone, chatJid)
function isBanned(sessionPhone, targetPhone) {
  return !!loadAll(sessionPhone)[normalizeNum(targetPhone)]
}

function banUser(sessionPhone, targetPhone, reason = "") {
  const all = loadAll(sessionPhone)
  all[normalizeNum(targetPhone)] = { bannedAt: Date.now(), reason }
  saveAll(sessionPhone, all)
}

function unbanUser(sessionPhone, targetPhone) {
  const all = loadAll(sessionPhone)
  const key = normalizeNum(targetPhone)
  if (all[key] === undefined) return false
  delete all[key]
  saveAll(sessionPhone, all)
  return true
}

function listBanned(sessionPhone) {
  return Object.keys(loadAll(sessionPhone))
}

function extractTarget({ msg, args }) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
  const quoted    = msg.message?.extendedTextMessage?.contextInfo?.participant
  if (mentioned) return mentioned
  if (quoted) return quoted
  if (args[0]) return args[0].replace(/\D/g, "") + "@s.whatsapp.net"
  return null
}

module.exports = {
  pattern: "ban",
  alias: [],
  category: "admin",
  desc: "Ban a user from using the bot",
  usage: ".ban @user | .ban 234801234567 | reply to their message with .ban",
  isBanned,
  banUser,
  unbanUser,
  listBanned,

  async run({ sock, msg, args, isOwner, isAdmin, helper, banCacheInvalidate }) {
    if (!isOwner && !isAdmin) return helper.reply(sock, msg, "❌ Only admins/owner can ban.")

    const target = extractTarget({ msg, args })
    if (!target) return helper.reply(sock, msg, "❌ Mention, reply to, or give the number of the user to ban.\nUsage: .ban @user")

    const targetPhone  = normalizeNum(target)
    const sessionPhone = normalizeNum(sock.user?.id || "")
    const isNumberArg  = args[0] && /^\+?\d[\d\s-]*$/.test(args[0])
    const reason        = (isNumberArg ? args.slice(1) : args.slice(0)).join(" ").trim()

    banUser(sessionPhone, targetPhone, reason)
    banCacheInvalidate?.(targetPhone)

    return helper.reply(sock, msg, helper.box("🚫 USER BANNED", [
      `Number: +${targetPhone}`,
      reason ? `Reason: ${reason}` : "No reason given",
    ]))
  },
}
