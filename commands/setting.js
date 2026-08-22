// commands/setting.js
const BOOL_SETTINGS = {
  autoread:       "autoRead",
  autotyping:     "autoTyping",
  autorecording:  "autoRecording",
  alwaysonline:   "alwaysOnline",
  grouponly:      "groupOnly",
  dmonly:         "dmOnly",
  anticall:       "anticall",
  autoviewstatus: "autoViewStatus",
}

module.exports = {
  pattern: "setting",
  alias: ["settings", "config"],
  category: "owner",
  desc: "View or change bot settings",
  usage:
    ".setting                        → view all saved settings\n" +
    ".setting prefix !               → change command prefix\n" +
    ".setting mode private           → private/public mode\n" +
    ".setting autoread on            → mark incoming DMs as read\n" +
    ".setting autotyping on          → show 'typing...' before replies\n" +
    ".setting autorecording on       → show 'recording...' before replies\n" +
    ".setting alwaysonline on        → keep presence set to online\n" +
    ".setting grouponly on           → bot only responds in groups\n" +
    ".setting dmonly on              → bot only responds in DMs\n" +
    ".setting anticall on            → auto-reject incoming calls\n" +
    ".setting autoviewstatus on      → mark contacts' statuses as viewed\n" +
    ".setting autoreactstatus 🔥      → react to every status with this emoji\n" +
    ".setting autoreplytext <text>   → auto-reply to DMs when prefix isn't used\n" +
    ".setting autoreply off          → turn off auto-reply",

  async run({ sock, msg, args, isOwner, helper, settings }) {
    if (!isOwner) return helper.reply(sock, msg, "❌ Only the owner can change settings.")

    if (!args.length) {
      const all = settings.getAll()
      const keys = Object.keys(all)
      if (!keys.length) return helper.reply(sock, msg, "No custom settings saved — everything is at default.\n\n" + module.exports.usage)
      return helper.reply(sock, msg, helper.box("⚙️ CURRENT SETTINGS", keys.map(k => `${k}: ${JSON.stringify(all[k])}`)))
    }

    const key  = args[0].toLowerCase()
    const rest = args.slice(1).join(" ").trim()

    if (key === "prefix") {
      if (!rest) return helper.reply(sock, msg, "❌ Usage: .setting prefix <char>")
      settings.set("prefix", rest)
      return helper.reply(sock, msg, helper.box("✅ PREFIX CHANGED", [`New prefix: ${rest}`]))
    }

    if (key === "mode") {
      const val = rest.toLowerCase()
      if (!["public", "private"].includes(val)) {
        return helper.reply(sock, msg, "❌ Usage: .setting mode public | .setting mode private")
      }
      settings.set("mode", val)
      return helper.reply(sock, msg, helper.box("✅ MODE CHANGED", [
        `Mode: ${val}`,
        val === "private" ? "Only owner/sudo can use the bot now." : "Everyone can use the bot now.",
      ]))
    }

    if (BOOL_SETTINGS[key]) {
      const val = rest.toLowerCase()
      if (!["on", "off"].includes(val)) {
        return helper.reply(sock, msg, `❌ Usage: .setting ${key} on | .setting ${key} off`)
      }
      const settingKey = BOOL_SETTINGS[key]
      settings.set(settingKey, val === "on")
      return helper.reply(sock, msg, helper.box("✅ SETTING UPDATED", [`${settingKey}: ${val === "on" ? "ON" : "OFF"}`]))
    }

    if (key === "autoreply") {
      if (rest.toLowerCase() === "off") {
        settings.set("autoReply", false)
        return helper.reply(sock, msg, "🚫 Auto-reply *disabled*.")
      }
      return helper.reply(sock, msg, "❌ Usage: .setting autoreply off\n(To turn it on, use .setting autoreplytext <message> instead)")
    }

    if (key === "autoreplytext") {
      if (!rest) return helper.reply(sock, msg, "❌ Usage: .setting autoreplytext <message>\nUse {prefix} to insert the current prefix.")
      settings.set("autoReplyText", rest)
      settings.set("autoReply", true)
      return helper.reply(sock, msg, helper.box("✅ AUTO-REPLY ENABLED", [`Message: ${rest}`]))
    }

    if (key === "autoreactstatus") {
      if (!rest) return helper.reply(sock, msg, "❌ Usage: .setting autoreactstatus <emoji>\n(Also run .setting autoviewstatus on to mark statuses as viewed)")
      settings.set("statusReactEmoji", rest)
      settings.set("autoReactStatus", true)
      return helper.reply(sock, msg, helper.box("✅ STATUS AUTO-REACT ENABLED", [`Emoji: ${rest}`]))
    }

    return helper.reply(sock, msg, `❌ Unknown setting: ${key}\n\n${module.exports.usage}`)
  },
}
