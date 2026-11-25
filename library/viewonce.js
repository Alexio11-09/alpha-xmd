// Caches the FULL original message content for view-once media, keyed by
// message id. WhatsApp's "quoted message" copy (what .vv normally sees when
// someone replies) is often stripped of the real mediaKey/directPath fields,
// which is why downloading straight from the quote fails with
// "No valid media URL or directPath present in message". The original
// message, captured here the moment it first arrives, still has them.
//
// Capped in size (LRU-style) so this can't grow without bound across many
// sessions and busy groups.

const MAX = 300;
const store = new Map();

function remember(id, message) {
  if (!id || !message) return;
  store.set(id, message);
  if (store.size > MAX) store.delete(store.keys().next().value);
}

function get(id) {
  return id ? store.get(id) || null : null;
}

module.exports = { remember, get };
