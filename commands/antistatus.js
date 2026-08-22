// commands/antistatus.js
module.exports = {
  pattern: "antistatus",
  alias: [],
  category: "group",
  desc: "Warn or kick members who tag this group in their WhatsApp status",
  usage: ".antistatus on | .antistatus off | .antistatus warn | .antistatus kick",

  async run({ sock, from, msg, args, isGroup, isAdmin, isOwner, helper }) {
    if (!isGroup) return helper.reply(sock, msg, "❌ This command only works in groups.")
    if (!isAdmin && !isOwner) return helper.reply(sock, msg, "❌ Only group admins can use this.")

    const sub   = (args[0] || "").toLowerCase()
    const phone = (sock.user?.id || "").split("@")[0].split(":")[0]

    if (sub === "off") {
      global.__antistatusDisable?.(phone, from)
      return helper.reply(sock, msg, "🚫 Antistatus *disabled* for this group.")
    }
    if (["on", "warn", "kick"].includes(sub)) {
      const mode = sub === "on" ? "warn" : sub
      global.__antistatusEnable?.(phone, from, mode)
      return helper.reply(sock, msg, helper.box("✅ ANTISTATUS ENABLED", [`Mode: ${mode}`]))
    }

    const enabled = global.__antistatusIsEnabled?.(phone, from)
    const mode    = global.__antistatusGetMode?.(phone, from)
    return helper.reply(
      sock, msg,
      `*Antistatus settings*\nStatus: ${enabled ? "✅ ON" : "🚫 OFF"}${enabled ? `\nMode: ${mode}` : ""}\n\n` +
      "Usage:\n.antistatus on\n.antistatus off\n.antistatus warn\n.antistatus kick"
    )
  },
}
