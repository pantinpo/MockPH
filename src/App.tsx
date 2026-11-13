import { useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  businessConfig,
  getBundleSavings,
  formatPrice,
  getPackageDurationMinutes,
  getPackageName,
  getPackagePrice,
  getPackageStageNames,
  getStagePrice,
} from './config'
import type { Booking, InterviewBundle, InterviewStage } from './config'
import { submitBookingRequest } from './submission'
import TurnstileWidget from './TurnstileWidget'
import './App.css'

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? ''

const initialBooking: Booking = {
  fullName: '',
  email: '',
  contactValue: '',
  targetRole: '',
  companyOrIndustry: '',
  experienceLevel: '',
  jobCategory: '',
  packageType: '',
  interviewStage: '',
  bundleId: '',
  durationMinutes: 0,
  preferredDate: '',
  preferredTime: '',
  timezone: 'Asia/Manila',
  notes: '',
  privacyNoticeAccepted: false,
  honeypot: '',
}

function PackageSelector({
  booking,
  errors,
  onChange,
  idPrefix,
}: {
  booking: Booking
  errors: Partial<Record<keyof Booking, string>>
  onChange: <Key extends keyof Booking>(key: Key, value: Booking[Key]) => void
  idPrefix: string
}) {
  const packagePrice = getPackagePrice(booking)
  const bundleSavings = booking.bundleId ? getBundleSavings(booking.bundleId) : 0
  const hasSelection = Boolean(
    booking.jobCategory &&
    ((booking.packageType === 'single' && booking.interviewStage) ||
      (booking.packageType === 'bundle' && booking.bundleId)),
  )

  function chooseStage(stageId: InterviewStage) {
    const stage = businessConfig.stages.find((item) => item.id === stageId)
    if (!stage) return
    onChange('packageType', 'single')
    onChange('interviewStage', stageId)
    onChange('bundleId', '')
    onChange('durationMinutes', stage.defaultDuration)
  }

  function chooseBundle(bundleId: InterviewBundle) {
    onChange('packageType', 'bundle')
    onChange('interviewStage', '')
    onChange('bundleId', bundleId)
  }

  const selectedBundle = businessConfig.bundles.find((bundle) => bundle.id === booking.bundleId)
  const selectedStage = businessConfig.stages.find((stage) => stage.id === booking.interviewStage)

  return (
    <div className="package-selector">
      <Field
        id={`${idPrefix}-jobCategory`}
        label="Job category"
        error={errors.jobCategory}
        hint="Used to tailor your practice questions. It does not change the package price."
      >
        <select
          id={`${idPrefix}-jobCategory`}
          value={booking.jobCategory}
          onChange={(event) => onChange('jobCategory', event.target.value)}
          aria-invalid={Boolean(errors.jobCategory)}
          aria-describedby={errors.jobCategory ? `${idPrefix}-jobCategory-error` : undefined}
        >
          <option value="">Select a category</option>
          {businessConfig.categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </Field>

      <fieldset className="package-type-picker">
        <legend>What would you like to practice?</legend>
        <div className="package-type-options">
          <label className={`package-type-option ${booking.packageType === 'single' ? 'selected' : ''}`}>
            <input
              type="radio"
              name={`${idPrefix}-packageType`}
              value="single"
              checked={booking.packageType === 'single'}
              onChange={() => {
                onChange('packageType', 'single')
                onChange('bundleId', '')
              }}
            />
            <b>One interview stage</b>
            <small>Choose the stage you want to practice.</small>
          </label>
          <label className={`package-type-option ${booking.packageType === 'bundle' ? 'selected' : ''}`}>
            <input
              type="radio"
              name={`${idPrefix}-packageType`}
              value="bundle"
              checked={booking.packageType === 'bundle'}
              onChange={() => {
                onChange('packageType', 'bundle')
                onChange('interviewStage', '')
              }}
            />
            <b>Multi-stage bundle</b>
            <small>Practice for more than one stage.</small>
          </label>
        </div>
        {errors.packageType && <span className="field-error">{errors.packageType}</span>}
      </fieldset>

      {booking.packageType === 'single' && (
        <fieldset className="stage-picker">
          <legend>Choose an interview stage</legend>
          <div className="stage-options">
            {businessConfig.stages.map((stage, index) => (
              <label className={`stage-option ${booking.interviewStage === stage.id ? 'selected' : ''}`} key={stage.id}>
                <input
                  type="radio"
                  name={`${idPrefix}-interviewStage`}
                  value={stage.id}
                  checked={booking.interviewStage === stage.id}
                  onChange={() => chooseStage(stage.id)}
                />
                <span className="stage-option-top">
                  <b><span className="stage-index">0{index + 1}</span> {stage.name}</b>
                  <span>{getStageDurationLabel(stage)}</span>
                </span>
                <small>{stage.description}</small>
              </label>
            ))}
          </div>
          {errors.interviewStage && <span className="field-error">{errors.interviewStage}</span>}
        </fieldset>
      )}

      {booking.packageType === 'bundle' && (
        <fieldset className="bundle-picker">
          <legend>Choose a bundle</legend>
          <div className="bundle-options">
            {businessConfig.bundles.map((bundle) => (
              <label className={`bundle-option ${booking.bundleId === bundle.id ? 'selected' : ''}`} key={bundle.id}>
                <input
                  type="radio"
                  name={`${idPrefix}-bundleId`}
                  value={bundle.id}
                  checked={booking.bundleId === bundle.id}
                  onChange={() => chooseBundle(bundle.id)}
                />
                <span className="bundle-option-copy">
                  <b>{bundle.name}</b>
                  <small>{bundle.description}</small>
                  <small>{bundle.stages.map((stageId) => {
                    const stage = businessConfig.stages.find((item) => item.id === stageId)
                    if (!stage) return ''
                    const durationLabel = stage.id === 'technical'
                      ? getStageDurationLabel(stage)
                      : `${stage.defaultDuration} min`
                    return `${stage.name}: ${durationLabel}`
                  }).join(' · ')}</small>
                </span>
                <span className="bundle-check" aria-hidden="true">{booking.bundleId === bundle.id ? '✓' : '+'}</span>
              </label>
            ))}
          </div>
          {errors.bundleId && <span className="field-error">{errors.bundleId}</span>}
        </fieldset>
      )}

      {booking.packageType === 'single' && selectedStage && selectedStage.durations.length > 1 && (
        <fieldset className="duration-picker">
          <legend>Choose your {selectedStage.name} length</legend>
          <div className="duration-options">
            {selectedStage.durations.map((duration) => (
              <label className={`duration-option ${booking.durationMinutes === duration ? 'selected' : ''}`} key={duration}>
                <input
                  type="radio"
                  name={`${idPrefix}-stageDuration`}
                  value={duration}
                  checked={booking.durationMinutes === duration}
                  onChange={() => onChange('durationMinutes', duration)}
                />
                <b>{duration} minutes</b>
              </label>
            ))}
          </div>
          {errors.durationMinutes && <span className="field-error">{errors.durationMinutes}</span>}
        </fieldset>
      )}

      <div className="selection-price" aria-live="polite">
        {hasSelection && packagePrice !== null ? (
          <>
            <div className="selection-price-copy">
              <span>YOUR COMPLETE PACKAGE</span>
              <b>{formatPrice(packagePrice)}</b>
              <small>{getPackageName(booking)} · {getPackageDurationMinutes(booking)} minutes total</small>
            </div>
            {booking.packageType === 'bundle' && selectedBundle && bundleSavings > 0 && (
              <span className="savings-note">Save {formatPrice(bundleSavings)}</span>
            )}
          </>
        ) : (
          <p>Choose your category and package to see the complete price.</p>
        )}
      </div>
      <p className="included-line"><span>✓</span> Every package includes a live mock interview, feedback, written recap, and recommendations.</p>
    </div>
  )
}

function getStageDurationLabel(stage: (typeof businessConfig.stages)[number]) {
  return stage.id === 'technical'
    ? `Up to ${stage.defaultDuration} min`
    : `${stage.durations.join(' or ')} min`
}

const experienceOptions = [
  { value: 'first', label: 'This will be my first interview' },
  { value: 'some', label: 'I have some interview experience' },
  { value: 'experienced', label: 'I interview regularly' },
]

function todayInManila() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function getManilaWeekday(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

function isClosedDate(date: string) {
  const weekday = getManilaWeekday(date)
  return weekday === 0 || weekday === 6
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function shiftCalendarMonth(monthKey: string, offset: number) {
  const [year, month] = monthKey.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1 + offset, 1))
  return formatDateKey(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 1).slice(0, 7)
}

function formatCalendarMonth(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)))
}

