# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Type checking
yarn typecheck

# Build (outputs to lib/)
yarn build

# Lint
yarn lint
yarn lint:fix

# Tests (timezone is required)
yarn test                  # all tests
yarn test:watch            # watch mode
yarn test:coverage         # with coverage

# Run a single test file
TZ=Europe/Paris yarn jest src/__tests__/Bubble.test.tsx

# Start example app
yarn start                 # mobile (Expo)
yarn start:web             # web
```

> Node >= 20 required. Use `yarn`, not `npm`.

## Architecture

This is an ESM TypeScript library (compiled to `lib/`) with a React Native Expo example app. The source lives in `src/`, tests in `src/__tests__/`, and integration test helpers in `tests/`.

### Component hierarchy

```
GiftedChat          — root component; owns message state, reply state, locale, color scheme
  ├── GiftedChatContext — React context exposing actionSheet(), getLocale(), getColorScheme()
  ├── MessagesContainer — Reanimated AnimatedFlatList rendering the message list (inverted by default)
  │   └── Item          — per-message row: Day separator + Message
  │       └── DayAnimated — sticky day header that animates using Reanimated worklets
  └── InputToolbar    — composer row: Actions + Composer (TextInput) + Send + ReplyPreview
```

### Key data models (`src/Models.ts`)

- **`IMessage`** — the canonical message shape (`_id`, `text`, `createdAt`, `user`, optional `image/video/audio/quickReplies/replyMessage/location`).
- **`User`** — `{ _id, name?, avatar? }`.
- **`ReplyMessage`** — subset of `IMessage` used for reply-to previews.

All generic components are typed as `<TMessage extends IMessage>` so consumers can extend the message type.

### Rendering pattern

Custom render props follow the `renderComponentOrElement` utility (`src/utils.ts`): they accept a React element, function component, class component, or `null`. Calling `renderComponentOrElement(prop, props)` handles all cases correctly—prefer it over `React.createElement` or JSX when rendering user-supplied render props.

### Style conventions

- `src/styles.ts` provides shared layout helpers (`fill`, `centerItems`) and two utilities:
  - `getColorSchemeStyle(styles, baseName, colorScheme)` — appends `_light`/`_dark` suffix.
  - `getStyleWithPosition(styles, baseName, position)` — appends `_left`/`_right` suffix.
- `src/Color.ts` contains the named color palette.
- Each component owns a local `styles.ts` alongside its `index.tsx`.

### Dark mode

Components read color scheme via `useColorScheme()` from `src/hooks/useColorScheme.ts`, which checks `GiftedChatContext` first (for the `colorScheme` prop on `<GiftedChat>`) then falls back to the system value.

### Reply feature

Reply state is dual-mode: uncontrolled (internal `useState`) when `reply.message` is not passed, or controlled when it is. The `reply` prop group on `GiftedChat` bundles `message`, `onClear`, `swipe.onSwipe`, `renderPreview`, and `previewStyle`.

### External dependencies

| Package | Role |
|---|---|
| `react-native-reanimated` | Animated list, scroll handlers, sticky day headers, scroll-to-bottom button |
| `react-native-gesture-handler` | `TextInput`, `Pressable`, `Text` (replaces RN equivalents) |
| `react-native-keyboard-controller` | `KeyboardProvider` + `KeyboardAvoidingView` for reliable keyboard handling |
| `react-native-safe-area-context` | Safe area insets inside `GiftedChat` |
| `@expo/react-native-action-sheet` | Long-press action sheet |
| `dayjs` | Date formatting and locale |

### Build output

`yarn build` runs `tsc` and emits `lib/` (`.js` + `.d.ts` + source maps). The package exposes `lib/index.js` as its entry point. Tests are excluded from compilation via `tsconfig.json`.

### TypeScript strictness

`tsconfig.json` enables `strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, and `strictNullChecks`. All these must pass before `yarn build` or `yarn prepublishOnly` will succeed.
