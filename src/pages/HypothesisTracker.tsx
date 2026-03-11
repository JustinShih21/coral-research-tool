import { useState, useCallback, useEffect } from 'react'
import type { Hypothesis } from '@/types/research'
import { hypotheses as initialHypotheses } from '@/data/hypotheses'

const STORAGE_KEY = 'coral-hypotheses'

function loadHypotheses(): Hypothesis[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Hypothesis[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore
  }
  return initialHypotheses
}

function saveHypotheses(h: Hypothesis[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(h))
}

export default function HypothesisTracker() {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>(loadHypotheses)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addEvidenceFor, setAddEvidenceFor] = useState<string | null>(null)
  const [newQuote, setNewQuote] = useState('')
  const [newSource, setNewSource] = useState('')
  const [newDate, setNewDate] = useState('')

  useEffect(() => {
    saveHypotheses(hypotheses)
  }, [hypotheses])

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
        Track evidence from field interviews against H1–H4. Evidence is saved in this browser.
      </p>
      <div className="hypothesis-list">
        {hypotheses.map((h) => (
          <section key={h.id} className="hypothesis-card">
            <button
              type="button"
              className="hypothesis-header"
              onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
            >
              <span className="hypothesis-id">{h.id}</span>
              <span className="hypothesis-title">{h.title}</span>
              <span className="hypothesis-toggle">{expandedId === h.id ? '−' : '+'}</span>
            </button>
            {expandedId === h.id && (
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
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