function latestStartTime(date: string, durationMinutes: number) {
  const weekday = date ? getManilaWeekday(date) : -1
  const closingMinutes = weekday === 5 ? 18 * 60 : 22 * 60
  const latestMinutes = Math.floor((closingMinutes - durationMinutes) / 30) * 30
  return `${String(Math.floor(latestMinutes / 60)).padStart(2, '0')}:${String(latestMinutes % 60).padStart(2, '0')}`
}

function getAvailableTimeSlots(date: string, durationMinutes: number) {
  if (!date || isClosedDate(date)) return []

  const [latestHour, latestMinute] = latestStartTime(date, durationMinutes).split(':').map(Number)
  const latestMinutes = latestHour * 60 + latestMinute
  const slots: { value: string; label: string }[] = []

  for (let minutes = 10 * 60; minutes <= latestMinutes; minutes += 30) {
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    const displayHour = hour % 12 || 12
    const period = hour < 12 ? 'AM' : 'PM'
    slots.push({
      value: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      label: `${displayHour}:${String(minute).padStart(2, '0')} ${period}`,
    })
  }

  return slots
}

function Field({
  label,
  id,
  error,
  hint,
  children,
}: {
  label: string
  id: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error" id={`${id}-error`}>{error}</span>}
    </div>
  )
}

