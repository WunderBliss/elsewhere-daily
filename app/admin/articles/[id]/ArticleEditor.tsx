'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Article } from '@/lib/db/schema'

export default function ArticleEditor({ article }: { article: Article }) {
  const [title, setTitle] = useState(article.title)
  const [slug, setSlug] = useState(article.slug)
  const [tags, setTags] = useState(article.tags.join(', '))
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleSave() {
    setSaving(true)
    setMessage('')
    const res = await fetch(`/api/admin/articles/${article.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        slug,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      }),
    })
    setSaving(false)
    setMessage(res.ok ? 'Saved.' : 'Save failed.')
  }

  async function handlePublish() {
    setPublishing(true)
    const res = await fetch(`/api/admin/articles/${article.id}/publish`, { method: 'POST' })
    setPublishing(false)
    if (res.ok) {
      router.push('/admin')
    } else {
      setMessage('Publish failed.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-center">
        <button onClick={handleSave} disabled={saving}
          className="bg-gray-200 text-gray-800 rounded px-4 py-2 text-sm hover:bg-gray-300 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
        {article.status === 'draft' && (
          <button onClick={handlePublish} disabled={publishing}
            className="bg-gray-900 text-white rounded px-4 py-2 text-sm hover:bg-gray-700 disabled:opacity-50">
            {publishing ? 'Publishing…' : 'Publish'}
          </button>
        )}
        {message && <span className="text-sm text-gray-500">{message}</span>}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide">Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1 font-mono" />
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide">Tags (comma-separated)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1" />
        </div>
      </div>

      <div className="border border-gray-200 rounded p-6">
        <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-4">Preview</h3>
        <div className="prose prose-gray max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content ?? ''}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
