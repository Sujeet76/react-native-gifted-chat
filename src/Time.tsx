import React, { memo, useMemo } from 'react'
import { StyleSheet, View, ViewStyle, TextStyle } from 'react-native'
import { Text } from 'react-native-gesture-handler'
import { Color } from './Color'
import { useChatContext } from './GiftedChatContext'
import { LeftRightStyle, IMessage } from './Models'
import { getStyleWithPosition } from './styles'

const styles = StyleSheet.create({
  text: {
    fontSize: 10,
    textAlign: 'right',
  },
  text_left: {
    color: Color.timeTextColor,
  },
  text_right: {
    color: Color.white,
  },
})

export interface TimeProps<TMessage extends IMessage> {
  position?: 'left' | 'right'
  currentMessage: TMessage
  containerStyle?: LeftRightStyle<ViewStyle>
  timeTextStyle?: LeftRightStyle<TextStyle>
  /** Intl.DateTimeFormatOptions to customize time display (replaces dayjs format string) */
  timeFormatOptions?: Intl.DateTimeFormatOptions
}

const defaultTimeFormatOptions: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
}

export const Time = memo(function Time <TMessage extends IMessage = IMessage>({
  position = 'left',
  containerStyle,
  currentMessage,
  timeFormatOptions = defaultTimeFormatOptions,
  timeTextStyle,
}: TimeProps<TMessage>) {
  const { getLocale } = useChatContext()

  const formattedTime = useMemo(() => {
    if (!currentMessage?.createdAt)
      return null

    const locale = getLocale() || undefined

    return new Intl.DateTimeFormat(locale, timeFormatOptions).format(
      new Date(currentMessage.createdAt)
    )
  }, [currentMessage?.createdAt, timeFormatOptions, getLocale])

  if (!currentMessage)
    return null

  return (
    <View style={containerStyle?.[position]}>
      <Text
        style={[
          getStyleWithPosition(styles, 'text', position),
          timeTextStyle?.[position],
        ]}
      >
        {formattedTime}
      </Text>
    </View>
  )
}) as <TMessage extends IMessage = IMessage>(props: TimeProps<TMessage>) => React.ReactElement | null