function DatePicker({
  value,
  today,
  onChange,
  ariaInvalid,
  ariaDescribedBy,
}: {
  value: string
  today: string
  onChange: (date: string) => void
  ariaInvalid: boolean
  ariaDescribedBy?: string
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => (value || today).slice(0, 7))
  const [year, month] = visibleMonth.split('-').map(Number)
  const firstDayOffset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cellCount = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7
  const calendarDays = Array.from({ length: cellCount }, (_, index) => {
    const day = index - firstDayOffset + 1
    return day > 0 && day <= daysInMonth ? formatDateKey(year, month, day) : ''
  })
  const currentMonth = today.slice(0, 7)

  return (
    <div
      className="date-picker"
      role="group"
      aria-labelledby="preferredDate-label"
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
    >
      <div className="calendar-header">
        <button
          className="calendar-nav"
          type="button"
          aria-label="Previous month"
          disabled={visibleMonth <= currentMonth}
          onClick={() => setVisibleMonth((current) => shiftCalendarMonth(current, -1))}
        >
          ‹
        </button>
        <b>{formatCalendarMonth(visibleMonth)}</b>
        <button
          className="calendar-nav"
          type="button"
          aria-label="Next month"
          onClick={() => setVisibleMonth((current) => shiftCalendarMonth(current, 1))}
        >
          ›
        </button>
      </div>
      <div className="calendar-grid" aria-label="Choose a weekday">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((weekday) => (
          <span className="calendar-weekday" key={weekday}>{weekday}</span>
        ))}
        {calendarDays.map((date, index) => {
          if (!date) return <span className="calendar-empty" key={`empty-${index}`} aria-hidden="true" />
          const disabled = date < today || isClosedDate(date)
          return (
            <button
              className={`calendar-day ${value === date ? 'selected' : ''}`}
              type="button"
              key={date}
              disabled={disabled}
              aria-label={date}
              aria-pressed={value === date}
              onClick={() => onChange(date)}
            >
              {Number(date.slice(-2))}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function App() {
  const [step, setStep] = useState(0)
  const [booking, setBooking] = useState<Booking>(initialBooking)
  const [errors, setErrors] = useState<Partial<Record<keyof Booking, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [requestReceived, setRequestReceived] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileResetVersion, setTurnstileResetVersion] = useState(0)
  const bookingRef = useRef<HTMLDivElement | null>(null)

  const price = booking.jobCategory ? getPackagePrice(booking) : null
  const packageName = getPackageName(booking)
  const packageDuration = getPackageDurationMinutes(booking)
  const packageStages = getPackageStageNames(booking)
  const today = todayInManila()
  const availableTimeSlots = getAvailableTimeSlots(booking.preferredDate, packageDuration)

  function updateField<Key extends keyof Booking>(key: Key, value: Booking[Key]) {
    setBooking((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({
      ...current,
      [key]: undefined,
      ...(key === 'jobCategory' || key === 'packageType' || key === 'interviewStage' ||
        key === 'bundleId' || key === 'durationMinutes'
        ? { packageType: undefined, interviewStage: undefined, bundleId: undefined, durationMinutes: undefined }
        : {}),
    }))
    setSubmitError('')
  }

  function choosePreferredDate(date: string) {
    if (date && isClosedDate(date)) {
      updateField('preferredDate', '')
      updateField('preferredTime', '')
      setErrors((current) => ({ ...current, preferredDate: 'Bookings are available Monday to Friday. Saturday and Sunday are closed.' }))
      return
    }
    updateField('preferredDate', date)
    updateField('preferredTime', '')
    setErrors((current) => ({ ...current, preferredDate: undefined, preferredTime: undefined }))
  }

  function scrollToBooking(targetId?: string) {
    window.setTimeout(() => {
      const target = (targetId && document.getElementById(targetId)) || bookingRef.current
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  function continueWithSelectedPackage() {
    const selectedStage = businessConfig.stages.find((stage) => stage.id === booking.interviewStage)
    const selectionComplete = price !== null &&
      Boolean(packageName) &&
      packageDuration > 0 &&
      (booking.packageType !== 'single' ||
        !selectedStage ||
        getStagePrice(selectedStage.id, booking.durationMinutes) !== null)
    setStep(selectionComplete ? 1 : 0)
    setErrors({})
    setSubmitError('')
    scrollToBooking(selectionComplete ? 'booking-about-form' : undefined)
  }

  function startBooking() {
    setStep(0)
    scrollToBooking()
  }

  function validateCurrentStep() {
    const nextErrors: Partial<Record<keyof Booking, string>> = {}
    if (step === 0) {
      if (!booking.jobCategory) nextErrors.jobCategory = 'Choose the category closest to the role.'
      if (!booking.packageType) nextErrors.packageType = 'Choose an individual stage or a bundle.'
      if (booking.packageType === 'single' && !booking.interviewStage) {
        nextErrors.interviewStage = 'Choose the interview stage you want to practice.'
      }
      if (booking.packageType === 'bundle' && !booking.bundleId) {
        nextErrors.bundleId = 'Choose a bundle to continue.'
      }
      const selectedStage = businessConfig.stages.find((stage) => stage.id === booking.interviewStage)
      if (booking.packageType === 'single' && selectedStage &&
          getStagePrice(selectedStage.id, booking.durationMinutes) === null) {
        nextErrors.durationMinutes = `Choose a valid ${selectedStage.name} length.`
      }
    }
    if (step === 1) {
      if (!booking.fullName.trim()) nextErrors.fullName = 'Enter your name.'
      if (!booking.email.trim() && !booking.contactValue.trim()) {
        nextErrors.email = 'Enter an email address or another way we can contact you.'
      } else if (booking.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email.trim())) {
        nextErrors.email = 'Enter a valid email address.'
      }
      if (!booking.targetRole.trim()) nextErrors.targetRole = 'Tell us the role you are preparing for.'
      if (!booking.experienceLevel) nextErrors.experienceLevel = 'Choose the option that fits you best.'
    }
    if (step === 2) {
      if (!booking.preferredDate) nextErrors.preferredDate = 'Choose a preferred date.'
      else if (booking.preferredDate < today) {
        nextErrors.preferredDate = 'Choose today or a future date.'
      } else if (isClosedDate(booking.preferredDate)) {
        nextErrors.preferredDate = 'Bookings are available Monday to Friday. Saturday and Sunday are closed.'
      }
      if (!booking.preferredTime) nextErrors.preferredTime = 'Choose a preferred time.'
      else if (booking.preferredDate) {
        const [hours, minutes] = booking.preferredTime.split(':').map(Number)
        const selectedMinutes = hours * 60 + minutes
        const latestMinutes = latestStartTime(booking.preferredDate, packageDuration).split(':').map(Number)
        const latestAllowed = latestMinutes[0] * 60 + latestMinutes[1]
        if (selectedMinutes < 10 * 60 || selectedMinutes > latestAllowed || selectedMinutes % 30 !== 0) {
          nextErrors.preferredTime = `Choose a time on the hour or half-hour from 10:00 AM to ${latestStartTime(booking.preferredDate, packageDuration)} so your session ends before closing.`
        }
      }
      if (!booking.privacyNoticeAccepted) {
        nextErrors.privacyNoticeAccepted = 'Please read and accept the privacy notice to continue.'
      }
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function continueFlow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validateCurrentStep()) return
    setStep((current) => Math.min(current + 1, 3))
    setSubmitError('')
    scrollToBooking()
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0))
    setErrors({})
    setSubmitError('')
    setTurnstileToken('')
    scrollToBooking()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validateCurrentStep() || price === null || !packageName) return
    if (!turnstileToken) {
      setSubmitError('Complete the verification before sending your request.')
      return
    }
    setIsSubmitting(true)
    setSubmitError('')
    try {
      await submitBookingRequest({
        ...booking,
        durationMinutes: packageDuration,
        packagePrice: price,
        packageName,
        packageDurationMinutes: packageDuration,
        interviewStages: packageStages,
      }, turnstileToken)
      setRequestReceived(true)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'We could not send your request. Please try again.')
      setTurnstileToken('')
      setTurnstileResetVersion((version) => version + 1)
    } finally {
      setIsSubmitting(false)
    }
  }

  function startOver() {
    setBooking(initialBooking)
    setStep(0)
    setErrors({})
    setSubmitError('')
    setRequestReceived(false)
    setTurnstileToken('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const progress = ((step + 1) / 4) * 100

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="MockCall PH home">
            <span className="brand-mark" aria-hidden="true"><span /></span>
            <span>MockCall <b>PH</b></span>
          </a>
          <nav aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#pricing">Packages</a>
          </nav>
          <button className="button button-small button-dark" onClick={() => startBooking()} type="button">
            Book a session <span aria-hidden="true">↗</span>
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero section-shell">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> A little practice goes a long way</div>
            <h1>Your next interview starts with <em>practice.</em></h1>
            <p className="hero-lede">
              Practice one-on-one with an experienced interviewer who understands your industry
              and the role you’re targeting. Get comfortable with realistic questions and leave
              with practical feedback.
            </p>
            <div className="hero-price-callout">
              <strong>Packages start at ₱100</strong>
              <span>Choose your package to see its complete price.</span>
            </div>
            <div className="hero-actions">
              <button className="button button-primary" type="button" onClick={() => startBooking()}>
                Book a mock interview <span aria-hidden="true">→</span>
              </button>
              <a className="text-link" href="#how-it-works">How it works <span aria-hidden="true">↓</span></a>
            </div>
            <div className="hero-reassurance"><span aria-hidden="true">✳</span> No pressure. No judgment. Just practice.</div>
          </div>

          <div className="hero-art" aria-label="Illustration of a friendly practice interview">
            <div className="art-sun" />
            <div className="art-doodle doodle-one">✳</div>
            <div className="art-doodle doodle-two">✦</div>
            <div className="art-card">
              <div className="art-card-top"><span className="live-dot" /> PRACTICE CALL <span>ONLINE</span></div>
              <div className="conversation">
                <div className="person person-coach"><span className="person-icon">M</span><div><b>Interviewer</b><i>Let’s start with you.</i></div></div>
                <div className="speech-bubble">“Tell me a little about yourself.”</div>
                <div className="person person-you"><span className="person-icon">Y</span><div><b>You</b><i>Finding your words...</i></div><span className="sound-bars"><i /><i /><i /><i /><i /></span></div>
              </div>
              <div className="art-card-foot"><span>Easy does it.</span><span className="tiny-spark">✳</span></div>
            </div>
            <div className="art-note"><span className="note-check">✓</span><span><b>Feedback included</b><small>Clear next steps, too</small></span></div>
            <div className="art-price"><small>IN EVERY PACKAGE</small><b>Feedback + recap</b></div>
          </div>
        </section>

        <div className="trust-strip">
          <div className="section-shell trust-inner">
            <span><i>01</i> A real interviewer familiar with your field</span>
            <span><i>02</i> 15–45 minutes for your stage</span>
            <span><i>03</i> Feedback and written recap included</span>
          </div>
        </div>

        <section className="section-shell how-section" id="how-it-works">
          <div className="section-heading">
            <div className="eyebrow">A simple way to get ready</div>
            <h2>Three steps. One more<br className="desktop-break" /> confident you.</h2>
          </div>
          <div className="steps-grid">
            <article className="how-card">
              <span className="step-number">01</span>
              <div className="step-icon icon-choice" aria-hidden="true"><span>↗</span><i /><i /></div>
              <h3>Choose your package</h3>
              <p>Choose an interview stage or bundle. Your complete price appears after you make your selections.</p>
            </article>
            <article className="how-card">
              <span className="step-number">02</span>
              <div className="step-icon icon-chat" aria-hidden="true"><span>···</span><i /></div>
              <h3>Tell us what’s ahead</h3>
              <p>Share the role, a time that works, and anything you’d like us to keep in mind.</p>
            </article>
            <article className="how-card">
              <span className="step-number">03</span>
              <div className="step-icon icon-spark" aria-hidden="true"><span>✳</span></div>
              <h3>Practice and improve</h3>
              <p>We’ll connect you with an interviewer familiar with your industry for realistic practice, useful feedback, and a written recap.</p>
            </article>
          </div>
          <p className="meeting-note">We’ll agree on an online meeting platform together, such as Google Meet or Microsoft Teams.</p>
        </section>

        <section className="pricing-section" id="pricing">
          <div className="section-shell pricing-layout">
            <div className="pricing-intro">
              <div className="eyebrow">Choose first. See your price.</div>
              <h2>Practice for<br />your next stage.</h2>
              <p>Pick a stage or bundle to see your full package price. Job category helps us tailor questions but never changes the price.</p>
              <div className="price-rule">
                <span className="rule-icon">✓</span>
                <p><b>One clear package price</b><br />A live mock interview, feedback, written recap, and recommendations are included.</p>
              </div>
              <a className="text-link" href="#booking">Book your selected package <span aria-hidden="true">↓</span></a>
            </div>
            <div className="price-preview">
              <div className="preview-heading">
                <div><span className="eyebrow">Build your practice package</span><h3>Your price follows your choices</h3></div>
              </div>
              <PackageSelector booking={booking} errors={{}} onChange={updateField} idPrefix="pricing" />
              <button className="button button-primary selector-continue" type="button" onClick={continueWithSelectedPackage}>
                Continue with this package <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </section>

        <section className="booking-section section-shell" id="booking">
          <div className="booking-aside">
            <div className="eyebrow">Your next step</div>
            <h2>Let’s make<br />practice happen.</h2>
            <p>Tell us what you’re preparing for, and we’ll connect you with an interviewer familiar with your industry and role. We’ll confirm a time before anything is booked.</p>
            <div className="booking-aside-note"><span aria-hidden="true">↳</span><p><b>Just a request for now.</b><br />We’ll follow up to confirm availability, meeting details, and payment instructions.</p></div>
            {price !== null && <div className="mini-price-card"><span>YOUR COMPLETE PACKAGE</span><b>{formatPrice(price)}</b><small>{packageName} · {packageDuration} minutes</small></div>}
          </div>

          <div className="wizard-card" ref={bookingRef}>
            {requestReceived ? (
              <div className="confirmation">
                <div className="confirmation-icon" aria-hidden="true">✓</div>
                <div className="eyebrow">Request received</div>
                <h2>Your request has<br />been received!</h2>
                <p>This is a booking request, not a confirmed appointment. We’ll contact you to confirm availability, meeting details, and payment instructions.</p>
                <div className="confirmation-summary">
                  <div><span>Package</span><b>{packageName} · {packageDuration} minutes</b></div>
                  <div><span>Included stages</span><b>{packageStages.join(', ')}</b></div>
                  <div><span>Job category</span><b>{businessConfig.categories.find((category) => category.id === booking.jobCategory)?.name}</b></div>
                  <div><span>Complete package price</span><b>{price !== null ? formatPrice(price) : ''}</b></div>
                  <div><span>Preferred schedule</span><b>{booking.preferredDate} at {booking.preferredTime} (Philippine time)</b></div>
                </div>
                <button className="button button-primary" type="button" onClick={startOver}>Start over</button>
              </div>
            ) : (
              <>
                <div className="wizard-top">
                  <div className="wizard-topline"><span>BOOKING REQUEST</span><span>STEP {step + 1} OF 4</span></div>
                  <div className="progress-track" role="progressbar" aria-label="Booking progress" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={4}><span style={{ width: `${progress}%` }} /></div>
                  <div className="wizard-step-names"><span className={step === 0 ? 'active' : ''}>Package</span><span className={step === 1 ? 'active' : ''}>About you</span><span className={step === 2 ? 'active' : ''}>Schedule</span><span className={step === 3 ? 'active' : ''}>Review</span></div>
                </div>

                <form onSubmit={step === 3 ? handleSubmit : continueFlow} noValidate>
                  {step === 0 && (
                    <div className="wizard-content">
                      <div className="wizard-title"><span className="step-kicker">01 / YOUR PACKAGE</span><h2>What are you preparing for?</h2><p>Choose your job category and practice package. We’ll show the complete price after you choose.</p></div>
                      <PackageSelector booking={booking} errors={errors} onChange={updateField} idPrefix="booking" />
                    </div>
                  )}

                  {step === 1 && (
                    <div className="wizard-content">
                      <div className="wizard-title"><span className="step-kicker">02 / ABOUT YOU</span><h2>Who’s getting ready?</h2><p>We only need a few details to shape the practice around your goals.</p></div>
                      <div className="field-grid" id="booking-about-form">
                        <Field id="fullName" label="Full name" error={errors.fullName}>
                          <input id="fullName" autoComplete="name" value={booking.fullName} onChange={(event) => updateField('fullName', event.target.value)} placeholder="e.g. Alex Santos" aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? 'fullName-error' : undefined} />
                        </Field>
                        <Field id="email" label="Email address" error={errors.email} hint="Optional if you provide another way to reach you.">
                          <input id="email" type="email" autoComplete="email" value={booking.email} onChange={(event) => updateField('email', event.target.value)} placeholder="you@example.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />
                        </Field>
                      </div>
                      <Field id="contactValue" label="Another way to reach you (optional)" hint="Phone number or preferred contact handle. Enter an email or alternate contact to continue.">
                        <input id="contactValue" autoComplete="tel" value={booking.contactValue} onChange={(event) => updateField('contactValue', event.target.value)} placeholder="Add a number or handle if you prefer" />
                      </Field>
                      <div className="field-grid">
                        <Field id="targetRole" label="Target job title" error={errors.targetRole}>
                          <input id="targetRole" value={booking.targetRole} onChange={(event) => updateField('targetRole', event.target.value)} placeholder="e.g. Junior accountant" aria-invalid={Boolean(errors.targetRole)} aria-describedby={errors.targetRole ? 'targetRole-error' : undefined} />
                        </Field>
                        <Field id="companyOrIndustry" label="Company or industry (optional)">
                          <input id="companyOrIndustry" value={booking.companyOrIndustry} onChange={(event) => updateField('companyOrIndustry', event.target.value)} placeholder="What can we tailor questions to?" />
                        </Field>
                      </div>
                      <Field id="experienceLevel" label="How much interview experience do you have?" error={errors.experienceLevel}>
                        <select id="experienceLevel" value={booking.experienceLevel} onChange={(event) => updateField('experienceLevel', event.target.value)} aria-invalid={Boolean(errors.experienceLevel)} aria-describedby={errors.experienceLevel ? 'experienceLevel-error' : undefined}>
                          <option value="">Choose one</option>
                          {experienceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </Field>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="wizard-content">
                      <div className="wizard-title"><span className="step-kicker">03 / SCHEDULE</span><h2>When works for you?</h2><p>Choose a weekday and a time during our open hours. All times are Philippine time.</p></div>
                      <div className="field-grid">
                        <div className="field">
                          <span className="field-label" id="preferredDate-label">Preferred date</span>
                          <DatePicker
                            value={booking.preferredDate}
                            today={today}
                            onChange={choosePreferredDate}
                            ariaInvalid={Boolean(errors.preferredDate)}
                            ariaDescribedBy={errors.preferredDate ? 'preferredDate-error' : undefined}
                          />
                          {errors.preferredDate && <span className="field-error" id="preferredDate-error">{errors.preferredDate}</span>}
                        </div>
                        <Field id="preferredTime" label="Preferred time" error={errors.preferredTime} hint="Choose times on the hour or half-hour. Mon–Thu: 10:00 AM–10:00 PM · Fri: 10:00 AM–6:00 PM · Closed weekends. Your session must end by closing.">
                          <select
                            id="preferredTime"
                            value={booking.preferredTime}
                            onChange={(event) => updateField('preferredTime', event.target.value)}
                            disabled={!availableTimeSlots.length}
                            aria-invalid={Boolean(errors.preferredTime)}
                            aria-describedby={errors.preferredTime ? 'preferredTime-error' : undefined}
                          >
                            <option value="">{booking.preferredDate ? 'Choose a time' : 'Choose a weekday first'}</option>
                            {availableTimeSlots.map((slot) => (
                              <option key={slot.value} value={slot.value}>{slot.label}</option>
                            ))}
                          </select>
                        </Field>
                      </div>
                      <Field id="notes" label="Anything else we should know? (optional)" hint="For example, an interview format or a question you find tricky.">
                        <textarea id="notes" rows={3} maxLength={700} value={booking.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Share only what would help us prepare." />
                      </Field>
                      <div className="privacy-card">
                        <div className="privacy-icon" aria-hidden="true">⌑</div>
                        <div><b>Your details stay focused on this request.</b><p>{businessConfig.privacyNotice}</p></div>
                      </div>
                      <label className={`consent-label ${errors.privacyNoticeAccepted ? 'consent-error' : ''}`}>
                        <input type="checkbox" checked={booking.privacyNoticeAccepted} onChange={(event) => updateField('privacyNoticeAccepted', event.target.checked)} />
                        <span>I have read and agree to the privacy notice for this booking request.</span>
                      </label>
                      {errors.privacyNoticeAccepted && <span className="field-error">{errors.privacyNoticeAccepted}</span>}
                      <div className="ai-disclosure"><span>✳</span><p>{businessConfig.aiNotesDisclosure}</p></div>
                      <div className="honeypot" aria-hidden="true">
                        <label htmlFor="website">Leave this field empty</label>
                        <input id="website" tabIndex={-1} autoComplete="off" value={booking.honeypot} onChange={(event) => updateField('honeypot', event.target.value)} />
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="wizard-content">
                      <div className="wizard-title"><span className="step-kicker">04 / REVIEW</span><h2>Does this look right?</h2><p>Check your package and preferred schedule before sending the request.</p></div>
                      <div className="review-summary">
                        <div className="review-package">
                          <span className="review-label">YOUR COMPLETE PACKAGE</span>
                          <b>{packageName} · {packageDuration} minutes</b>
                          <span>{packageStages.join(' + ')}</span>
                          <span>{businessConfig.categories.find((category) => category.id === booking.jobCategory)?.name}</span>
                          <strong>{price !== null ? formatPrice(price) : ''}</strong>
                          <small>Live session, feedback, written recap, and recommendations included.</small>
                        </div>
                        <div className="review-details">
                          <SummaryRow label="Name" value={booking.fullName} />
                          <SummaryRow label="Email" value={booking.email} />
                          {booking.contactValue && <SummaryRow label="Other contact" value={booking.contactValue} />}
                          <SummaryRow label="Target role" value={booking.targetRole} />
                          {booking.companyOrIndustry && <SummaryRow label="Company / industry" value={booking.companyOrIndustry} />}
                          <SummaryRow label="Experience" value={experienceOptions.find((option) => option.value === booking.experienceLevel)?.label ?? ''} />
                          <SummaryRow label="Preferred schedule" value={`${booking.preferredDate} at ${booking.preferredTime} (Asia/Manila)`} />
                          {booking.notes && <SummaryRow label="Note" value={booking.notes} />}
                        </div>
                      </div>
                      <div className="request-warning"><span aria-hidden="true">↗</span><p>This sends a <b>booking request</b>, not a confirmed appointment. We’ll contact you to confirm availability, meeting details, and payment instructions.</p></div>
                      <TurnstileWidget
                        siteKey={turnstileSiteKey}
                        onToken={setTurnstileToken}
                        resetVersion={turnstileResetVersion}
                      />
                      {submitError && <div className="submit-error" role="alert">{submitError}</div>}
                    </div>
                  )}

                  <div className="wizard-actions">
                    {step > 0 ? <button className="back-button" type="button" onClick={goBack}><span aria-hidden="true">←</span> Back</button> : <span />}
                    {step < 3 ? (
                      <button className="button button-primary" type="submit">Continue <span aria-hidden="true">→</span></button>
                    ) : (
                      <button className="button button-primary" type="submit" disabled={isSubmitting || !turnstileToken}>
                        {isSubmitting ? <><span className="button-spinner" /> Sending request…</> : <>Send booking request <span aria-hidden="true">→</span></>}
                      </button>
                    )}
                  </div>
                  <p className="wizard-privacy-foot">Your request is only sent when you press the button above.</p>
                </form>
              </>
            )}
          </div>
        </section>

        <section className="bottom-note">
          <div className="section-shell bottom-note-inner"><span className="bottom-spark">✳</span><p><b>Practice is a great first step.</b> Mock interviews offer practice and feedback; they can’t guarantee a job offer or hiring outcome.</p></div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="section-shell footer-inner">
          <a className="brand footer-brand" href="#top"><span className="brand-mark" aria-hidden="true"><span /></span><span>MockCall <b>PH</b></span></a>
          <span>Practice before the real interview.</span>
          <a href="#top">Back to top ↑</a>
        </div>
        <div className="section-shell footer-legal">Privacy notice and retention settings should be reviewed by the service owner before launch, including applicable Philippine data-protection requirements.</div>
      </footer>
    </>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="summary-row"><span>{label}</span><b>{value}</b></div>
}

export default App
