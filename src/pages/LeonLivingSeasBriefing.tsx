import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  leonProfile,
  leonInsights,
  operatingSignals,
  interviewGoals,
  interviewSections as baseInterviewSections,
  toolConcepts,
  leonSourceFiles,
  type ToolConcept,
  type InterviewSection,
  type InterviewQuestion,
} from '@/data/leonLivingSeas'
import { useAuth } from '@/contexts/AuthContext'
import { getResearchData, setResearchData } from '@/lib/researchStorage'

const STORAGE_KEY = 'coral-leon-briefing'
const LEON_ADDITIONS_KEY = 'leon-interview-additions'
const LEON_DELETED_IDS_KEY = 'leon-interview-deleted-ids'
const SAVED_INDICATOR_MS = 2000

function parseLeonSections(value: unknown): InterviewSection[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (s): s is InterviewSection =>
      s != null &&
      typeof s === 'object' &&
      typeof (s as InterviewSection).id === 'string' &&
      typeof (s as InterviewSection).title === 'string' &&
      Array.isArray((s as InterviewSection).questions)
  )
}

function parseLeonDeletedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((id): id is string => typeof id === 'string')
}

function mergeLeonSections(
  base: InterviewSection[],
  additions: InterviewSection[],
  deletedIds: string[]
): InterviewSection[] {
  const deletedSet = new Set(deletedIds)
  const result: InterviewSection[] = []
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

type Tab = 'briefing' | 'interview' | 'tools'
type ToolFilter = 'all' | ToolConcept['stage']

interface SavedState {
  checkedQuestions: Record<string, boolean>
  questionNotes: Record<string, string>
  meetingNotes: string
}

function isSavedState(value: unknown): value is SavedState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return 'checkedQuestions' in value && 'questionNotes' in value && 'meetingNotes' in value
}

