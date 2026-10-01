/**
 * Pure community-feed logic (no React Native imports) so it can be unit-tested.
 */

export interface Post {
  id: string;
  title: string;
  author: string;
  tags: string[];
  createdAt: number;
  upvotes: number;
  downvotes: number;
}

export type Vote = -1 | 0 | 1;
export type FeedSort = "hot" | "new" | "top";

export const score = (p: Post) => p.upvotes - p.downvotes;

/**
 * Reddit-style "hot" rank: log-scaled net score plus a recency bonus,
 * so a new post with a few votes can outrank an old popular one.
 * `halfLifeHours` controls how many hours are worth one order of magnitude of votes.
 */
export function hotRank(p: Post, halfLifeHours = 12): number {
  const s = score(p);
  const order = Math.log10(Math.max(Math.abs(s), 1));
  const sign = Math.sign(s);
  const hours = p.createdAt / 3_600_000;
  return sign * order + hours / halfLifeHours;
}

/** Applies a change of the current user's vote from `previous` to `next`. */
export function applyVote(p: Post, previous: Vote, next: Vote): Post {
  let { upvotes, downvotes } = p;
  if (previous === 1) upvotes -= 1;
  if (previous === -1) downvotes -= 1;
  if (next === 1) upvotes += 1;
  if (next === -1) downvotes += 1;
  return { ...p, upvotes: Math.max(0, upvotes), downvotes: Math.max(0, downvotes) };
}

/** Tapping the same arrow again clears the vote. */
export const nextVote = (current: Vote, pressed: 1 | -1): Vote => (current === pressed ? 0 : pressed);

/** Lower-cases, strips `#` and whitespace, de-duplicates. Empty tags are dropped. */
export function normalizeTags(raw: string): string[] {
  // NFKC folds full-width "＃" and "，" (CJK/Thai keyboards) to "#" and ",";
  // zero-width characters would otherwise make visually identical tags differ.
  const tags = raw
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .split(/[,、\s]+/)
    .map((t) => t.replace(/^#+/, "").toLowerCase().trim())
    .filter(Boolean);
  return [...new Set(tags)].slice(0, 5);
}

/** Tag -> post count, most used first (ties alphabetical). */
export function tagCounts(posts: Post[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const p of posts) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export interface FeedQuery {
  sort: FeedSort;
  tag?: string | null;
  search?: string;
}

export function queryFeed(posts: Post[], { sort, tag, search }: FeedQuery): Post[] {
  const key = (s: string) => s.normalize("NFKC").toLowerCase();
  const needle = key(search?.trim() ?? "");
  const filtered = posts.filter(
    (p) =>
      (!tag || p.tags.includes(tag)) &&
      (!needle || key(p.title).includes(needle) || key(p.author).includes(needle)),
  );
  const cmp: Record<FeedSort, (a: Post, b: Post) => number> = {
    hot: (a, b) => hotRank(b) - hotRank(a),
    new: (a, b) => b.createdAt - a.createdAt,
    top: (a, b) => score(b) - score(a) || b.createdAt - a.createdAt,
  };
  return filtered.sort(cmp[sort]);
}

export function validatePost(title: string): string | null {
  // Count code points: "👍👍👍" is 3 characters, not 6 UTF-16 units.
  const n = Array.from(title.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").trim()).length;
  if (n < 5) return "Title must be at least 5 characters.";
  if (n > 120) return "Title must be at most 120 characters.";
  return null;
}

/** Posts plus this device's votes, stored together so they cannot drift apart. */
export interface FeedState {
  posts: Post[];
  votes: Record<string, Vote>;
}

/** Applies a vote press to both the post counts and the remembered vote. */
export function castVote(state: FeedState, id: string, pressed: 1 | -1): FeedState {
  const previous = state.votes[id] ?? 0;
  const next = nextVote(previous, pressed);
  return {
    posts: state.posts.map((p) => (p.id === id ? applyVote(p, previous, next) : p)),
    votes: { ...state.votes, [id]: next },
  };
}

function isPost(value: unknown): value is Post {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.title === "string" &&
    typeof p.author === "string" &&
    Array.isArray(p.tags) &&
    p.tags.every((t) => typeof t === "string") &&
    [p.createdAt, p.upvotes, p.downvotes].every((n) => typeof n === "number" && Number.isFinite(n)) &&
    (p.upvotes as number) >= 0 &&
    (p.downvotes as number) >= 0
  );
}

/** Type guard used when loading the feed from local storage. */
export function isFeedState(value: unknown): value is FeedState {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Record<string, unknown>;
  if (!Array.isArray(s.posts) || !s.posts.every(isPost)) return false;
  if (typeof s.votes !== "object" || s.votes === null || Array.isArray(s.votes)) return false;
  return Object.values(s.votes).every((v) => v === -1 || v === 0 || v === 1);
}
