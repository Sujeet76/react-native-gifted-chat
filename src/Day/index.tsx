import React, { memo, useMemo } from 'react'
import { View } from 'react-native'
import { Text } from 'react-native-gesture-handler'
import { useChatContext } from '../GiftedChatContext'
import stylesCommon from '../styles'
import styles from './styles'
import { DayProps } from './types'

export * from './types'

export const Day = memo(function Day ({
  dateFormatOptions,
  createdAt,
  containerStyle,
  wrapperStyle,
  textProps,
}: DayProps) {
  const { getLocale } = useChatContext()

  const dateStr = useMemo(() => {
    if (createdAt == null)
      return null

    const date = new Date(createdAt)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday)
      return 'Today'

    const isThisYear = date.getFullYear() === now.getFullYear()
    const locale = getLocale() || undefined

    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: isThisYear ? undefined : 'numeric',
      ...dateFormatOptions,
    }).format(date)
  }, [createdAt, dateFormatOptions, getLocale])

  if (!dateStr)
    return null

  return (
    <View style={[stylesCommon.centerItems, styles.container, containerStyle]}>
      <View style={[styles.wrapper, wrapperStyle]}>
        <Text {...textProps} style={[styles.text, textProps?.style]}>
          {dateStr}
        </Text>
      </View>
    </View>
  )
})
