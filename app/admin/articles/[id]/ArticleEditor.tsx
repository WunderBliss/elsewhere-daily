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
  const [status, setStatus] = useState<Article['status']>(article.status)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [unpublishing, setUnpublishing] = useState(false)
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
    setMessage('')
    const res = await fetch(`/api/admin/articles/${article.id}/publish`, { method: 'POST' })
    setPublishing(false)
    if (res.ok) {
      router.push('/admin')
    } else {
      setMessage('Publish failed.')
    }
  }

  async function handleUnpublish() {
    if (!confirm('Unpublish this article? It will return to the drafts queue and disappear from the public site.')) {
      return
    }
    setUnpublishing(true)
    setMessage('')
    const res = await fetch(`/api/admin/articles/${article.id}/unpublish`, { method: 'POST' })
    setUnpublishing(false)
    if (res.ok) {
      setStatus('draft')
      setMessage('Unpublished. Article moved back to drafts.')
      router.refresh()
    } else {
      setMessage('Unpublish failed.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <button onClick={handleSave} disabled={saving}
          className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded px-4 py-2 text-sm hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
        {status === 'draft' && (
          <button onClick={handlePublish} disabled={publishing}
            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded px-4 py-2 text-sm hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-50">
            {publishing ? 'Publishing…' : 'Publish'}
          </button>
        )}
        {status === 'published' && (
          <button onClick={handleUnpublish} disabled={unpublishing}
            className="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700 rounded px-4 py-2 text-sm hover:bg-amber-200 dark:hover:bg-amber-900/60 disabled:opacity-50">
            {unpublishing ? 'Unpublishing…' : 'Unpublish'}
          </button>
        )}
        {message && <span className="text-sm text-gray-500 dark:text-gray-400">{message}</span>}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm mt-1 font-mono" />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tags (comma-separated)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm mt-1" />
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded p-6">
        <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Preview</h3>
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content ?? ''}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
