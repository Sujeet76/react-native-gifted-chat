<p align="center">
  <a href="https://www.npmjs.com/package/@sujeetdotkumar/react-native-gifted-chat-performant"><img alt="npm version" src="https://badge.fury.io/js/@sujeetdotkumar%2Freact-native-gifted-chat-performant.svg"/></a>
  <img src="https://img.shields.io/badge/platforms-iOS%20%7C%20Android%20%7C%20Web-lightgrey.svg" alt="platforms">
  <img src="https://img.shields.io/badge/TypeScript-supported-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/Expo-compatible-000020.svg" alt="Expo compatible">
</p>

<h1 align="center">react-native-gifted-chat-performant</h1>

<p align="center">
  A high-performance fork of <a href="https://github.com/FaridSafi/react-native-gifted-chat">react-native-gifted-chat</a> built for large message lists.
</p>

---

## What's different from the original

This fork replaces the core rendering stack with purpose-built, higher-performance primitives while keeping the full public API intact (except the date/time format props — see [Breaking Changes](#breaking-changes)).

### List renderer — LegendList v3

The `AnimatedFlatList` (a `react-native-gesture-handler` FlatList wrapped in `Animated.createAnimatedComponent`) has been replaced with [`KeyboardChatLegendList`](https://www.legendapp.com/open-source/list/v3/) from `@legendapp/list`.

LegendList is purpose-built for chat and large lists in React Native. Key advantages over FlatList:
- Separate recycling pools per item type (`'message'` vs `'day'`) — prevents layout thrash between different-height items
- `maintainScrollAtEnd`, `alignItemsAtEnd`, `initialScrollAtEnd` — purpose-built chat scroll semantics without an `inverted` prop hack
- `sharedValues` prop syncs scroll offset directly to a Reanimated `SharedValue` — no `useAnimatedScrollHandler` needed
- Pure JS, no native code, no extra `pod install`

### Day separator tracking — eliminated

The original implementation tracked day separator positions using a `CellRendererComponent` that fired a layout worklet on **every message item** on every render. Those positions were stored in a `daysPositions` SharedValue, sorted (O(n log n)), and interpolated on every scroll frame. All of that is gone.

Day separators are now interleaved directly in the data array (`displayData`) alongside messages. An `onViewableItemsChanged` callback tracks the topmost visible day for the animated overlay — zero per-item overhead.

### Keyboard handling — KeyboardStickyView

`KeyboardAvoidingView` (which can cause layout jumps on keyboard open) has been replaced with:
- `KeyboardChatLegendList` handles keyboard-aware scroll internally
- `KeyboardStickyView` from `react-native-keyboard-controller` keeps the input toolbar pinned above the keyboard

### dayjs removed — native Intl APIs

`dayjs` (~5 KB gzipped) has been removed entirely. All date and time formatting now uses the built-in `Intl.DateTimeFormat` API, which is zero-cost (already part of the JS engine), supports the same locale strings, and produces identical output.

### lodash.isequal removed

`lodash.isequal` was listed as a dependency in the original but was not imported anywhere in `src/`. Removed.

### React.memo on leaf components

`Day`, `Time`, and `GiftedAvatar` are now wrapped with `React.memo` to prevent unnecessary re-renders when parent state changes don't affect their props.

### Performance summary

| Bottleneck | Original | This fork |
|---|---|---|
| List virtualization | RNGH FlatList + Animated wrapper | LegendList v3 with separate recycling pools |
| Day position tracking | O(n log n) sort + worklet per item layout | Eliminated — data-driven via `displayData` |
| Per-item CellRendererComponent | Fires worklet on every item layout | Removed |
| `daysPositions` SharedValue | Modified per-item, read per scroll frame | Removed |
| dayjs bundle | ~5 KB gzipped | 0 (native Intl) |
| lodash.isequal | ~4 KB gzipped | 0 (removed) |

---

## Breaking Changes

### Date & time format props

The original `dayjs`-based format props have been replaced with `Intl.DateTimeFormatOptions`:

| Original prop | Type | Replacement | Type |
|---|---|---|---|
| `timeFormat` | `string` (dayjs format, e.g. `'LT'`) | `timeFormatOptions` | `Intl.DateTimeFormatOptions` |
| `dateFormat` | `string` (dayjs format, e.g. `'D MMMM'`) | `dateFormatOptions` | `Intl.DateTimeFormatOptions` |
| `dateFormatCalendar` | `object` (dayjs calendar options) | removed — use `dateFormatOptions` | — |

**Migration example:**

```tsx
// Before
<GiftedChat timeFormat='HH:mm' dateFormat='D MMMM' />

// After
<GiftedChat
  timeFormatOptions={{ hour: '2-digit', minute: '2-digit', hour12: false }}
  dateFormatOptions={{ day: 'numeric', month: 'long' }}
/>
```

The `locale` prop continues to work — it is passed directly to `Intl.DateTimeFormat` as the locale string.

---

## Features

- Fully customizable — override any component with your own implementation
- Composer actions — attach photos, files, or trigger custom actions
- Reply to messages — swipe-to-reply with reply preview and message threading
- Load earlier messages — infinite scroll with pagination support
- Copy to clipboard — long-press messages to copy text
- Smart link parsing — auto-detect URLs, emails, phone numbers, hashtags, mentions
- Avatars — user initials or custom avatar images
- Localized dates — full i18n support via native `Intl.DateTimeFormat`
- Keyboard handling — `KeyboardChatLegendList` + `KeyboardStickyView` for all platforms
- System messages — display system notifications in chat
- Quick replies — bot-style quick reply buttons
- Typing indicator — show when users are typing
- Message status — tick indicators for sent/delivered/read states
- Scroll to bottom — quick navigation button
- Web support — works with react-native-web
- Expo support — easy integration with Expo projects
- TypeScript — complete TypeScript definitions included

---

## Requirements

| Requirement | Version |
|-------------|---------|
| React Native | >= 0.70.0 |
| iOS | >= 13.4 |
| Android | API 21+ (Android 5.0) |
| Expo | SDK 50+ |
| react-native-keyboard-controller | >= 1.21.0 |
| TypeScript | >= 5.0 (optional) |

---

## Installation

### Expo Projects

```bash
npx expo install @sujeetdotkumar/react-native-gifted-chat-performant @legendapp/list react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-keyboard-controller
```

### Bare React Native Projects

```bash
yarn add @sujeetdotkumar/react-native-gifted-chat-performant @legendapp/list react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-keyboard-controller
```

Then install iOS pods:

```bash
npx pod-install
```

And follow the [react-native-reanimated installation guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/#step-2-add-reanimateds-babel-plugin) to add the Babel plugin.

---

## Usage

```jsx
import React, { useState, useCallback, useEffect } from 'react'
import { GiftedChat } from '@sujeetdotkumar/react-native-gifted-chat-performant'
import { useHeaderHeight } from '@react-navigation/elements'

export function Example() {
  const [messages, setMessages] = useState([])
  const headerHeight = useHeaderHeight()

  useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: 'Hello developer',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'John Doe',
          avatar: 'https://placeimg.com/140/140/any',
        },
      },
    ])
  }, [])

  const onSend = useCallback((messages = []) => {
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, messages),
    )
  }, [])

  return (
    <GiftedChat
      messages={messages}
      onSend={messages => onSend(messages)}
      user={{ _id: 1 }}
      keyboardAvoidingViewProps={{ keyboardVerticalOffset: headerHeight }}
    />
  )
}
```

---

## Props Reference

### Core Configuration

- **`messages`** _(Array)_ - Messages to display
- **`user`** _(Object)_ - User sending the messages: `{ _id, name, avatar }`
- **`onSend`** _(Function)_ - Callback when sending a message
- **`messageIdGenerator`** _(Function)_ - Generate an id for new messages. Defaults to a simple random string generator.
- **`locale`** _(String)_ - Locale string passed to `Intl.DateTimeFormat` (e.g. `'fr'`, `'de'`, `'ja'`)
- **`colorScheme`** _('light' | 'dark')_ - Force color scheme. When `undefined`, uses the system color scheme.

### Refs

- **`messagesContainerRef`** _(LegendList ref)_ - Ref to the list
- **`textInputRef`** _(TextInput ref)_ - Ref to the text input

### Keyboard & Layout

- **`keyboardProviderProps`** _(Object)_ - Props for [`KeyboardProvider`](https://kirillzyusko.github.io/react-native-keyboard-controller/docs/api/keyboard-provider)
- **`keyboardAvoidingViewProps`** _(Object)_ - Props including `keyboardVerticalOffset` (distance from screen top to GiftedChat container — use `useHeaderHeight()` when inside a navigation stack)
- **`isAlignedTop`** _(Boolean)_ - Align bubbles to top instead of bottom; default `false`
- **`isInverted`** _(Bool)_ - Reverses display order of `messages`; default `true`

### Text Input & Composer

- **`text`** _(String)_ - Controlled input text
- **`initialText`** _(String)_ - Initial text in the input field
- **`isSendButtonAlwaysVisible`** _(Bool)_ - Always show send button; default `false`
- **`minComposerHeight`** / **`maxComposerHeight`** _(Number)_ - Composer height bounds
- **`minInputToolbarHeight`** _(Integer)_ - Minimum toolbar height; default `44`
- **`renderInputToolbar`** _(Component | Function)_ - Custom input toolbar
- **`renderComposer`** _(Component | Function)_ - Custom text input
- **`renderSend`** _(Component | Function)_ - Custom send button
- **`renderActions`** _(Component | Function)_ - Custom action button (left of composer)
- **`renderAccessory`** _(Component | Function)_ - Custom second line below composer
- **`textInputProps`** _(Object)_ - Props passed to `<TextInput>`

### Messages & Message Container

- **`messagesContainerStyle`** _(Object)_ - Custom style for messages container
- **`renderMessage`** _(Component | Function)_ - Custom message container
- **`renderLoading`** _(Component | Function)_ - Loading view while initializing
- **`renderChatEmpty`** _(Component | Function)_ - Component when messages are empty
- **`renderChatFooter`** _(Component | Function)_ - Component below the message list
- **`listProps`** _(Object)_ - Extra props passed to the underlying `LegendList`

### Message Bubbles & Content

- **`renderBubble`** _(Component | Function)_ - Custom message bubble
- **`renderMessageText`** _(Component | Function)_ - Custom message text
- **`renderMessageImage`** _(Component | Function)_ - Custom message image
- **`renderMessageVideo`** _(Component | Function)_ - Custom message video
- **`renderMessageAudio`** _(Component | Function)_ - Custom message audio
- **`renderCustomView`** _(Component | Function)_ - Custom view inside the bubble
- **`isCustomViewBottom`** _(Bool)_ - Render custom view below text/image; default `false`
- **`onPressMessage`** / **`onLongPressMessage`** _(Function)_ - Message tap/long-press callbacks
- **`imageProps`** / **`imageStyle`** / **`videoProps`** - Image and video customization
- **`messageTextProps`** _(Object)_ - Props for `MessageText` (link parsing, matchers, styles)

### Avatars

- **`renderAvatar`** _(Component | Function | null)_ - Custom avatar; `null` to hide
- **`isUserAvatarVisible`** _(Bool)_ - Show avatar for current user; default `false`
- **`isAvatarVisibleForEveryMessage`** _(Bool)_ - Show avatar on every message; default `false`
- **`onPressAvatar`** / **`onLongPressAvatar`** _(Function)_ - Avatar tap callbacks
- **`isAvatarOnTop`** _(Bool)_ - Show avatar at top of consecutive messages; default `false`

### Username

- **`isUsernameVisible`** _(Bool)_ - Show username in bubble; default `false`
- **`renderUsername`** _(Component | Function)_ - Custom username component

### Date & Time

- **`timeFormatOptions`** _(Intl.DateTimeFormatOptions)_ - Format for message times; default `{ hour: '2-digit', minute: '2-digit' }`
- **`dateFormatOptions`** _(Intl.DateTimeFormatOptions)_ - Format for day separators; default `{ day: 'numeric', month: 'long' }`
- **`renderDay`** _(Component | Function)_ - Custom day separator
- **`renderTime`** _(Component | Function)_ - Custom time component
- **`timeTextStyle`** _(Object)_ - Custom time text style (supports left/right)
- **`isDayAnimationEnabled`** _(Bool)_ - Animated day label on scroll; default `true`

### System Messages

- **`renderSystemMessage`** _(Component | Function)_ - Custom system message

### Load Earlier Messages

- **`loadEarlierMessagesProps`** _(Object)_
  - `isAvailable` - Show/hide button
  - `onPress` - Load callback
  - `isLoading` - Show spinner
  - `isInfiniteScrollEnabled` - Auto-trigger `onPress` at top of list
  - `label`, `containerStyle`, `wrapperStyle`, `textStyle` - Customization
- **`renderLoadEarlier`** _(Component | Function)_ - Custom load-earlier button

### Typing Indicator

- **`isTyping`** _(Bool)_ - Show typing indicator; default `false`
- **`renderTypingIndicator`** _(Component | Function)_ - Custom typing indicator
- **`renderFooter`** _(Component | Function)_ - Custom footer (overrides typing indicator)

### Quick Replies

- **`onQuickReply`** _(Function)_ - Callback when quick reply is sent
- **`renderQuickReplies`** / **`renderQuickReplySend`** _(Function)_ - Custom renderers
- **`quickReplyStyle`** / **`quickReplyTextStyle`** / **`quickReplyContainerStyle`** - Styles

### Reply to Messages

```tsx
<GiftedChat
  reply={{
    swipe: {
      isEnabled: true,
      direction: 'left',
      onSwipe: (message) => setReplyMessage(message),
    },
    message: replyMessage,
    onClear: () => setReplyMessage(null),
  }}
/>
```

Full `reply` prop shape:

```typescript
interface ReplyProps<TMessage> {
  swipe?: {
    isEnabled?: boolean
    direction?: 'left' | 'right'
    onSwipe?: (message: TMessage) => void
    renderAction?: (progress, translation, position) => React.ReactNode
    actionContainerStyle?: StyleProp<ViewStyle>
  }
  previewStyle?: { containerStyle?, textStyle?, imageStyle? }
  messageStyle?: { containerStyle?, textStyle?, imageStyle?, ...left/right variants }
  message?: ReplyMessage
  onClear?: () => void
  onPress?: (message: TMessage) => void
  renderPreview?: (props: ReplyPreviewProps) => React.ReactNode
  renderMessageReply?: (props: MessageReplyProps) => React.ReactNode
}
```

### Scroll to Bottom

- **`isScrollToBottomEnabled`** _(Bool)_ - Show scroll-to-bottom button; default `false`
- **`scrollToBottomComponent`** _(Function)_ - Custom button content
- **`scrollToBottomStyle`** / **`scrollToBottomContentStyle`** - Styles

---

## Platform Notes

### Android

Add `android:windowSoftInputMode="adjustResize"` to your `AndroidManifest.xml`:

```xml
<activity
  android:name=".MainActivity"
  android:windowSoftInputMode="adjustResize"
  android:configChanges="keyboard|keyboardHidden|orientation|screenSize">
```

### Web (react-native-web)

`@legendapp/list` is pure JS and works with react-native-web. Follow the standard `react-native-web` webpack config to alias `react-native` imports.

---

## Contributing

```bash
yarn install
yarn build       # outputs to lib/
yarn test        # runs all tests
yarn lint        # check for lint errors
yarn lint:fix    # auto-fix lint errors
yarn prepublishOnly  # full validation: lint + test + build
```

---

## Credits

Based on [react-native-gifted-chat](https://github.com/FaridSafi/react-native-gifted-chat) by [Farid Safi](https://www.x.com/FaridSafi) and [contributors](https://github.com/FaridSafi/react-native-gifted-chat/graphs/contributors).

Performance improvements by [Sujeet Kumar](https://github.com/sujeetdotkumar).

---

## License

[MIT](LICENSE)
