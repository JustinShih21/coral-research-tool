import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  ensureUniqueSlug,
  loadTeamSiteData,
  newCohortId,
  newMemberId,
  saveTeamSiteData,
  slugFromName,
} from '@/lib/teamData'
import type { PastCohort, PastCohortMember, TeamExperience, TeamMember, TeamSiteData } from '@/types/team'

const SAVE_DEBOUNCE_MS = 450
const SAVED_INDICATOR_MS = 2000

function missionToText(paragraphs: string[]): string {
  return paragraphs.join('\n\n')
}

function textToMission(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export default function TeamManagePage() {
  const { user } = useAuth()
  const [data, setData] = useState<TeamSiteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [saveStatus, setSaveStatus] = useState<'cloud' | 'local' | null>(null)
  const isInitialHydrate = useRef(true)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveIndicatorRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadTeamSiteData().then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!data || !user) return
    if (isInitialHydrate.current) {
      isInitialHydrate.current = false
      return
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveTeamSiteData(data).then((synced) => {
        setSavedAt(Date.now())
        setSaveStatus(synced ? 'cloud' : 'local')
        if (saveIndicatorRef.current) clearTimeout(saveIndicatorRef.current)
        saveIndicatorRef.current = setTimeout(() => {
          setSavedAt(null)
          setSaveStatus(null)
        }, SAVED_INDICATOR_MS)
      })
    }, SAVE_DEBOUNCE_MS)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [data, user])

  const patchMember = useCallback((id: string, patch: Partial<TeamMember>) => {
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        currentMembers: prev.currentMembers.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      }
    })
  }, [])

  const addMember = useCallback(() => {
    setData((prev) => {
      if (!prev) return prev
      const id = newMemberId()
      const baseSlug = ensureUniqueSlug('new-member', prev.currentMembers)
      const member: TeamMember = {
        id,
        slug: baseSlug,
        name: 'New member',
        photoUrl: '',
        linkedInUrl: '',
        headline: '',
        role: '',
        bio: '',
        experience: [],
        education: [],
        skills: [],
      }
      setSelectedMemberId(id)
      return { ...prev, currentMembers: [...prev.currentMembers, member] }
    })
  }, [])

  const removeMember = useCallback((id: string) => {
    setData((prev) => {
      if (!prev) return prev
      setSelectedMemberId((cur) => (cur === id ? null : cur))
      return { ...prev, currentMembers: prev.currentMembers.filter((m) => m.id !== id) }
    })
  }, [])

  const moveMember = useCallback((id: string, dir: -1 | 1) => {
    setData((prev) => {
      if (!prev) return prev
      const idx = prev.currentMembers.findIndex((m) => m.id === id)
      const next = idx + dir
      if (idx < 0 || next < 0 || next >= prev.currentMembers.length) return prev
      const copy = [...prev.currentMembers]
      const [row] = copy.splice(idx, 1)
      copy.splice(next, 0, row)
      return { ...prev, currentMembers: copy }
    })
  }, [])

  const syncSlugFromName = useCallback(
    (id: string, name: string) => {
      setData((prev) => {
        if (!prev) return prev
        const slug = ensureUniqueSlug(slugFromName(name), prev.currentMembers, id)
        return {
          ...prev,
          currentMembers: prev.currentMembers.map((m) => (m.id === id ? { ...m, name, slug } : m)),
        }
      })
    },
    []
  )

  const addPastCohort = useCallback(() => {
    setData((prev) => {
      if (!prev) return prev
      const cohort: PastCohort = { id: newCohortId(), label: 'Past cohort', members: [] }
      return { ...prev, pastCohorts: [...prev.pastCohorts, cohort] }
    })
  }, [])

  const patchCohort = useCallback((id: string, patch: Partial<PastCohort>) => {
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        pastCohorts: prev.pastCohorts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }
    })
  }, [])

  const removeCohort = useCallback((id: string) => {
    setData((prev) => (prev ? { ...prev, pastCohorts: prev.pastCohorts.filter((c) => c.id !== id) } : prev))
  }, [])

  const addPastMember = useCallback((cohortId: string) => {
    setData((prev) => {
      if (!prev) return prev
      const row: PastCohortMember = { name: '', photoUrl: '', linkedInUrl: '' }
      return {
        ...prev,
        pastCohorts: prev.pastCohorts.map((c) =>
          c.id === cohortId ? { ...c, members: [...c.members, row] } : c
        ),
      }
    })
  }, [])

  const patchPastMember = useCallback(
    (cohortId: string, index: number, patch: Partial<PastCohortMember>) => {
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          pastCohorts: prev.pastCohorts.map((c) => {
            if (c.id !== cohortId) return c
            const members = c.members.map((m, i) => (i === index ? { ...m, ...patch } : m))
            return { ...c, members }
          }),
        }
      })
    },
    []
  )

  const removePastMember = useCallback((cohortId: string, index: number) => {
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        pastCohorts: prev.pastCohorts.map((c) =>
          c.id === cohortId ? { ...c, members: c.members.filter((_, i) => i !== index) } : c
        ),
      }
    })
  }, [])

  if (loading || !data) {
    return (
      <div className="team-manage">
        <p className="team-loading">Loading…</p>
      </div>
    )
  }

  const selected = selectedMemberId ? data.currentMembers.find((m) => m.id === selectedMemberId) : null

  return (
    <div className="team-manage">
      <header className="team-manage-header">
        <div>
          <h1>Manage team directory</h1>
          <p className="team-manage-intro">
            Edits save automatically while you are logged in. Public pages read from the same stored data.
          </p>
        </div>
        <div className="team-manage-header-actions">
          {savedAt && (
            <span className="team-save-status" data-status={saveStatus ?? ''}>
              {saveStatus === 'cloud' ? 'Saved to cloud' : 'Saved locally'}
            </span>
          )}
          <Link to="/team" className="team-manage-preview">
            View public team page
          </Link>
        </div>
      </header>

      <section className="team-manage-section">
        <h2>Team page copy</h2>
        <div className="team-manage-grid">
          <label className="team-field">
            Page title
            <input
              type="text"
              value={data.teamOverview.title}
              onChange={(e) =>
                setData((p) =>
                  p ? { ...p, teamOverview: { ...p.teamOverview, title: e.target.value } } : p
                )
              }
            />
          </label>
          <label className="team-field">
            Subtitle
            <input
              type="text"
              value={data.teamOverview.subtitle}
              onChange={(e) =>
                setData((p) =>
                  p ? { ...p, teamOverview: { ...p.teamOverview, subtitle: e.target.value } } : p
                )
              }
            />
          </label>
          <label className="team-field team-field-full">
            Mission paragraphs (blank line between paragraphs)
            <textarea
              rows={6}
              value={missionToText(data.teamOverview.missionParagraphs)}
              onChange={(e) =>
                setData((p) =>
                  p
                    ? {
                        ...p,
                        teamOverview: {
                          ...p.teamOverview,
                          missionParagraphs: textToMission(e.target.value),
                        },
                      }
                    : p
                )
              }
            />
          </label>
          <label className="team-field team-field-full">
            Goals (one per line)
            <textarea
              rows={5}
              value={data.teamOverview.goals.join('\n')}
              onChange={(e) =>
                setData((p) =>
                  p
                    ? {
                        ...p,
                        teamOverview: {
                          ...p.teamOverview,
                          goals: e.target.value
                            .split('\n')
                            .map((l) => l.trim())
                            .filter(Boolean),
                        },
                      }
                    : p
                )
              }
            />
          </label>
          <label className="team-field team-field-full">
            How we came together
            <textarea
              rows={5}
              value={data.teamOverview.originStory}
              onChange={(e) =>
                setData((p) =>
                  p
                    ? { ...p, teamOverview: { ...p.teamOverview, originStory: e.target.value } }
                    : p
                )
              }
            />
          </label>
        </div>
      </section>

      <section className="team-manage-section">
        <div className="team-manage-section-head">
          <h2>Current members</h2>
          <button type="button" className="team-btn-primary" onClick={addMember}>
            Add member
          </button>
        </div>

        <div className="team-manage-split">
          <ul className="team-member-picker">
            {data.currentMembers.map((m, i) => (
              <li key={m.id}>
                <button
                  type="button"
                  className={selectedMemberId === m.id ? 'active' : ''}
                  onClick={() => setSelectedMemberId(m.id)}
                >
                  {m.name || 'Untitled'}
                </button>
                <span className="team-member-picker-meta">
                  <button type="button" aria-label="Move up" onClick={() => moveMember(m.id, -1)} disabled={i === 0}>
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    onClick={() => moveMember(m.id, 1)}
                    disabled={i === data.currentMembers.length - 1}
                  >
                    ↓
                  </button>
                </span>
              </li>
            ))}
          </ul>

          <div className="team-member-editor">
            {!selected ? (
              <p className="team-muted">Select a member or add a new one to edit their profile.</p>
            ) : (
              <>
                <label className="team-field">
                  Display name
                  <input
                    type="text"
                    value={selected.name}
                    onChange={(e) => patchMember(selected.id, { name: e.target.value })}
                    onBlur={() => syncSlugFromName(selected.id, selected.name)}
                  />
                </label>
                <label className="team-field">
                  <span>
                    URL slug (public URL ends with /team/member/<strong>slug</strong>)
                  </span>
                  <input
                    type="text"
                    value={selected.slug}
                    onChange={(e) =>
                      patchMember(selected.id, {
                        slug: ensureUniqueSlug(slugFromName(e.target.value), data.currentMembers, selected.id),
                      })
                    }
                  />
                </label>
                <label className="team-field team-field-full">
                  Photo URL (or path under /public, e.g. /team/photos/name.jpg)
                  <input
                    type="text"
                    value={selected.photoUrl}
                    onChange={(e) => patchMember(selected.id, { photoUrl: e.target.value })}
                  />
                </label>
                <label className="team-field team-field-full">
                  LinkedIn profile URL
                  <input
                    type="url"
                    value={selected.linkedInUrl ?? ''}
                    onChange={(e) => patchMember(selected.id, { linkedInUrl: e.target.value })}
                    placeholder="https://www.linkedin.com/in/…"
                  />
                </label>
                <label className="team-field team-field-full">
                  Headline
                  <input
                    type="text"
                    value={selected.headline ?? ''}
                    onChange={(e) => patchMember(selected.id, { headline: e.target.value })}
                    placeholder="Short line under name"
                  />
                </label>
                <label className="team-field team-field-full">
                  Role on team
                  <input
                    type="text"
                    value={selected.role ?? ''}
                    onChange={(e) => patchMember(selected.id, { role: e.target.value })}
                  />
                </label>
                <label className="team-field team-field-full">
                  Bio
                  <textarea
                    rows={4}
                    value={selected.bio ?? ''}
                    onChange={(e) => patchMember(selected.id, { bio: e.target.value })}
                  />
                </label>
                <label className="team-field team-field-full">
                  Skills (one per line)
                  <textarea
                    rows={3}
                    value={selected.skills.join('\n')}
                    onChange={(e) =>
                      patchMember(selected.id, {
                        skills: e.target.value
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </label>

                <div className="team-subform">
                  <div className="team-subform-head">
                    <h3>Experience</h3>
                    <button
                      type="button"
                      className="team-btn-small"
                      onClick={() =>
                        patchMember(selected.id, {
                          experience: [
                            ...selected.experience,
                            { title: '', org: '', description: '', start: '', end: '' },
                          ],
                        })
                      }
                    >
                      Add role
                    </button>
                  </div>
                  {selected.experience.map((ex, idx) => (
                    <div key={idx} className="team-repeat-block">
                      <label className="team-field">
                        Title
                        <input
                          type="text"
                          value={ex.title}
                          onChange={(e) => {
                            const next = [...selected.experience] as TeamExperience[]
                            next[idx] = { ...ex, title: e.target.value }
                            patchMember(selected.id, { experience: next })
                          }}
                        />
                      </label>
                      <label className="team-field">
                        Organization
                        <input
                          type="text"
                          value={ex.org}
                          onChange={(e) => {
                            const next = [...selected.experience]
                            next[idx] = { ...ex, org: e.target.value }
                            patchMember(selected.id, { experience: next })
                          }}
                        />
                      </label>
                      <div className="team-inline-two">
                        <label className="team-field">
                          Start
                          <input
                            type="text"
                            value={ex.start ?? ''}
                            onChange={(e) => {
                              const next = [...selected.experience]
                              next[idx] = { ...ex, start: e.target.value }
                              patchMember(selected.id, { experience: next })
                            }}
                            placeholder="2022"
                          />
                        </label>
                        <label className="team-field">
                          End
                          <input
                            type="text"
                            value={ex.end ?? ''}
                            onChange={(e) => {
                              const next = [...selected.experience]
                              next[idx] = { ...ex, end: e.target.value }
                              patchMember(selected.id, { experience: next })
                            }}
                            placeholder="Present"
                          />
                        </label>
                      </div>
                      <label className="team-field team-field-full">
                        Description
                        <textarea
                          rows={2}
                          value={ex.description ?? ''}
                          onChange={(e) => {
                            const next = [...selected.experience]
                            next[idx] = { ...ex, description: e.target.value }
                            patchMember(selected.id, { experience: next })
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="team-btn-danger-text"
                        onClick={() =>
                          patchMember(selected.id, {
                            experience: selected.experience.filter((_, j) => j !== idx),
                          })
                        }
                      >
                        Remove this role
                      </button>
                    </div>
                  ))}
                </div>

                <div className="team-subform">
                  <div className="team-subform-head">
                    <h3>Education</h3>
                    <button
                      type="button"
                      className="team-btn-small"
                      onClick={() =>
                        patchMember(selected.id, {
                          education: [...selected.education, { school: '', degree: '', year: '' }],
                        })
                      }
                    >
                      Add school
                    </button>
                  </div>
                  {selected.education.map((ed, idx) => (
                    <div key={idx} className="team-repeat-block">
                      <label className="team-field">
                        School
                        <input
                          type="text"
                          value={ed.school}
                          onChange={(e) => {
                            const next = [...selected.education]
                            next[idx] = { ...ed, school: e.target.value }
                            patchMember(selected.id, { education: next })
                          }}
                        />
                      </label>
                      <label className="team-field">
                        Degree
                        <input
                          type="text"
                          value={ed.degree ?? ''}
                          onChange={(e) => {
                            const next = [...selected.education]
                            next[idx] = { ...ed, degree: e.target.value }
                            patchMember(selected.id, { education: next })
                          }}
                        />
                      </label>
                      <label className="team-field">
                        Year
                        <input
                          type="text"
                          value={ed.year ?? ''}
                          onChange={(e) => {
                            const next = [...selected.education]
                            next[idx] = { ...ed, year: e.target.value }
                            patchMember(selected.id, { education: next })
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="team-btn-danger-text"
                        onClick={() =>
                          patchMember(selected.id, {
                            education: selected.education.filter((_, j) => j !== idx),
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <button type="button" className="team-btn-danger" onClick={() => removeMember(selected.id)}>
                  Remove member from current team
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="team-manage-section">
        <div className="team-manage-section-head">
          <h2>Past teams</h2>
          <button type="button" className="team-btn-primary" onClick={addPastCohort}>
            Add cohort
          </button>
        </div>
        <p className="team-muted team-manage-hint">
          Each cohort appears on the public page with photos and names; clicking opens LinkedIn.
        </p>
        {data.pastCohorts.map((cohort) => (
          <div key={cohort.id} className="team-cohort-editor">
            <div className="team-cohort-editor-head">
              <label className="team-field team-field-grow">
                Cohort label
                <input
                  type="text"
                  value={cohort.label}
                  onChange={(e) => patchCohort(cohort.id, { label: e.target.value })}
                  placeholder="e.g. 2024 BUAD 493"
                />
              </label>
              <button type="button" className="team-btn-danger-text" onClick={() => removeCohort(cohort.id)}>
                Remove cohort
              </button>
            </div>
            <button type="button" className="team-btn-small" onClick={() => addPastMember(cohort.id)}>
              Add person
            </button>
            <div className="team-past-rows">
              {cohort.members.map((m, index) => (
                <div key={index} className="team-past-row">
                  <label className="team-field">
                    Name
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => patchPastMember(cohort.id, index, { name: e.target.value })}
                    />
                  </label>
                  <label className="team-field">
                    Photo URL
                    <input
                      type="text"
                      value={m.photoUrl}
                      onChange={(e) => patchPastMember(cohort.id, index, { photoUrl: e.target.value })}
                    />
                  </label>
                  <label className="team-field">
                    LinkedIn URL
                    <input
                      type="url"
                      value={m.linkedInUrl}
                      onChange={(e) => patchPastMember(cohort.id, index, { linkedInUrl: e.target.value })}
                    />
                  </label>
                  <button
                    type="button"
                    className="team-btn-danger-text"
                    onClick={() => removePastMember(cohort.id, index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
