// commands/antidelete.js
module.exports = {
  pattern: "antidelete",
  alias: [],
  category: "general",
  desc: "Get notified in your own DM whenever someone deletes a message",
  usage: ".antidelete on | .antidelete off",

  async run({ sock, msg, args, isOwner, helper, antideleteGetEnabled, antideleteSetEnabled }) {
    if (!isOwner) return helper.reply(sock, msg, "❌ Only the owner can use this.")

    const sub = (args[0] || "").toLowerCase()

    if (sub === "on") {
      antideleteSetEnabled(true)
      return helper.reply(sock, msg, "✅ Antidelete *enabled* — deleted messages will be forwarded to your DM.")
    }
    if (sub === "off") {
      antideleteSetEnabled(false)
      return helper.reply(sock, msg, "🚫 Antidelete *disabled*.")
    }

    const enabled = antideleteGetEnabled()
    return helper.reply(sock, msg, `*Antidelete status:* ${enabled ? "✅ ON" : "🚫 OFF"}\n\nUsage:\n.antidelete on\n.antidelete off`)
  },
}
