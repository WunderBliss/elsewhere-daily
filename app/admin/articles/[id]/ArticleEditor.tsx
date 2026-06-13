'use client'
import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { Article } from '@/lib/db/schema'
import '@uiw/react-md-editor/markdown-editor.css'

// @uiw/react-md-editor is heavy and depends on `window`; load on the client only.
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-200 dark:border-gray-800 rounded p-6 text-sm text-gray-500 dark:text-gray-400">
      Loading editor…
    </div>
  ),
})

export default function ArticleEditor({ article }: { article: Article }) {
  const [title, setTitle] = useState(article.title)
  const [slug, setSlug] = useState(article.slug)
  const [tags, setTags] = useState(article.tags.join(', '))
  const [excerpt, setExcerpt] = useState(article.excerpt ?? '')
  const [content, setContent] = useState(article.content ?? '')
  const [status, setStatus] = useState<Article['status']>(article.status)
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit')

  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [unpublishing, setUnpublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  // Track unsaved-changes state by comparing current form values to the last
  // server snapshot. Captured at mount + after each successful save.
  const [snapshot, setSnapshot] = useState({
    title: article.title,
    slug: article.slug,
    tags: article.tags.join(', '),
    excerpt: article.excerpt ?? '',
    content: article.content ?? '',
  })
  const dirty = useMemo(
    () =>
      title !== snapshot.title ||
      slug !== snapshot.slug ||
      tags !== snapshot.tags ||
      excerpt !== snapshot.excerpt ||
      content !== snapshot.content,
    [title, slug, tags, excerpt, content, snapshot],
  )

  // Warn on navigate-away with unsaved changes.
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (!dirty) return
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

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
        excerpt,
        content,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setMessage('Saved.')
      setSnapshot({ title, slug, tags, excerpt, content })
      router.refresh()
    } else {
      setMessage('Save failed.')
    }
  }

  async function handlePublish() {
    if (dirty && !confirm('You have unsaved changes. Publish without saving them?')) return
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

  async function handleDelete() {
    const confirmText = status === 'published'
      ? 'Permanently delete this PUBLISHED article? This cannot be undone, and the article will disappear from the public site immediately.'
      : 'Permanently delete this draft? This cannot be undone.'
    if (!confirm(confirmText)) return
    // Second confirm for published articles — small extra friction is worth it.
    if (status === 'published' && !confirm('Are you absolutely sure? Type-anything dialog not implemented; this is your last chance to back out.')) {
      return
    }
    setDeleting(true)
    setMessage('')
    const res = await fetch(`/api/admin/articles/${article.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) {
      router.push('/admin')
    } else {
      setMessage('Delete failed.')
    }
  }

  // The editor's color scheme is controlled by a data attribute the library
  // reads off the document. Track our theme by looking at html.dark which the
  // ThemeToggle component sets.
  const [editorTheme, setEditorTheme] = useState<'light' | 'dark'>('light')
  useEffect(() => {
    function sync() {
      const isDark = document.documentElement.classList.contains('dark')
      setEditorTheme(isDark ? 'dark' : 'light')
      document.documentElement.setAttribute('data-color-mode', isDark ? 'dark' : 'light')
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded px-4 py-2 text-sm hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
        >
          {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
        </button>
        {status === 'draft' && (
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded px-4 py-2 text-sm hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-50"
          >
            {publishing ? 'Publishing…' : 'Publish'}
          </button>
        )}
        {status === 'published' && (
          <button
            onClick={handleUnpublish}
            disabled={unpublishing}
            className="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700 rounded px-4 py-2 text-sm hover:bg-amber-200 dark:hover:bg-amber-900/60 disabled:opacity-50"
          >
            {unpublishing ? 'Unpublishing…' : 'Unpublish'}
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="ml-auto bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 rounded px-4 py-2 text-sm hover:bg-red-100 dark:hover:bg-red-950/60 disabled:opacity-50"
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
        {message && <span className="w-full sm:w-auto text-sm text-gray-500 dark:text-gray-400">{message}</span>}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm mt-1 font-mono"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tags (comma-separated)</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Excerpt</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            placeholder="Auto-derived from the first paragraph if left blank."
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm mt-1 resize-y"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Content</label>
          <div className="ml-auto inline-flex border border-gray-300 dark:border-gray-700 rounded overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setEditorMode('edit')}
              className={`px-3 py-1 ${editorMode === 'edit' ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'}`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('preview')}
              className={`px-3 py-1 ${editorMode === 'preview' ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'}`}
            >
              Preview
            </button>
          </div>
        </div>
        <div data-color-mode={editorTheme}>
          <MDEditor
            value={content}
            onChange={(v) => setContent(v ?? '')}
            preview={editorMode}
            hideToolbar={false}
            height={500}
            visibleDragbar={false}
          />
        </div>
      </div>
    </div>
  )
}
