import { useState, useMemo, useEffect } from 'react'
import { libraryDocuments, libraryReadings, libraryRecordings } from '@/data/researchLibrary'
import { useAuth } from '@/contexts/AuthContext'
import { getResearchData, setResearchData } from '@/lib/researchStorage'
import type { LibraryDocument } from '@/types/library'

const LIBRARY_EXTRA_KEY = 'library-documents-extra'

type Tab = 'documents' | 'readings' | 'recordings'

function parseExtraDocs(value: unknown): LibraryDocument[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (d): d is LibraryDocument =>
      d != null &&
      typeof d === 'object' &&
      typeof (d as LibraryDocument).id === 'string' &&
      typeof (d as LibraryDocument).title === 'string' &&
      typeof (d as LibraryDocument).description === 'string' &&
      typeof (d as LibraryDocument).source === 'string'
  )
}

export default function ResearchLibrary() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('documents')
  const [topicFilter, setTopicFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  const [extraDocuments, setExtraDocuments] = useState<LibraryDocument[]>([])
  useEffect(() => {
    getResearchData<unknown>(LIBRARY_EXTRA_KEY).then((data) => {
      setExtraDocuments(parseExtraDocs(data))
    })
  }, [])

  const allDocuments = useMemo(
    () => [...libraryDocuments, ...extraDocuments],
    [extraDocuments]
  )

  const topicsDocs = Array.from(new Set(allDocuments.map((d) => d.topic).filter((t): t is string => !!t)))
  const topicsReadings = Array.from(new Set(libraryReadings.map((r) => r.topic)))

  const searchLower = search.trim().toLowerCase()
  const filteredDocs = useMemo(() => {
    let list = topicFilter === '' ? allDocuments : allDocuments.filter((d) => d.topic === topicFilter)
    if (searchLower)
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(searchLower) ||
          (d.description && d.description.toLowerCase().includes(searchLower)) ||
          (d.topic && d.topic.toLowerCase().includes(searchLower))
      )
    return list
  }, [topicFilter, searchLower, allDocuments])
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

  const saveExtraDocuments = (next: LibraryDocument[]) => {
    setExtraDocuments(next)
    setResearchData(LIBRARY_EXTRA_KEY, next)
  }

  const addDocument = (doc: LibraryDocument) => {
    saveExtraDocuments([...extraDocuments, doc])
  }

  const removeExtraDocument = (id: string) => {
    saveExtraDocuments(extraDocuments.filter((d) => d.id !== id))
  }

  const isExtraDoc = (id: string) => extraDocuments.some((d) => d.id === id)

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
        <>
          {user && (
            <AddDocumentForm
              onAdd={addDocument}
              existingIds={new Set(allDocuments.map((d) => d.id))}
            />
          )}
          <ul className="library-list documents-list">
            {filteredDocs.map((doc) => (
              <li key={doc.id} className={isExtraDoc(doc.id) ? 'library-card-wrap library-card-extra' : ''}>
                {doc.link ? (
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
                ) : (
                  <div className="library-card library-card-no-link">
                    <h3>{doc.title}</h3>
                    <p className="library-description">{doc.description}</p>
                    <div className="library-meta">
                      <span className="library-source">{doc.source}</span>
                      {doc.topic && <span className="library-topic">{doc.topic}</span>}
                    </div>
                    <p className="library-no-link">
                      No link yet — add a <code>link</code> in the data to open this document.
                    </p>
                  </div>
                )}
                {user && isExtraDoc(doc.id) && (
                  <button
                    type="button"
                    className="library-card-delete"
                    onClick={() => removeExtraDocument(doc.id)}
                    title="Remove document"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
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

function AddDocumentForm({
  onAdd,
  existingIds,
}: {
  onAdd: (doc: LibraryDocument) => void
  existingIds: Set<string>
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [source, setSource] = useState('')
  const [topic, setTopic] = useState('')
  const [link, setLink] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = 'extra-' + Date.now()
    if (existingIds.has(id)) return
    onAdd({
      id,
      title: title.trim() || 'Untitled',
      description: description.trim() || '',
      source: source.trim() || '',
      topic: topic.trim() || undefined,
      link: link.trim() || undefined,
    })
    setTitle('')
    setDescription('')
    setSource('')
    setTopic('')
    setLink('')
  }

  return (
    <form onSubmit={handleSubmit} className="library-add-form">
      <h3>Add document</h3>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Description
        <input value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label>
        Source
        <input value={source} onChange={(e) => setSource(e.target.value)} />
      </label>
      <label>
        Topic
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Optional" />
      </label>
      <label>
        Link (URL or path)
        <input value={link} onChange={(e) => setLink(e.target.value)} type="url" placeholder="Optional" />
      </label>
      <button type="submit">Add document</button>
    </form>
  )
}
