import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

const MOODS = {
  'Midnight': { bg:'#0d0e12', surface:'#16181f', surface2:'#1b1e27', ink:'#f3f4f8', muted:'#828aa0', line:'#272b36', accent:'#7c6cff', accentGrad:'linear-gradient(135deg,#6d5efc,#a855f7)', shadow:'0 8px 30px rgba(0,0,0,.45)' },
  'Daylight': { bg:'#f5f6f9', surface:'#ffffff', surface2:'#f2f4f8', ink:'#0e1320', muted:'#8a93a6', line:'#e9ecf2', accent:'#5b54f0', accentGrad:'linear-gradient(135deg,#6366f1,#8b5cf6)', shadow:'0 6px 24px rgba(20,24,40,.07)' },
  'Mocha':    { bg:'#f5f1ea', surface:'#fffdfa', surface2:'#f7f2ea', ink:'#251f18', muted:'#9c8f7d', line:'#ece2d4', accent:'#d2691e', accentGrad:'linear-gradient(135deg,#f97316,#ef4444)', shadow:'0 6px 24px rgba(60,40,10,.08)' },
}
const SHAPES = {
  'Soft':      { rad:'20px', rsm:'12px' },
  'Editorial': { rad:'6px',  rsm:'5px'  },
  'Sharp':     { rad:'0px',  rsm:'0px'  },
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
  const [mood,    setMoodRaw]    = useState(() => load('tt_mood',    'Midnight'))
  const [shape,   setShapeRaw]   = useState(() => load('tt_shape',   'Soft'))
  const [density, setDensityRaw] = useState(() => load('tt_density', 'Cozy'))

  const theme = { ...MOODS[mood] || MOODS['Midnight'], ...SHAPES[shape] || SHAPES['Soft'], ...DENSITIES[density] || DENSITIES['Cozy'] }

  useEffect(() => {
    const r = document.documentElement
    r.style.setProperty('--bg',         theme.bg)
    r.style.setProperty('--surface',    theme.surface)
    r.style.setProperty('--surface2',   theme.surface2)
    r.style.setProperty('--ink',        theme.ink)
    r.style.setProperty('--muted',      theme.muted)
    r.style.setProperty('--line',       theme.line)
    r.style.setProperty('--rad',        theme.rad)
    r.style.setProperty('--rsm',        theme.rsm)
    r.style.setProperty('--shadow',     theme.shadow)
    r.style.setProperty('--gap',        theme.gap)
    r.style.setProperty('--cgap',       theme.cgap)
    r.style.setProperty('--cardpad',    theme.cardpad)
    r.style.setProperty('--accent',     theme.accent)
    r.style.setProperty('--accentGrad', theme.accentGrad)
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
