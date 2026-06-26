import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

const MOODS = {
  'Warm Paper': { bg:'#f6f3ee', surface:'#ffffff', surface2:'#fcfbf9', ink:'#211d18', muted:'#9a9184', line:'#ece6dd' },
  'Cool Slate': { bg:'#eef1f4', surface:'#ffffff', surface2:'#f7f9fb', ink:'#1b2430', muted:'#8893a3', line:'#e2e7ee' },
  'Clean Mono': { bg:'#f2f2f0', surface:'#ffffff', surface2:'#fafafa',  ink:'#18181b', muted:'#9b9b9e', line:'#e6e6e4' },
}
const SHAPES = {
  'Soft':      { rad:'16px', rsm:'10px', shadow:'0 1px 3px rgba(40,30,10,.06)' },
  'Editorial': { rad:'5px',  rsm:'4px',  shadow:'0 1px 0 rgba(0,0,0,.05)' },
  'Sharp':     { rad:'0px',  rsm:'0px',  shadow:'none' },
}
const DENSITIES = {
  'Cozy':    { gap:'22px', cgap:'14px', cardpad:'16px 18px' },
  'Compact': { gap:'16px', cgap:'9px',  cardpad:'12px 14px' },
  'Airy':    { gap:'30px', cgap:'20px', cardpad:'22px 24px' },
}

export const MOOD_KEYS    = Object.keys(MOODS)
export const SHAPE_KEYS   = Object.keys(SHAPES)
export const DENSITY_KEYS = Object.keys(DENSITIES)

function load(key, fallback) {
  try { return localStorage.getItem(key) || fallback } catch { return fallback }
}
function save(key, val) {
  try { localStorage.setItem(key, val) } catch {}
}

export function ThemeProvider({ children }) {
  const [mood,    setMoodRaw]    = useState(() => load('tt_mood',    'Warm Paper'))
  const [shape,   setShapeRaw]   = useState(() => load('tt_shape',   'Soft'))
  const [density, setDensityRaw] = useState(() => load('tt_density', 'Cozy'))

  const theme = { ...MOODS[mood] || MOODS['Warm Paper'], ...SHAPES[shape] || SHAPES['Soft'], ...DENSITIES[density] || DENSITIES['Cozy'] }

  useEffect(() => {
    const r = document.documentElement
    r.style.setProperty('--bg',       theme.bg)
    r.style.setProperty('--surface',  theme.surface)
    r.style.setProperty('--surface2', theme.surface2)
    r.style.setProperty('--ink',      theme.ink)
    r.style.setProperty('--muted',    theme.muted)
    r.style.setProperty('--line',     theme.line)
    r.style.setProperty('--rad',      theme.rad)
    r.style.setProperty('--rsm',      theme.rsm)
    r.style.setProperty('--shadow',   theme.shadow)
    r.style.setProperty('--gap',      theme.gap)
    r.style.setProperty('--cgap',     theme.cgap)
    r.style.setProperty('--cardpad',  theme.cardpad)
  }, [mood, shape, density])

  function setMood(m)    { setMoodRaw(m);    save('tt_mood', m) }
  function setShape(s)   { setShapeRaw(s);   save('tt_shape', s) }
  function setDensity(d) { setDensityRaw(d); save('tt_density', d) }

  return (
    <ThemeContext.Provider value={{ theme, mood, shape, density, setMood, setShape, setDensity }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
