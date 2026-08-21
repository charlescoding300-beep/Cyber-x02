// lib/sessionBackup.js
// Personal-use stub. index.js calls these on every creds update, memory
// warning, and shutdown — but since this is a single-device deployment,
// the local data/ + sessions/ folders on disk are already your backup.
// No remote target is configured, so these are safe no-ops.
//
// If you later want crash-proof backups that survive a full host wipe
// (e.g. pushing to a private GitHub repo like the old SADBOY build did),
// fill these in — the shape index.js expects is already correct.

async function schedulePush(_phone) {}
async function pushImmediate(_phone) {}
async function pushAll() {}
async function deleteSession(_phone) {}
async function restore(_phone) { return false }
async function restoreAll() { return 0 }

module.exports = { schedulePush, pushImmediate, pushAll, deleteSession, restore, restoreAll }
