import React, {
  createRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  RefObject,
} from 'react'
import {
  View,
  useColorScheme,
} from 'react-native'
import {
  ActionSheetProvider,
  ActionSheetProviderRef,
} from '@expo/react-native-action-sheet'
import { useKeyboardChatComposerInset } from '@legendapp/list/keyboard-chat'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider, KeyboardStickyView } from 'react-native-keyboard-controller'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { TEST_ID } from '../Constant'
import { GiftedChatContext } from '../GiftedChatContext'
import { InputToolbar } from '../InputToolbar'
import { MessagesContainer, AnimatedList } from '../MessagesContainer'
import { IMessage, ReplyMessage } from '../Models'
import stylesCommon from '../styles'
import { renderComponentOrElement } from '../utils'
import styles from './styles'
import { GiftedChatProps } from './types'

function GiftedChat<TMessage extends IMessage = IMessage> (
  props: GiftedChatProps<TMessage>
) {
  const {
    messages = [],
    initialText = '',
    isTyping,

    // "random" function from here: https://stackoverflow.com/a/8084248/3452513
    messageIdGenerator = () => (Math.random() + 1).toString(36).substring(7),

    user = {},
    onSend,
    locale = 'en',
    colorScheme: colorSchemeProp,
    renderLoading,
    actionSheet,
    textInputProps,
    renderChatFooter,
    renderInputToolbar,
    isInverted = true,

    // Reply props
    reply,
  } = props

  const replyMessageProp = reply?.message
  const onClearReply = reply?.onClear
  const onSwipeToReply = reply?.swipe?.onSwipe
  const renderReplyPreview = reply?.renderPreview
  const replyPreviewContainerStyle = reply?.previewStyle?.containerStyle
  const replyPreviewTextStyle = reply?.previewStyle?.textStyle

  const systemColorScheme = useColorScheme()
  const colorScheme = colorSchemeProp !== undefined ? colorSchemeProp : systemColorScheme

  const actionSheetRef = useRef<ActionSheetProviderRef>(null)
  const insets = useSafeAreaInsets()

  const messagesContainerRef = useMemo(
    () => props.messagesContainerRef || createRef<AnimatedList<TMessage>>(),
    [props.messagesContainerRef]
  ) as RefObject<AnimatedList<TMessage>>

  // Ref to the composer (input bar) View for keyboard inset tracking
  const composerViewRef = useRef<View>(null)

  // Syncs the list bottom inset to match the composer height
  const { contentInsetEndAdjustment, onComposerLayout } = useKeyboardChatComposerInset(
    messagesContainerRef as any,
    composerViewRef
  )

  const textInputRef = useMemo(
    () => props.textInputRef || createRef<{ clear(): void }>(),
    [props.textInputRef]
  )

  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [text, setText] = useState<string | undefined>(() => props.text || '')
  const [internalReplyMessage, setInternalReplyMessage] = useState<ReplyMessage | null>(null)

  const replyMessage = replyMessageProp !== undefined ? replyMessageProp : internalReplyMessage

  const getTextFromProp = useCallback(
    (fallback: string) => {
      if (props.text === undefined)
        return fallback

      return props.text
    },
    [props.text]
  )

  const handleSwipeToReply = useCallback(
    (message: TMessage) => {
      if (replyMessageProp === undefined)
        setInternalReplyMessage({
          _id: message._id,
          text: message.text,
          user: message.user,
          image: message.image,
          audio: message.audio,
        })

      onSwipeToReply?.(message)
    },
    [replyMessageProp, onSwipeToReply]
  )

  const clearReply = useCallback(() => {
    if (replyMessageProp === undefined)
      setInternalReplyMessage(null)

    onClearReply?.()
  }, [replyMessageProp, onClearReply])

  const renderMessages = useMemo(() => {
    if (!isInitialized)
      return null

    const { messagesContainerStyle, ...messagesContainerProps } = props

    return (
      <View style={[stylesCommon.fill, messagesContainerStyle]}>
        <MessagesContainer<TMessage>
          {...messagesContainerProps}
          isInverted={isInverted}
          messages={messages}
          forwardRef={messagesContainerRef}
          isTyping={isTyping}
          contentInsetEndAdjustment={contentInsetEndAdjustment}
          reply={{
            ...reply,
            swipe: reply?.swipe ? {
              ...reply.swipe,
              onSwipe: handleSwipeToReply,
            } : undefined,
          }}
        />
        {renderComponentOrElement(renderChatFooter, {})}
      </View>
    )
  }, [
    isInitialized,
    isTyping,
    messages,
    props,
    isInverted,
    messagesContainerRef,
    renderChatFooter,
    reply,
    handleSwipeToReply,
    contentInsetEndAdjustment,
  ])

  const notifyInputTextReset = useCallback(() => {
    props.textInputProps?.onChangeText?.('')
  }, [props.textInputProps])

  const resetInputToolbar = useCallback(() => {
    textInputRef.current?.clear()
    notifyInputTextReset()
    setText(getTextFromProp(''))
  }, [getTextFromProp, textInputRef, notifyInputTextReset])

  const _onSend = useCallback(
    (messages: TMessage[] = [], shouldResetInputToolbar = false) => {
      if (!Array.isArray(messages))
        messages = [messages]

      const newMessages: TMessage[] = messages.map(message => ({
        ...message,
        user: user!,
        createdAt: new Date(),
        _id: messageIdGenerator?.(),
        ...(replyMessage ? { replyMessage } : {}),
      }))

      if (shouldResetInputToolbar === true)
        resetInputToolbar()

      clearReply()
      onSend?.(newMessages)
    },
    [messageIdGenerator, onSend, user, resetInputToolbar, replyMessage, clearReply]
  )

  const _onChangeText = useCallback(
    (text: string) => {
      props.textInputProps?.onChangeText?.(text)

      if (props.text === undefined)
        setText(text)
    },
    [props.text, props.textInputProps]
  )

  const inputToolbarFragment = useMemo(() => {
    if (!isInitialized)
      return null

    const inputToolbarProps = {
      ...props,
      text: getTextFromProp(text!),
      onSend: _onSend,
      textInputProps: {
        ...textInputProps,
        onChangeText: _onChangeText,
        ref: textInputRef,
      },
      replyMessage,
      onClearReply: clearReply,
      renderReplyPreview,
      replyPreviewContainerStyle,
      replyPreviewTextStyle,
    }

    if (renderInputToolbar)
      return renderComponentOrElement(renderInputToolbar, inputToolbarProps)

    return <InputToolbar {...inputToolbarProps} />
  }, [
    isInitialized,
    _onSend,
    getTextFromProp,
    props,
    text,
    renderInputToolbar,
    textInputRef,
    textInputProps,
    _onChangeText,
    replyMessage,
    clearReply,
    renderReplyPreview,
    replyPreviewContainerStyle,
    replyPreviewTextStyle,
  ])

  const contextValues = useMemo(
    () => ({
      actionSheet:
        actionSheet ||
        (() => ({
          showActionSheetWithOptions:
            actionSheetRef.current!.showActionSheetWithOptions,
        })),
      getLocale: () => locale,
      getColorScheme: () => colorScheme,
    }),
    [actionSheet, locale, colorScheme]
  )

  useEffect(() => {
    if (props.text != null)
      setText(props.text)
  }, [props.text])

  return (
    <GiftedChatContext.Provider value={contextValues}>
      <ActionSheetProvider ref={actionSheetRef}>
        <View
          testID={TEST_ID.WRAPPER}
          style={[stylesCommon.fill, styles.contentContainer]}
          onLayout={e => {
            if (isInitialized)
              return

            const { layout } = e.nativeEvent

            if (layout.height <= 0)
              return

            props.textInputProps?.onChangeText?.('')
            setIsInitialized(true)
            setText(getTextFromProp(initialText))
          }}
        >
          <View style={[stylesCommon.fill, !isInitialized && styles.hidden]}>
            {renderMessages}
            <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
              <View ref={composerViewRef} onLayout={onComposerLayout}>
                {inputToolbarFragment}
              </View>
            </KeyboardStickyView>
          </View>
          {!isInitialized && renderComponentOrElement(renderLoading, {})}
        </View>
      </ActionSheetProvider>
    </GiftedChatContext.Provider>
  )
}

function GiftedChatWrapper<TMessage extends IMessage = IMessage> (props: GiftedChatProps<TMessage>) {
  const {
    keyboardProviderProps,
    ...rest
  } = props

  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider>
        <KeyboardProvider
          statusBarTranslucent
          navigationBarTranslucent
          {...keyboardProviderProps}
        >
          <GiftedChat<TMessage> {...rest} />
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

GiftedChatWrapper.append = <TMessage extends IMessage>(
  currentMessages: TMessage[] = [],
  messages: TMessage[],
  isInverted = true
) => {
  if (!Array.isArray(messages))
    messages = [messages]

  return isInverted
    ? messages.concat(currentMessages)
    : currentMessages.concat(messages)
}

GiftedChatWrapper.prepend = <TMessage extends IMessage>(
  currentMessages: TMessage[] = [],
  messages: TMessage[],
  isInverted = true
) => {
  if (!Array.isArray(messages))
    messages = [messages]

  return isInverted
    ? currentMessages.concat(messages)
    : messages.concat(currentMessages)
}

export {
  GiftedChatWrapper as GiftedChat
}
