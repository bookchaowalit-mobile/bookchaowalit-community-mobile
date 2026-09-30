import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  type FeedState,
  type FeedSort,
  type Post,
  castVote,
  isFeedState,
  normalizeTags,
  queryFeed,
  score,
  tagCounts,
  validatePost,
} from "../../lib/community";
import { valueCodec } from "../../lib/persist";
import { usePersistentState } from "../../lib/usePersistentState";

const NOW = Date.now();
const H = 3_600_000;
const SEED: Post[] = [
  { id: "1", title: "Share your weekend side project", author: "ann", tags: ["showcase"], createdAt: NOW - 30 * H, upvotes: 24, downvotes: 2 },
  { id: "2", title: "Best way to learn TypeScript in 2026?", author: "bob", tags: ["typescript", "help"], createdAt: NOW - 5 * H, upvotes: 9, downvotes: 0 },
  { id: "3", title: "Expo Router tips and tricks thread", author: "cat", tags: ["expo", "tips"], createdAt: NOW - 1 * H, upvotes: 3, downvotes: 0 },
  { id: "4", title: "Weekly meetup: remote pairing session", author: "dan", tags: ["events"], createdAt: NOW - 50 * H, upvotes: 12, downvotes: 1 },
];
const SORTS: FeedSort[] = ["hot", "new", "top"];
const feedCodec = valueCodec(isFeedState);

export default function FeedScreen() {
  const [feedState, setFeedState] = usePersistentState<FeedState>("community.feed.v1", { posts: SEED, votes: {} }, feedCodec);
  const { posts, votes } = feedState;
  const [sort, setSort] = useState<FeedSort>("hot");
  const [tag, setTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const feed = useMemo(() => queryFeed(posts, { sort, tag, search }), [posts, sort, tag, search]);
  const tags = useMemo(() => tagCounts(posts), [posts]);

  const vote = (id: string, pressed: 1 | -1) => setFeedState((s) => castVote(s, id, pressed));

  const submit = () => {
    const problem = validatePost(title);
    setError(problem);
    if (problem) return;
    const post: Post = {
      id: String(Date.now()),
      title: title.trim(),
      author: "you",
      tags: normalizeTags(tagInput),
      createdAt: Date.now(),
      upvotes: 1,
      downvotes: 0,
    };
    setFeedState((s) => ({ posts: [post, ...s.posts], votes: { ...s.votes, [post.id]: 1 } }));
    setTitle("");
    setTagInput("");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <TextInput accessibilityLabel="Post title" onChangeText={setTitle} placeholder="Start a discussion…" style={styles.input} value={title} />
        <TextInput
          accessibilityLabel="Tags, comma separated"
          autoCapitalize="none"
          onChangeText={setTagInput}
          placeholder="Tags (e.g. help, expo)"
          style={styles.input}
          value={tagInput}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable accessibilityRole="button" accessibilityLabel="Post discussion" onPress={submit} style={styles.button}>
          <Text style={styles.buttonText}>Post</Text>
        </Pressable>
      </View>

      <TextInput accessibilityLabel="Search posts" onChangeText={setSearch} placeholder="Search title or author" style={styles.input} value={search} />

      <View style={styles.chips}>
        {SORTS.map((s) => (
          <Chip key={s} label={s} active={s === sort} onPress={() => setSort(s)} />
        ))}
      </View>
      <View style={styles.chips}>
        <Chip label="all" active={tag === null} onPress={() => setTag(null)} />
        {tags.map(([t, n]) => (
          <Chip key={t} label={`#${t} (${n})`} active={tag === t} onPress={() => setTag(tag === t ? null : t)} />
        ))}
      </View>

      {feed.length === 0 && <Text style={styles.empty}>No posts match.</Text>}
      {feed.map((p) => {
        const mine = votes[p.id] ?? 0;
        return (
          <View key={p.id} style={styles.post}>
            <View style={styles.voteCol}>
              <Pressable accessibilityLabel={`Upvote ${p.title}`} accessibilityRole="button" accessibilityState={{ selected: mine === 1 }} hitSlop={8} onPress={() => vote(p.id, 1)}>
                <Text style={[styles.arrow, mine === 1 && styles.arrowActive]}>▲</Text>
              </Pressable>
              <Text accessibilityLabel={`Score ${score(p)}`} style={styles.score}>
                {score(p)}
              </Text>
              <Pressable accessibilityLabel={`Downvote ${p.title}`} accessibilityRole="button"
 accessibilityState={{ selected: mine === -1 }} hitSlop={8} onPress={() => vote(p.id, -1)}>
                <Text style={[styles.arrow, mine === -1 && styles.arrowActive]}>▼</Text>
              </Pressable>
            </View>
            <View style={styles.postBody}>
              <Text style={styles.postTitle}>{p.title}</Text>
              <Text style={styles.meta}>
                by {p.author}
                {p.tags.length ? ` · ${p.tags.map((t) => `#${t}`).join(" ")}` : ""}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  content: { padding: 16, gap: 10 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 12, gap: 8 },
  input: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  error: { color: "#C62828", fontSize: 13 },
  button: { backgroundColor: "#2F6DB5", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 14, borderWidth: 1, borderColor: "#2F6DB5", paddingHorizontal: 10, paddingVertical: 4 },
  chipActive: { backgroundColor: "#2F6DB5" },
  chipText: { color: "#2F6DB5", textTransform: "capitalize" },
  chipTextActive: { color: "#fff" },
  empty: { color: "#666", textAlign: "center", marginTop: 16 },
  post: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, padding: 12, gap: 12 },
  voteCol: { alignItems: "center", width: 36 },
  arrow: { fontSize: 18, color: "#888" },
  arrowActive: { color: "#2F6DB5" },
  score: { fontWeight: "700", color: "#222" },
  postBody: { flex: 1, gap: 4 },
  postTitle: { fontSize: 16, fontWeight: "600", color: "#222" },
  meta: { fontSize: 12, color: "#666" },
});
