import React, { useMemo } from 'react'
import { Message, MessageProps } from '../../../Message'
import { IMessage } from '../../../Models'
import { ItemProps } from './types'

export * from './types'

export const Item = <TMessage extends IMessage>(props: ItemProps<TMessage>) => {
  const {
    renderMessage: renderMessageProp,
    reply,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    isDayAnimationEnabled: _isDayAnimationEnabled,
    /* eslint-enable @typescript-eslint/no-unused-vars */
    ...rest
  } = props

  const messageProps = useMemo(() => ({
    ...rest,
    swipeToReply: reply?.swipe,
    messageReply: reply
      ? {
        renderMessageReply: reply.renderMessageReply,
        onPress: reply.onPress,
        ...reply.messageStyle,
      }
      : undefined,
  }), [rest, reply])

  return renderMessageProp
    ? renderMessageProp(messageProps as MessageProps<TMessage>)
    : <Message<TMessage> {...messageProps as MessageProps<TMessage>} />
}
