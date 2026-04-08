import { useEffect, useState } from 'react'
import type { TeamSiteData } from '@/types/team'
import { loadTeamSiteData } from '@/lib/teamData'

export function useTeamSiteData() {
  const [data, setData] = useState<TeamSiteData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    loadTeamSiteData().then((d) => {
      if (!cancelled) {
        setData(d)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading }
}
