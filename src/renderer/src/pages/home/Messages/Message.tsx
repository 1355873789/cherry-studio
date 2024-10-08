import UserPopup from '@renderer/components/Popups/UserPopup'
import { FONT_FAMILY } from '@renderer/config/constant'
import { APP_NAME, AppLogo, isLocalAi } from '@renderer/config/env'
import { startMinAppById } from '@renderer/config/minapps'
import { getModelLogo } from '@renderer/config/models'
import { useTheme } from '@renderer/context/ThemeProvider'
import { useAssistant } from '@renderer/hooks/useAssistant'
import useAvatar from '@renderer/hooks/useAvatar'
import { useModel } from '@renderer/hooks/useModel'
import { useSettings } from '@renderer/hooks/useSettings'
import { Message } from '@renderer/types'
import { firstLetter, removeLeadingEmoji } from '@renderer/utils'
import { Avatar, Divider } from 'antd'
import dayjs from 'dayjs'
import { upperFirst } from 'lodash'
import { FC, memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import MessageContent from './MessageContent'
import MessageMenubar from './MessageMenubar'
import MessgeTokens from './MessageTokens'

interface Props {
  message: Message
  index?: number
  total?: number
  lastMessage?: boolean
  onEditMessage?: (message: Message) => void
  onDeleteMessage?: (message: Message) => void
}

const MessageItem: FC<Props> = ({ message, index, lastMessage, onEditMessage, onDeleteMessage }) => {
  const avatar = useAvatar()
  const { t } = useTranslation()
  const { assistant, setModel } = useAssistant(message.assistantId)
  const model = useModel(message.modelId)
  const { userName, showMessageDivider, messageFont, fontSize } = useSettings()
  const { theme } = useTheme()

  const isLastMessage = lastMessage || index === 0
  const isAssistantMessage = message.role === 'assistant'

  const getUserName = useCallback(() => {
    if (isLocalAi && message.role !== 'user') return APP_NAME
    if (message.role === 'assistant') return upperFirst(model?.name || model?.id)
    return userName || t('common.you')
  }, [message.role, model?.id, model?.name, t, userName])

  const fontFamily = useMemo(() => {
    return messageFont === 'serif' ? FONT_FAMILY.replace('sans-serif', 'serif').replace('Ubuntu, ', '') : FONT_FAMILY
  }, [messageFont])

  const messageBorder = showMessageDivider ? undefined : 'none'

  const avatarSource = useMemo(() => {
    if (isLocalAi) return AppLogo
    return message.modelId ? getModelLogo(message.modelId) : undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.modelId, theme])

  const avatarName = useMemo(() => firstLetter(assistant?.name).toUpperCase(), [assistant?.name])

  const username = useMemo(() => removeLeadingEmoji(getUserName()), [getUserName])

  const showMiniApp = () => model?.provider && startMinAppById(model?.provider)

  if (message.type === 'clear') {
    return (
      <Divider dashed style={{ padding: '0 20px' }} plain>
        {t('chat.message.new.context')}
      </Divider>
    )
  }

  return (
    <MessageContainer key={message.id} className="message">
      <MessageHeader>
        <AvatarWrapper>
          {isAssistantMessage ? (
            <Avatar
              src={avatarSource}
              size={35}
              style={{
                borderRadius: '20%',
                cursor: 'pointer',
                border: isLocalAi ? '1px solid var(--color-border-soft)' : 'none',
                filter: theme === 'dark' ? 'invert(0.05)' : undefined
              }}
              onClick={showMiniApp}>
              {avatarName}
            </Avatar>
          ) : (
            <Avatar
              src={avatar}
              size={35}
              style={{ borderRadius: '20%', cursor: 'pointer' }}
              onClick={() => UserPopup.show()}
            />
          )}
          <UserWrap>
            <UserName>{username}</UserName>
            <MessageTime>{dayjs(message.createdAt).format('MM/DD HH:mm')}</MessageTime>
          </UserWrap>
        </AvatarWrapper>
      </MessageHeader>
      <MessageContentContainer style={{ fontFamily, fontSize }}>
        <MessageContent message={message} model={model} />
        {!lastMessage && (
          <MessageFooter style={{ border: messageBorder, flexDirection: isLastMessage ? 'row-reverse' : undefined }}>
            <MessgeTokens message={message} />
            <MessageMenubar
              message={message}
              model={model}
              index={index}
              isLastMessage={isLastMessage}
              isAssistantMessage={isAssistantMessage}
              setModel={setModel}
              onEditMessage={onEditMessage}
              onDeleteMessage={onDeleteMessage}
            />
          </MessageFooter>
        )}
      </MessageContentContainer>
    </MessageContainer>
  )
}

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 20px;
  position: relative;
  .menubar {
    opacity: 0;
    transition: opacity 0.2s ease;
    &.show {
      opacity: 1;
    }
  }
  &:hover {
    .menubar {
      opacity: 1;
    }
  }
`

const MessageHeader = styled.div`
  margin-right: 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-bottom: 4px;
  justify-content: space-between;
`

const AvatarWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

const UserWrap = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-left: 12px;
`

const UserName = styled.div`
  font-size: 14px;
  font-weight: 600;
`

const MessageTime = styled.div`
  font-size: 12px;
  color: var(--color-text-3);
`

const MessageContentContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  margin-left: 46px;
  margin-top: 5px;
`

const MessageFooter = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
  margin: 2px 0 8px 0;
  border-top: 0.5px dashed var(--color-border);
`

export default memo(MessageItem)
