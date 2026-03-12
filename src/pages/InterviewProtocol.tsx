import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { interviewProtocol as baseProtocol } from '@/data/interviewProtocol'
import {
  interviewDimensions,
  fieldObjectives,
  fieldInsightExample,
} from '@/data/researchFramework'
import { useAuth } from '@/contexts/AuthContext'
import { getResearchData, setResearchData } from '@/lib/researchStorage'
import type { ProtocolSection } from '@/types/research'

const STORAGE_KEY = 'coral-interview-notes'
const PROTOCOL_ADDITIONS_KEY = 'interview-protocol-additions'
const PROTOCOL_DELETED_IDS_KEY = 'interview-protocol-deleted-ids'

const SAVED_INDICATOR_MS = 2000

function parseSections(value: unknown): ProtocolSection[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (s): s is ProtocolSection =>
      s != null &&
      typeof s === 'object' &&
      typeof (s as ProtocolSection).id === 'string' &&
      typeof (s as ProtocolSection).stakeholderType === 'string' &&
      Array.isArray((s as ProtocolSection).questions)
  )
}

function parseDeletedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((id): id is string => typeof id === 'string')
}

function mergeProtocol(
  base: ProtocolSection[],
  additions: ProtocolSection[],
  deletedIds: string[]
): ProtocolSection[] {
  const deletedSet = new Set(deletedIds)
  const result: ProtocolSection[] = []
  for (const section of base) {
    const filteredQuestions = section.questions.filter((q) => !deletedSet.has(q.id))
    const extraQuestions = additions
      .filter((a) => a.id === section.id)
      .flatMap((a) => a.questions)
    result.push({
      ...section,
      questions: [...filteredQuestions, ...extraQuestions],
    })
  }
  for (const addSection of additions) {
    if (!base.some((s) => s.id === addSection.id)) result.push(addSection)
  }
  return result
}

export default function InterviewProtocol() {
  const { user } = useAuth()
  const [additions, setAdditions] = useState<ProtocolSection[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [protocolLoaded, setProtocolLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      getResearchData<unknown>(PROTOCOL_ADDITIONS_KEY),
      getResearchData<unknown>(PROTOCOL_DELETED_IDS_KEY),
    ]).then(([addData, delData]) => {
      setAdditions(parseSections(addData))
      setDeletedIds(parseDeletedIds(delData))
      setProtocolLoaded(true)
    })
  }, [])

  const displayProtocol = useMemo(
    () => mergeProtocol(baseProtocol, additions, deletedIds),
    [additions, deletedIds]
  )

  const [expandedSection, setExpandedSection] = useState<string | null>(
    baseProtocol[0]?.id ?? null
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

  const saveNotes = useCallback(() => {
    if (!user) return
    setResearchData(STORAGE_KEY, notes).then((synced) => {
      setSavedAt(Date.now())
      setSaveStatus(synced ? 'cloud' : 'local')
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        setSavedAt(null)
        setSaveStatus(null)
      }, SAVED_INDICATOR_MS)
    })
  }, [user, notes])

  useEffect(() => {
    if (!protocolLoaded) return
    if (!isInitialMount.current && user) {
      saveNotes()
    } else {
      isInitialMount.current = false
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [notes, user, protocolLoaded, saveNotes])

  const setNote = useCallback((questionId: string, value: string) => {
    setNotes((prev) => ({ ...prev, [questionId]: value }))
  }, [])

  const addQuestion = useCallback((sectionId: string, sectionTitle: string, text: string) => {
    const newId = 'custom-' + Date.now()
    const newSection: ProtocolSection = {
      id: sectionId,
      stakeholderType: sectionTitle,
      questions: [{ id: newId, text }],
    }
    const next = [...additions]
    const idx = next.findIndex((s) => s.id === sectionId)
    if (idx >= 0) {
      next[idx] = {
        ...next[idx],
        questions: [...next[idx].questions, { id: newId, text }],
      }
    } else {
      next.push(newSection)
    }
    setAdditions(next)
    setResearchData(PROTOCOL_ADDITIONS_KEY, next)
  }, [additions])

  const deleteQuestion = useCallback((questionId: string) => {
    const inAdditions = additions.some((s) => s.questions.some((q) => q.id === questionId))
    if (inAdditions) {
      const next = additions
        .map((s) => ({
          ...s,
          questions: s.questions.filter((q) => q.id !== questionId),
        }))
        .filter((s) => s.questions.length > 0)
      setAdditions(next)
      setResearchData(PROTOCOL_ADDITIONS_KEY, next)
    } else {
      const next = [...deletedIds, questionId]
      setDeletedIds(next)
      setResearchData(PROTOCOL_DELETED_IDS_KEY, next)
    }
  }, [additions, deletedIds])

  return (
    <div className="interview-protocol">
      <h1>Interview Protocol</h1>
      <p className="protocol-intro">
        Question guides by stakeholder type. Use note fields during interviews and code findings against the shared dimensions below.
        {!user && (
          <span className="protocol-login-hint"> Log in to save notes and add or remove questions.</span>
        )}
        {user && savedAt != null && (
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
        {displayProtocol.map((section: ProtocolSection) => (
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
              <div className="protocol-body">
                <ul className="protocol-questions">
                  {section.questions.map((q: { id: string; text: string }) => (
                    <li key={q.id} className="protocol-question">
                      <p className="question-text">{q.text}</p>
                      <textarea
                        className="question-notes"
                        placeholder={user ? 'Notes…' : 'Log in to save notes'}
                        value={notes[q.id] ?? ''}
                        onChange={(ev) => setNote(q.id, ev.target.value)}
                        readOnly={!user}
                        rows={2}
                      />
                      {user && (
                        <button
                          type="button"
                          className="protocol-question-delete"
                          onClick={() => deleteQuestion(q.id)}
                          title="Remove question"
                        >
                          Remove question
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {user && (
                  <AddQuestionForm
                    sectionId={section.id}
                    sectionTitle={section.stakeholderType}
                    onAdd={addQuestion}
                  />
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function AddQuestionForm({
  sectionId,
  sectionTitle,
  onAdd,
}: {
  sectionId: string
  sectionTitle: string
  onAdd: (sectionId: string, sectionTitle: string, text: string) => void
}) {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(sectionId, sectionTitle, text.trim())
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} className="protocol-add-question">
      <label>
        Add question
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="New question text…"
        />
      </label>
      <button type="submit">Add</button>
    </form>
  )
}
