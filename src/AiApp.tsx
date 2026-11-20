import { useState } from 'react'
import './AiApp.css'

type AiView = 'landing' | 'login' | 'dashboard' | 'setup' | 'history' | 'pricing' | 'support'

const interviewTypes = [
  { id: 'screening', name: 'Initial Screening', copy: 'Practice your introduction, resume walkthrough, and role fit.' },
  { id: 'behavioral', name: 'Behavioral', copy: 'Use STAR responses for common competency questions.' },
  { id: 'bpo', name: 'BPO / Customer Service', copy: 'Practice customer scenarios, tone, and service recovery.' },
  { id: 'de-escalation', name: 'De-escalation', copy: 'Respond to difficult customer situations with calm structure.' },
]

export default function AiApp() {
  const [view, setView] = useState<AiView>(getView())
  const [authPreview, setAuthPreview] = useState(false)
  const [trialAvailable, setTrialAvailable] = useState(true)
  const [balanceSeconds, setBalanceSeconds] = useState(trialAvailable ? 15 * 60 : 0)

  function navigate(next: AiView) {
    setView(next)
    window.history.pushState({}, '', next === 'landing' ? '#/' : `#/ai/${next}`)
  }

  function startTrial() {
    setAuthPreview(true)
  }

  function previewDashboard() {
    setAuthPreview(false)
    setTrialAvailable(false)
    setBalanceSeconds(15 * 60)
    navigate('dashboard')
  }

  function formatMinutes(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const remainder = String(seconds % 60).padStart(2, '0')
    return `${String(minutes).padStart(2, '0')}:${remainder}`
  }

  return (
    <div className="ai-app">
      <header className="ai-header">
        <a className="ai-brand" href="/"><span className="ai-brand-mark">M</span><span>MockCall <b>AI</b></span></a>
        <nav aria-label="MockCall AI navigation">
          <button type="button" onClick={() => navigate('landing')}>About</button>
          <button type="button" onClick={() => navigate('pricing')}>Minutes</button>
          {view !== 'landing' && <button type="button" onClick={() => navigate('support')}>Support</button>}
        </nav>
        <button className="ai-header-action" type="button" onClick={() => navigate(view === 'landing' ? 'login' : 'dashboard')}>
          {view === 'landing' ? 'Sign in' : 'Dashboard'}
        </button>
      </header>
      <div className="ai-preview-banner" role="status">
        Internal preview: sign-in, interviews, minutes, and purchases are not connected yet.
      </div>

      {view === 'landing' && (
        <main>
          <section className="ai-hero">
            <div>
              <span className="ai-eyebrow">PRIVATE AI PRACTICE</span>
              <h1>Practice the conversation<br />before the real interview.</h1>
              <p>Have a real-time voice interview with an AI interviewer, then receive a clear 3-tier assessment based on your responses.</p>
              <div className="ai-actions">
                <button type="button" className="ai-primary" onClick={trialAvailable ? startTrial : () => navigate('dashboard')}>
                  Start Practicing With AI
                </button>
                <button type="button" className="ai-secondary" onClick={() => navigate('pricing')}>Explore Minutes</button>
              </div>
              <small>One-time free trial: 15 minutes · Voice only · English</small>
            </div>
            <div className="ai-hero-card" aria-label="AI interview preview">
              <span className="ai-live"><i /> LIVE PRACTICE</span>
              <div className="ai-orb">AI</div>
              <b>Interviewer is listening</b>
              <div className="ai-wave" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
            </div>
          </section>
          <section className="ai-section">
            <span className="ai-eyebrow">V1 INTERVIEW TYPES</span>
            <h2>Choose the conversation you need.</h2>
            <div className="ai-type-grid">
              {interviewTypes.map((type) => (
                <button key={type.id} type="button" onClick={() => navigate('setup')}>
                  <span>0{interviewTypes.indexOf(type) + 1}</span>
                  <b>{type.name}</b>
                  <p>{type.copy}</p>
                </button>
              ))}
            </div>
          </section>
          <section className="ai-retention">
            <h2>Private by design</h2>
            <p>Voice processing requires consent. Raw audio is deleted after 7 days. Transcript and assessment remain until you delete them or delete your account.</p>
            <b>AI-generated feedback does not guarantee passing a real interview.</b>
          </section>
        </main>
      )}

      {authPreview && view === 'landing' && (
        <div className="ai-modal-backdrop" role="presentation" onMouseDown={() => setAuthPreview(false)}>
          <section className="ai-modal" role="dialog" aria-modal="true" aria-labelledby="ai-login-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="ai-modal-close" type="button" aria-label="Close" onClick={() => setAuthPreview(false)}>×</button>
            <span className="ai-eyebrow">START PRACTICING</span>
            <h2 id="ai-login-title">Sign in to MockCall AI</h2>
            <button type="button" className="ai-provider" onClick={previewDashboard}>Continue with Google</button>
            <button type="button" className="ai-provider" onClick={previewDashboard}>Continue with LinkedIn</button>
            <button type="button" className="ai-provider" onClick={previewDashboard}>Continue with Phone Number</button>
            <p>Authentication services connect securely to the independent AI backend.</p>
          </section>
        </div>
      )}

      {view === 'login' && (
        <main className="ai-page ai-auth">
          <section>
            <span className="ai-eyebrow">WELCOME</span>
            <h1>Sign in to your AI workspace.</h1>
            <button type="button" className="ai-provider" onClick={previewDashboard}>Continue with Google</button>
            <button type="button" className="ai-provider" onClick={previewDashboard}>Continue with LinkedIn</button>
            <button type="button" className="ai-provider" onClick={previewDashboard}>Continue with Phone Number</button>
          </section>
        </main>
      )}

      {view === 'dashboard' && (
        <main className="ai-page">
          <div className="ai-page-heading"><div><span className="ai-eyebrow">YOUR PRACTICE SPACE</span><h1>Welcome back.</h1></div><button type="button" className="ai-primary" onClick={() => navigate('setup')}>Start new interview</button></div>
          <div className="ai-dashboard-grid">
            <section className="ai-balance"><span>AVAILABLE AI MINUTES</span><b>{formatMinutes(balanceSeconds)} remaining</b><small>Free trial available: {trialAvailable ? 'Available' : 'Used'}</small></section>
            <section><span className="ai-card-label">RATING TREND</span><h3>Needs Improvement · Meeting Expectations · Exceeding Expectations</h3><p>Complete an interview to build your practice trend.</p></section>
          </div>
          <section className="ai-recent">
            <div><h2>Recent interviews</h2><button type="button" onClick={() => navigate('history')}>View history</button></div>
            <p>No interviews yet. Start with an Initial Screening practice.</p>
          </section>
        </main>
      )}

      {view === 'setup' && (
        <main className="ai-page ai-setup">
          <div className="ai-page-heading"><div><span className="ai-eyebrow">INTERVIEW SETUP</span><h1>Configure your practice.</h1></div></div>
          <form onSubmit={(event) => { event.preventDefault(); navigate('dashboard') }}>
            <label>Interview type<select defaultValue="screening">{interviewTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
            <label>Target job title<input placeholder="e.g. Customer Service Representative" /></label>
            <label>Industry<select><option>Call Center / BPO</option><option>General Business</option><option>Healthcare</option></select></label>
            <label>Experience level<select><option>Entry level</option><option>Mid-level</option><option>Experienced</option></select></label>
            <label>Difficulty<select><option>Standard</option><option>Challenging</option></select></label>
            <label>Interviewer personality<select><option>Professional</option><option>Warm</option><option>Structured</option></select></label>
            <label>Duration<select><option>15 minutes</option><option>30 minutes</option><option>45 minutes</option></select></label>
            <div className="ai-billing-note"><b>How minutes work:</b> Your minutes are counted from when the interview starts until it ends. That includes AI speaking time, your answers, pauses, and reconnection time. If our system fails, you are not charged. If you end early, paid minutes used are kept as used, and a new interview starts from the beginning.</div>
            <div className="ai-billing-note"><b>AI disclaimer:</b> AI-generated feedback does not guarantee passing a real interview.</div>
            <button type="submit" className="ai-primary">Check microphone and start</button>
          </form>
        </main>
      )}

      {view === 'pricing' && (
        <main className="ai-page ai-pricing">
          <span className="ai-eyebrow">AI MINUTES</span><h1>Practice as much or as little as you need.</h1>
          <div className="ai-pack-grid">
            <section><span>FREE TRIAL</span><b>15 minutes</b><p>Available once per verified account.</p></section>
            <section><span>STANDARD PACK</span><b>60 minutes</b><p>Use across 4 × 15-minute sessions or any combination that fits.</p></section>
          </div>
          <p>Minutes never expire. Purchased minutes are consumed only for actual seconds used.</p>
        </main>
      )}

      {view === 'history' && (
        <main className="ai-page"><span className="ai-eyebrow">INTERVIEW HISTORY</span><h1>Previous interviews</h1><p>No completed interviews yet.</p></main>
      )}

      {view === 'support' && (
        <main className="ai-page"><span className="ai-eyebrow">SUPPORT</span><h1>How can we help?</h1><form onSubmit={(event) => event.preventDefault()}><label>Category<select><option>Technical issue</option><option>Billing and minutes</option><option>Account</option></select></label><label>Subject<input /></label><label>Description<textarea rows={5} /></label><button type="submit" className="ai-primary">Submit ticket</button></form></main>
      )}

      <footer className="ai-footer"><a href="https://mockph.com" target="_blank" rel="noopener noreferrer">Human interview services at mockph.com</a><span>MockCall AI · Voice practice only</span></footer>
    </div>
  )
}

function getView(): AiView {
  const segment = window.location.hash.split('/')[2]
  const views: AiView[] = ['login', 'dashboard', 'setup', 'history', 'pricing', 'support']
  return views.includes(segment as AiView) ? segment as AiView : 'landing'
}
