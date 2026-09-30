# Upgrade Plan

## Current state

Score: 5/10 (was 2/10) — working community feed (post, tags, votes, hot/new/top,
tag filter, search) with tested logic and honest CI; data is in-memory only.

## Backlog

- P0: Persist posts and votes (AsyncStorage now; community backend API later).
- P1: Post detail screen with comments (reuse the comments app's thread model).
- P1: Component tests for the feed screen (jest-expo + @testing-library/react-native).
- P1: Real user identity instead of the hard-coded "you" author.
- P2: Moderation: report/hide posts; rate-limit posting.
- P2: Link the EAS project (`eas init`) so the preview build job can run.

## Done in this pass

- Fixed the app not bundling: aligned `expo-router`/`react-native`/`expo-constants`
  with SDK 53 and added missing `expo-font`, `expo-asset`, `query-string` deps.
- Feed screen backed by pure `lib/community.ts` (vote transitions, hot rank,
  tag normalisation/counts, filtering and sorting) with 11 vitest tests.
- CI runs `npm ci`, typecheck, lint, tests and an Android JS bundle without `|| true`;
  EAS job skips cleanly without `EXPO_TOKEN`; added `eas.json`, ESLint config, lockfile.
