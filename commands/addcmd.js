// commands/addcmd.js
module.exports = {
  pattern: "addcmd",
  alias: ["newcmd"],
  category: "owner",
  desc: "Add a custom auto-reply command",
  usage: ".addcmd <trigger>|<response>\nExample: .addcmd hello|Hey there! 👋",

  async run({ sock, msg, text, isOwner, helper }) {
    if (!isOwner) return helper.reply(sock, msg, "❌ Only the owner can use this.")

    const [trigger, ...rest] = text.split("|")
    const response = rest.join("|").trim()
    if (!trigger?.trim() || !response) {
      return helper.reply(sock, msg, "❌ Usage: .addcmd <trigger>|<response>\nExample: .addcmd hello|Hey there! 👋")
    }

    const phone = (sock.user?.id || "").split("@")[0].split(":")[0]
    global.__customCmdAdd?.(phone, trigger.trim(), response)

    return helper.reply(sock, msg, helper.box("✅ CUSTOM COMMAND SAVED", [`Trigger: ${trigger.trim()}`]))
  },
}
