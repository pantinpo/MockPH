import { useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { businessConfig, getPackagePrice, formatPrice } from './config'
import type { Booking, InterviewStage } from './config'
import { submitBookingRequest } from './submission'
import './App.css'

const initialBooking: Booking = {
  fullName: '',
  email: '',
  contactValue: '',
  targetRole: '',
  companyOrIndustry: '',
  experienceLevel: '',
  jobCategory: '',
  interviewStage: '',
  durationMinutes: 30,
  preferredDate: '',
  preferredTime: '',
  timezone: 'Asia/Manila',
  notes: '',
  privacyNoticeAccepted: false,
  honeypot: '',
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

function App() {
  const [step, setStep] = useState(0)
  const [booking, setBooking] = useState<Booking>(initialBooking)
  const [errors, setErrors] = useState<Partial<Record<keyof Booking, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [requestReceived, setRequestReceived] = useState(false)
  const bookingRef = useRef<HTMLElement | null>(null)

  const price = booking.jobCategory && booking.interviewStage
    ? getPackagePrice(booking.jobCategory, booking.interviewStage)
    : null
  const selectedStage = businessConfig.stages.find((item) => item.id === booking.interviewStage)

  function updateField<Key extends keyof Booking>(key: Key, value: Booking[Key]) {
    setBooking((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setSubmitError('')
  }

  function scrollToBooking() {
    window.setTimeout(() => bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  function startBooking(stage?: InterviewStage) {
    if (stage) updateField('interviewStage', stage)
    setStep(0)
    scrollToBooking()
  }

  function validateCurrentStep() {
    const nextErrors: Partial<Record<keyof Booking, string>> = {}
    if (step === 0) {
      if (!booking.jobCategory) nextErrors.jobCategory = 'Choose the category closest to the role.'
      if (!booking.interviewStage) nextErrors.interviewStage = 'Choose the interview stage.'
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
      else if (booking.preferredDate < todayInManila()) {
        nextErrors.preferredDate = 'Choose today or a future date.'
      }
      if (!booking.preferredTime) nextErrors.preferredTime = 'Choose a preferred time.'
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
    scrollToBooking()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validateCurrentStep() || !price || !selectedStage) return
    setIsSubmitting(true)
    setSubmitError('')
    try {
      await submitBookingRequest({
        ...booking,
        packagePrice: price,
        packageName: selectedStage.name,
      })
      setRequestReceived(true)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'We could not send your request. Please try again.')
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
              Get comfortable answering questions with a relaxed, one-on-one mock interview.
              Practice out loud, get useful feedback, and show up more prepared.
            </p>
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
              <div className="art-card-top"><span className="live-dot" /> PRACTICE SESSION <span>30 MIN</span></div>
              <div className="conversation">
                <div className="person person-coach"><span className="person-icon">M</span><div><b>Interviewer</b><i>Let’s start with you.</i></div></div>
                <div className="speech-bubble">“Tell me a little about yourself.”</div>
                <div className="person person-you"><span className="person-icon">Y</span><div><b>You</b><i>Finding your words...</i></div><span className="sound-bars"><i /><i /><i /><i /><i /></span></div>
              </div>
              <div className="art-card-foot"><span>Easy does it.</span><span className="tiny-spark">✳</span></div>
            </div>
            <div className="art-note"><span className="note-check">✓</span><span><b>Feedback included</b><small>Clear next steps, too</small></span></div>
            <div className="art-price"><small>COMPLETE PACKAGE</small><b>from ₱100</b></div>
          </div>
        </section>

        <div className="trust-strip">
          <div className="section-shell trust-inner">
            <span><i>01</i> One-on-one with a real person</span>
            <span><i>02</i> A full 30-minute practice</span>
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
              <p>Pick the interview stage and job category. You’ll see the complete price before you send a request.</p>
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
              <p>Meet online, answer realistic questions, then get useful feedback and a written recap.</p>
            </article>
          </div>
          <p className="meeting-note">We’ll agree on an online meeting platform together, such as Google Meet or Microsoft Teams.</p>
        </section>

        <section className="pricing-section" id="pricing">
          <div className="section-shell pricing-layout">
            <div className="pricing-intro">
              <div className="eyebrow">Straightforward, complete pricing</div>
              <h2>One session.<br />Everything you need.</h2>
              <p>Every package includes a live mock interview, performance feedback, a written review and recap, and practical recommendations.</p>
              <div className="price-rule">
                <span className="rule-icon">₱</span>
                <p><b>Initial Screening is ₱100</b><br />For every job category. Later stages are priced by category.</p>
              </div>
              <a className="text-link" href="#booking">See your exact package price <span aria-hidden="true">↓</span></a>
            </div>
            <div className="price-preview">
              <div className="preview-heading">
                <div><span className="eyebrow">Your package, at a glance</span><h3>Choose a category to see prices</h3></div>
                <label className="preview-select-label" htmlFor="preview-category">Job category</label>
                <select
                  id="preview-category"
                  className="preview-select"
                  value={booking.jobCategory}
                  onChange={(event) => updateField('jobCategory', event.target.value)}
                >
                  <option value="">Select category</option>
                  {businessConfig.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </div>
              <div className="stage-price-list">
                {businessConfig.stages.map((stage, index) => {
                  const amount = booking.jobCategory ? getPackagePrice(booking.jobCategory, stage.id) : null
                  return (
                    <button className={`stage-price-row ${index === 0 ? 'stage-price-fixed' : ''}`} key={stage.id} type="button" onClick={() => startBooking(stage.id)}>
                      <span className="stage-index">0{index + 1}</span>
                      <span className="stage-price-name"><b>{stage.name}</b><small>{stage.priceNote}</small></span>
                      <span className="stage-amount">{amount === null ? (stage.id === 'screening' ? '₱100' : '—') : formatPrice(amount)}<small>{stage.id === 'screening' ? 'fixed price' : `${stage.multiplierLabel} category base`}</small></span>
                      <span className="row-arrow" aria-hidden="true">↗</span>
                    </button>
                  )
                })}
              </div>
              <div className="preview-foot"><span>30-minute session</span><span>Written recap included</span></div>
            </div>
          </div>
        </section>

        <section className="booking-section section-shell" id="booking" ref={bookingRef}>
          <div className="booking-aside">
            <div className="eyebrow">Your next step</div>
            <h2>Let’s make<br />practice happen.</h2>
            <p>Tell us a little about what you’re preparing for. We’ll confirm a time with you before anything is booked.</p>
            <div className="booking-aside-note"><span aria-hidden="true">↳</span><p><b>Just a request for now.</b><br />We’ll follow up to confirm availability, meeting details, and payment instructions.</p></div>
            <div className="mini-price-card"><span>COMPLETE PACKAGE</span><b>{price !== null ? formatPrice(price) : 'from ₱100'}</b><small>{selectedStage?.name ?? '30-minute mock interview'}</small></div>
          </div>

          <div className="wizard-card">
            {requestReceived ? (
              <div className="confirmation">
                <div className="confirmation-icon" aria-hidden="true">✓</div>
                <div className="eyebrow">Request received</div>
                <h2>Your request has<br />been received!</h2>
                <p>This is a booking request, not a confirmed appointment. We’ll contact you to confirm availability, meeting details, and payment instructions.</p>
                <div className="confirmation-summary">
                  <div><span>Package</span><b>{selectedStage?.name} · 30 minutes</b></div>
                  <div><span>Job category</span><b>{businessConfig.categories.find((category) => category.id === booking.jobCategory)?.name}</b></div>
                  <div><span>Complete package price</span><b>{price !== null && formatPrice(price)}</b></div>
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
                      <div className="wizard-title"><span className="step-kicker">01 / YOUR PACKAGE</span><h2>What are you preparing for?</h2><p>Choose your job category and interview stage. Your complete package price updates right away.</p></div>
                      <Field id="jobCategory" label="Job category" error={errors.jobCategory}>
                        <select id="jobCategory" value={booking.jobCategory} onChange={(event) => updateField('jobCategory', event.target.value)} aria-invalid={Boolean(errors.jobCategory)} aria-describedby={errors.jobCategory ? 'jobCategory-error' : undefined}>
                          <option value="">Select a category</option>
                          {businessConfig.categories.map((category) => <option key={category.id} value={category.id}>{category.name} · base {formatPrice(category.basePrice)}</option>)}
                        </select>
                      </Field>
                      <fieldset className="stage-picker">
                        <legend>Interview stage</legend>
                        <div className="stage-options">
                          {businessConfig.stages.map((stage) => (
                            <label className={`stage-option ${booking.interviewStage === stage.id ? 'selected' : ''}`} key={stage.id}>
                              <input type="radio" name="interviewStage" value={stage.id} checked={booking.interviewStage === stage.id} onChange={() => updateField('interviewStage', stage.id)} />
                              <span className="stage-option-top"><b>{stage.name}</b><span>{booking.jobCategory ? formatPrice(getPackagePrice(booking.jobCategory, stage.id)) : stage.id === 'screening' ? '₱100' : stage.multiplierLabel}</span></span>
                              <small>{stage.priceNote}</small>
                            </label>
                          ))}
                        </div>
                        {errors.interviewStage && <span className="field-error">{errors.interviewStage}</span>}
                      </fieldset>
                      <div className="duration-and-price">
                        <div className="duration-box"><span className="duration-icon">◷</span><span><b>30-minute session</b><small>One-on-one, online</small></span></div>
                        <div className="package-total"><span>COMPLETE PACKAGE</span><b>{price !== null ? formatPrice(price) : 'Choose a stage'}</b></div>
                      </div>
                      <p className="included-line"><span>✓</span> Live interview · Feedback · Written recap · Recommendations</p>
                      <PriceExplanation categoryId={booking.jobCategory} stage={booking.interviewStage} />
                    </div>
                  )}

                  {step === 1 && (
                    <div className="wizard-content">
                      <div className="wizard-title"><span className="step-kicker">02 / ABOUT YOU</span><h2>Who’s getting ready?</h2><p>We only need a few details to shape the practice around your goals.</p></div>
                      <div className="field-grid">
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
                      <div className="wizard-title"><span className="step-kicker">03 / SCHEDULE</span><h2>When works for you?</h2><p>Share a preferred time. We’ll check availability and confirm with you.</p></div>
                      <div className="field-grid">
                        <Field id="preferredDate" label="Preferred date" error={errors.preferredDate}>
                          <input id="preferredDate" type="date" min={todayInManila()} value={booking.preferredDate} onChange={(event) => updateField('preferredDate', event.target.value)} aria-invalid={Boolean(errors.preferredDate)} aria-describedby={errors.preferredDate ? 'preferredDate-error' : undefined} />
                        </Field>
                        <Field id="preferredTime" label="Preferred time" error={errors.preferredTime} hint="All times are Philippine time (Asia/Manila).">
                          <input id="preferredTime" type="time" value={booking.preferredTime} onChange={(event) => updateField('preferredTime', event.target.value)} aria-invalid={Boolean(errors.preferredTime)} aria-describedby={errors.preferredTime ? 'preferredTime-error' : undefined} />
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
                          <b>{selectedStage?.name} · 30 minutes</b>
                          <span>{businessConfig.categories.find((category) => category.id === booking.jobCategory)?.name}</span>
                          <strong>{price !== null && formatPrice(price)}</strong>
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
                      {submitError && <div className="submit-error" role="alert">{submitError}</div>}
                    </div>
                  )}

                  <div className="wizard-actions">
                    {step > 0 ? <button className="back-button" type="button" onClick={goBack}><span aria-hidden="true">←</span> Back</button> : <span />}
                    {step < 3 ? (
                      <button className="button button-primary" type="submit">Continue <span aria-hidden="true">→</span></button>
                    ) : (
                      <button className="button button-primary" type="submit" disabled={isSubmitting}>
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

function PriceExplanation({ categoryId, stage }: { categoryId: string; stage: string }) {
  if (!categoryId || !stage) return <p className="price-explanation">Choose a category and interview stage to see your full package price.</p>
  const category = businessConfig.categories.find((item) => item.id === categoryId)
  const stageInfo = businessConfig.stages.find((item) => item.id === stage)
  if (!category || !stageInfo) return null
  if (stageInfo.id === 'screening') {
    return <p className="price-explanation">Initial Screening has one fixed price for every job category. No separate charge for the recap.</p>
  }
  return <p className="price-explanation">{stageInfo.name}: {formatPrice(category.basePrice)} category base price × {stageInfo.multiplierLabel}. The displayed amount covers the complete package.</p>
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="summary-row"><span>{label}</span><b>{value}</b></div>
}

export default App
