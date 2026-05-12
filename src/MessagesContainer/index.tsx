import React, { useCallback, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import { KeyboardChatLegendList, useKeyboardScrollToEnd } from '@legendapp/list/keyboard-chat'
import { Pressable, Text } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Day } from '../Day'
import { LoadEarlierMessages } from '../LoadEarlierMessages'
import { warning } from '../logging'
import { IMessage } from '../Models'
import stylesCommon from '../styles'
import { TypingIndicator } from '../TypingIndicator'

import { DayAnimated } from './components/DayAnimated'
import { Item } from './components/Item'
import { ItemProps } from './components/Item/types'
import styles from './styles'
import { AnimatedList, MessagesContainerProps } from './types'
import { buildDisplayData, DisplayItem } from './utils'

export * from './types'
export * from './utils'

export const MessagesContainer = <TMessage extends IMessage>(props: MessagesContainerProps<TMessage>) => {
  const {
    messages = [],
    user,
    isTyping = false,
    renderChatEmpty: renderChatEmptyProp,
    isInverted = true,
    listProps,
    isScrollToBottomEnabled = false,
    scrollToBottomStyle,
    scrollToBottomContentStyle,
    loadEarlierMessagesProps,
    renderTypingIndicator: renderTypingIndicatorProp,
    renderFooter: renderFooterProp,
    renderLoadEarlier: renderLoadEarlierProp,
    forwardRef: forwardRefProp,
    scrollToBottomComponent: scrollToBottomComponentProp,
    renderDay: renderDayProp,
    isDayAnimationEnabled = true,
    isAlignedTop = false,
    contentInsetEndAdjustment,
  } = props

  // Internal ref used when no external ref is provided
  const internalRef = useRef<AnimatedList<TMessage>>(null)
  const listRef = forwardRefProp ?? internalRef

  // SharedValues for DayAnimated overlay — synced from LegendList via sharedValues prop
  const scrolledY = useSharedValue(0)
  const isNearEnd = useSharedValue(true)

  const scrollToBottomOpacity = useSharedValue(0)
  const [isScrollToBottomVisible, setIsScrollToBottomVisible] = useState(false)

  const scrollToBottomStyleAnim = useAnimatedStyle(() => ({
    opacity: scrollToBottomOpacity.value,
  }), [scrollToBottomOpacity])

  // Track which day is currently visible for the DayAnimated overlay
  const [visibleDay, setVisibleDay] = useState<number | undefined>()

  // useKeyboardScrollToEnd provides scrollMessageToEnd used by scroll-to-bottom button
  const { scrollMessageToEnd } = useKeyboardScrollToEnd({ listRef: listRef as any })

  // Reverse messages internally so LegendList always receives oldest-first data.
  // The public API keeps messages as newest-first when isInverted=true.
  const orderedMessages = useMemo(
    () => (isInverted ? [...messages].reverse() : messages),
    [messages, isInverted]
  )

  const displayData = useMemo(
    () => buildDisplayData(orderedMessages, user?._id),
    [orderedMessages, user?._id]
  )

  const renderTypingIndicator = useCallback(() => {
    if (renderTypingIndicatorProp)
      return renderTypingIndicatorProp()

    return <TypingIndicator isTyping={isTyping} style={props.typingIndicatorStyle} />
  }, [isTyping, renderTypingIndicatorProp, props.typingIndicatorStyle])

  const ListFooterComponent = useMemo(() => {
    if (renderFooterProp)
      return renderFooterProp(props)

    return renderTypingIndicator()
  }, [renderFooterProp, renderTypingIndicator, props])

  const renderLoadEarlier = useCallback(() => {
    if (loadEarlierMessagesProps?.isAvailable) {
      if (renderLoadEarlierProp)
        return renderLoadEarlierProp(loadEarlierMessagesProps)

      return <LoadEarlierMessages {...loadEarlierMessagesProps} />
    }

    return null
  }, [loadEarlierMessagesProps, renderLoadEarlierProp])

  const ListHeaderComponent = useMemo(() => {
    const content = renderLoadEarlier()

    if (!content)
      return null

    return <View style={stylesCommon.fill}>{content}</View>
  }, [renderLoadEarlier])

  const renderChatEmpty = useCallback(() => {
    if (renderChatEmptyProp)
      return isAlignedTop
        ? renderChatEmptyProp()
        : (
          <View style={[stylesCommon.fill, styles.emptyChatContainer]}>
            {renderChatEmptyProp()}
          </View>
        )

    return <View style={stylesCommon.fill} />
  }, [isAlignedTop, renderChatEmptyProp])

  const keyExtractor = useCallback(
    (item: DisplayItem<TMessage>) =>
      item.type === 'day' ? item.key : item.message._id.toString(),
    []
  )

  const getItemType = useCallback(
    (item: DisplayItem<TMessage>) => item.type,
    []
  )

  const renderItem = useCallback(
    ({ item }: { item: DisplayItem<TMessage> }) => {
      if (item.type === 'day') 
        return renderDayProp
          ? renderDayProp({ createdAt: item.createdAt })
          : <Day createdAt={item.createdAt} />
      

      const { message, position, previousMessage, nextMessage } = item

      if (!message._id && message._id !== 0)
        warning('GiftedChat: `_id` is missing for message', JSON.stringify(message))

      if (!message.user) {
        if (!message.system)
          warning('GiftedChat: `user` is missing for message', JSON.stringify(message))

        message.user = { _id: 0 }
      }

      const {
        messages: _messages,
        user: _user,
        isInverted: _isInverted,
        listProps: _listProps,
        forwardRef: _forwardRef,
        renderDay: _renderDay,
        contentInsetEndAdjustment: _cia,
        ...restProps
      } = props

      const messageProps: ItemProps<TMessage> = {
        position,
        ...restProps,
        currentMessage: message,
        previousMessage: previousMessage as TMessage,
        nextMessage: nextMessage as TMessage,
        isDayAnimationEnabled: false, // day items are already in displayData; no per-item day rendering needed
      }

      return <Item<TMessage> {...messageProps} />
    },
     
    [props, renderDayProp]
  )

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ item: DisplayItem<TMessage> }> }) => {
      // Find the topmost visible day separator to show in the overlay
      const dayItem = viewableItems
        .map(v => v.item)
        .find((item): item is typeof item & { type: 'day' } => item.type === 'day')

      setVisibleDay(dayItem?.createdAt)
    },
    []
  )

  // Show/hide scroll-to-bottom button via isNearEnd SharedValue
  const showScrollToBottom = useCallback((show: boolean) => {
    if (show)
      setIsScrollToBottomVisible(true)

    scrollToBottomOpacity.value = withTiming(show ? 1 : 0, { duration: 250 }, isFinished => {
      if (isFinished && !show)
        runOnJS(setIsScrollToBottomVisible)(false)
    })
  }, [scrollToBottomOpacity])

  // React to isNearEnd changes from LegendList's sharedValues to show/hide the scroll-to-bottom button
  useAnimatedReaction(
    () => isNearEnd.value,
    (near, prev) => {
      if (near === prev || !isScrollToBottomEnabled)
        return

      runOnJS(showScrollToBottom)(!near)
    },
    [isNearEnd, isScrollToBottomEnabled, showScrollToBottom]
  )

  const handleScrollToBottomPress = useCallback(() => {
    scrollMessageToEnd({ animated: true, closeKeyboard: false })
  }, [scrollMessageToEnd])

  const renderScrollBottomComponent = useCallback(() => {
    if (scrollToBottomComponentProp)
      return scrollToBottomComponentProp()

    return <Text>{'V'}</Text>
  }, [scrollToBottomComponentProp])

  const scrollToBottomContent = useMemo(
    () => (
      <Animated.View
        style={[
          stylesCommon.centerItems,
          styles.scrollToBottomContent,
          scrollToBottomContentStyle,
          scrollToBottomStyleAnim,
        ]}
      >
        {renderScrollBottomComponent()}
      </Animated.View>
    ),
    [scrollToBottomStyleAnim, scrollToBottomContentStyle, renderScrollBottomComponent]
  )

  const ScrollToBottomWrapper = useCallback(() => {
    if (!isScrollToBottomEnabled || !isScrollToBottomVisible)
      return null

    return (
      <Pressable
        style={[styles.scrollToBottom, scrollToBottomStyle]}
        onPress={handleScrollToBottomPress}
      >
        {scrollToBottomContent}
      </Pressable>
    )
  }, [
    isScrollToBottomEnabled,
    isScrollToBottomVisible,
    handleScrollToBottomPress,
    scrollToBottomContent,
    scrollToBottomStyle,
  ])

  // onEndReached in the public API means "load earlier messages" (oldest end in inverted view).
  // With oldest-first data and KeyboardChatLegendList, this is onStartReached.
  const onStartReached = useCallback(() => {
    if (
      loadEarlierMessagesProps?.isAvailable &&
      loadEarlierMessagesProps.isInfiniteScrollEnabled &&
      !loadEarlierMessagesProps.isLoading
    )
      loadEarlierMessagesProps.onPress()
  }, [loadEarlierMessagesProps])

  return (
    <View
      style={[
        styles.contentContainerStyle,
        isAlignedTop ? styles.containerAlignTop : stylesCommon.fill,
      ]}
    >
      <KeyboardChatLegendList
        ref={listRef as any}
        data={displayData}
        renderItem={renderItem as any}
        keyExtractor={keyExtractor as any}
        estimatedItemSize={80}
        drawDistance={500}
        recycleItems={false}
        getItemType={getItemType as any}
        maintainScrollAtEnd={isInverted}
        maintainScrollAtEndThreshold={0.1}
        maintainVisibleContentPosition={isInverted}
        initialScrollAtEnd={isInverted}
        alignItemsAtEnd={isInverted}
        onStartReached={isInverted ? onStartReached : undefined}
        onStartReachedThreshold={0.1}
        onEndReached={!isInverted ? onStartReached : undefined}
        onEndReachedThreshold={0.1}
        keyboardDismissMode='interactive'
        keyboardShouldPersistTaps='handled'
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={<>{ListFooterComponent}</>}
        ListEmptyComponent={renderChatEmpty as any}
        contentContainerStyle={styles.messagesContainer}
        style={stylesCommon.fill}
        onViewableItemsChanged={onViewableItemsChanged as any}
        contentInsetEndAdjustment={contentInsetEndAdjustment}
        sharedValues={{
          scrollOffset: scrolledY,
          isNearEnd,
        }}
        {...(listProps as any)}
      />
      <ScrollToBottomWrapper />
      {isDayAnimationEnabled && visibleDay != null && (
        <DayAnimated
          scrolledY={scrolledY}
          visibleDay={visibleDay}
          renderDay={renderDayProp}
          dateFormatOptions={props.dateFormatOptions}
        />
      )}
    </View>
  )
}
