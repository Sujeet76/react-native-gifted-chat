import { DayProps } from '../../../Day'

export interface DayAnimatedProps extends Omit<DayProps, 'createdAt'> {
  scrolledY: { value: number }
  visibleDay: number
  renderDay?: (props: DayProps) => React.ReactNode
}
