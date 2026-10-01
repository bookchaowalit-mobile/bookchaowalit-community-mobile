import { describe, expect, it } from "vitest";
import { castVote, isFeedState, type FeedState } from "../community";
import { encodeEnvelope, valueCodec } from "../persist";

const base: FeedState = {
  posts: [{ id: "p", title: "Hello", author: "ann", tags: ["x"], createdAt: 1, upvotes: 2, downvotes: 0 }],
  votes: {},
};

describe("castVote", () => {
  it("updates counts and the remembered vote together", () => {
    const up = castVote(base, "p", 1);
    expect(up.posts[0].upvotes).toBe(3);
    expect(up.votes.p).toBe(1);
    const flipped = castVote(up, "p", -1);
    expect(flipped.posts[0]).toMatchObject({ upvotes: 2, downvotes: 1 });
    expect(castVote(flipped, "p", -1).votes.p).toBe(0);
  });
});

describe("feed persistence", () => {
  const codec = valueCodec(isFeedState);
  it("round-trips posts and votes", () => {
    const state = castVote(base, "p", 1);
    expect(codec.decode(codec.encode(state))).toEqual(state);
  });
  it("rejects malformed state", () => {
    expect(codec.decode(encodeEnvelope({ ...base, votes: { p: 2 } }))).toBeUndefined();
    expect(codec.decode(encodeEnvelope({ ...base, posts: [{ ...base.posts[0], upvotes: -1 }] }))).toBeUndefined();
    expect(codec.decode(encodeEnvelope({ posts: [] }))).toBeUndefined();
  });
});
