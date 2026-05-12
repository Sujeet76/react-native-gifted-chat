import React, { useCallback, useMemo, useRef } from 'react'
import { LayoutChangeEvent } from 'react-native'
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated'
import { Day } from '../../../Day'
import stylesCommon from '../../../styles'
import styles from './styles'
import { DayAnimatedProps } from './types'

export * from './types'

export const DayAnimated = ({ scrolledY, visibleDay, renderDay, ...rest }: DayAnimatedProps) => {
  const opacity = useSharedValue(0)
  const containerHeight = useSharedValue(0)
  const fadeOutTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const prevScrolledY = useSharedValue(0)

  const fadeOut = useCallback(() => {
    'worklet'
    opacity.value = withTiming(0, { duration: 500 })
  }, [opacity])

  const scheduleFadeOut = useCallback(() => {
    clearTimeout(fadeOutTimeoutRef.current)
    fadeOutTimeoutRef.current = setTimeout(fadeOut, 500)
  }, [fadeOut])

  useAnimatedReaction(
    () => scrolledY.value,
    (current, prev) => {
      if (current === prev)
        return

      prevScrolledY.value = current
      opacity.value = withTiming(1, { duration: 200 })
      runOnJS(scheduleFadeOut)()
    },
    [scrolledY, scheduleFadeOut]
  )

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }), [opacity])

  const handleLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    containerHeight.value = nativeEvent.layout.height
  }, [containerHeight])

  const dayContent = useMemo(() => {
    return renderDay
      ? renderDay({ ...rest, createdAt: visibleDay })
      : (
        <Day
          {...rest}
          containerStyle={[styles.dayAnimatedDayContainerStyle, rest.containerStyle]}
          createdAt={visibleDay}
        />
      )
  }, [visibleDay, renderDay, rest])

  return (
    <Animated.View
      style={[stylesCommon.centerItems, styles.dayAnimated]}
      onLayout={handleLayout}
      pointerEvents='none'
    >
      <Animated.View style={contentStyle} pointerEvents='none'>
        {dayContent}
      </Animated.View>
    </Animated.View>
  )
}
