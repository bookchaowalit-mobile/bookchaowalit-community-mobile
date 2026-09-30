# Community — Mobile

React Native mobile app (Expo) for **Community**.

Part of [Chaowalit Greepoke](https://bookchaowalit.com)'s 101 Portfolio Projects.

## Features

- **Community feed** (Feed tab): start a discussion with tags, up/down-vote posts
  (tap again to clear), sort by *hot* (score with time decay), *new* or *top*,
  filter by tag and search by title/author. Data is in-memory for now.
- Feed logic lives in `lib/community.ts` (pure TypeScript, unit-tested).

## Tech Stack

- **Framework:** Expo SDK 53 + Expo Router
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based)
- **UI:** React Native + Ionicons

## Getting Started

```bash
npm install
npx expo start
```

## Scripts

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint (eslint-config-expo)
npm test            # vitest unit tests for lib/
npx expo export --platform android --output-dir dist   # JS bundle smoke check
```

CI (`.github/workflows/build.yml`) runs all of the above with `npm ci`; failures
are not masked. The EAS preview build only runs on `main` when the `EXPO_TOKEN`
secret is configured (run `eas init` once to link the project).

## Build

```bash
# Android
npx eas build --platform android --profile preview

# iOS
npx eas build --platform ios --profile preview
```

## Related

- **Frontend:** [bookchaowalit-website/community-frontend](https://github.com/bookchaowalit-website/community-frontend)
- **Portfolio:** [bookchaowalit.com](https://bookchaowalit.com)

## License

MIT
