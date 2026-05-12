import React from 'react'
import { View, Text } from 'react-native'
import { render } from '@testing-library/react-native'
import { DayProps } from '../Day'
import { DayAnimated } from '../MessagesContainer/components/DayAnimated'
import { DEFAULT_TEST_MESSAGE } from './data'

const mockScrolledY = { value: 0 }
const VISIBLE_DAY = new Date(DEFAULT_TEST_MESSAGE.createdAt).getTime()

describe('DayAnimated', () => {
  it('should render DayAnimated with default Day component', () => {
    const { toJSON } = render(
      <DayAnimated
        scrolledY={mockScrolledY}
        visibleDay={VISIBLE_DAY}
      />
    )
    expect(toJSON()).toMatchSnapshot()
  })

  it('should use custom renderDay when provided', () => {
    const customRenderDay = jest.fn((props: DayProps) => (
      <View testID='custom-day'>
        <Text>Custom Day: {new Date(props.createdAt).toISOString()}</Text>
      </View>
    ))

    const { toJSON } = render(
      <DayAnimated
        scrolledY={mockScrolledY}
        visibleDay={VISIBLE_DAY}
        renderDay={customRenderDay}
      />
    )

    expect(toJSON()).toMatchSnapshot()
  })
})
