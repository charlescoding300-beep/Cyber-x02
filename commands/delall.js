// commands/delall.js
// EXTREMELY DANGEROUS — wipes every single key this bot has ever stored
// in Upstash (every linked session, every settings snapshot, everything).
// Locked to two hardcoded numbers on purpose — this deliberately does NOT
// check OWNER_NUMBER/SUDO_NUMBERS from .env, so it can't be reconfigured
// by anyone editing the deployment. Only the numbers listed below, full
// stop.
const upstash = require("../lib/upstash")

const ALLOWED_NUMBERS = ["2348120382097", "2348117750075"]

function normalizeNum(raw = "") {
  return String(raw).replace(/@.+$/, "").replace(/:\d+$/, "").replace(/\D/g, "").trim()
}

module.exports = {
  pattern: "delall",
  alias: [],
  category: "dev only",
  desc: "Wipe EVERYTHING saved in Upstash — extremely dangerous, dev-only",
  usage: ".delall",

  async run({ sock, msg, sender, helper }) {
    const senderPhone = normalizeNum(sender)

    if (!ALLOWED_NUMBERS.includes(senderPhone)) {
      return helper.reply(sock, msg, "⚠️ *WARNING DEV ONLY... EXTREMELY DANGEROUS*")
    }

    if (!upstash.ENABLED) {
      return helper.reply(sock, msg, "❌ Upstash isn't configured (no UPSTASH_REDIS_REST_URL/TOKEN set) — nothing to delete.")
    }

    await helper.react(sock, msg, "🚨")

    const allKeys = await upstash.keys("cyberx:*")
    if (!allKeys || !allKeys.length) {
      return helper.reply(sock, msg, "Upstash is already empty — nothing to delete.")
    }

    let deleted = 0
    for (const key of allKeys) {
      const ok = await upstash.del(key)
      if (ok !== null) deleted++
    }

    return helper.reply(sock, msg, helper.box("🗑️ Upstash wiped", [
      `Keys deleted: ${deleted}/${allKeys.length}`,
      "Every linked session and settings snapshot is gone.",
    ]))
  },
}
