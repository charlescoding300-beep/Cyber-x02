// commands/delcmd.js
module.exports = {
  pattern: "delcmd",
  alias: ["removecmd"],
  category: "owner",
  desc: "Remove a custom command",
  usage: ".delcmd <trigger>",

  async run({ sock, msg, args, isOwner, helper }) {
    if (!isOwner) return helper.reply(sock, msg, "❌ Only the owner can use this.")

    const trigger = args[0]
    if (!trigger) return helper.reply(sock, msg, "❌ Usage: .delcmd <trigger>")

    const phone = (sock.user?.id || "").split("@")[0].split(":")[0]
    const removed = global.__customCmdRemove?.(phone, trigger)

    return helper.reply(sock, msg, removed ? `✅ Removed *${trigger}*.` : `❌ No custom command called *${trigger}*.`)
  },
}
