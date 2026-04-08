import { useState, useMemo, useEffect } from 'react'
import { libraryDocuments, libraryReadings } from '@/data/researchLibrary'
import { useAuth } from '@/contexts/AuthContext'
import { getResearchData, setResearchData } from '@/lib/researchStorage'
import type { LibraryDocument } from '@/types/library'
import { LIBRARY_IMAGE } from '@/data/imageAssets'

const LIBRARY_EXTRA_KEY = 'library-documents-extra'
const LIBRARY_IMAGE_CANDIDATES = ['/images/library/library.jpg', LIBRARY_IMAGE, '/reef.svg'] as const

type Tab = 'documents' | 'readings'
type PreviewMode = 'iframe' | 'office' | 'unsupported'

interface PreviewState {
  title: string
  link: string
  mode: PreviewMode
  src?: string
  reason?: string
}

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

function normalizeLink(link: string): string {
  return encodeURI(link)
}

function extensionFromLink(link: string): string {
  const normalized = link.split('?')[0].split('#')[0]
  const idx = normalized.lastIndexOf('.')
  if (idx < 0) return ''
  return normalized.slice(idx + 1).toLowerCase()
}

function isLocalDevHost(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}

function absoluteUrl(link: string): string {
  if (/^https?:\/\//i.test(link)) return link
  if (typeof window === 'undefined') return link
  if (link.startsWith('/')) return `${window.location.origin}${link}`
  return `${window.location.origin}/${link}`
}

function buildPreview(title: string, rawLink: string): PreviewState {
  const link = normalizeLink(rawLink)
  const ext = extensionFromLink(link)

  if (['pdf', 'txt', 'md', 'csv', 'json', 'html', 'htm', 'svg', 'png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
    return { title, link, mode: 'iframe', src: link }
  }

  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
    if (isLocalDevHost()) {
      return {
        title,
        link,
        mode: 'unsupported',
        reason: 'Office document preview works best on deployed URLs. In local dev, use download/open.',
      }
    }
    const officeSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteUrl(link))}`
    return { title, link, mode: 'office', src: officeSrc }
  }

  return {
    title,
    link,
    mode: 'unsupported',
    reason: 'Preview is not available for this file type. Use download/open instead.',
  }
}

export default function ResearchLibrary() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('documents')
  const [topicFilter, setTopicFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [libraryImageIndex, setLibraryImageIndex] = useState(0)
  const [preview, setPreview] = useState<PreviewState | null>(null)

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
    if (searchLower) {
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(searchLower) ||
          (d.description && d.description.toLowerCase().includes(searchLower)) ||
          (d.topic && d.topic.toLowerCase().includes(searchLower))
      )
    }
    return list
  }, [topicFilter, searchLower, allDocuments])

  const filteredReadings = useMemo(() => {
    let list = topicFilter === '' ? libraryReadings : libraryReadings.filter((r) => r.topic === topicFilter)
    if (searchLower) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(searchLower) || r.topic.toLowerCase().includes(searchLower)
      )
    }
    return list
  }, [topicFilter, searchLower])

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
  const libraryImageSrc =
    LIBRARY_IMAGE_CANDIDATES[Math.min(libraryImageIndex, LIBRARY_IMAGE_CANDIDATES.length - 1)]
  const handleLibraryImageError = () =>
    setLibraryImageIndex((prev) =>
      prev < LIBRARY_IMAGE_CANDIDATES.length - 1 ? prev + 1 : prev
    )

  const previewItem = (title: string, link?: string) => {
    if (!link) return
    setPreview(buildPreview(title, link))
  }

  return (
    <div className="research-library">
      <header className="library-header">
        <div className="library-header-bg" role="img" aria-label="Research and coral reef">
          <img
            src={libraryImageSrc}
            alt=""
            aria-hidden
            className="library-header-bg-img"
            onError={handleLibraryImageError}
          />
        </div>
        <span className="library-header-overlay" aria-hidden />
        <div className="library-header-content">
          <h1>Research Library</h1>
          <p className="library-header-intro">
            Document-first archive from the Coral Farming research set.
          </p>
        </div>
      </header>
      <p className="library-intro">
        Preview documents directly in the site, then download or open in a new tab.
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
      </div>
      <div className="library-filters">
        <label className="library-search-label">
          Search:
          <input
            type="search"
            placeholder="Title, topic, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="library-search-input"
          />
        </label>
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
            {filteredDocs.map((doc) => {
              const safeLink = doc.link ? normalizeLink(doc.link) : undefined
              return (
                <li key={doc.id} className={isExtraDoc(doc.id) ? 'library-card-wrap library-card-extra' : ''}>
                  <div className="library-card library-card-no-link">
                    <h3>{doc.title}</h3>
                    <p className="library-description">{doc.description}</p>
                    <div className="library-meta">
                      <span className="library-source">{doc.source}</span>
                      {doc.topic && <span className="library-topic">{doc.topic}</span>}
                    </div>
                    {safeLink ? (
                      <div className="library-card-actions">
                        <button type="button" className="library-action-btn" onClick={() => previewItem(doc.title, doc.link)}>
                          Preview
                        </button>
                        <a href={safeLink} className="library-action-btn" download>
                          Download
                        </a>
                        <a href={safeLink} target="_blank" rel="noopener noreferrer" className="library-action-btn library-action-ghost">
                          Open
                        </a>
                      </div>
                    ) : (
                      <p className="library-no-link">
                        No link yet - add a <code>link</code> in the data to open this document.
                      </p>
                    )}
                  </div>
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
              )
            })}
          </ul>
        </>
      )}
      {tab === 'readings' && (
        <ul className="library-list readings-list">
          {filteredReadings.map((r) => {
            const safeLink = r.link ? normalizeLink(r.link) : undefined
            return (
              <li key={r.id} className="library-card-wrap">
                <div className="library-card library-card-no-link">
                  <h3>{r.title}</h3>
                  <div className="library-meta">
                    <span className="library-topic">{r.topic}</span>
                    <span className="library-source">{r.source}</span>
                  </div>
                  {safeLink ? (
                    <div className="library-card-actions">
                      <button type="button" className="library-action-btn" onClick={() => previewItem(r.title, r.link)}>
                        Preview
                      </button>
                      <a href={safeLink} className="library-action-btn" download>
                        Download
                      </a>
                      <a href={safeLink} target="_blank" rel="noopener noreferrer" className="library-action-btn library-action-ghost">
                        Open
                      </a>
                    </div>
                  ) : (
                    <p className="library-no-link">
                      No link yet - add a <code>link</code> in the data to open this reading.
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {preview && (
        <div className="library-preview-backdrop" onClick={() => setPreview(null)}>
          <section className="library-preview-modal" onClick={(e) => e.stopPropagation()}>
            <header className="library-preview-header">
              <div>
                <h3>{preview.title}</h3>
                <p>In-site document preview</p>
              </div>
              <div className="library-preview-actions">
                <a href={preview.link} className="library-action-btn" download>
                  Download
                </a>
                <a href={preview.link} target="_blank" rel="noopener noreferrer" className="library-action-btn library-action-ghost">
                  Open
                </a>
                <button type="button" className="library-action-btn library-action-ghost" onClick={() => setPreview(null)}>
                  Close
                </button>
              </div>
            </header>
            <div className="library-preview-body">
              {preview.mode === 'unsupported' || !preview.src ? (
                <p className="library-preview-fallback">{preview.reason}</p>
              ) : (
                <iframe
                  src={preview.src}
                  title={`Preview: ${preview.title}`}
                  className="library-preview-frame"
                />
              )}
            </div>
          </section>
        </div>
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
        <input value={link} onChange={(e) => setLink(e.target.value)} type="text" placeholder="Optional" />
      </label>
      <button type="submit">Add document</button>
    </form>
  )
}
