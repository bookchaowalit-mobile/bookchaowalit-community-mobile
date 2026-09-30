# Upgrade Plan

## Current state

Score: 5/10 (was 2/10) — working community feed (post, tags, votes, hot/new/top,
tag filter, search) with tested logic and honest CI; data is in-memory only.

## Backlog

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

## Done in this pass (pass 2)

Score: 6/10 (was 5/10) — posts and votes survive restarts and are stored atomically.

- Posts and this device's votes are stored together (`FeedState`) with AsyncStorage (`@react-native-async-storage/async-storage` 2.1.2) via `lib/usePersistentState.ts`, so counts and remembered votes cannot drift; vote logic moved into pure `castVote`; `isFeedState` rejects malformed data (tested).
- Accessibility: vote buttons name the post; post button labelled; profile links get link roles.
- Advisories: `overrides.postcss ^8.5.28` clears the high-severity PostCSS advisory in Expo metro-config (minor bump). Remaining `image-size` (metro, bundler-only), `uuid` (via `xcode`) and `decode-uri-component` (via `query-string@7`) need an Expo SDK major upgrade; deliberately not auto-fixed.
- Verified: typecheck, lint, 20 vitest tests, Android `expo export` bundle.
