// commands/cmdlist.js
module.exports = {
  pattern: "cmdlist",
  alias: ["mycommands"],
  category: "owner",
  desc: "List all your custom commands",
  usage: ".cmdlist",

  async run({ sock, msg, helper }) {
    const phone = (sock.user?.id || "").split("@")[0].split(":")[0]
    const list = global.__customCmdList?.(phone) || []
    if (!list.length) return helper.reply(sock, msg, "You have no custom commands yet. Add one with .addcmd <trigger>|<response>")
    return helper.reply(sock, msg, helper.box("📋 CUSTOM COMMANDS", list.map(c => `• ${c}`)))
  },
}
