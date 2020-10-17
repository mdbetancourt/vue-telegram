import { MESSAGE_CONTENT } from '@airgram/api'
const {
  messageText,
  messageAudio,
  messageAnimation,
  messagePhoto,
  messageCall,
  messageContact,
  messageVideo,
  messageExpiredPhoto,
  messageExpiredVideo,
  messageLocation,
  messagePoll,
  messageSticker,
  messageVoiceNote,
  messageDocument
} = MESSAGE_CONTENT

const SERVICE_TYPE = [
  MESSAGE_CONTENT.messageChatAddMembers,
  MESSAGE_CONTENT.messageChatChangePhoto,
  MESSAGE_CONTENT.messageChatChangeTitle,
  MESSAGE_CONTENT.messageChatDeleteMember,
  MESSAGE_CONTENT.messageChatDeletePhoto,
  MESSAGE_CONTENT.messageChatJoinByLink,
  MESSAGE_CONTENT.messageChatSetTtl,
  MESSAGE_CONTENT.messageChatUpgradeFrom,
  MESSAGE_CONTENT.messageChatUpgradeTo,

  MESSAGE_CONTENT.messagePassportDataReceived,
  MESSAGE_CONTENT.messagePassportDataSent,

  MESSAGE_CONTENT.messagePaymentSuccessful,
  MESSAGE_CONTENT.messagePaymentSuccessfulBot,

  MESSAGE_CONTENT.messageBasicGroupChatCreate,
  MESSAGE_CONTENT.messageContactRegistered,
  MESSAGE_CONTENT.messageCustomServiceAction,
  MESSAGE_CONTENT.messageGameScore,
  MESSAGE_CONTENT.messagePinMessage,
  MESSAGE_CONTENT.messageScreenshotTaken,
  MESSAGE_CONTENT.messageSupergroupChatCreate,
  MESSAGE_CONTENT.messageUnsupported,
  MESSAGE_CONTENT.messageWebsiteConnected
]

export function isService(message) {
  if (!message || !message.content) return false
  return SERVICE_TYPE.includes(message.content._)
}

/** @param {import('@airgram/api').Message} message */
export function getMessageContent(message) {
  const { content } = message
  if (!message) return null
  if (!content) return null

  let caption = ''
  if (caption) {
    caption = `, ${content.caption.text}`
  }
  const poll = content.poll

  const descriptions = {
    [messageText]: () => content.text.text + caption,
    [messageAudio]: () => 'Music ' + caption,
    [messageAnimation]: () => 'GIF ' + caption,
    [messageVideo]: () => 'Video ' + caption,
    [messagePhoto]: () => 'Photo ' + caption,
    [messageDocument]: () => content.document.fileName,
    [messageVoiceNote]: () => 'Voice message ' + caption,
    [messageSticker]: () => 'Sticker ' + content.sticker.emoji,
    [messageCall]: () => 'Call ' + caption,
    [messageContact]: () => 'Contact ' + caption,
    [messageExpiredPhoto]: () => 'Photo ' + caption,
    [messageExpiredVideo]: () => 'Video ' + caption,
    [messageLocation]: () => 'Location ' + caption,
    [messagePoll]: () => '📊 ' + (poll.question || 'Poll') + caption
  }
  const description = descriptions[content._]
  return (description && description()) || 'Unsupported'
}
