import { useState, useEffect } from 'react'
import type { BottleneckType } from '@/types/research'
import { bottleneckTypes as initialBottlenecks } from '@/data/bottlenecks'

const STORAGE_KEY = 'coral-bottlenecks'

function loadBottlenecks(): BottleneckType[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as BottleneckType[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore
  }
  return initialBottlenecks
}

function saveBottlenecks(b: BottleneckType[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(b))
}

export default function BottleneckDiagnostic() {
  const [bottlenecks, setBottlenecks] = useState<BottleneckType[]>(loadBottlenecks)

  useEffect(() => {
    saveBottlenecks(bottlenecks)
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
        Score each bottleneck type 0–5 (0 = not relevant, 5 = dominant barrier). Scores are saved in this browser.
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
              <label>
                Severity (0–5):
                <select
                  value={b.severity}
                  onChange={(e) => setSeverity(b.id, Number(e.target.value))}
                >
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
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
