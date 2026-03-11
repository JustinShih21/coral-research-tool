import { useState, useCallback } from 'react'
import { contacts } from '@/data/contacts'

export default function Contacts() {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'in_person' | 'virtual'>('all')
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyContact = useCallback(async (contact: string, id: string) => {
    try {
      await navigator.clipboard.writeText(contact.replace(/\s/g, ''))
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // ignore
    }
  }, [])

  const filtered = contacts.filter((c) => {
    const matchCategory =
      categoryFilter === 'all' || c.category === categoryFilter
    const matchSearch =
      search === '' ||
      [c.name, c.organization, c.description].some((s) =>
        s.toLowerCase().includes(search.toLowerCase())
      )
    return matchCategory && matchSearch
  })

  return (
    <div className="contacts-page">
      <h1>Contact List</h1>
      <p className="contacts-intro">
        Bali / Indonesia coral restoration contacts from BUAD493 field research. In-person (Indonesia trip) and virtual interviews.
      </p>
      <div className="contacts-filters">
        <label>
          Type:
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'all' | 'in_person' | 'virtual')}
          >
            <option value="all">All</option>
            <option value="in_person">Met in person (Indonesia)</option>
            <option value="virtual">Virtual / self-sourced</option>
          </select>
        </label>
        <label>
          Search:
          <input
            type="search"
            placeholder="Name, org, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <ul className="contacts-list">
        {filtered.map((c) => (
          <li key={c.id} className="contact-card">
            <div className="contact-header">
              <h3>{c.name}</h3>
              <span className={`contact-badge ${c.category}`}>
                {c.category === 'in_person' ? 'In person' : 'Virtual'}
              </span>
            </div>
            <p className="contact-org">{c.organization}</p>
            <p className="contact-detail">
              <strong>Contact:</strong> {c.contact}
              <button
                type="button"
                className="contact-copy-btn"
                onClick={() => copyContact(c.contact, c.id)}
                title="Copy"
              >
                {copiedId === c.id ? 'Copied' : 'Copy'}
              </button>
            </p>
            <p className="contact-description">{c.description}</p>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && (
        <p className="contacts-empty">No contacts match the filters.</p>
      )}
    </div>
  )
}
