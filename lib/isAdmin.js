// lib/isAdmin.js
// Matches the exact call shapes used in index.js:
//   isAdminLib.isOwner(jid)
//   isAdminLib.isBotAdmin(state.groupCache, from, sock)
//   isAdminLib.isAdmin(state.groupCache, from, sender, sock, null, senderAlt)

function normalizeNum(raw = "") {
  return String(raw).replace(/@.+$/, "").replace(/:\d+$/, "").replace(/\D/g, "").trim()
}

function getOwnerNumbers() {
  return (process.env.OWNER_NUMBER || process.env.BOT_NUMBER || "")
    .split(",")
    .map(normalizeNum)
    .filter(Boolean)
}

function isOwner(jid) {
  const num = normalizeNum(jid)
  if (!num) return false
  return getOwnerNumbers().includes(num)
}

function isBotAdmin(groupCache, from, sock) {
  try {
    const meta = groupCache?.[from]
    if (!meta?.participants) return false
    const botNum = normalizeNum(sock?.user?.id || "")
    return meta.participants.some(
      p => normalizeNum(p.id) === botNum && (p.admin === "admin" || p.admin === "superadmin")
    )
  } catch {
    return false
  }
}

function isAdmin(groupCache, from, sender, sock, _unused, senderAlt) {
  try {
    const meta = groupCache?.[from]
    if (!meta?.participants) return false
    const candidates = [sender, senderAlt].filter(Boolean).map(normalizeNum)
    return meta.participants.some(
      p => candidates.includes(normalizeNum(p.id)) && (p.admin === "admin" || p.admin === "superadmin")
    )
  } catch {
    return false
  }
}

module.exports = { isOwner, isBotAdmin, isAdmin, normalizeNum, getOwnerNumbers }
