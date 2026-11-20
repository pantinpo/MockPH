import type { BookingSubmission } from './config'

const resultMessageType = 'mockcall-booking-result'

function getSubmissionError(errorCode: unknown) {
  switch (errorCode) {
    case 'INVALID_REQUEST':
      return 'We could not verify the booking details. Check your package and preferred schedule, then try again.'
    case 'PACKAGE_MISMATCH':
      return 'The booking page and service have different package settings. Please contact the service operator to update the booking service, then try again.'
    case 'VERIFICATION_FAILED':
      return 'The security check could not be verified. Please complete it again and resend your request.'
    case 'SHEET_WRITE_FAILED':
      return 'The booking service could not save your request. Please try again later or contact the service operator.'
    default:
      return 'We could not save your request. Please try again later.'
  }
}

export async function submitBookingRequest(booking: BookingSubmission, turnstileToken: string) {
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
    payloadField.value = JSON.stringify({ ...booking, turnstileToken, responseToken })
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
      else finish(new Error(getSubmissionError(event.data.errorCode)))
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
