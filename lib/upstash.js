// lib/upstash.js
// Minimal Upstash Redis REST client. Uses the built-in fetch — no
// @upstash/redis package needed. Reads UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN from .env. Without them, every call here is a
// safe no-op (ENABLED stays false) so the bot still runs fine on
// local-file-only persistence.

const BASE    = process.env.UPSTASH_REDIS_REST_URL
const TOKEN   = process.env.UPSTASH_REDIS_REST_TOKEN
const ENABLED = !!(BASE && TOKEN)

async function call(pathParts) {
  if (!ENABLED) return null
  const url = `${BASE.replace(/\/$/, "")}/${pathParts.map(encodeURIComponent).join("/")}`
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } })
    if (!res.ok) {
      console.error(`[UPSTASH] ✗ ${pathParts[0]} failed: HTTP ${res.status}`)
      return null
    }
    const data = await res.json()
    return data.result
  } catch (e) {
    console.error(`[UPSTASH] ✗ ${pathParts[0]} error:`, e.message)
    return null
  }
}

function set(key, value)  { return call(["set", key, value]) }
function get(key)         { return call(["get", key]) }
function del(key)         { return call(["del", key]) }
function keys(pattern)    { return call(["keys", pattern]) }

module.exports = { ENABLED, set, get, del, keys }
