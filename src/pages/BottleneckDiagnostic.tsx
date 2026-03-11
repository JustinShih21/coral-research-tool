import { useState, useEffect, useRef } from 'react'
import type { BottleneckType } from '@/types/research'
import { bottleneckTypes as initialBottlenecks } from '@/data/bottlenecks'
import { getResearchData, setResearchData } from '@/lib/researchStorage'

const STORAGE_KEY = 'coral-bottlenecks'

const SAVED_INDICATOR_MS = 2000

export default function BottleneckDiagnostic() {
  const [bottlenecks, setBottlenecks] = useState<BottleneckType[]>(initialBottlenecks)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [saveStatus, setSaveStatus] = useState<'cloud' | 'local' | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    getResearchData<BottleneckType[]>(STORAGE_KEY).then((data) => {
      if (!Array.isArray(data) || data.length === 0) return
      const valid = data.filter(
        (b): b is BottleneckType =>
          b != null &&
          typeof b === 'object' &&
          typeof (b as BottleneckType).id === 'string' &&
          typeof (b as BottleneckType).name === 'string' &&
          typeof (b as BottleneckType).severity === 'number' &&
          (b as BottleneckType).severity >= 0 &&
          (b as BottleneckType).severity <= 5
      )
      if (valid.length > 0) setBottlenecks(valid)
    })
  }, [])

  useEffect(() => {
    if (!isInitialMount.current) {
      setResearchData(STORAGE_KEY, bottlenecks).then((synced) => {
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
  }, [bottlenecks])

  const setSeverity = (id: string, severity: number) => {
    setBottlenecks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, severity } : b))
    )
  }

  const setNotes = (id: string, notes: string) => {
    setBottlenecks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, notes } : b))
    )
  }

  const dominant = bottlenecks.filter((b) => b.severity > 0).sort((a, b) => b.severity - a.severity)[0]

  return (
    <div className="bottleneck-diagnostic">
      <h1>Bottleneck Diagnostic</h1>
      <p className="bottleneck-intro">
        Score each structural barrier 0-5 (0 = not relevant, 5 = dominant barrier). Scores are saved in this browser.
        {savedAt != null && (
          <span className={`save-indicator ${saveStatus === 'local' ? 'save-local' : ''}`}>
            {saveStatus === 'local' ? 'Saved locally' : 'Saved'}
          </span>
        )}
      </p>
      {dominant && (
        <div className="bottleneck-dominant">
          <strong>Current dominant bottleneck:</strong> {dominant.name} (severity {dominant.severity})
        </div>
      )}
      <div className="bottleneck-list">
        {bottlenecks.map((b) => (
          <section key={b.id} className="bottleneck-card">
            <h3>{b.name}</h3>
            <p className="bottleneck-desc">{b.description}</p>
            <div className="bottleneck-controls">
              <div className="bottleneck-severity-wrap">
                <span className="bottleneck-severity-label">Severity (0–5):</span>
                <div className="bottleneck-severity-dots" role="group" aria-label="Severity 0 to 5">
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`bottleneck-dot ${b.severity === n ? 'active' : ''} ${b.severity >= n ? 'filled' : ''}`}
                      onClick={() => setSeverity(b.id, n)}
                      title={`Severity ${n}`}
                      aria-pressed={b.severity === n}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <label>
                Notes:
                <input
                  type="text"
                  value={b.notes}
                  onChange={(e) => setNotes(b.id, e.target.value)}
                  placeholder="Optional notes from field…"
                />
              </label>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
