'use client'
import { useEffect, useState } from 'react'
import { THEME_STORAGE_KEY, type ThemePreference } from '@/lib/theme'

function applyTheme(pref: ThemePreference) {
  const resolved =
    pref === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : pref
  document.documentElement.setAttribute('data-theme', resolved)
  document.documentElement.dataset.themePref = pref
}

function nextPref(p: ThemePreference): ThemePreference {
  if (p === 'system') return 'light'
  if (p === 'light') return 'dark'
  return 'system'
}

function labelFor(p: ThemePreference): string {
  if (p === 'system') return 'Auto'
  if (p === 'light') return 'Light'
  return 'Dark'
}

function iconFor(p: ThemePreference) {
  // Inline SVGs — no new dependencies, no font icons, no asset round-trips.
  if (p === 'light') {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    )
  }
  if (p === 'dark') {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M8 20h8M12 18v2" />
    </svg>
  )
}

export default function ThemeToggle() {
  const [pref, setPref] = useState<ThemePreference>('system')
  const [mounted, setMounted] = useState(false)

  // Read current preference from the DOM (set by the inline init script) on mount.
  // This is a legitimate "sync from external system" effect: the inline script
  // wrote to <html> before hydration, and we mirror that into React state once.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    const fromDom = document.documentElement.dataset.themePref as ThemePreference | undefined
    if (fromDom === 'light' || fromDom === 'dark' || fromDom === 'system') {
      setPref(fromDom)
    }
  }, [])

  // When in "system" mode, react to OS-level changes live.
  useEffect(() => {
    if (pref !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [pref])

  function cycle() {
    const next = nextPref(pref)
    setPref(next)
    try {
      if (next === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
      else localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      /* localStorage disabled — fall back to in-memory state */
    }
    applyTheme(next)
  }

  return (
    <button
      type="button"
      onClick={cycle}
      // Render a stable placeholder during SSR/first paint so the button doesn't visibly shift.
      aria-label={mounted ? `Theme: ${labelFor(pref)}. Click to cycle.` : 'Theme toggle'}
      title={mounted ? `Theme: ${labelFor(pref)}` : 'Theme'}
      className="inline-flex items-center gap-1.5 rounded border border-gray-300 dark:border-gray-700 px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <span className="inline-flex" suppressHydrationWarning>
        {iconFor(mounted ? pref : 'system')}
      </span>
      <span suppressHydrationWarning>{mounted ? labelFor(pref) : 'Auto'}</span>
    </button>
  )
}
