import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

type TurnstileOptions = {
  sitekey: string
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': () => void
}

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileOptions) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let turnstileLoad: Promise<TurnstileApi> | undefined

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (turnstileLoad) return turnstileLoad

  turnstileLoad = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile)
      else {
        turnstileLoad = undefined
        reject(new Error('Turnstile failed to initialize.'))
      }
    }
    script.onerror = () => {
      turnstileLoad = undefined
      script.remove()
      reject(new Error('Turnstile could not be loaded.'))
    }
    document.head.append(script)
  })

  return turnstileLoad
}

export default function TurnstileWidget({
  siteKey,
  onToken,
  resetVersion,
}: {
  siteKey: string
  onToken: Dispatch<SetStateAction<string>>
  resetVersion: number
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | undefined>(undefined)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!siteKey) return

    loadTurnstile().then((turnstile) => {
      if (cancelled || !containerRef.current) return
      widgetIdRef.current = turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(''),
        'error-callback': () => {
          onToken('')
          setLoadError(true)
        },
      })
    }).catch(() => {
      if (!cancelled) setLoadError(true)
    })

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = undefined
      }
    }
  }, [siteKey, onToken])

  useEffect(() => {
    if (resetVersion === 0) return
    if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current)
  }, [resetVersion, onToken])

  const verificationError = !siteKey || loadError

  return (
    <div className="turnstile-field">
      <div ref={containerRef} />
      {verificationError ? (
        <p className="field-error" role="alert">
          Verification is unavailable. Please try again later.
        </p>
      ) : (
        <p className="field-hint">Complete the verification before sending your request.</p>
      )}
    </div>
  )
}
