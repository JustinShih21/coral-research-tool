import { useState } from 'react'
import CoralReefCanvas from '@/components/CoralReefCanvas'

type ReefHealthTab = 'reef-health' | 'reef-star-growth'

export default function ReefHealth() {
  const [tab, setTab] = useState<ReefHealthTab>('reef-health')

  const isHealth = tab === 'reef-health'
  const title = isHealth ? 'Reef Health' : 'Reef Star Growth'
  const subtitle = isHealth
    ? 'Global hard coral cover · GCRMN · NOAA CRW'
    : 'MARRS Reef Stars · months since installation'

  return (
    <div className="reef-health-page">
      <div className="reef-health-tabs" role="tablist" aria-label="Reef health modes">
        <button
          type="button"
          role="tab"
          className={`reef-health-tab${isHealth ? ' active' : ''}`}
          aria-selected={isHealth}
          onClick={() => setTab('reef-health')}
        >
          Reef Health
        </button>
        <button
          type="button"
          role="tab"
          className={`reef-health-tab${!isHealth ? ' active' : ''}`}
          aria-selected={!isHealth}
          onClick={() => setTab('reef-star-growth')}
        >
          Reef Star Growth
        </button>
      </div>

      <CoralReefCanvas
        key={tab}
        mode={tab}
        title={title}
        subtitle={subtitle}
        titleLevel={1}
      />
    </div>
  )
}
