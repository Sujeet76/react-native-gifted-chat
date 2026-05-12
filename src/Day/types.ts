import {
  StyleProp,
  ViewStyle,
  TextProps,
} from 'react-native'

export interface DayProps {
  createdAt: Date | number
  /** Intl.DateTimeFormatOptions to customize date display (replaces dayjs format strings) */
  dateFormatOptions?: Intl.DateTimeFormatOptions
  containerStyle?: StyleProp<ViewStyle>
  wrapperStyle?: StyleProp<ViewStyle>
  /** Props to pass to the Text component (e.g., style, allowFontScaling, numberOfLines) */
  textProps?: Partial<TextProps>
}
