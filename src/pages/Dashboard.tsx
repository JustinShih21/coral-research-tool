import { useRef, useState } from 'react'
import { researchPhases } from '@/data/phases'
import {
  projectMission,
  centralThesis,
  structuralBarriers,
  actorSystems,
  fieldObjectives,
  analyticalQuestions,
  expectedOutcomes,
} from '@/data/researchFramework'
import { useAuth } from '@/contexts/AuthContext'
import { getResearchData, setResearchData, RESEARCH_KEYS } from '@/lib/researchStorage'

const CURRENT_PHASE_ID = 1

async function downloadBackup() {
  const backup: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
  }
  await Promise.all(
    RESEARCH_KEYS.map(async (key) => {
      const value = await getResearchData(key)
      if (value !== null) backup[key] = value
    })
  )
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `coral-research-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function isValidBackup(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
}

export default function Dashboard() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null)
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(
    () => new Set(researchPhases.map((p) => p.id))
  )

  function togglePhase(phaseId: number) {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(phaseId)) next.delete(phaseId)
      else next.add(phaseId)
      return next
    })
  }

  function handleRestoreClick() {
    fileInputRef.current?.click()
  }

  function handleRestoreFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    ev.target.value = ''
    if (!file) return
    if (!user) {
      setRestoreMessage('Log in to restore a backup.')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const text = reader.result as string
        const data = JSON.parse(text) as unknown
        if (!isValidBackup(data)) {
          setRestoreMessage('Invalid backup file format.')
          return
        }
        let restored = 0
        let allSynced = true
        for (const key of RESEARCH_KEYS) {
          if (key in data && data[key] !== undefined) {
            const value = data[key]
            const synced = await setResearchData(key, value)
            if (!synced) allSynced = false
            restored++
          }
        }
        if (restored === 0) {
          setRestoreMessage('No known backup keys found in file.')
          return
        }
        setRestoreMessage(
          allSynced
            ? `Restored ${restored} section(s). Reloading…`
            : `Restored ${restored} section(s). Some saved locally only. Reloading…`
        )
        setTimeout(() => window.location.reload(), 1000)
      } catch {
        setRestoreMessage('Could not read or parse file.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="dashboard">
      <h1>Research Program Dashboard</h1>
      <p className="dashboard-intro">
        Indonesia Coral Reef Financing Research - mission, core framework, and execution phases.
      </p>
      <section className="dashboard-panel">
        <h2>Project Mission</h2>
        {projectMission.map((statement) => (
          <p key={statement} className="dashboard-paragraph">
            {statement}
          </p>
        ))}
        <div className="dashboard-thesis">
          <strong>Central Thesis:</strong> {centralThesis}
        </div>
      </section>
      <section className="dashboard-panel">
        <h2>Structural Barriers to Coral Financing</h2>
        <div className="dashboard-grid">
          {structuralBarriers.map((barrier) => (
            <article key={barrier.id} className="dashboard-card">
              <h3>{barrier.name}</h3>
              <p>{barrier.description}</p>
              <ul>
                {barrier.implications.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <section className="dashboard-panel">
        <h2>Coral Reef Economy System Mapping</h2>
        <div className="dashboard-grid">
          {actorSystems.map((system) => (
            <article key={system.id} className="dashboard-card">
              <h3>{system.name}</h3>
              <p>{system.description}</p>
              <p className="dashboard-card-label">Examples</p>
              <ul>
                {system.examples.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
              <p className="dashboard-card-label">Evaluation Focus</p>
              <ul>
                {system.evaluationFocus.map((focus) => (
                  <li key={focus}>{focus}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <section className="dashboard-panel">
        <h2>Field Objectives and Analytical Questions</h2>
        <div className="dashboard-two-col">
          <article className="dashboard-card">
            <h3>Core Field Objectives</h3>
            <ol>
              {fieldObjectives.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          </article>
          <article className="dashboard-card">
            <h3>Analytical Questions</h3>
            <ul>
              {analyticalQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
      <section className="dashboard-panel">
        <h2>Expected Outcome</h2>
        <ol className="dashboard-outcomes">
          {expectedOutcomes.map((outcome) => (
            <li key={outcome}>{outcome}</li>
          ))}
        </ol>
      </section>
      <div className="phases">
        {researchPhases.map((phase) => {
          const isExpanded = expandedPhases.has(phase.id)
          return (
            <article
              key={phase.id}
              className={`phase-card ${phase.id === CURRENT_PHASE_ID ? 'phase-current' : ''}`}
            >
              <button
                type="button"
                className="phase-card-toggle"
                onClick={() => togglePhase(phase.id)}
                aria-expanded={isExpanded}
              >
                <div className="phase-header">
                  <span className="phase-num">Phase {phase.id}</span>
                  {phase.id === CURRENT_PHASE_ID && <span className="phase-badge">Current</span>}
                </div>
                <h2>{phase.name}</h2>
                <p className="phase-timing">{phase.timing}</p>
                <span className="phase-chevron" aria-hidden>{isExpanded ? '▼' : '▶'}</span>
              </button>
              {isExpanded && (
                <div className="phase-activities-wrap">
                  <span className="phase-activities-label">Key deliverables</span>
                  <ul className="phase-activities">
                    {phase.keyActivities.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          )
        })}
      </div>
      {user && (
        <section className="backup-restore">
          <h2>Backup / Restore</h2>
          <p className="backup-restore-intro">
            Download all saved data (stakeholder notes, hypotheses, interview notes, bottleneck scores) to a file, or restore from a previous backup.
          </p>
          <div className="backup-restore-actions">
            <button type="button" className="backup-btn" onClick={() => downloadBackup()}>
              Download backup
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="backup-file-input"
              aria-hidden
              onChange={handleRestoreFile}
            />
            <button type="button" className="restore-btn" onClick={handleRestoreClick}>
              Restore from file
            </button>
          </div>
          {restoreMessage && <p className="backup-restore-message">{restoreMessage}</p>}
        </section>
      )}
    </div>
  )
}
