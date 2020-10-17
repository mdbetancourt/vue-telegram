import { airgram } from '@/plugins/tdweb'
import store from '@/plugins/store'
import { AUTHORIZATION_STATE } from '@airgram/api'

/**
 * use this to make a Base64 encoded string URL friendly,
 * i.e. '+' and '/' are replaced with '-' and '_' also any trailing '='
 * characters are removed
 *
 * @param {String} str the encoded string
 * @returns {String} the URL friendly encoded String
 */
function Base64EncodeUrl(str) {
  return str
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function arrayBufferToBase64(buffer) {
  var binary = ''
  var bytes = new Uint8Array(buffer)
  var len = bytes.byteLength
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return Base64EncodeUrl(window.btoa(binary))
}

/**
 *
 * @param {ServiceWorkerRegistration} registration
 */
export async function subscribeNotifications(registration) {
  try {
    let pushSubscription = await registration.pushManager.getSubscription()
    if (pushSubscription) await pushSubscription.unsubscribe()

    pushSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true
    })
    console.log(
      '[SW] Received PushSubscription: ',
      JSON.stringify(pushSubscription)
    )

    const { endpoint } = pushSubscription
    const p256DhBase64Url = arrayBufferToBase64(
      pushSubscription.getKey('p256dh')
    )
    const authBase64Url = arrayBufferToBase64(pushSubscription.getKey('auth'))

    if (endpoint && p256DhBase64Url && authBase64Url) {
      const authorizationState = store.state.tdlib.auth.current
      if (
        authorizationState &&
        authorizationState === AUTHORIZATION_STATE.authorizationStateReady
      ) {
        airgram.api.registerDevice({
          deviceToken: {
            _: 'deviceTokenWebPush',
            endpoint,
            p256DhBase64Url,
            authBase64Url
          },
          otherUserIds: []
        })
      }
    }
  } catch (error) {
    console.error('[SW] Error during service worker push subscription: ', error)
  }
}
