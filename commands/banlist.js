// commands/banlist.js
const banLib = require("./ban.js")

function normalizeNum(raw = "") {
  return String(raw).replace(/@.+$/, "").replace(/:\d+$/, "").replace(/\D/g, "").trim()
}

module.exports = {
  pattern: "banlist",
  alias: ["banned"],
  category: "admin",
  desc: "List all currently banned numbers",
  usage: ".banlist",

  async run({ sock, msg, isOwner, isAdmin, helper }) {
    if (!isOwner && !isAdmin) return helper.reply(sock, msg, "❌ Only admins/owner can view this.")
    const sessionPhone = normalizeNum(sock.user?.id || "")
    const banned = banLib.listBanned(sessionPhone)
    if (!banned.length) return helper.reply(sock, msg, "Nobody is banned right now.")
    return helper.reply(sock, msg, helper.box("🚫 BANNED NUMBERS", banned.map(n => `+${n}`)))
  },
}
