import { RefObject } from 'react'
import {
  StyleProp,
  ViewStyle,
} from 'react-native'
import { LegendListRef, LegendListProps } from '@legendapp/list/react-native'

import { DayProps } from '../Day'
import { LoadEarlierMessagesProps } from '../LoadEarlierMessages'
import { MessageProps } from '../Message'
import { User, IMessage, Reply } from '../Models'
import { ReplyProps } from '../Reply'
import { TypingIndicatorProps } from '../TypingIndicator/types'

export type { LegendListRef }

/** The ref type for the messages list */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type AnimatedList<_TMessage> = LegendListRef

/** Additional props for LegendList */
export type AnimatedListProps<_TMessage extends IMessage = IMessage> = Partial<
  Omit<LegendListProps<unknown>, 'data' | 'renderItem' | 'keyExtractor'>
>

export interface MessagesContainerProps<TMessage extends IMessage = IMessage>
  extends Omit<TypingIndicatorProps, 'style'> {
  /** Ref for the message list */
  forwardRef?: RefObject<AnimatedList<TMessage>>
  /** Messages to display (newest-first when isInverted=true, which is the default) */
  messages?: TMessage[]
  /** Format to use for rendering dates; accepts Intl.DateTimeFormatOptions */
  dateFormatOptions?: Intl.DateTimeFormatOptions
  /** User sending the messages: { _id, name, avatar } */
  user?: User
  /** Additional props for LegendList */
  listProps?: AnimatedListProps<TMessage>
  /** Reverses display order of messages; default is true (newest-first public API) */
  isInverted?: boolean
  /** Controls whether or not the message bubbles appear at the top of the chat */
  isAlignedTop?: boolean
  /** Enables the isScrollToBottomEnabled Component */
  isScrollToBottomEnabled?: boolean
  /** Scroll to bottom wrapper style */
  scrollToBottomStyle?: StyleProp<ViewStyle>
  /** Scroll to bottom content style */
  scrollToBottomContentStyle?: StyleProp<ViewStyle>
  /** Distance from bottom before showing scroll to bottom button */
  scrollToBottomOffset?: number
  /** Custom component to render when messages are empty */
  renderChatEmpty?: () => React.ReactNode
  /** Custom footer component on the list, e.g. 'User is typing...' */
  renderFooter?: (props: MessagesContainerProps<TMessage>) => React.ReactNode
  /** Custom message container */
  renderMessage?: (props: MessageProps<TMessage>) => React.ReactElement
  /** Custom day above a message */
  renderDay?: (props: DayProps) => React.ReactNode
  /** Custom "Load earlier messages" button */
  renderLoadEarlier?: (props: LoadEarlierMessagesProps) => React.ReactNode
  /** Custom typing indicator */
  renderTypingIndicator?: () => React.ReactNode
  /** Scroll to bottom custom component */
  scrollToBottomComponent?: () => React.ReactNode
  /** Callback when quick reply is sent */
  onQuickReply?: (replies: Reply[]) => void
  /** Props to pass to the LoadEarlierMessages component. */
  loadEarlierMessagesProps?: LoadEarlierMessagesProps
  /** Style for TypingIndicator component */
  typingIndicatorStyle?: StyleProp<ViewStyle>
  /** Enable animated day label that appears on scroll; default is true */
  isDayAnimationEnabled?: boolean
  /** Reply functionality configuration */
  reply?: ReplyProps<TMessage>
  /**
   * SharedValue for keyboard inset adjustment (from useKeyboardChatComposerInset).
   * Passed from GiftedChat when using KeyboardChatLegendList.
   */
  contentInsetEndAdjustment?: import('react-native-reanimated').SharedValue<number>
}

export interface State {
  showScrollBottom: boolean
  hasScrolled: boolean
}
