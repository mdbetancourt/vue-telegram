import { Airgram } from 'tdweb-airgram'
import { getBrowser, getOSName } from '@/utils/information'
import { version } from '../../package.json'

export const airgram = new Airgram({
  apiId: 939250,
  apiHash: 'bdbf7000698e3bbd40d331225b7e3496',
  systemLanguageCode: navigator.language || 'en',
  deviceModel: getBrowser(),
  systemVersion: getOSName(),
  useChatInfoDatabase: true,
  useMessageDatabase: true,
  useTestDc: false,
  applicationVersion: version
})

if (process.env.NODE_ENV !== 'production') {
  window.airgram = airgram
  airgram.use((ctx, next) => {
    // Log all
    console.log(ctx)
    next()
  })
}
