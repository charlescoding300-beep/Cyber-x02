// commands/antitag.js
module.exports = {
  pattern: "antitag",
  alias: [],
  category: "group",
  desc: "Delete messages that mention/tag members in this group",
  usage: ".antitag on | .antitag off",

  async run({ sock, from, msg, args, isGroup, isAdmin, isOwner, helper }) {
    if (!isGroup) return helper.reply(sock, msg, "❌ This command only works in groups.")
    if (!isAdmin && !isOwner) return helper.reply(sock, msg, "❌ Only group admins can use this.")

    const sub   = (args[0] || "").toLowerCase()
    const phone = (sock.user?.id || "").split("@")[0].split(":")[0]

    if (sub === "on") {
      global.__antitagEnable?.(phone, from)
      return helper.reply(sock, msg, "✅ Antitag *enabled* for this group.")
    }
    if (sub === "off") {
      global.__antitagDisable?.(phone, from)
      return helper.reply(sock, msg, "🚫 Antitag *disabled* for this group.")
    }

    const enabled = global.__antitagIsEnabled?.(phone, from)
    return helper.reply(sock, msg, `*Antitag status:* ${enabled ? "✅ ON" : "🚫 OFF"}\n\nUsage:\n.antitag on\n.antitag off`)
  },
}
