import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const TEAM_PASSKEY = import.meta.env.VITE_TEAM_SIGNUP_PASSKEY ?? '2137'

type Step = 'login' | 'passkey' | 'signup'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')
  const [step, setStep] = useState<Step>('login')

  // Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Passkey
  const [passkey, setPasskey] = useState('')
  const [passkeyError, setPasskeyError] = useState('')

  // Signup
  const [signupEmail, setSignupEmail] = useState('')
  const [signupFullName, setSignupFullName] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupError, setSignupError] = useState('')
  const [signupSuccess, setSignupSuccess] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    if (!supabase) {
      setLoginError('Sign-in is not configured.')
      return
    }
    setLoginLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoginLoading(false)
    if (error) {
      setLoginError(error.message)
      return
    }
    const target = returnUrl && returnUrl.startsWith('/') && returnUrl !== '/login' ? returnUrl : '/'
    navigate(target, { replace: true })
  }

  const handlePasskey = (e: React.FormEvent) => {
    e.preventDefault()
    setPasskeyError('')
    if (passkey.trim() === TEAM_PASSKEY) {
      setStep('signup')
      setPasskey('')
    } else {
      setPasskeyError('Invalid passkey.')
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupError('')
    setSignupSuccess('')
    if (!supabase) {
      setSignupError('Sign-up is not configured.')
      return
    }
    setSignupLoading(true)
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: { data: { full_name: signupFullName } },
    })
    setSignupLoading(false)
    if (error) {
      setSignupError(error.message)
      return
    }
    setSignupSuccess('Account created. You can now log in with your email and password.')
    setStep('login')
    setSignupEmail('')
    setSignupFullName('')
    setSignupPassword('')
  }

  const backToLogin = () => {
    setStep('login')
    setPasskey('')
    setPasskeyError('')
    setSignupError('')
    setSignupSuccess('')
  }

  if (!supabase) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Log in</h1>
          <p className="login-muted">Sign-in is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>
          <Link to="/">Back to app</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {step === 'login' && (
          <>
            <h1>Log in</h1>
            <p className="login-muted">Team members can log in to save edits and manage content.</p>
            <form onSubmit={handleLogin} className="login-form">
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </label>
              {loginError && <p className="login-error" role="alert">{loginError}</p>}
              <button type="submit" disabled={loginLoading}>
                {loginLoading ? 'Signing in…' : 'Log in'}
              </button>
            </form>
            <div className="login-footer">
              <button
                type="button"
                className="login-team-link"
                onClick={() => setStep('passkey')}
              >
                Team member access
              </button>
            </div>
          </>
        )}

        {step === 'passkey' && (
          <>
            <h1>Team member access</h1>
            <p className="login-muted">Enter the passkey to create a team account.</p>
            <form onSubmit={handlePasskey} className="login-form">
              <label>
                Passkey
                <input
                  type="password"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Enter passkey"
                  autoComplete="off"
                />
              </label>
              {passkeyError && <p className="login-error" role="alert">{passkeyError}</p>}
              <div className="login-form-actions">
                <button type="submit">Continue</button>
                <button type="button" className="login-back" onClick={backToLogin}>
                  Back to login
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'signup' && (
          <>
            <h1>Create team account</h1>
            <p className="login-muted">Enter your details. You will log in with email and password.</p>
            <form onSubmit={handleSignup} className="login-form">
              <label>
                Email
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                Full name
                <input
                  type="text"
                  value={signupFullName}
                  onChange={(e) => setSignupFullName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </label>
              {signupError && <p className="login-error" role="alert">{signupError}</p>}
              {signupSuccess && <p className="login-success" role="status">{signupSuccess}</p>}
              <div className="login-form-actions">
                <button type="submit" disabled={signupLoading}>
                  {signupLoading ? 'Creating account…' : 'Create account'}
                </button>
                <button type="button" className="login-back" onClick={backToLogin}>
                  Back to login
                </button>
              </div>
            </form>
          </>
        )}

        <p className="login-back-home">
          <Link to="/">← Back to app</Link>
        </p>
      </div>
    </div>
  )
}
