// Channel permission overwrites, as plain data. Pure, so it is tested.
// type: 0 = role, 1 = member. allow / deny are BigInt permission bitfields.

/**
 * What a new channel should get: the category's overwrites copied (so the channel stays as private as its category),
 * then `extras` applied on top. For the permission bits an extra mentions, the extra wins over the category.
 * Returns undefined only when the category has no overwrites and nothing is added. Otherwise it returns the full list, never an empty one,
 * so a channel in a private category cannot end up with fewer restrictions than its category.
 */
export function mergeOverwrites(parent, extras) {
  if (extras.length === 0 && parent.length === 0) return undefined;
  const byKey = new Map(parent.map((o) => [`${o.type}:${o.id}`, { ...o }]));
  for (const extra of extras) {
    const key = `${extra.type}:${extra.id}`;
    const base = byKey.get(key) ?? { id: extra.id, type: extra.type, allow: 0n, deny: 0n };
    const mentioned = extra.allow | extra.deny;
    byKey.set(key, { id: base.id, type: base.type, allow: (base.allow & ~mentioned) | extra.allow, deny: (base.deny & ~mentioned) | extra.deny });
  }
  return [...byKey.values()];
}

/** Can this member (role ids + own id) see and write, given overwrites on top of the base permissions? Mirrors Discord's order. */
export function effective(base, overwrites, { memberId, roleIds, everyoneId }) {
  let perms = base;
  const find = (type, id) => overwrites.find((o) => o.type === type && o.id === id);
  const everyone = find(0, everyoneId);
  if (everyone) perms = (perms & ~everyone.deny) | everyone.allow;
  let deny = 0n;
  let allow = 0n;
  for (const id of roleIds) {
    const o = find(0, id);
    if (o) { deny |= o.deny; allow |= o.allow; }
  }
  perms = (perms & ~deny) | allow;
  const mine = find(1, memberId);
  if (mine) perms = (perms & ~mine.deny) | mine.allow;
  return perms;
}