export default function LeonLivingSeasBriefing() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('briefing')
  const [toolFilter, setToolFilter] = useState<ToolFilter>('all')
  const [search, setSearch] = useState('')
  const [leonAdditions, setLeonAdditions] = useState<InterviewSection[]>([])
  const [leonDeletedIds, setLeonDeletedIds] = useState<string[]>([])
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({})
  const [questionNotes, setQuestionNotes] = useState<Record<string, string>>({})
  const [meetingNotes, setMeetingNotes] = useState('')
  const [expandedToolId, setExpandedToolId] = useState<string | null>(toolConcepts[0]?.id ?? null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [saveStatus, setSaveStatus] = useState<'cloud' | 'local' | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    Promise.all([
      getResearchData<unknown>(LEON_ADDITIONS_KEY),
      getResearchData<unknown>(LEON_DELETED_IDS_KEY),
    ]).then(([addData, delData]) => {
      setLeonAdditions(parseLeonSections(addData))
      setLeonDeletedIds(parseLeonDeletedIds(delData))
    })
  }, [])

  const displaySections = useMemo(
    () => mergeLeonSections(baseInterviewSections, leonAdditions, leonDeletedIds),
    [leonAdditions, leonDeletedIds]
  )

  useEffect(() => {
    getResearchData<SavedState>(STORAGE_KEY).then((data) => {
      if (!isSavedState(data)) return
      if (data.checkedQuestions && typeof data.checkedQuestions === 'object') {
        setCheckedQuestions(data.checkedQuestions)
      }
      if (data.questionNotes && typeof data.questionNotes === 'object') {
        setQuestionNotes(data.questionNotes)
      }
      if (typeof data.meetingNotes === 'string') setMeetingNotes(data.meetingNotes)
    })
  }, [])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (!user) return
    const payload: SavedState = { checkedQuestions, questionNotes, meetingNotes }
    setResearchData(STORAGE_KEY, payload).then((synced) => {
      setSavedAt(Date.now())
      setSaveStatus(synced ? 'cloud' : 'local')
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        setSavedAt(null)
        setSaveStatus(null)
      }, SAVED_INDICATOR_MS)
    })
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [checkedQuestions, questionNotes, meetingNotes, user])

  const totalQuestions = displaySections.reduce((sum, section) => sum + section.questions.length, 0)
  const doneQuestions = Object.values(checkedQuestions).filter(Boolean).length

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return displaySections
    return displaySections
      .map((section) => ({
        ...section,
        questions: section.questions.filter(
          (q) =>
            q.text.toLowerCase().includes(query) ||
            q.whyItMatters.toLowerCase().includes(query)
        ),
      }))
      .filter((section) => section.questions.length > 0)
  }, [search, displaySections])

  const addLeonQuestion = useCallback(
    (sectionId: string, sectionTitle: string, text: string, whyItMatters: string) => {
      const newId = 'leon-custom-' + Date.now()
      const newQ: InterviewQuestion = { id: newId, text, whyItMatters: whyItMatters || 'Custom question.' }
      const next = [...leonAdditions]
      const idx = next.findIndex((s) => s.id === sectionId)
      if (idx >= 0) {
        next[idx] = { ...next[idx], questions: [...next[idx].questions, newQ] }
      } else {
        next.push({ id: sectionId, title: sectionTitle, questions: [newQ] })
      }
      setLeonAdditions(next)
      setResearchData(LEON_ADDITIONS_KEY, next)
    },
    [leonAdditions]
  )

  const deleteLeonQuestion = useCallback(
    (questionId: string) => {
      const inAdditions = leonAdditions.some((s) => s.questions.some((q) => q.id === questionId))
      if (inAdditions) {
        const next = leonAdditions
          .map((s) => ({ ...s, questions: s.questions.filter((q) => q.id !== questionId) }))
          .filter((s) => s.questions.length > 0)
        setLeonAdditions(next)
        setResearchData(LEON_ADDITIONS_KEY, next)
      } else {
        const next = [...leonDeletedIds, questionId]
        setLeonDeletedIds(next)
        setResearchData(LEON_DELETED_IDS_KEY, next)
      }
    },
    [leonAdditions, leonDeletedIds]
  )

  const filteredTools = useMemo(() => {
    if (toolFilter === 'all') return toolConcepts
    return toolConcepts.filter((tool) => tool.stage === toolFilter)
  }, [toolFilter])

  return (
    <div className="leon-page">
      <h1>Leon + Living Seas Briefing</h1>
      <p className="leon-intro">
        Consolidated briefing from Living Seas and related field notes, with interview prep and tool options.
        {!user && <span className="auth-hint"> Log in to save progress.</span>}
        {savedAt != null && (
          <span className={`save-indicator ${saveStatus === 'local' ? 'save-local' : ''}`}>
            {saveStatus === 'local' ? 'Saved locally' : 'Saved'}
          </span>
        )}
      </p>

      <div className="leon-tabs">
        <button
          type="button"
          className={tab === 'briefing' ? 'active' : ''}
          onClick={() => setTab('briefing')}
        >
          Briefing
        </button>
        <button
          type="button"
          className={tab === 'interview' ? 'active' : ''}
          onClick={() => setTab('interview')}
        >
          Interview Prep
        </button>
        <button
          type="button"
          className={tab === 'tools' ? 'active' : ''}
          onClick={() => setTab('tools')}
        >
          Tool Concepts
        </button>
      </div>

      {tab === 'briefing' && (
        <section className="leon-section">
          <article className="leon-profile-card">
            <h2>{leonProfile.name}</h2>
            <p className="leon-meta">
              <strong>{leonProfile.org}</strong> - {leonProfile.role}
            </p>
            <p>{leonProfile.orientation}</p>
          </article>

          <div className="leon-grid">
            {leonInsights.map((insight) => (
              <article key={insight.id} className="leon-insight-card">
                <h3>{insight.title}</h3>
                <p>{insight.detail}</p>
                <span className="leon-source-chip">{insight.source}</span>
              </article>
            ))}
          </div>

          <article className="leon-subsection">
            <h2>Operating Signals Around Living Seas</h2>
            <ul>
              {operatingSignals.map((signal) => (
                <li key={signal.id}>
                  <strong>{signal.title}:</strong> {signal.detail}
                </li>
              ))}
            </ul>
          </article>

          <article className="leon-subsection">
            <h2>Source Files Reviewed</h2>
            <ul className="leon-source-list">
              {leonSourceFiles.map((file) => (
                <li key={file.link}>
                  <a href={encodeURI(file.link)} target="_blank" rel="noopener noreferrer">
                    {file.label}
                  </a>
                </li>
              ))}
            </ul>
          </article>
        </section>
      )}

      {tab === 'interview' && (
        <section className="leon-section">
          <article className="leon-subsection">
            <h2>Interview Objectives</h2>
            <ol>
              {interviewGoals.map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ol>
          </article>

          <div className="leon-interview-toolbar">
            <label>
              Search questions
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by topic, bottleneck, metric..."
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setCheckedQuestions({})
                setQuestionNotes({})
              }}
            >
              Reset interview checklist
            </button>
            <span className="leon-progress">
              {doneQuestions}/{totalQuestions} marked complete
            </span>
          </div>

          <div className="leon-question-sections">
            {filteredSections.map((section) => (
              <article key={section.id} className="leon-question-section">
                <h3>{section.title}</h3>
                <ul className="leon-question-list">
                  {section.questions.map((question) => (
                    <li key={question.id} className="leon-question-item">
                      <label className="leon-question-row">
                        <input
                          type="checkbox"
                          checked={checkedQuestions[question.id] ?? false}
                          onChange={(e) =>
                            setCheckedQuestions((prev) => ({
                              ...prev,
                              [question.id]: e.target.checked,
                            }))
                          }
                        />
                        <span>{question.text}</span>
                      </label>
                      <p className="leon-question-why">
                        <strong>Why this matters:</strong> {question.whyItMatters}
                      </p>
                      <textarea
                        value={questionNotes[question.id] ?? ''}
                        onChange={(e) =>
                          setQuestionNotes((prev) => ({
                            ...prev,
                            [question.id]: e.target.value,
                          }))
                        }
                        placeholder={user ? 'Interview notes for this question...' : 'Log in to save notes'}
                        readOnly={!user}
                        rows={2}
                      />
                      {user && (
                        <button
                          type="button"
                          className="leon-question-delete"
                          onClick={() => deleteLeonQuestion(question.id)}
                          title="Remove question"
                        >
                          Remove question
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {user && (
                  <LeonAddQuestionForm
                    sectionId={section.id}
                    sectionTitle={section.title}
                    onAdd={addLeonQuestion}
                  />
                )}
              </article>
            ))}
            {filteredSections.length === 0 && (
              <p className="leon-empty">No questions match the current search.</p>
            )}
          </div>

          <article className="leon-subsection">
            <h2>Meeting Synthesis Notes</h2>
            <textarea
              value={meetingNotes}
              onChange={(e) => setMeetingNotes(e.target.value)}
              placeholder="Capture cross-cutting themes, contradictions, and immediate follow-up tasks..."
              rows={6}
            />
          </article>
        </section>
      )}

      {tab === 'tools' && (
        <section className="leon-section">
          <div className="leon-tool-filters">
            <button
              type="button"
              className={toolFilter === 'all' ? 'active' : ''}
              onClick={() => setToolFilter('all')}
            >
              All concepts
            </button>
            <button
              type="button"
              className={toolFilter === 'fast_mvp' ? 'active' : ''}
              onClick={() => setToolFilter('fast_mvp')}
            >
              Fast MVP
            </button>
            <button
              type="button"
              className={toolFilter === 'strategic_build' ? 'active' : ''}
              onClick={() => setToolFilter('strategic_build')}
            >
              Strategic build
            </button>
          </div>

          <div className="leon-tool-list">
            {filteredTools.map((tool) => (
              <article key={tool.id} className="leon-tool-card">
                <button
                  type="button"
                  className="leon-tool-header"
                  onClick={() => setExpandedToolId(expandedToolId === tool.id ? null : tool.id)}
                >
                  <div>
                    <h3>{tool.name}</h3>
                    <span className={`leon-stage ${tool.stage}`}>
                      {tool.stage === 'fast_mvp' ? 'Fast MVP' : 'Strategic build'}
                    </span>
                  </div>
                  <span>{expandedToolId === tool.id ? '−' : '+'}</span>
                </button>
                {expandedToolId === tool.id && (
                  <div className="leon-tool-body">
                    <p>
                      <strong>Value:</strong> {tool.value}
                    </p>
                    <p>
                      <strong>What to build:</strong> {tool.build}
                    </p>
                    <p>
                      <strong>Primary users:</strong> {tool.users.join(', ')}
                    </p>
                    <p>
                      <strong>Core inputs:</strong> {tool.coreInputs.join(', ')}
                    </p>
                    <p>
                      <strong>Risks:</strong> {tool.risks.join('; ')}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function LeonAddQuestionForm({
  sectionId,
  sectionTitle,
  onAdd,
}: {
  sectionId: string
  sectionTitle: string
  onAdd: (sectionId: string, sectionTitle: string, text: string, whyItMatters: string) => void
}) {
  const [text, setText] = useState('')
  const [whyItMatters, setWhyItMatters] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(sectionId, sectionTitle, text.trim(), whyItMatters.trim())
    setText('')
    setWhyItMatters('')
  }

  return (
    <form onSubmit={handleSubmit} className="leon-add-question">
      <label>
        Add question
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="New question text…"
        />
      </label>
      <label>
        Why it matters <span className="leon-add-optional">(optional)</span>
        <input
          value={whyItMatters}
          onChange={(e) => setWhyItMatters(e.target.value)}
          placeholder="Why this question matters…"
        />
      </label>
      <button type="submit">Add</button>
    </form>
  )
}
