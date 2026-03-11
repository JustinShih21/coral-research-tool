import { researchPhases } from '@/data/phases'

const CURRENT_PHASE_ID = 1

export default function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Research Program Dashboard</h1>
      <p className="dashboard-intro">
        Indonesia Coral Reef Financing Research — overview of phases and key activities.
      </p>
      <div className="phases">
        {researchPhases.map((phase) => (
          <article
            key={phase.id}
            className={`phase-card ${phase.id === CURRENT_PHASE_ID ? 'phase-current' : ''}`}
          >
            <div className="phase-header">
              <span className="phase-num">Phase {phase.id}</span>
              {phase.id === CURRENT_PHASE_ID && <span className="phase-badge">Current</span>}
            </div>
            <h2>{phase.name}</h2>
            <p className="phase-timing">{phase.timing}</p>
            <ul className="phase-activities">
              {phase.keyActivities.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  )
}
