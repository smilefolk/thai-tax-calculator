import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false)
  const [matches, setMatches] = useState(get)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/** Breakpoints from the handoff: <700 mobile layouts, <1100 stacked splits */
export const useIsMobile = () => useMediaQuery('(max-width: 699px)')
export const useIsNarrow = () => useMediaQuery('(max-width: 1099px)')
