import { useState, useCallback, useEffect, useRef } from 'react'
import type { Hypothesis } from '@/types/research'
import { hypotheses as initialHypotheses } from '@/data/hypotheses'
import { useAuth } from '@/contexts/AuthContext'
import { getResearchData, setResearchData } from '@/lib/researchStorage'

const STORAGE_KEY = 'coral-hypotheses'

const SAVED_INDICATOR_MS = 2000

export default function HypothesisTracker() {
  const { user } = useAuth()
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>(initialHypotheses)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addEvidenceFor, setAddEvidenceFor] = useState<string | null>(null)
  const [newQuote, setNewQuote] = useState('')
  const [newSource, setNewSource] = useState('')
  const [newDate, setNewDate] = useState('')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [saveStatus, setSaveStatus] = useState<'cloud' | 'local' | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    getResearchData<Hypothesis[]>(STORAGE_KEY).then((data) => {
      if (!Array.isArray(data) || data.length === 0) return
      const valid = data.filter(
        (h): h is Hypothesis =>
          h != null &&
          typeof h === 'object' &&
          typeof (h as Hypothesis).id === 'string' &&
          typeof (h as Hypothesis).title === 'string' &&
          Array.isArray((h as Hypothesis).evidence)
      )
      if (valid.length > 0) setHypotheses(valid)
    })
  }, [])

  useEffect(() => {
    if (!isInitialMount.current && user) {
      setResearchData(STORAGE_KEY, hypotheses).then((synced) => {
        setSavedAt(Date.now())
        setSaveStatus(synced ? 'cloud' : 'local')
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = setTimeout(() => {
          setSavedAt(null)
          setSaveStatus(null)
        }, SAVED_INDICATOR_MS)
      })
    } else {
      isInitialMount.current = false
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [hypotheses, user])

  const addEvidence = useCallback(
    (hypId: string) => {
      if (!newQuote.trim()) return
      setHypotheses((prev) =>
        prev.map((h) =>
          h.id === hypId
            ? {
                ...h,
                evidence: [
                  ...h.evidence,
                  {
                    id: `ev-${Date.now()}`,
                    quote: newQuote.trim(),
                    source: newSource.trim(),
                    date: newDate.trim(),
                  },
                ],
              }
            : h
        )
      )
      setNewQuote('')
      setNewSource('')
      setNewDate('')
      setAddEvidenceFor(null)
    },
    [newQuote, newSource, newDate]
  )

  const removeEvidence = useCallback((hypId: string, evId: string) => {
    setHypotheses((prev) =>
      prev.map((h) =>
        h.id === hypId
          ? { ...h, evidence: h.evidence.filter((e) => e.id !== evId) }
          : h
      )
    )
  }, [])

  return (
    <div className="hypothesis-tracker">
      <h1>Hypothesis Tracker</h1>
      <p className="tracker-intro">
        Track evidence from field interviews against the core institutional hypotheses (H1-H4).
        {!user && <span className="auth-hint"> Log in to save evidence.</span>}
        {savedAt != null && (
          <span className={`save-indicator ${saveStatus === 'local' ? 'save-local' : ''}`}>
            {saveStatus === 'local' ? 'Saved locally' : 'Saved'}
          </span>
        )}
      </p>
      <div className="hypothesis-list">
        {hypotheses.map((h) => (
          <section key={h.id} className="hypothesis-card">
            <button
              type="button"
              className="hypothesis-header"
              onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
              aria-expanded={expandedId === h.id}
            >
              <span className="hypothesis-id">{h.id}</span>
              <span className="hypothesis-title">{h.title}</span>
              <span className="hypothesis-toggle" aria-hidden>{expandedId === h.id ? '−' : '+'}</span>
            </button>
            <div className="hypothesis-body-wrap" data-expanded={expandedId === h.id}>
              <div className="hypothesis-body">
                <p className="hypothesis-text">{h.text}</p>
                <h4>Evidence</h4>
                <ul className="evidence-list">
                  {h.evidence.map((e) => (
                    <li key={e.id} className="evidence-item">
                      <blockquote>{e.quote}</blockquote>
                      <cite>{e.source}</cite>
                      {e.date && <span className="evidence-date">{e.date}</span>}
                      <button
                        type="button"
                        className="evidence-remove"
                        onClick={() => removeEvidence(h.id, e.id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                {addEvidenceFor === h.id ? (
                  <div className="evidence-form">
                    <textarea
                      placeholder="Quote or finding…"
                      value={newQuote}
                      onChange={(ev) => setNewQuote(ev.target.value)}
                      rows={2}
                    />
                    <input
                      type="text"
                      placeholder="Source (e.g. interviewee, org)"
                      value={newSource}
                      onChange={(ev) => setNewSource(ev.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Date"
                      value={newDate}
                      onChange={(ev) => setNewDate(ev.target.value)}
                    />
                    <div className="evidence-form-actions">
                      <button type="button" onClick={() => addEvidence(h.id)}>
                        Add
                      </button>
                      <button type="button" onClick={() => setAddEvidenceFor(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="add-evidence-btn"
                    onClick={() => setAddEvidenceFor(h.id)}
                  >
                    + Add evidence
                  </button>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
