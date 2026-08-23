// commands/ping.js
module.exports = {
  pattern: "ping",
  alias: ["speed"],
  category: "general",
  desc: "Check bot response speed and live status",
  usage: ".ping",

  async run({ sock, msg, helper }) {
    await helper.react(sock, msg, "🚨")

    const start = Date.now()

    const sent = await sock.sendMessage(
      msg.key.remoteJid,
      { text: "🤖 *_𝕡𝕚𝕟𝕘𝕚𝕟𝕘 𝘾𝙔𝘽𝙀𝙍 𝙓. . ._*" },
      { quoted: msg }
    )

    const latency = Date.now() - start

    // process.uptime() is built into Node — real seconds since this
    // process started, no index.js wiring needed.
    const uptimeSec = Math.floor(process.uptime())
    const h = Math.floor(uptimeSec / 3600)
    const m = Math.floor((uptimeSec % 3600) / 60)
    const runtime = `${h}h ${m}m`

    const memMB = Math.round(process.memoryUsage().rss / 1024 / 1024)

    // global.__getStatus already exists in index.js (untouched, was already
    // there) and exposes ramLimitMB — used here only to flag high load.
    const ramLimit = global.__getStatus?.()?.ramLimitMB
    const status = ramLimit && memMB > ramLimit * 0.85 ? "High load" : "Stable"

    const text =
      "╭━━━〔 𝘾𝙔𝘽𝙀𝙍 𝙓 〕━━━╮\n" +
      "┃ ⚡ *PONG!*\n" +
      "┃\n" +
      "┃ 🚀 *Bot*       : *Online*\n" +
      `┃ ⏱️ *Latency*   : *${latency} ms*\n` +
      `┃ 🧠 *Runtime*   : *${runtime}*\n` +
      `┃ 💾 *Memory*    : *${memMB} MB*\n` +
      `┃ 📡 *Status*    : *${status}*\n` +
      "╰━━━━━━━━━━━━━━━━━━╯\n" +
      "> © 𝘾𝙔𝘽𝙀𝙍 𝙓"

    await sock.sendMessage(msg.key.remoteJid, { text, edit: sent.key })
  },
}
