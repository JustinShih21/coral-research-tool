import { useState, useMemo } from 'react'
import { libraryDocuments, libraryReadings, libraryRecordings } from '@/data/researchLibrary'

type Tab = 'documents' | 'readings' | 'recordings'

export default function ResearchLibrary() {
  const [tab, setTab] = useState<Tab>('documents')
  const [topicFilter, setTopicFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  const topicsDocs = Array.from(new Set(libraryDocuments.map((d) => d.topic).filter((t): t is string => !!t)))
  const topicsReadings = Array.from(new Set(libraryReadings.map((r) => r.topic)))

  const searchLower = search.trim().toLowerCase()
  const filteredDocs = useMemo(() => {
    let list = topicFilter === '' ? libraryDocuments : libraryDocuments.filter((d) => d.topic === topicFilter)
    if (searchLower)
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(searchLower) ||
          (d.description && d.description.toLowerCase().includes(searchLower)) ||
          (d.topic && d.topic.toLowerCase().includes(searchLower))
      )
    return list
  }, [topicFilter, searchLower])
  const filteredReadings = useMemo(() => {
    let list = topicFilter === '' ? libraryReadings : libraryReadings.filter((r) => r.topic === topicFilter)
    if (searchLower)
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(searchLower) || r.topic.toLowerCase().includes(searchLower)
      )
    return list
  }, [topicFilter, searchLower])
  const filteredRecordings = useMemo(() => {
    if (!searchLower) return libraryRecordings
    return libraryRecordings.filter(
      (r) =>
        r.title.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower)
    )
  }, [searchLower])

  return (
    <div className="research-library">
      <h1>Research Library</h1>
      <p className="library-intro">
        Documents, readings, and recordings from the Coral Farming archive. Add links when files are hosted to enable direct access or playback.
      </p>
      <div className="library-tabs">
        <button
          type="button"
          className={tab === 'documents' ? 'active' : ''}
          onClick={() => setTab('documents')}
        >
          Documents
        </button>
        <button
          type="button"
          className={tab === 'readings' ? 'active' : ''}
          onClick={() => setTab('readings')}
        >
          Readings
        </button>
        <button
          type="button"
          className={tab === 'recordings' ? 'active' : ''}
          onClick={() => setTab('recordings')}
        >
          Recordings
        </button>
      </div>
      <div className="library-filters">
        <label className="library-search-label">
          Search:
          <input
            type="search"
            placeholder={tab === 'recordings' ? 'Search recordings…' : 'Title, topic, description…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="library-search-input"
          />
        </label>
        {tab !== 'recordings' && (
          <label>
            Topic:
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
            >
              <option value="">All</option>
              {(tab === 'documents' ? topicsDocs : topicsReadings).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {tab === 'documents' && (
        <ul className="library-list documents-list">
          {filteredDocs.map((doc) =>
            doc.link ? (
              <li key={doc.id}>
                <a
                  href={encodeURI(doc.link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="library-card library-card-link"
                >
                  <h3>{doc.title}</h3>
                  <p className="library-description">{doc.description}</p>
                  <div className="library-meta">
                    <span className="library-source">{doc.source}</span>
                    {doc.topic && <span className="library-topic">{doc.topic}</span>}
                  </div>
                  <span className="library-link">Open document →</span>
                </a>
              </li>
            ) : (
              <li key={doc.id} className="library-card library-card-no-link">
                <h3>{doc.title}</h3>
                <p className="library-description">{doc.description}</p>
                <div className="library-meta">
                  <span className="library-source">{doc.source}</span>
                  {doc.topic && <span className="library-topic">{doc.topic}</span>}
                </div>
                <p className="library-no-link">
                  No link yet — add a <code>link</code> in the data to open this document.
                </p>
              </li>
            )
          )}
        </ul>
      )}
      {tab === 'readings' && (
        <ul className="library-list readings-list">
          {filteredReadings.map((r) =>
            r.link ? (
              <li key={r.id}>
                <a
                  href={encodeURI(r.link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="library-card library-card-link"
                >
                  <h3>{r.title}</h3>
                  <div className="library-meta">
                    <span className="library-topic">{r.topic}</span>
                    <span className="library-source">{r.source}</span>
                  </div>
                  <span className="library-link">Open reading →</span>
                </a>
              </li>
            ) : (
              <li key={r.id} className="library-card library-card-no-link">
                <h3>{r.title}</h3>
                <div className="library-meta">
                  <span className="library-topic">{r.topic}</span>
                  <span className="library-source">{r.source}</span>
                </div>
                <p className="library-no-link">
                  No link yet — add a <code>link</code> in the data to open this reading.
                </p>
              </li>
            )
          )}
        </ul>
      )}
      {tab === 'recordings' && (
        <ul className="library-list recordings-list">
          {filteredRecordings.map((rec) => {
            const safeLink = rec.link ? encodeURI(rec.link) : undefined
            return (
              <li key={rec.id} className="library-card recording-card">
                <h3>{rec.title}</h3>
                <p className="library-description">{rec.description}</p>
                <div className="library-meta">
                  <span className="library-source">{rec.source}</span>
                  <span className="recording-type">{rec.type}</span>
                </div>
                {safeLink ? (
                  <div className="recording-embed">
                    {rec.type === 'video' ? (
                      <video controls src={safeLink} className="recording-player" />
                    ) : (
                      <audio controls src={safeLink} className="recording-player" />
                    )}
                  </div>
                ) : (
                  <p className="recording-placeholder">Add a link in the data to enable playback.</p>
                )}
                {safeLink && (
                  <a href={safeLink} target="_blank" rel="noopener noreferrer" className="library-link">
                    Open in new tab
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
