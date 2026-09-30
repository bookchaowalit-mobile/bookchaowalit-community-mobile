import { describe, expect, it } from "vitest";
import {
  type Post,
  applyVote,
  hotRank,
  nextVote,
  normalizeTags,
  queryFeed,
  score,
  tagCounts,
  validatePost,
} from "../community";

const H = 3_600_000;
const T0 = Date.UTC(2026, 0, 1);
const post = (id: string, over: Partial<Post> = {}): Post => ({
  id,
  title: `Post ${id}`,
  author: "ann",
  tags: [],
  createdAt: T0,
  upvotes: 0,
  downvotes: 0,
  ...over,
});

describe("votes", () => {
  it("applies, switches and clears votes", () => {
    const p = post("a", { upvotes: 3, downvotes: 1 });
    expect(score(applyVote(p, 0, 1))).toBe(3);
    expect(score(applyVote(p, 1, -1))).toBe(0);
    expect(score(applyVote(p, -1, 0))).toBe(3);
  });

  it("toggles off when the same arrow is pressed", () => {
    expect(nextVote(1, 1)).toBe(0);
    expect(nextVote(0, -1)).toBe(-1);
    expect(nextVote(-1, 1)).toBe(1);
  });

  it("never goes negative", () => {
    expect(applyVote(post("a"), 1, 0).upvotes).toBe(0);
  });
});

describe("hotRank", () => {
  it("favours recent posts over slightly more popular old ones", () => {
    const old = post("old", { upvotes: 20, createdAt: T0 });
    const fresh = post("new", { upvotes: 5, createdAt: T0 + 24 * H });
    expect(hotRank(fresh)).toBeGreaterThan(hotRank(old));
  });

  it("penalises negative scores", () => {
    const good = post("g", { upvotes: 10 });
    const bad = post("b", { downvotes: 10 });
    expect(hotRank(good)).toBeGreaterThan(hotRank(bad));
  });
});

describe("tags", () => {
  it("normalizes tag input", () => {
    expect(normalizeTags("#React, react  expo,,#TS")).toEqual(["react", "expo", "ts"]);
    expect(normalizeTags("a b c d e f g")).toHaveLength(5);
  });

  it("counts tags", () => {
    const posts = [post("1", { tags: ["b", "a"] }), post("2", { tags: ["a"] })];
    expect(tagCounts(posts)).toEqual([["a", 2], ["b", 1]]);
  });
});

describe("queryFeed", () => {
  const posts = [
    post("1", { title: "Hello Expo", tags: ["expo"], upvotes: 1, createdAt: T0 }),
    post("2", { title: "Typescript tips", tags: ["ts"], upvotes: 9, createdAt: T0 + H }),
    post("3", { title: "Expo router", tags: ["expo"], upvotes: 4, createdAt: T0 + 2 * H, author: "bob" }),
  ];

  it("sorts by new and top", () => {
    expect(queryFeed(posts, { sort: "new" }).map((p) => p.id)).toEqual(["3", "2", "1"]);
    expect(queryFeed(posts, { sort: "top" }).map((p) => p.id)).toEqual(["2", "3", "1"]);
  });

  it("filters by tag and search", () => {
    expect(queryFeed(posts, { sort: "new", tag: "expo" }).map((p) => p.id)).toEqual(["3", "1"]);
    expect(queryFeed(posts, { sort: "new", search: "BOB" }).map((p) => p.id)).toEqual(["3"]);
  });

  it("does not mutate the input", () => {
    queryFeed(posts, { sort: "top" });
    expect(posts.map((p) => p.id)).toEqual(["1", "2", "3"]);
  });
});

describe("validatePost", () => {
  it("checks title length", () => {
    expect(validatePost("hey")).toMatch(/at least/);
    expect(validatePost("A fine title")).toBeNull();
  });
});
