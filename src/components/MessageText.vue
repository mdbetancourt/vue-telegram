<script>
import { TEXT_ENTITY_TYPE, MESSAGE_CONTENT } from '@airgram/api'
import ContentRenderWebPage from './ContentRenderWebPage.vue'

/**
 * @typedef {import('@airgram/api').FormattedText} FormattedText
 * @typedef {import('@airgram/api').Message} Message
 * */

/** @return {Array<Object>} */
function splitBy(text, entities, start = 0) {
  const [entity, ...restEntities] = entities
  if (start === text.length) {
    return []
  }

  if (!entity) {
    // Text node
    return [{ text: text.slice(start, text.length), type: { _: 'text' } }]
  }
  if (start < entity.offset) {
    // Text node
    const first = text.slice(start, entity.offset)
    return [
      { text: first, type: { _: 'text' } },
      ...splitBy(text, [entity, ...restEntities], entity.offset)
    ]
  }
  // Other type
  const first = text.slice(entity.offset, entity.offset + entity.length)
  return [
    { ...entity, text: first },
    ...splitBy(text, restEntities, entity.offset + entity.length)
  ]
}

export default {
  name: 'ContentRenderText',
  functional: true,
  props: {
    message: { type: Object, required: true }
  },
  render: function(h, ctx) {
    /** @type {Message} */
    const message = ctx.props.message
    if (message.content._ !== MESSAGE_CONTENT.messageText)
      throw new Error('content render text only can render messageText')

    const {
      text: { text, entities },
      webPage
    } = message.content

    let options = { style: { whiteSpace: 'pre-line', userSelect: 'text' } }

    const click = event => event.stopPropagation()

    const content = splitBy(text, entities).map(({ text, type, offset }) => {
      let hashtag, command
      switch (type._) {
        case TEXT_ENTITY_TYPE.textEntityTypeUrl: {
          let url = text.startsWith('http') ? text : 'http://' + text
          let decodedUrl
          try {
            decodedUrl = decodeURI(text)
          } catch (error) {
            console.error('uri: ' + text + '\n' + error)
            decodedUrl = text
          }
          return h(
            'a',
            {
              ...options,
              key: offset,
              on: {
                click
              },
              attrs: {
                href: url,
                title: url,
                target: '_blank',
                rel: 'noopener noreferrer'
              }
            },
            decodedUrl
          )
        }
        case TEXT_ENTITY_TYPE.textEntityTypeTextUrl: {
          let url = type.url.startsWith('http')
            ? type.url
            : 'http://' + type.url
          return h(
            'a',
            {
              ...options,
              key: offset,
              on: {
                click
              },
              attrs: {
                href: url,
                title: url,
                target: '_blank',
                rel: 'noopener noreferrer'
              }
            },
            text
          )
        }
        case TEXT_ENTITY_TYPE.textEntityTypeBold:
          return h('strong', { key: offset }, text)
        case TEXT_ENTITY_TYPE.textEntityTypeItalic:
          return h('em', { key: offset }, text)
        case TEXT_ENTITY_TYPE.textEntityTypeCode:
          return h('code', { key: offset }, text)
        case TEXT_ENTITY_TYPE.textEntityTypePre:
          return h('pre', { key: offset }, h('code', text))
        case TEXT_ENTITY_TYPE.textEntityTypeMention:
          return h(
            'a',
            {
              ...options,
              key: offset,
              on: { click },
              attrs: { href: `#/im?p=${text}` }
            },
            text
          )
        case TEXT_ENTITY_TYPE.textEntityTypeMentionName:
          return h(
            'a',
            {
              ...options,
              key: offset,
              on: { click },
              attrs: { href: `#/im?p=u${type.user_id}` }
            },
            text
          )
        case TEXT_ENTITY_TYPE.textEntityTypeHashtag:
          hashtag =
            text.length > 0 && text[0] === '#' ? text.substring(1) : text
          return h(
            'a',
            {
              ...options,
              key: offset,
              on: { click },
              attrs: { href: `tg://search_hashtag?hashtag=${hashtag}` }
            },
            text
          )
        case TEXT_ENTITY_TYPE.textEntityTypeEmailAddress:
          return h(
            'a',
            {
              ...options,
              key: offset,
              on: { click },
              attrs: { href: `mailto:${text}`, rel: 'noopener noreferrer' }
            },
            text
          )
        case TEXT_ENTITY_TYPE.textEntityTypeBotCommand:
          command =
            text.length > 0 && text[0] === '/' ? text.substring(1) : text
          return h(
            'a',
            {
              ...options,
              key: offset,
              on: { click },
              attrs: { href: `tg://bot_command?command=${command}&bot=` }
            },
            text
          )
        default:
          return text
      }
    })
    if (webPage) {
      content.push(
        h(ContentRenderWebPage, {
          props: {
            webPage
          }
        })
      )
    }
    return h('div', options, content)
  }
}
</script>
