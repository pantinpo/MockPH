import type { BookingSubmission } from './config'

const resultMessageType = 'mockcall-booking-result'

export async function submitBookingRequest(booking: BookingSubmission) {
  const endpoint = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL?.trim()
  if (!endpoint) {
    throw new Error('Booking requests are not connected yet. Please try again later; no request was sent or saved.')
  }

  let endpointUrl: URL
  try {
    endpointUrl = new URL(endpoint)
  } catch {
    throw new Error('The booking endpoint is not a valid URL. No request was sent.')
  }
  if (endpointUrl.protocol !== 'https:' || endpointUrl.hostname !== 'script.google.com') {
    throw new Error('The booking endpoint must be a secure Google Apps Script web app URL. No request was sent.')
  }

  const responseToken = crypto.randomUUID()

  return new Promise<void>((resolve, reject) => {
    const frameName = `mockcall-submit-${Date.now()}`
    const iframe = document.createElement('iframe')
    iframe.name = frameName
    iframe.title = 'Booking request response'
    iframe.className = 'submission-frame'
    iframe.setAttribute('aria-hidden', 'true')

    const form = document.createElement('form')
    form.method = 'POST'
    form.action = endpointUrl.toString()
    form.target = frameName
    form.className = 'submission-form'

    const payloadField = document.createElement('input')
    payloadField.type = 'hidden'
    payloadField.name = 'payload'
    payloadField.value = JSON.stringify({ ...booking, responseToken })
    form.append(payloadField)
    document.body.append(iframe, form)

    let settled = false
    const cleanup = () => {
      window.removeEventListener('message', onMessage)
      window.clearTimeout(timeoutId)
      form.remove()
      iframe.remove()
    }
    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      cleanup()
      if (error) reject(error)
      else resolve()
    }
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== resultMessageType || event.data.responseToken !== responseToken) return
      if (event.data.ok === true) finish()
      else finish(new Error('We could not save your request. Please try again later.'))
    }
    const timeoutId = window.setTimeout(() => {
      finish(new Error('The request could not be confirmed. Please try again later; if this keeps happening, contact the service operator.'))
    }, 25_000)

    window.addEventListener('message', onMessage)
    try {
      form.submit()
    } catch {
      finish(new Error('Your browser could not send the request. Please try again.'))
    }
  })
}
