jest.mock('react-native-worklets', () =>
  require('react-native-worklets/lib/module/mock')
)

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
)

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 }
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaInsetsContext: {
      Consumer: ({ children }: any) => children(inset),
    },
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  }
})

jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest')
)

// Mock @legendapp/list packages to avoid native/worklet issues in Jest
jest.mock('@legendapp/list/react-native', () => {
  const React = require('react')
  const { FlatList } = require('react-native')
  const MockList = React.forwardRef((props: any, ref: any) => React.createElement(FlatList, { ...props, ref }))
  MockList.displayName = 'LegendList'
  return {
    LegendList: MockList,
    useIsLastItem: () => false,
    useListScrollSize: () => ({ width: 0, height: 0 }),
    useRecyclingState: (init: any) => [typeof init === 'function' ? init({}) : init, jest.fn()],
    useRecyclingEffect: jest.fn(),
    useViewability: jest.fn(),
    useViewabilityAmount: jest.fn(),
    useSyncLayout: () => jest.fn(),
  }
})

jest.mock('@legendapp/list/reanimated', () => {
  const React = require('react')
  const { FlatList } = require('react-native')
  const MockList = React.forwardRef((props: any, ref: any) => React.createElement(FlatList, { ...props, ref }))
  MockList.displayName = 'AnimatedLegendList'
  return { AnimatedLegendList: MockList }
})

jest.mock('@legendapp/list/keyboard-chat', () => {
  const React = require('react')
  const { FlatList } = require('react-native')
  const MockList = React.forwardRef((props: any, ref: any) => React.createElement(FlatList, { ...props, ref }))
  MockList.displayName = 'KeyboardChatLegendList'
  return {
    KeyboardChatLegendList: MockList,
    useKeyboardScrollToEnd: () => ({
      freeze: { value: false, set: jest.fn() },
      scrollMessageToEnd: jest.fn(),
    }),
    useKeyboardChatComposerInset: () => ({
      contentInsetEndAdjustment: { value: 0 },
      onComposerLayout: jest.fn(),
    }),
  }
})
