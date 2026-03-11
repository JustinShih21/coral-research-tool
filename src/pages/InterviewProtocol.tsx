import { useState, useCallback, useEffect } from 'react'
import { interviewProtocol } from '@/data/interviewProtocol'

const STORAGE_KEY = 'coral-interview-notes'

function loadNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveNotes(notes: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

export default function InterviewProtocol() {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    interviewProtocol[0]?.id ?? null
  )
  const [notes, setNotes] = useState<Record<string, string>>(loadNotes)

  useEffect(() => {
    saveNotes(notes)
  }, [notes])

  const setNote = useCallback((questionId: string, value: string) => {
    setNotes((prev) => ({ ...prev, [questionId]: value }))
  }, [])

  return (
    <div className="interview-protocol">
      <h1>Interview Protocol</h1>
      <p className="protocol-intro">
        Question guides by stakeholder type. Use the note fields during or after field interviews.
      </p>
      <div className="protocol-sections">
        {interviewProtocol.map((section) => (
          <section key={section.id} className="protocol-section">
            <button
              type="button"
              className="protocol-section-header"
              onClick={() =>
                setExpandedSection(expandedSection === section.id ? null : section.id)
              }
            >
              <h2>{section.stakeholderType}</h2>
              <span className="protocol-toggle">{expandedSection === section.id ? '−' : '+'}</span>
            </button>
            {expandedSection === section.id && (
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
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
