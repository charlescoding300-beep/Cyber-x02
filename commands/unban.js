// commands/unban.js
const banLib = require("./ban.js")

function normalizeNum(raw = "") {
  return String(raw).replace(/@.+$/, "").replace(/:\d+$/, "").replace(/\D/g, "").trim()
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
  pattern: "unban",
  alias: [],
  category: "admin",
  desc: "Unban a previously banned user",
  usage: ".unban @user | .unban 234801234567 | reply to their message with .unban",

  async run({ sock, msg, args, isOwner, isAdmin, helper, banCacheInvalidate }) {
    if (!isOwner && !isAdmin) return helper.reply(sock, msg, "❌ Only admins/owner can unban.")

    const target = extractTarget({ msg, args })
    if (!target) return helper.reply(sock, msg, "❌ Mention, reply to, or give the number of the user to unban.\nUsage: .unban @user")

    const targetPhone  = normalizeNum(target)
    const sessionPhone = normalizeNum(sock.user?.id || "")
    const removed = banLib.unbanUser(sessionPhone, targetPhone)
    banCacheInvalidate?.(targetPhone)

    if (!removed) return helper.reply(sock, msg, "That number isn't banned.")
    return helper.reply(sock, msg, helper.box("✅ USER UNBANNED", [`Number: +${targetPhone}`]))
  },
}

