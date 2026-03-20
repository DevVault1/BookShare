function normalizeId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
}

function buildConversationKey(userA, userB, bookId) {
  const pair = [normalizeId(userA), normalizeId(userB)].sort();
  const context = normalizeId(bookId) || 'general';
  return `${pair.join('__')}::${context}`;
}

function buildUnreadCounts(existing = {}, currentUserId) {
  const normalized = typeof existing?.toObject === 'function' ? existing.toObject() : existing;
  return {
    ...(normalized || {}),
    [normalizeId(currentUserId)]: normalized?.[normalizeId(currentUserId)] || 0,
  };
}

module.exports = {
  normalizeId,
  buildConversationKey,
  buildUnreadCounts,
};
