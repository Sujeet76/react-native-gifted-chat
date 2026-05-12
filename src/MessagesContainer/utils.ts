import { IMessage } from '../Models'
import { isSameDay } from '../utils'

export type MessageDisplayItem<TMessage extends IMessage> = {
  type: 'message'
  message: TMessage
  position: 'left' | 'right'
  previousMessage: Partial<TMessage>
  nextMessage: Partial<TMessage>
}

export type DayDisplayItem = {
  type: 'day'
  createdAt: number
  key: string
}

export type DisplayItem<TMessage extends IMessage> = MessageDisplayItem<TMessage> | DayDisplayItem

/**
 * Builds a flat display array from messages (which must be oldest-first).
 * Day separator items are interleaved before the first message of each new day.
 */
export function buildDisplayData<TMessage extends IMessage>(
  messages: TMessage[],
  userId: string | number | undefined
): DisplayItem<TMessage>[] {
  const result: DisplayItem<TMessage>[] = []

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    const prev = messages[i - 1]
    const next = messages[i + 1]

    if (!prev || !isSameDay(msg, prev))
      result.push({
        type: 'day',
        createdAt: new Date(msg.createdAt).getTime(),
        key: `day-${msg._id}`,
      })

    result.push({
      type: 'message',
      message: msg,
      position: userId != null && msg.user?._id === userId ? 'right' : 'left',
      previousMessage: prev ?? {},
      nextMessage: next ?? {},
    })
  }

  return result
}
