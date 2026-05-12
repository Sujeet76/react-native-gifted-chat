import { IMessage } from '../../../Models'
import { MessagesContainerProps } from '../../types'

export interface ItemProps<TMessage extends IMessage> extends MessagesContainerProps<TMessage> {
  currentMessage: TMessage
  previousMessage?: TMessage
  nextMessage?: TMessage
  position: 'left' | 'right'
  isDayAnimationEnabled?: boolean
}
