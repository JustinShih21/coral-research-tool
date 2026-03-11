import { useState, useCallback, useEffect, useRef } from 'react'
import { interviewProtocol } from '@/data/interviewProtocol'
import {
  interviewDimensions,
  fieldObjectives,
  fieldInsightExample,
} from '@/data/researchFramework'
import { getResearchData, setResearchData } from '@/lib/researchStorage'

const STORAGE_KEY = 'coral-interview-notes'

const SAVED_INDICATOR_MS = 2000

export default function InterviewProtocol() {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    interviewProtocol[0]?.id ?? null
  )
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [saveStatus, setSaveStatus] = useState<'cloud' | 'local' | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    getResearchData<Record<string, string>>(STORAGE_KEY).then((data) => {
      if (data && typeof data === 'object' && !Array.isArray(data)) setNotes(data)
    })
  }, [])

  useEffect(() => {
    if (!isInitialMount.current) {
      setResearchData(STORAGE_KEY, notes).then((synced) => {
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
  }, [notes])

  const setNote = useCallback((questionId: string, value: string) => {
    setNotes((prev) => ({ ...prev, [questionId]: value }))
  }, [])

  return (
    <div className="interview-protocol">
      <h1>Interview Protocol</h1>
      <p className="protocol-intro">
        Question guides by stakeholder type. Use note fields during interviews and code findings against the shared dimensions below.
        {savedAt != null && (
          <span className={`save-indicator ${saveStatus === 'local' ? 'save-local' : ''}`}>
            {saveStatus === 'local' ? 'Saved locally' : 'Saved'}
          </span>
        )}
      </p>
      <section className="protocol-reference">
        <h2>Core Field Objectives</h2>
        <ol>
          {fieldObjectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ol>
      </section>
      <section className="protocol-reference">
        <h2>Interview Coding Dimensions</h2>
        <div className="protocol-dimensions">
          {interviewDimensions.map((dimension) => (
            <article key={dimension.id} className="protocol-dimension-card">
              <h3>{dimension.name}</h3>
              <p>{dimension.prompt}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="protocol-reference">
        <h2>{fieldInsightExample.title}</h2>
        <ul>
          {fieldInsightExample.observations.map((observation) => (
            <li key={observation}>{observation}</li>
          ))}
        </ul>
        <p className="protocol-insight">{fieldInsightExample.interpretation}</p>
      </section>
      <div className="protocol-sections">
        {interviewProtocol.map((section) => (
          <section key={section.id} className="protocol-section">
            <button
              type="button"
              className="protocol-section-header"
              onClick={() =>
                setExpandedSection(expandedSection === section.id ? null : section.id)
              }
              aria-expanded={expandedSection === section.id}
            >
              <h2>{section.stakeholderType}</h2>
              <span className="protocol-toggle" aria-hidden>{expandedSection === section.id ? '−' : '+'}</span>
            </button>
            <div className="protocol-body-wrap" data-expanded={expandedSection === section.id}>
              <ul className="protocol-questions">
                {section.questions.map((q) => (
                  <li key={q.id} className="protocol-question">
                    <p className="question-text">{q.text}</p>
                    <textarea
                      className="question-notes"
                      placeholder="Notes…"
                      value={notes[q.id] ?? ''}
                      onChange={(ev) => setNote(q.id, ev.target.value)}
                      rows={2}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
